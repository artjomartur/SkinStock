import Foundation
import Combine

@MainActor
class AchievementService: ObservableObject {
    @Published var achievements: [Achievement] = []
    @Published var newlyUnlocked: Achievement? = nil
    
    private let cacheKey = "achievements_v1"
    
    static let allDefinitions: [(id: String, title: String, description: String, icon: String)] = [
        ("first_login", "Willkommen!", "Melde dich zum ersten Mal an", "star.fill"),
        ("portfolio_100", "Starter", "Portfolio-Wert über 100€", "chart.line.uptrend.xyaxis"),
        ("portfolio_500", "Investor", "Portfolio-Wert über 500€", "banknote.fill"),
        ("portfolio_1000", "Whaler", "Portfolio-Wert über 1.000€", "crown.fill"),
        ("portfolio_5000", "High Roller", "Portfolio-Wert über 5.000€", "diamond.fill"),
        ("portfolio_10000", "Legende", "Portfolio-Wert über 10.000€", "bolt.shield.fill"),
        ("items_5", "Sammler", "5 Skins im Inventar", "tray.full.fill"),
        ("items_25", "Hoarder", "25 Skins im Inventar", "archivebox.fill"),
        ("items_50", "Arsenal", "50 Skins im Inventar", "shippingbox.fill"),
        ("items_100", "Museum", "100 Skins im Inventar", "building.columns.fill"),
        ("first_knife", "Erste Klinge", "Besitze ein Messer (★)", "scissors"),
        ("first_gloves", "Handarbeit", "Besitze Handschuhe", "hand.raised.fill"),
        ("sticker_king", "Sticker King", "Besitze einen Skin mit 4 Stickern", "sparkles"),
        ("diversified", "Diversifiziert", "Besitze Skins in 5+ Seltenheitsstufen", "chart.pie.fill"),
        ("watchlist_add", "Beobachter", "Füge ein Item zur Watchlist hinzu", "eye.fill"),
    ]
    
    init() {
        loadAchievements()
    }
    
    private func loadAchievements() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let saved = try? JSONDecoder().decode([Achievement].self, from: data) {
            self.achievements = saved
            // Neue Achievements hinzufügen die in Updates dazukamen
            for def in Self.allDefinitions {
                if !achievements.contains(where: { $0.id == def.id }) {
                    achievements.append(Achievement(id: def.id, title: def.title, description: def.description, iconName: def.icon, isUnlocked: false, unlockedDate: nil))
                }
            }
        } else {
            self.achievements = Self.allDefinitions.map {
                Achievement(id: $0.id, title: $0.title, description: $0.description, iconName: $0.icon, isUnlocked: false, unlockedDate: nil)
            }
        }
    }
    
    private func save() {
        if let data = try? JSONEncoder().encode(achievements) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }
    
    func unlock(_ achievementId: String) {
        guard let index = achievements.firstIndex(where: { $0.id == achievementId }),
              !achievements[index].isUnlocked else { return }
        
        achievements[index].isUnlocked = true
        achievements[index].unlockedDate = Date()
        newlyUnlocked = achievements[index]
        save()
        
        // Auto-dismiss nach 3 Sekunden
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            self?.newlyUnlocked = nil
        }
    }
    
    /// Prüft alle Achievements basierend auf dem aktuellen Zustand
    func evaluate(inventory: [CS2Item], totalValue: Double, watchlistCount: Int) {
        // Portfolio-Wert
        if totalValue >= 100 { unlock("portfolio_100") }
        if totalValue >= 500 { unlock("portfolio_500") }
        if totalValue >= 1000 { unlock("portfolio_1000") }
        if totalValue >= 5000 { unlock("portfolio_5000") }
        if totalValue >= 10000 { unlock("portfolio_10000") }
        
        // Item-Anzahl
        if inventory.count >= 5 { unlock("items_5") }
        if inventory.count >= 25 { unlock("items_25") }
        if inventory.count >= 50 { unlock("items_50") }
        if inventory.count >= 100 { unlock("items_100") }
        
        // Spezial-Items
        if inventory.contains(where: { $0.skinCategory == "Knife" }) { unlock("first_knife") }
        if inventory.contains(where: { $0.skinCategory == "Gloves" }) { unlock("first_gloves") }
        if inventory.contains(where: { $0.stickers.count >= 4 }) { unlock("sticker_king") }
        
        // Diversifikation
        let rarities = Set(inventory.map { $0.rarity })
        if rarities.count >= 5 { unlock("diversified") }
        
        // Watchlist
        if watchlistCount > 0 { unlock("watchlist_add") }
        
        // First Login
        unlock("first_login")
    }
    
    var unlockedCount: Int { achievements.filter { $0.isUnlocked }.count }
    var totalCount: Int { achievements.count }
    var progressPercent: Double { Double(unlockedCount) / Double(totalCount) * 100 }
}
