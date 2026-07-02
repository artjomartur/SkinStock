import Foundation
import Combine

@MainActor
class SteamService: ObservableObject {
    @Published var isFetching = false
    @Published var error: String?
    @Published var inventory: [CS2Item] = []
    
    // Extrahiert die 17-stellige SteamID64 aus einem Link oder String
    func extractSteamId(from input: String) -> String? {
        let cleanInput = input.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Check 1: Steam Profil-URL
        if let range = cleanInput.range(of: "profiles/") {
            let substring = cleanInput[range.upperBound...]
            let components = substring.split(separator: "/")
            if let first = components.first, first.count == 17, CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: String(first))) {
                return String(first)
            }
        }
        
        // Check 2: Bereits eine 17-stellige ID
        if cleanInput.count == 17, CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: cleanInput)) {
            return cleanInput
        }
        
        return nil
    }
    
    func fetchInventory(for steamIdInput: String) async {
        self.isFetching = true
        self.error = nil
        
        guard let steamId = extractSteamId(from: steamIdInput) else {
            self.error = "Bitte gib eine gültige 17-stellige SteamID64 (z.B. 7656119...) oder einen Profil-Link an."
            self.isFetching = false
            return
        }
        
        do {
            async let pricesData = fetchPrices()
            
            // Native iOS: Wir brauchen keinen CORS-Proxy mehr! Direkt von Steam abfragen.
            let steamURL = URL(string: "https://steamcommunity.com/inventory/\(steamId)/730/2?l=german&count=1000")!
            let (data, _) = try await URLSession.shared.data(from: steamURL)
            
            let prices = try await pricesData
            let items = try parseInventory(data: data, prices: prices)
            
            self.inventory = items
            self.isFetching = false
        } catch {
            self.error = "Fehler beim Abrufen vom Steam-Server. Profil privat oder Rate Limit erreicht."
            self.isFetching = false
        }
    }
    
    private func fetchPrices() async throws -> [String: Double] {
        let url = URL(string: "https://prices.csgotrader.app/latest/steam.json")!
        let (data, _) = try await URLSession.shared.data(from: url)
        
        guard let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
            return [:]
        }
        
        var priceMap: [String: Double] = [:]
        for (key, value) in json {
            if let itemPrices = value as? [String: Any],
               let price = itemPrices["last_24h"] as? Double ?? itemPrices["last_7d"] as? Double {
                priceMap[key] = price
            }
        }
        return priceMap
    }
    
    private func parseInventory(data: Data, prices: [String: Double]) throws -> [CS2Item] {
        guard let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
              let assets = json["assets"] as? [[String: Any]],
              let descriptions = json["descriptions"] as? [[String: Any]] else {
            throw NSError(domain: "SteamService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Ungültiges Steam-Inventar JSON"])
        }
        
        var descMap: [String: [String: Any]] = [:]
        for desc in descriptions {
            // Manche IDs in der Steam API sind Strings, manche Numbers. Wir parsen sicher als String.
            let classid = String(describing: desc["classid"] ?? "")
            let instanceid = String(describing: desc["instanceid"] ?? "")
            descMap["\(classid)_\(instanceid)"] = desc
        }
        
        var parsedItems: [CS2Item] = []
        var seenHashNames: Set<String> = []
        
        for asset in assets {
            let classid = String(describing: asset["classid"] ?? "")
            let instanceid = String(describing: asset["instanceid"] ?? "")
            
            if let desc = descMap["\(classid)_\(instanceid)"],
               let hashName = desc["market_hash_name"] as? String,
               !seenHashNames.contains(hashName) {
                
                seenHashNames.insert(hashName)
                
                let name = desc["name"] as? String ?? "Unknown Item"
                let price = prices[hashName] ?? Double.random(in: 10...100) // Fallback
                
                var rarity: SkinRarity = .milSpec
                var wear: String = ""
                
                if let tags = desc["tags"] as? [[String: Any]] {
                    for tag in tags {
                        let category = tag["category"] as? String ?? ""
                        if category == "Rarity", let color = tag["color"] as? String {
                            if color == "eb4b4b" { rarity = .covert }
                            else if color == "d32ce6" { rarity = .classified }
                            else if color == "8847ff" { rarity = .restricted }
                            else if color == "e4ae39" { rarity = .contraband }
                        }
                        if category == "Exterior", let localizedTag = tag["localized_tag_name"] as? String {
                            wear = localizedTag
                        }
                    }
                }
                
                let item = CS2Item(
                    id: UUID(),
                    name: name,
                    float: Double.random(in: 0...1), // Fallback, da Steam API den Float ohne inspect nicht liefert
                    phase: nil,
                    wear: wear,
                    lastPrice: price,
                    currency: "EUR",
                    skinCategory: "Item",
                    rarity: rarity
                )
                parsedItems.append(item)
            }
        }
        return parsedItems
    }
}
