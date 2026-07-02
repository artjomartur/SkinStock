import Foundation
import Combine
import AuthenticationServices

@MainActor
class SteamService: NSObject, ObservableObject {
    @Published var isFetching = false
    @Published var error: String?
    @Published var profile: SteamProfile?
    
    struct SteamProfile: Codable {
        let steamId64: String
        let name: String
        let avatarUrl: URL?
    }
    
    private let profileCacheKey = "cached_steam_profile"
    
    override init() {
        super.init()
        if let data = UserDefaults.standard.data(forKey: profileCacheKey),
           let profile = try? JSONDecoder().decode(SteamProfile.self, from: data) {
            self.profile = profile
        }
    }
    
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
    
    func fetchProfile(for steamIdInput: String) async {
        self.isFetching = true
        self.error = nil
        
        guard let steamId = extractSteamId(from: steamIdInput) else {
            self.error = "Bitte gib eine gültige 17-stellige SteamID64 an."
            self.isFetching = false
            return
        }
        
        await fetchProfileData(steamId: steamId)
        self.isFetching = false
    }
    
    private func fetchProfileData(steamId: String) async {
        guard let url = URL(string: "https://steamcommunity.com/profiles/\(steamId)?xml=1") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let xml = String(data: data, encoding: .utf8) {
                let name = extractXML(xml, tag: "steamID") ?? "Unknown User"
                let avatar = extractXML(xml, tag: "avatarFull")
                
                let newProfile = SteamProfile(
                    steamId64: steamId,
                    name: name,
                    avatarUrl: avatar != nil ? URL(string: avatar!) : nil
                )
                self.profile = newProfile
                
                if let data = try? JSONEncoder().encode(newProfile) {
                    UserDefaults.standard.set(data, forKey: profileCacheKey)
                }
            }
        } catch {
            print("Fehler beim Profilabruf: \(error)")
        }
    }
    
    private func extractXML(_ xml: String, tag: String) -> String? {
        let openTag = "<\(tag)>"
        let closeTag = "</\(tag)>"
        guard let startRange = xml.range(of: openTag),
              let endRange = xml.range(of: closeTag, options: [], range: startRange.upperBound..<xml.endIndex) else {
            return nil
        }
        
        let content = xml[startRange.upperBound..<endRange.lowerBound]
        // CData-Tags entfernen falls vorhanden
        let clean = content.replacingOccurrences(of: "<![CDATA[", with: "").replacingOccurrences(of: "]]>", with: "")
        return clean.trimmingCharacters(in: .whitespacesAndNewlines)
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
            
            // Lade Profil
            await fetchProfile(for: extractedId)
            
            if error != nil {
                throw NSError(domain: "SteamService", code: -4, userInfo: [NSLocalizedDescriptionKey: error!])
            }
        } else {
            throw NSError(domain: "SteamService", code: -5, userInfo: [NSLocalizedDescriptionKey: "Steam ID konnte nicht extrahiert werden"])
        }
    }
}
