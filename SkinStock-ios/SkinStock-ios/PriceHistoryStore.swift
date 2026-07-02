import Foundation
import Combine

/// Persistente Speicherung von täglichen Preis-Snapshots
/// Baut über die Zeit eine echte Preis-Historie auf
@MainActor
class PriceHistoryStore: ObservableObject {
    private let storeKey = "price_history_store_v2"
    
    // [hashName: [DateString: Price]]
    private var store: [String: [String: Double]] = [:]
    
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    
    private let hourFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd-HH"
        return f
    }()
    
    init() {
        loadStore()
    }
    
    private func loadStore() {
        if let data = UserDefaults.standard.data(forKey: storeKey),
           let decoded = try? JSONDecoder().decode([String: [String: Double]].self, from: data) {
            self.store = decoded
        }
    }
    
    private func saveStore() {
        if let data = try? JSONEncoder().encode(store) {
            UserDefaults.standard.set(data, forKey: storeKey)
        }
    }
    
    /// Speichert den aktuellen Preis für ein Item (einmal pro Stunde)
    func recordPrice(hashName: String, price: Double) {
        let hourKey = hourFormatter.string(from: Date())
        if store[hashName] == nil {
            store[hashName] = [:]
        }
        store[hashName]?[hourKey] = price
        // Auch Tageswert setzen (überschreibt mit dem neuesten Preis des Tages)
        let dayKey = dateFormatter.string(from: Date())
        store[hashName]?[dayKey] = price
    }
    
    /// Speichert alle aktuellen Preise aus dem PriceMap
    func recordAllPrices(priceMap: [String: Double]) {
        for (hashName, price) in priceMap {
            recordPrice(hashName: hashName, price: price)
        }
        saveStore()
    }
    
    /// Gibt die gespeicherte Preis-Historie für einen Zeitraum zurück
    func getHistory(for hashName: String, timeframe: Timeframe) -> [PriceHistoryPoint] {
        guard let itemStore = store[hashName] else { return [] }
        
        let now = Date()
        let calendar = Calendar.current
        
        let startDate: Date
        let useHourly: Bool
        
        switch timeframe {
        case .day:
            startDate = calendar.date(byAdding: .hour, value: -24, to: now)!
            useHourly = true
        case .week:
            startDate = calendar.date(byAdding: .day, value: -7, to: now)!
            useHourly = false
        case .month:
            startDate = calendar.date(byAdding: .month, value: -1, to: now)!
            useHourly = false
        case .year:
            startDate = calendar.date(byAdding: .year, value: -1, to: now)!
            useHourly = false
        case .max:
            startDate = calendar.date(byAdding: .year, value: -5, to: now)!
            useHourly = false
        }
        
        var points: [PriceHistoryPoint] = []
        let formatter = useHourly ? hourFormatter : dateFormatter
        
        for (key, price) in itemStore {
            if let date = formatter.date(from: key) {
                if date >= startDate && date <= now {
                    points.append(PriceHistoryPoint(date: date, price: price))
                }
            } else if !useHourly {
                // Versuche auch hourly keys im daily Modus zu nutzen
                if let date = hourFormatter.date(from: key) {
                    if date >= startDate && date <= now {
                        points.append(PriceHistoryPoint(date: date, price: price))
                    }
                }
            }
        }
        
        // Sortiere chronologisch
        return points.sorted { $0.date < $1.date }
    }
    
    /// Gibt die Portfolio-Historie zurück (Summe aller Items)
    func getPortfolioHistory(inventory: [CS2Item], priceService: PriceService, timeframe: Timeframe) -> [PriceHistoryPoint] {
        guard !inventory.isEmpty else { return [] }
        
        // Sammle alle Zeitpunkte
        var allDates: Set<Date> = []
        var histories: [String: [PriceHistoryPoint]] = [:]
        
        for item in inventory {
            let h = getHistory(for: item.hashName, timeframe: timeframe)
            histories[item.hashName] = h
            for p in h {
                allDates.insert(p.date)
            }
        }
        
        // Falls keine Historie vorhanden, gib nur den aktuellen Punkt zurück
        if allDates.isEmpty {
            let totalNow = priceService.calculateTotalValue(inventory: inventory)
            return [PriceHistoryPoint(date: Date(), price: totalNow)]
        }
        
        let sortedDates = allDates.sorted()
        var portfolioHistory: [PriceHistoryPoint] = []
        
        for date in sortedDates {
            var total = 0.0
            for item in inventory {
                if let itemHistory = histories[item.hashName] {
                    // Finde den nächsten Preis vor oder an diesem Datum
                    if let closest = itemHistory.last(where: { $0.date <= date }) {
                        total += closest.price
                    } else if let first = itemHistory.first {
                        total += first.price
                    } else {
                        total += priceService.getPrice(for: item)
                    }
                } else {
                    total += priceService.getPrice(for: item)
                }
            }
            portfolioHistory.append(PriceHistoryPoint(date: date, price: total))
        }
        
        return portfolioHistory
    }
}
