import Foundation
import Combine

@MainActor
class PriceService: ObservableObject {
    @Published var priceMap: [String: Double] = [:]
    
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
        // Fallback-API, falls CSGO Trader down ist, nehmen wir Skinport!
        guard let url = URL(string: "https://api.skinport.com/v1/items?app_id=730&currency=\(currency)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        // Setze einen Standard-User-Agent, da manche APIs ohne User-Agent blocken
        request.setValue("SkinStock/1.0", forHTTPHeaderField: "User-Agent")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        // Skinport JSON: [{"market_hash_name": "...", "suggested_price": 12.34}, ...]
        let items = try JSONDecoder().decode([SkinportItem].self, from: data)
        
        var newPriceMap: [String: Double] = [:]
        for item in items {
            // Wir verwenden den suggested_price, ansonsten min_price als Fallback
            if let price = item.suggested_price ?? item.min_price {
                newPriceMap[item.market_hash_name] = price
            }
        }
        
        self.priceMap = newPriceMap
        self.savePricesToCache()
    }
    
    // MARK: - Portfolio Berechnungen
    
    func calculateTotalValue(inventory: [CS2Item]) -> Double {
        return inventory.reduce(0) { $0 + getPrice(for: $1) }
    }
    
    func getPrice(for item: CS2Item) -> Double {
        // Falls wir den genauen Namen im PriceMap haben, nimm ihn, ansonsten Fallback auf item.lastPrice
        return priceMap[item.hashName] ?? item.lastPrice
    }
    
    func calculatePortfolioDistribution(inventory: [CS2Item]) -> [String: Double] {
        var distribution: [String: Double] = [:]
        let totalValue = calculateTotalValue(inventory: inventory)
        
        guard totalValue > 0 else { return [:] }
        
        for item in inventory {
            let itemValue = getPrice(for: item)
            let category = item.skinCategory
            distribution[category, default: 0.0] += itemValue
        }
        
        // In Prozent umrechnen
        for (category, value) in distribution {
            distribution[category] = (value / totalValue) * 100
        }
        
        return distribution
    }
    
    // MARK: - Historische Preisdaten (Mock)
    
    // Cache für Mock-Daten, damit der Graph nicht bei jedem Redraw neu generiert wird
    private var historyCache: [String: [PriceHistoryPoint]] = [:]
    
    func getPriceHistory(for hashName: String, timeframe: Timeframe) -> [PriceHistoryPoint] {
        let cacheKey = "\(hashName)_\(timeframe.rawValue)"
        if let cached = historyCache[cacheKey] {
            return cached
        }
        
        let currentPrice = priceMap[hashName] ?? 10.0
        
        let pointCount: Int
        let interval: TimeInterval // in seconds backwards
        
        switch timeframe {
        case .day:
            pointCount = 24
            interval = -3600 // hourly
        case .week:
            pointCount = 7
            interval = -86400 // daily
        case .month:
            pointCount = 30
            interval = -86400
        case .year:
            pointCount = 12
            interval = -2592000 // approx 30 days
        case .max:
            pointCount = 50
            interval = -2592000 // monthly over ~4 years
        }
        
        var history: [PriceHistoryPoint] = []
        var runningPrice = currentPrice
        
        // Seed based on hashName so the line is somewhat consistent
        let hashValue = Double(abs(hashName.hash))
        let volatility = 0.02 + (hashValue.truncatingRemainder(dividingBy: 0.05)) // 2% to 7% volatility
        
        let now = Date()
        
        // Latest point (now)
        history.append(PriceHistoryPoint(date: now, price: currentPrice))
        
        for i in 1..<pointCount {
            let date = now.addingTimeInterval(Double(i) * interval)
            
            // Random walk backwards
            let changePercent = Double.random(in: -volatility...volatility)
            runningPrice = runningPrice / (1.0 + changePercent)
            
            if runningPrice < 0.03 { runningPrice = 0.03 }
            
            history.append(PriceHistoryPoint(date: date, price: runningPrice))
        }
        
        // Reverse so it goes from oldest to newest
        let finalHistory = history.reversed().map { $0 }
        historyCache[cacheKey] = finalHistory
        return finalHistory
    }
    
    func getPortfolioHistory(inventory: [CS2Item], timeframe: Timeframe) -> [PriceHistoryPoint] {
        guard !inventory.isEmpty else { return [] }
        
        let histories = inventory.map { getPriceHistory(for: $0.hashName, timeframe: timeframe) }
        guard let firstHistory = histories.first else { return [] }
        
        var portfolioHistory: [PriceHistoryPoint] = []
        
        for i in 0..<firstHistory.count {
            let date = firstHistory[i].date
            let totalValue = histories.reduce(0) { $0 + $1[i].price }
            portfolioHistory.append(PriceHistoryPoint(date: date, price: totalValue))
        }
        
        return portfolioHistory
    }
}

// MARK: - Helper Models

struct SkinportItem: Codable {
    let market_hash_name: String
    let suggested_price: Double?
    let min_price: Double?
}
