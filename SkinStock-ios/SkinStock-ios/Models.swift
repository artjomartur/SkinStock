import Foundation
import SwiftUI

enum SkinRarity: String, CaseIterable, Codable {
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

enum Timeframe: String, CaseIterable, Identifiable {
    case day = "1T"
    case week = "1W"
    case month = "1M"
    case year = "1J"
    case max = "MAX"
    
    var id: String { self.rawValue }
}

struct PriceHistoryPoint: Identifiable {
    let id = UUID()
    let date: Date
    let price: Double
}

struct CS2Item: Identifiable, Hashable, Codable {
    let id: UUID
    let assetid: String
    let classid: String
    let instanceid: String
    
    let name: String
    let hashName: String
    let float: Double?
    let phase: String?
    let wear: String?
    var lastPrice: Double
    let currency: String
    let skinCategory: String
    let rarity: SkinRarity
    let imageUrl: URL?
    let marketable: Bool
}
