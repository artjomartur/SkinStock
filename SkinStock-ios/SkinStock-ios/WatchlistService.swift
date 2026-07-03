import Foundation
import Combine

@MainActor
class WatchlistService: ObservableObject {
    @Published var items: [WatchlistItem] = []
    
    private let cacheKey = "watchlist_items_v1"
    
    init() {
        loadItems()
    }
    
    private func loadItems() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let items = try? JSONDecoder().decode([WatchlistItem].self, from: data) {
            self.items = items
        }
    }
    
    private func saveItems() {
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }
    
    func addItem(hashName: String, name: String, imageUrl: URL?, rarity: SkinRarity, targetPrice: Double?) {
        let item = WatchlistItem(
            id: UUID(),
            hashName: hashName,
            name: name,
            imageUrl: imageUrl,
            rarity: rarity,
            targetPrice: targetPrice,
            addedDate: Date()
        )
        items.append(item)
        saveItems()
    }
    
    func removeItem(_ item: WatchlistItem) {
        items.removeAll { $0.id == item.id }
        saveItems()
    }
    
    func isWatching(hashName: String) -> Bool {
        items.contains { $0.hashName == hashName }
    }
}
