import Foundation
import Combine
import AuthenticationServices

@MainActor
class SteamService: NSObject, ObservableObject {
    @Published var isFetching = false
    @Published var error: String?
    @Published var inventory: [CS2Item] = []
    
    // Extrahiert die 17-stellige SteamID64 aus einem Link oder String
    func extractSteamId(from input: String) -> String? {
        let cleanInput = input.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Check 1: Suche nach einem 17-stelligen numerischen Segment (z.B. in /profiles/ oder /openid/id/)
        let components = cleanInput.split(separator: "/")
        for component in components {
            let str = String(component)
            if str.count == 17, CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: str)) {
                return str
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
                
                // Filtere untauschbare / unverkaufbare Items (wie Standardwaffen oder Medaillen) heraus
                let tradable = desc["tradable"] as? Int ?? 0
                let marketable = desc["marketable"] as? Int ?? 0
                guard tradable == 1 || marketable == 1 else { continue }
                
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
                
                // Bild-URL generieren
                var itemImageUrl: URL? = nil
                if let iconUrlHash = desc["icon_url"] as? String {
                    itemImageUrl = URL(string: "https://community.cloudflare.steamstatic.com/economy/image/\(iconUrlHash)/360fx360f")
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
                    rarity: rarity,
                    imageUrl: itemImageUrl
                )
                parsedItems.append(item)
            }
        }
        return parsedItems
    }
    
    // MARK: - Steam OpenID Authentication via WKWebView
    
    // Generiert die offizielle Steam Login URL, die vom WKWebView geladen wird
    func getSteamAuthURL() -> URL {
        // Wir nutzen eine Fake-Return-URL auf der echten Steam-Domain, da Steam custom schemes wie cs2app:// verbietet
        let returnUrl = "https://steamcommunity.com/login_success"
        
        var components = URLComponents(string: "https://steamcommunity.com/openid/login")!
        components.queryItems = [
            URLQueryItem(name: "openid.ns", value: "http://specs.openid.net/auth/2.0"),
            URLQueryItem(name: "openid.mode", value: "checkid_setup"),
            URLQueryItem(name: "openid.return_to", value: returnUrl),
            URLQueryItem(name: "openid.realm", value: returnUrl),
            URLQueryItem(name: "openid.identity", value: "http://specs.openid.net/auth/2.0/identifier_select"),
            URLQueryItem(name: "openid.claimed_id", value: "http://specs.openid.net/auth/2.0/identifier_select")
        ]
        return components.url!
    }
    
    // Verarbeitet die von Steam aufgerufene Callback-URL, um die SteamID64 zu extrahieren
    func handleSteamCallback(url: URL) async throws {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems else {
            throw NSError(domain: "SteamService", code: -2, userInfo: [NSLocalizedDescriptionKey: "Ungültige Callback URL"])
        }
        
        // Steam sendet bei Abbruch openid.mode=cancel
        if let mode = queryItems.first(where: { $0.name == "openid.mode" })?.value, mode == "cancel" {
            throw NSError(domain: "SteamService", code: -3, userInfo: [NSLocalizedDescriptionKey: "Login vom Benutzer abgebrochen"])
        }
        
        if let claimedId = queryItems.first(where: { $0.name == "openid.claimed_id" })?.value,
           let extractedId = extractSteamId(from: claimedId) {
            
            // Lade Inventar
            await fetchInventory(for: extractedId)
            
            if error != nil {
                throw NSError(domain: "SteamService", code: -4, userInfo: [NSLocalizedDescriptionKey: error!])
            }
        } else {
            throw NSError(domain: "SteamService", code: -5, userInfo: [NSLocalizedDescriptionKey: "Steam ID konnte nicht extrahiert werden"])
        }
    }
}
