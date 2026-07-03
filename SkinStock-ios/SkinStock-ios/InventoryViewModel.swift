import Foundation
import Combine
import SwiftUI

enum SortOption: String, CaseIterable {
    case highestValue = "Höchster Wert"
    case lowestValue = "Niedrigster Wert"
    case nameAZ = "Name (A-Z)"
    case nameZA = "Name (Z-A)"
    case floatAscending = "Niedrigster Float (FN zuerst)"
    case floatDescending = "Höchster Float (BS zuerst)"
}

@MainActor
class InventoryViewModel: ObservableObject {
    @Published var searchText: String = ""
    @Published var sortOption: SortOption = .highestValue
    @Published var showOnlyMarketable: Bool = false
    @Published var selectedCategory: String? = nil
    
    // Die berechneten, gefilterten und sortierten Items, die das UI rendert.
    @Published var displayedItems: [CS2Item] = []
    
    private var rawInventory: [CS2Item] = []
    private var priceService: PriceService?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Pipeline: Immer wenn sich Filter, Sortierung oder Suchtext ändern, updaten wir das angezeigte Array.
        Publishers.CombineLatest4($searchText, $sortOption, $showOnlyMarketable, $selectedCategory)
            .debounce(for: .milliseconds(100), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.applyFiltersAndSort()
            }
            .store(in: &cancellables)
    }
    
    /// Empfängt die rohen Items vom InventoryService und die Preise vom PriceService
    func updateData(inventory: [CS2Item], priceService: PriceService) {
        self.rawInventory = inventory
        self.priceService = priceService
        applyFiltersAndSort()
    }
    
    /// Alle einzigartigen Kategorien, die im Inventar existieren
    var availableCategories: [String] {
        let categories = Set(rawInventory.map { $0.skinCategory })
        return Array(categories).sorted()
    }
    
    private func applyFiltersAndSort() {
        var result = rawInventory
        
        // 1. Verkaufen filtern
        if showOnlyMarketable {
            result = result.filter { $0.marketable }
        }
        
        // 2. Kategorie filtern
        if let category = selectedCategory {
            result = result.filter { $0.skinCategory == category }
        }
        
        // 3. Suche
        if !searchText.isEmpty {
            result = result.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        }
        
        // Preise für die Items setzen, damit wir danach sortieren können
        let priceMap = priceService?.priceMap ?? [:]
        for i in 0..<result.count {
            if let fetchedPrice = priceMap[result[i].hashName] {
                result[i].lastPrice = fetchedPrice
            }
        }
        
        // 4. Sortieren
        switch sortOption {
        case .highestValue:
            result.sort { $0.lastPrice > $1.lastPrice }
        case .lowestValue:
            result.sort { $0.lastPrice < $1.lastPrice }
        case .nameAZ:
            result.sort { $0.name < $1.name }
        case .nameZA:
            result.sort { $0.name > $1.name }
        case .floatAscending:
            result.sort { ($0.float ?? 1.0) < ($1.float ?? 1.0) }
        case .floatDescending:
            result.sort { ($0.float ?? 0.0) > ($1.float ?? 0.0) }
        }
        
        self.displayedItems = result
    }
}
