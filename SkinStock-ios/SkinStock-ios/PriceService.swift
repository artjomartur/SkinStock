import Foundation
import Combine
#if canImport(WidgetKit)
import WidgetKit
#endif

/// Marktplatz-Gebührenstruktur für den Netto-Liquidationswert
enum Marketplace: String, CaseIterable, Identifiable, Codable {
    case steam = "Steam Market"
    case skinport = "Skinport"
    case skinbaron = "Skinbaron"
    case buff = "Buff163"
    
    var id: String { self.rawValue }
    
    /// Prozentuale Gebühr (z.B. 0.15 = 15%)
    var feeRate: Double {
        switch self {
        case .steam: return 0.15       // 13% Valve + 2% CS2
        case .skinport: return 0.06    // 6%
        case .skinbaron: return 0.08   // 8%
        case .buff: return 0.025       // 2.5%
        }
    }
    
    var displayFee: String {
        return "\(Int(feeRate * 100))%"
    }
}

@MainActor
class PriceService: ObservableObject {
    @Published var priceMap: [String: Double] = [:]
    /// Steam Market Median-Preise (für Arbitrage-Vergleich)
    @Published var steamMedianPrices: [String: Double] = [:]
    
    private let cacheKey = "cached_skinport_prices"
    
    init() {
        loadCachedPrices()
    }
    
    /// Lädt die lokal gecachten Preise beim App-Start (Zero Loading Time)
    private func loadCachedPrices() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let cached = try? JSONDecoder().decode([String: Double].self, from: data) {
            self.priceMap = cached
        }
    }
    
    /// Speichert die aktuellen Preise lokal
    private func savePricesToCache() {
        if let data = try? JSONEncoder().encode(priceMap) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }
    
    /// Ruft die aktuellen Marktpreise von der öffentlichen Skinport API ab
    func fetchPrices(currency: String = "EUR") async throws {
        guard let url = URL(string: "https://api.skinport.com/v1/items?app_id=730&currency=\(currency)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.setValue("SkinStock/1.0", forHTTPHeaderField: "User-Agent")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        let items = try JSONDecoder().decode([SkinportItem].self, from: data)
        
        var newPriceMap: [String: Double] = [:]
        for item in items {
            if let price = item.suggested_price ?? item.min_price {
                newPriceMap[item.market_hash_name] = price
            }
        }
        
        self.priceMap = newPriceMap
        self.savePricesToCache()
    }
    
    /// Ruft Steam-Markt Median-Preise ab (für Arbitrage)
    func fetchSteamMedianPrice(for hashName: String) async {
        let encoded = hashName.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? hashName
        guard let url = URL(string: "https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=\(encoded)") else { return }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let medianStr = json["median_price"] as? String {
                // Parse "12,34€" oder "$12.34" format
                let cleaned = medianStr
                    .replacingOccurrences(of: "€", with: "")
                    .replacingOccurrences(of: "$", with: "")
                    .replacingOccurrences(of: ",", with: ".")
                    .replacingOccurrences(of: "--", with: "0")
                    .trimmingCharacters(in: .whitespaces)
                if let price = Double(cleaned) {
                    steamMedianPrices[hashName] = price
                }
            }
        } catch {
            // Silently fail – Steam rate limits aggressively
        }
    }
    
    // MARK: - Portfolio Berechnungen
    
    func calculateTotalValue(inventory: [CS2Item], includeSticker: Bool = false) -> Double {
        return inventory.reduce(0) { $0 + getPrice(for: $1, includeSticker: includeSticker) }
    }
    
    func syncWidgetData(totalValue: Double, history: [Double]) {
        if let userDefaults = UserDefaults(suiteName: "group.com.artjombecker.skinstock") {
            userDefaults.set(totalValue, forKey: "widgetTotalValue")
            userDefaults.set(history, forKey: "widgetHistory")
        }
        // Notify the widget to update its timeline
        #if canImport(WidgetKit)
        WidgetCenter.shared.reloadAllTimelines()
        #endif
        
        // Update Live Activity if running
        let trend = (history.last ?? 0) - (history.first ?? 0)
        if #available(iOS 16.1, *) {
            LiveActivityService.shared.updateActivity(totalValue: totalValue, trend: trend)
        }
    }
    
    /// Berechnet den Netto-Liquidationswert nach Abzug der Plattform-Gebühren
    func calculateNetValue(inventory: [CS2Item], marketplace: Marketplace, includeSticker: Bool = false) -> Double {
        let gross = calculateTotalValue(inventory: inventory, includeSticker: includeSticker)
        return gross * (1.0 - marketplace.feeRate)
    }
    
    func calculateStickerOverpay(for item: CS2Item) -> Double {
        var overpay = 0.0
        for sticker in item.stickers {
            let stickerHashName = "Sticker | \(sticker.name)"
            if let stickerPrice = priceMap[stickerHashName] {
                overpay += stickerPrice * 0.10
            }
        }
        return overpay
    }
    
    func getPrice(for item: CS2Item, includeSticker: Bool = false) -> Double {
        let base = priceMap[item.hashName] ?? item.lastPrice
        if includeSticker {
            return base + calculateStickerOverpay(for: item)
        }
        return base
    }
    
    /// Netto-Preis eines einzelnen Items nach Gebühren
    func getNetPrice(for item: CS2Item, marketplace: Marketplace, includeSticker: Bool = false) -> Double {
        return getPrice(for: item, includeSticker: includeSticker) * (1.0 - marketplace.feeRate)
    }
    
    func calculatePortfolioDistribution(inventory: [CS2Item], includeSticker: Bool = false) -> [String: Double] {
        var distribution: [String: Double] = [:]
        let totalValue = calculateTotalValue(inventory: inventory, includeSticker: includeSticker)
        
        guard totalValue > 0 else { return [:] }
        
        for item in inventory {
            let itemValue = getPrice(for: item, includeSticker: includeSticker)
            let category = item.skinCategory
            distribution[category, default: 0.0] += itemValue
        }
        
        for (category, value) in distribution {
            distribution[category] = (value / totalValue) * 100
        }
        
        return distribution
    }
    
    // MARK: - Arbitrage
    
    /// Berechnet den Spread zwischen Skinport und Steam
    func arbitrageSpread(for hashName: String) -> Double? {
        guard let skinportPrice = priceMap[hashName],
              let steamPrice = steamMedianPrices[hashName],
              steamPrice > 0 else { return nil }
        // Positiver Spread = günstiger auf Skinport
        return ((steamPrice - skinportPrice) / steamPrice) * 100
    }
    
    func checkCustomPriceAlerts(userSettings: UserSettings, notificationService: NotificationService) {
        for alert in userSettings.priceAlerts {
            guard alert.isActive else { continue }
            if let currentUSDPrice = priceMap[alert.hashName] {
                if alert.isAbove && currentUSDPrice >= alert.targetPrice {
                    notificationService.sendPriceAlert(
                        title: "Preisalarm ausgelöst! 📈",
                        body: "\(alert.hashName) ist über \(userSettings.formattedPrice(alert.targetPrice)) gestiegen!"
                    )
                    userSettings.toggleAlertActive(id: alert.id)
                } else if !alert.isAbove && currentUSDPrice <= alert.targetPrice {
                    notificationService.sendPriceAlert(
                        title: "Preisalarm ausgelöst! 📉",
                        body: "\(alert.hashName) ist unter \(userSettings.formattedPrice(alert.targetPrice)) gefallen!"
                    )
                    userSettings.toggleAlertActive(id: alert.id)
                }
            }
        }
    }
}

// MARK: - Helper Models

struct SkinportItem: Codable {
    let market_hash_name: String
    let suggested_price: Double?
    let min_price: Double?
}
