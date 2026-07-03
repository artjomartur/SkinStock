import Foundation
import Combine

@MainActor
class InventoryService: ObservableObject {
    @Published var isFetching = false
    @Published var error: String?
    @Published var inventory: [CS2Item] = []
    
    private let cacheKey = "cached_inventory_items"
    private let firstSeenKey = "item_first_seen_dates"
    
    /// Gespeicherte "erstmals gesehen"-Daten für Trade-Lock-Berechnung
    private var firstSeenDates: [String: Date] = [:]
    
    init() {
        loadFirstSeenDates()
        loadCachedInventory()
    }
    
    private func loadCachedInventory() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let cached = try? JSONDecoder().decode([CS2Item].self, from: data) {
            self.inventory = cached
        }
    }
    
    private func saveInventoryToCache() {
        if let data = try? JSONEncoder().encode(inventory) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }
    
    private func loadFirstSeenDates() {
        if let data = UserDefaults.standard.data(forKey: firstSeenKey),
           let dates = try? JSONDecoder().decode([String: Date].self, from: data) {
            self.firstSeenDates = dates
        }
    }
    
    private func saveFirstSeenDates() {
        if let data = try? JSONEncoder().encode(firstSeenDates) {
            UserDefaults.standard.set(data, forKey: firstSeenKey)
        }
    }
    
    func fetchInventory(for steamId: String) async {
        self.isFetching = true
        self.error = nil
        
        do {
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
            self.saveFirstSeenDates()
            
        } catch {
            self.error = error.localizedDescription
        }
        
        self.isFetching = false
    }
    
    private func parseInventory(data: Data) throws -> [CS2Item] {
        guard let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
              let assets = json["assets"] as? [[String: Any]],
              let descriptions = json["descriptions"] as? [[String: Any]] else {
            return []
        }
        
        var descMap: [String: [String: Any]] = [:]
        for desc in descriptions {
            let classid = String(describing: desc["classid"] ?? "")
            let instanceid = String(describing: desc["instanceid"] ?? "")
            descMap["\(classid)_\(instanceid)"] = desc
        }
        
        var parsedItems: [CS2Item] = []
        var seenAssetIds: Set<String> = []
        
        for asset in assets {
            let assetid = String(describing: asset["assetid"] ?? "")
            let classid = String(describing: asset["classid"] ?? "")
            let instanceid = String(describing: asset["instanceid"] ?? "")
            
            guard !seenAssetIds.contains(assetid) else { continue }
            
            if let desc = descMap["\(classid)_\(instanceid)"] {
                let hashName = (desc["market_hash_name"] as? String) ?? (desc["market_name"] as? String) ?? (desc["name"] as? String) ?? "Unknown"
                
                seenAssetIds.insert(assetid)
                
                let marketableFlag = desc["marketable"] as? Int ?? 0
                let marketable = (marketableFlag == 1)
                let tradableFlag = desc["tradable"] as? Int ?? 0
                let tradable = (tradableFlag == 1)
                
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
                            else if color == "4b69ff" { rarity = .milSpec }
                            else if color == "5e98d9" { rarity = .industrial }
                            else if color == "b0c3d9" { rarity = .consumer }
                        }
                        if category == "Exterior", let localizedTag = tag["localized_tag_name"] as? String {
                            wear = localizedTag
                        }
                        if category == "Weapon", let localizedTag = tag["localized_tag_name"] as? String {
                            skinCategory = localizedTag
                        }
                    }
                }
                
                // Messer/Handschuhe Fix
                if hashName.contains("★") {
                    if hashName.contains("Gloves") || hashName.contains("Hand Wraps") || hashName.contains("Bloodhound") {
                        skinCategory = "Gloves"
                    } else {
                        skinCategory = "Knife"
                    }
                }
                
                // Sticker extrahieren
                var stickers: [StickerInfo] = []
                if let descArray = desc["descriptions"] as? [[String: Any]] {
                    for descEntry in descArray {
                        if let htmlValue = descEntry["value"] as? String,
                           htmlValue.contains("sticker_info") {
                            // Parse Sticker-Namen aus HTML
                            stickers = parseStickerHTML(htmlValue)
                        }
                    }
                }
                
                // Collection extrahieren
                var collectionName: String? = nil
                if let tags = desc["tags"] as? [[String: Any]] {
                    for tag in tags {
                        let category = tag["category"] as? String ?? ""
                        if category == "ItemSet", let localizedTag = tag["localized_tag_name"] as? String {
                            collectionName = localizedTag
                        }
                    }
                }
                
                // Bild-URL
                var itemImageUrl: URL? = nil
                if let iconUrlHash = desc["icon_url"] as? String {
                    itemImageUrl = URL(string: "https://community.cloudflare.steamstatic.com/economy/image/\(iconUrlHash)/360fx360f")
                }
                
                // Trade-Lock: Erstmals gesehen tracken
                let assetKey = "\(classid)_\(instanceid)_\(assetid)"
                if firstSeenDates[assetKey] == nil {
                    firstSeenDates[assetKey] = Date()
                }
                let firstSeen = firstSeenDates[assetKey]
                
                let item = CS2Item(
                    id: UUID(),
                    assetid: assetid,
                    classid: classid,
                    instanceid: instanceid,
                    name: name,
                    hashName: hashName,
                    float: nil,
                    phase: nil,
                    wear: wear,
                    lastPrice: 0.0,
                    currency: "EUR",
                    skinCategory: skinCategory,
                    rarity: rarity,
                    imageUrl: itemImageUrl,
                    marketable: marketable,
                    tradable: tradable,
                    stickers: stickers,
                    firstSeenDate: firstSeen,
                    collectionName: collectionName
                )
                
                parsedItems.append(item)
            }
        }
        return parsedItems
    }
    
    /// Extrahiert Sticker-Namen aus dem Steam HTML-Snippet
    private func parseStickerHTML(_ html: String) -> [StickerInfo] {
        var stickers: [StickerInfo] = []
        
        // Steam gibt Sticker-Info als HTML mit img-Tags
        // Format: <img ... src="..."> Sticker: Name1, Name2, ...
        // Oder im neueren Format einzelne Sticker-Einträge
        
        let namePattern = "Sticker: (.+?)(?:</|$)"
        if let range = html.range(of: namePattern, options: .regularExpression) {
            let match = String(html[range])
            let cleaned = match
                .replacingOccurrences(of: "Sticker: ", with: "")
                .replacingOccurrences(of: "</", with: "")
            
            let names = cleaned.components(separatedBy: ", ")
            for (index, name) in names.enumerated() {
                let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    stickers.append(StickerInfo(
                        name: trimmed,
                        imageUrl: nil,
                        slot: index
                    ))
                }
            }
        }
        
        return stickers
    }
}
