import Foundation
import SwiftUI

enum SkinRarity: String, CaseIterable {
    case consumer = "Consumer Grade"
    case industrial = "Industrial Grade"
    case milSpec = "Mil-Spec Grade"
    case restricted = "Restricted"
    case classified = "Classified"
    case covert = "Covert"
    case contraband = "Contraband"
    
    // Basis-Farben für den Glow-Effekt
    var color: Color {
        switch self {
        case .consumer: return Color(hex: "B0C3D9")
        case .industrial: return Color(hex: "5E98D9")
        case .milSpec: return Color(hex: "4B69FF")
        case .restricted: return Color(hex: "8847FF")
        case .classified: return Color(hex: "D32CE6")
        case .covert: return Color(hex: "EB4B4B")
        case .contraband: return Color(hex: "E4AE39")
        }
    }
}

struct CS2Item: Identifiable, Hashable {
    let id: UUID
    let name: String
    let float: Double?
    let phase: String?
    let wear: String?
    let lastPrice: Double
    let currency: String
    let skinCategory: String
    let rarity: SkinRarity
    let imageUrl: URL?
}
