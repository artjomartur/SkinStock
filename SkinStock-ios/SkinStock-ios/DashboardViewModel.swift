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
            CS2Item(id: UUID(), name: "AK-47 | Neon Rider", float: 0.045, phase: nil, wear: "Factory New", lastPrice: 450.0, currency: "EUR", skinCategory: "Rifle", rarity: .covert, imageUrl: URL(string: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV092lnYmGmOHLPr7Vn35cpsBziLDFponmjQOyr0RpZmigLdecIwE4Y1HTqVi8k-e-gZe17czAnCFmviU8pSGKrS2PgQYMMLKvQeXN/360fx360f")),
            CS2Item(id: UUID(), name: "AWP | Dragon Lore", float: 0.014, phase: nil, wear: "Factory New", lastPrice: 12450.0, currency: "EUR", skinCategory: "Sniper Rifle", rarity: .covert, imageUrl: URL(string: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdXhW-tW1l42HmfDLPr7Vn35cpsQm3-3Hptmj2QDgrURpZDzwIoedIAM8ZFGC-VO4le3q0cLvuJnAwXo3s3UnpS2Ozgv330__YvSrxw/360fx360f")),
            CS2Item(id: UUID(), name: "Karambit | Doppler", float: 0.032, phase: "Phase 2", wear: "Factory New", lastPrice: 1200.0, currency: "EUR", skinCategory: "Knife", rarity: .covert, imageUrl: URL(string: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbMs8Qz3wMzFdWh5-9_TkmjGkvTLM-jFh2gGusIli-vAoIqkjlG1q0JtMTyncYeWcAU_MAnYr1Lrxum705TttMjPwHoxvnJ34nmPl0Hn1B4eafl0g_mWSg/360fx360f")),
            CS2Item(id: UUID(), name: "M4A1-S | Printstream", float: 0.15, phase: nil, wear: "Field-Tested", lastPrice: 180.50, currency: "EUR", skinCategory: "Rifle", rarity: .classified, imageUrl: URL(string: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszJemkV092lnYmGmOHLPr7Vn35cpsQk2-uXotij2QDsqEBpMmn2LNLDegVvYw7S81e6webnhMO87c-fyXs263Rxs3nYnBSxiwYMMLJrI1705w/360fx360f"))
        ]
        
        calculateTotal()
    }
    
    func calculateTotal() {
        self.totalValue = inventory.reduce(0) { $0 + $1.lastPrice }
    }
}
