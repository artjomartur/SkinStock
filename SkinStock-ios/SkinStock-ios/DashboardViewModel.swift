import Foundation
import SwiftUI
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var inventory: [CS2Item] = []
    @Published var totalValue: Double = 0.0
    
    init() {
        loadMockData()
    }
    
    func loadMockData() {
        self.inventory = [
            CS2Item(id: UUID(), name: "AWP | Dragon Lore", float: 0.014, phase: nil, wear: "Factory New", lastPrice: 12450.0, currency: "USD", skinCategory: "Sniper Rifle", rarity: .covert),
            CS2Item(id: UUID(), name: "Karambit | Doppler", float: 0.032, phase: "Phase 2", wear: "Factory New", lastPrice: 1200.0, currency: "USD", skinCategory: "Knife", rarity: .covert),
            CS2Item(id: UUID(), name: "AK-47 | Redline", float: 0.15, phase: nil, wear: "Field-Tested", lastPrice: 25.50, currency: "USD", skinCategory: "Rifle", rarity: .classified)
        ]
        
        calculateTotal()
    }
    
    private func calculateTotal() {
        self.totalValue = inventory.reduce(0) { $0 + $1.lastPrice }
    }
}
