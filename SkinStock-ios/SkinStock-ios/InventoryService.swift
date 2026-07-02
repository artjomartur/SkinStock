import Foundation
import Combine

@MainActor
class InventoryService: ObservableObject {
    @Published var isFetching = false
    @Published var error: String?
    @Published var inventory: [CS2Item] = []
    
    private let cacheKey = "cached_inventory_items"
    
    init() {
        loadCachedInventory()
    }
    
    /// Lädt gecachte Items sofort beim Start
    private func loadCachedInventory() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let cached = try? JSONDecoder().decode([CS2Item].self, from: data) {
            self.inventory = cached
        }
    }
    
    /// Speichert die Items lokal
    private func saveInventoryToCache() {
        if let data = try? JSONEncoder().encode(inventory) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }
    
    func fetchInventory(for steamId: String) async {
        self.isFetching = true
        self.error = nil
        
        do {
            // Offizieller, öffentlicher Steam Endpoint für Inventare
            let steamURL = URL(string: "https://steamcommunity.com/inventory/\(steamId)/730/2?l=english&count=5000")!
            let (data, response) = try await URLSession.shared.data(from: steamURL)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }
            
            if httpResponse.statusCode == 403 || httpResponse.statusCode == 401 {
                throw NSError(domain: "Inventory", code: 403, userInfo: [NSLocalizedDescriptionKey: "Inventar ist privat."])
            }
            if httpResponse.statusCode == 429 {
                throw NSError(domain: "Inventory", code: 429, userInfo: [NSLocalizedDescriptionKey: "Steam Rate-Limit erreicht. Versuch es später."])
            }
            
            let items = try parseInventory(data: data)
            
            self.inventory = items
            self.saveInventoryToCache()
            
        } catch {
            self.error = error.localizedDescription
        }
        
        self.isFetching = false
    }
    
    private func parseInventory(data: Data) throws -> [CS2Item] {
        guard let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
              let assets = json["assets"] as? [[String: Any]],
              let descriptions = json["descriptions"] as? [[String: Any]] else {
            // Falls das Inventar leer ist, hat JSON keine "assets" Node.
            return []
        }
        
        // Map für schnellen Zugriff auf Descriptions
        var descMap: [String: [String: Any]] = [:]
        for desc in descriptions {
            let classid = String(describing: desc["classid"] ?? "")
            let instanceid = String(describing: desc["instanceid"] ?? "")
            descMap["\(classid)_\(instanceid)"] = desc
        }
        
        var parsedItems: [CS2Item] = []
        var seenInstanceIds: Set<String> = [] // Damit wir keine doppelten Asset-Logiken haben (wobei assetid unique ist)
        
        for asset in assets {
            let assetid = String(describing: asset["assetid"] ?? "")
            let classid = String(describing: asset["classid"] ?? "")
            let instanceid = String(describing: asset["instanceid"] ?? "")
            
            guard !seenInstanceIds.contains(assetid) else { continue }
            
            if let desc = descMap["\(classid)_\(instanceid)"] {
                let hashName = (desc["market_hash_name"] as? String) ?? (desc["market_name"] as? String) ?? (desc["name"] as? String) ?? "Unknown"
                
                seenInstanceIds.insert(assetid)
                
                let marketableFlag = desc["marketable"] as? Int ?? 0
                let marketable = (marketableFlag == 1)
                
                // Wir filtern untauschbare/unverkaufbare Default-Waffen (Medaillen etc. bleiben, wenn man will, aber meistens tradable == 1)
                // Default CS2 items are not marketable and not tradable.
                
                let name = desc["name"] as? String ?? "Unknown Item"
                
                var rarity: SkinRarity = .milSpec
                var wear: String = ""
                var skinCategory = "Item"
                
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
                        if category == "Weapon", let localizedTag = tag["localized_tag_name"] as? String {
                            skinCategory = localizedTag
                        }
                    }
                }
                
                // Messer/Handschuhe Kategorie Fix
                if hashName.contains("★") {
                    if hashName.contains("Gloves") || hashName.contains("Hand Wraps") || hashName.contains("Bloodhound") {
                        skinCategory = "Gloves"
                    } else {
                        skinCategory = "Knife"
                    }
                }
                
                var itemImageUrl: URL? = nil
                if let iconUrlHash = desc["icon_url"] as? String {
                    itemImageUrl = URL(string: "https://community.cloudflare.steamstatic.com/economy/image/\(iconUrlHash)/360fx360f")
                }
                
                let item = CS2Item(
                    id: UUID(),
                    assetid: assetid,
                    classid: classid,
                    instanceid: instanceid,
                    name: name,
                    hashName: hashName,
                    float: nil, // Wird von Steam API nicht geliefert
                    phase: nil, // Wird von Steam API nicht geliefert
                    wear: wear,
                    lastPrice: 0.0, // Wird später vom PriceService injiziert
                    currency: "EUR",
                    skinCategory: skinCategory,
                    rarity: rarity,
                    imageUrl: itemImageUrl,
                    marketable: marketable
                )
                
                parsedItems.append(item)
            }
        }
        return parsedItems
    }
}
