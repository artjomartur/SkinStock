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
    
    /// Glow-Farbe für OLED-Effekt
    var glowColor: Color {
        color
    }
    
    var tier: Int {
        switch self {
        case .consumer: return 1
        case .industrial: return 2
        case .milSpec: return 3
        case .restricted: return 4
        case .classified: return 5
        case .covert: return 6
        case .contraband: return 7
        }
    }
    
    /// Nächsthöhere Seltenheit für Trade-Up
    var nextTier: SkinRarity? {
        switch self {
        case .consumer: return .industrial
        case .industrial: return .milSpec
        case .milSpec: return .restricted
        case .restricted: return .classified
        case .classified: return .covert
        case .covert, .contraband: return nil
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

struct StickerInfo: Codable, Hashable {
    let name: String
    let imageUrl: URL?
    let slot: Int
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
    let tradable: Bool
    
    // Sticker
    let stickers: [StickerInfo]
    
    // Trade-Lock
    let firstSeenDate: Date?
    
    // Collection
    let collectionName: String?
    
    /// Trade-Lock läuft 7 Tage nach dem ersten Erscheinen ab
    var tradeLockExpiry: Date? {
        guard let firstSeen = firstSeenDate else { return nil }
        return Calendar.current.date(byAdding: .day, value: 7, to: firstSeen)
    }
    
    var isTradeLocked: Bool {
        guard let expiry = tradeLockExpiry else { return false }
        return Date() < expiry
    }
    
    var tradeLockRemainingSeconds: TimeInterval {
        guard let expiry = tradeLockExpiry else { return 0 }
        return max(0, expiry.timeIntervalSince(Date()))
    }
    
    // Custom Decodable implementation for backward compatibility
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        assetid = try container.decode(String.self, forKey: .assetid)
        classid = try container.decode(String.self, forKey: .classid)
        instanceid = try container.decode(String.self, forKey: .instanceid)
        name = try container.decode(String.self, forKey: .name)
        hashName = try container.decode(String.self, forKey: .hashName)
        float = try container.decodeIfPresent(Double.self, forKey: .float)
        phase = try container.decodeIfPresent(String.self, forKey: .phase)
        wear = try container.decodeIfPresent(String.self, forKey: .wear)
        lastPrice = try container.decode(Double.self, forKey: .lastPrice)
        currency = try container.decode(String.self, forKey: .currency)
        skinCategory = try container.decode(String.self, forKey: .skinCategory)
        rarity = try container.decode(SkinRarity.self, forKey: .rarity)
        imageUrl = try container.decodeIfPresent(URL.self, forKey: .imageUrl)
        marketable = try container.decode(Bool.self, forKey: .marketable)
        
        // Migrate new fields with default values if they are missing from old cache
        tradable = try container.decodeIfPresent(Bool.self, forKey: .tradable) ?? true
        stickers = try container.decodeIfPresent([StickerInfo].self, forKey: .stickers) ?? []
        firstSeenDate = try container.decodeIfPresent(Date.self, forKey: .firstSeenDate)
        collectionName = try container.decodeIfPresent(String.self, forKey: .collectionName)
    }
    
    // Standard initializer
    init(id: UUID, assetid: String, classid: String, instanceid: String, name: String, hashName: String, float: Double?, phase: String?, wear: String?, lastPrice: Double, currency: String, skinCategory: String, rarity: SkinRarity, imageUrl: URL?, marketable: Bool, tradable: Bool, stickers: [StickerInfo], firstSeenDate: Date?, collectionName: String?) {
        self.id = id
        self.assetid = assetid
        self.classid = classid
        self.instanceid = instanceid
        self.name = name
        self.hashName = hashName
        self.float = float
        self.phase = phase
        self.wear = wear
        self.lastPrice = lastPrice
        self.currency = currency
        self.skinCategory = skinCategory
        self.rarity = rarity
        self.imageUrl = imageUrl
        self.marketable = marketable
        self.tradable = tradable
        self.stickers = stickers
        self.firstSeenDate = firstSeenDate
        self.collectionName = collectionName
    }
}

// MARK: - Watchlist Item (Skins die man kaufen will)

struct WatchlistItem: Identifiable, Codable {
    let id: UUID
    let hashName: String
    let name: String
    let imageUrl: URL?
    let rarity: SkinRarity
    let targetPrice: Double? // Preis unter dem man kaufen will
    let addedDate: Date
}

// MARK: - Achievement

struct Achievement: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let iconName: String
    var isUnlocked: Bool
    var unlockedDate: Date?
}
