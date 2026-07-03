import SwiftUI
import Combine

// MARK: - Achievement Unlock Banner (Toast)

struct AchievementBannerView: View {
    let achievement: Achievement
    @State private var appear = false
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "FFD700"), Color(hex: "FF8C00")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 44, height: 44)
                    .shadow(color: Color(hex: "FFD700").opacity(0.5), radius: 10)
                
                Image(systemName: achievement.iconName)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.black)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text("Achievement freigeschaltet! 🎉")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                
                Text(achievement.title)
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                
                Text(achievement.description)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [Color(hex: "FFD700").opacity(0.5), Color.white.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
        .shadow(color: Color(hex: "FFD700").opacity(0.2), radius: 20, x: 0, y: 10)
        .padding(.horizontal, 20)
        .offset(y: appear ? 0 : -100)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                appear = true
            }
        }
    }
}

// MARK: - Achievements List View

struct AchievementsListView: View {
    @EnvironmentObject var achievementService: AchievementService
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Progress Ring
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.1), lineWidth: 8)
                            .frame(width: 100, height: 100)
                        
                        Circle()
                            .trim(from: 0, to: CGFloat(achievementService.progressPercent / 100))
                            .stroke(
                                LinearGradient(
                                    colors: [Color(hex: "FFD700"), Color(hex: "FF8C00")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                style: StrokeStyle(lineWidth: 8, lineCap: .round)
                            )
                            .frame(width: 100, height: 100)
                            .rotationEffect(.degrees(-90))
                        
                        VStack(spacing: 2) {
                            Text("\(achievementService.unlockedCount)")
                                .font(.title.bold())
                                .foregroundStyle(.white)
                            Text("/ \(achievementService.totalCount)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.top, 20)
                    
                    // Achievement List
                    VStack(spacing: 12) {
                        ForEach(achievementService.achievements) { achievement in
                            achievementRow(achievement)
                        }
                    }
                    .padding(.horizontal, 20)
                    
                    Spacer().frame(height: 100)
                }
            }
            .navigationTitle("Achievements")
            .background(Color.black.edgesIgnoringSafeArea(.all))
        }
        .preferredColorScheme(.dark)
    }
    
    @ViewBuilder
    private func achievementRow(_ achievement: Achievement) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(achievement.isUnlocked
                          ? LinearGradient(colors: [Color(hex: "FFD700"), Color(hex: "FF8C00")], startPoint: .topLeading, endPoint: .bottomTrailing)
                          : LinearGradient(colors: [Color.white.opacity(0.1), Color.white.opacity(0.05)], startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 44, height: 44)
                
                Image(systemName: achievement.iconName)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(achievement.isUnlocked ? .black : .white.opacity(0.3))
            }
            
            VStack(alignment: .leading, spacing: 3) {
                Text(achievement.title)
                    .font(.subheadline.bold())
                    .foregroundStyle(achievement.isUnlocked ? .white : .white.opacity(0.4))
                
                Text(achievement.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            if achievement.isUnlocked {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(Color(hex: "FFD700"))
                    .font(.title3)
            } else {
                Image(systemName: "lock.fill")
                    .foregroundStyle(.white.opacity(0.2))
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(achievement.isUnlocked ? 0.06 : 0.02)))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(
            achievement.isUnlocked ? Color(hex: "FFD700").opacity(0.2) : Color.white.opacity(0.05),
            lineWidth: 0.5
        ))
    }
}

// MARK: - Portfolio Score Card

struct PortfolioScoreView: View {
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var userSettings: UserSettings
    
    var diversificationScore: Int {
        let rarities = Set(inventoryService.inventory.map { $0.rarity })
        let categories = Set(inventoryService.inventory.map { $0.skinCategory })
        let priceRanges = Set(inventoryService.inventory.map { priceBucket(priceService.getPrice(for: $0)) })
        
        let maxScore = 100
        let rarityScore = min(rarities.count * 12, 40)        // bis zu 40
        let categoryScore = min(categories.count * 6, 30)      // bis zu 30
        let priceScore = min(priceRanges.count * 8, 30)        // bis zu 30
        
        return min(rarityScore + categoryScore + priceScore, maxScore)
    }
    
    private func priceBucket(_ price: Double) -> String {
        if price < 1 { return "micro" }
        if price < 10 { return "low" }
        if price < 50 { return "mid" }
        if price < 200 { return "high" }
        return "premium"
    }
    
    var riskRating: String {
        let total = priceService.calculateTotalValue(inventory: inventoryService.inventory)
        guard total > 0 else { return "—" }
        
        let topItemValue = inventoryService.inventory.map { priceService.getPrice(for: $0) }.max() ?? 0
        let concentration = topItemValue / total
        
        if concentration > 0.5 { return "Hoch" }
        if concentration > 0.3 { return "Mittel" }
        return "Niedrig"
    }
    
    var riskColor: Color {
        switch riskRating {
        case "Hoch": return .red
        case "Mittel": return .orange
        case "Niedrig": return .green
        default: return .secondary
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Portfolio Score")
                .font(.headline)
                .foregroundStyle(.white)
            
            HStack(spacing: 24) {
                // Diversifikation
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.1), lineWidth: 6)
                            .frame(width: 70, height: 70)
                        
                        Circle()
                            .trim(from: 0, to: CGFloat(diversificationScore) / 100)
                            .stroke(
                                LinearGradient(colors: [Color(hex: "00F0FF"), Color(hex: "00FF77")], startPoint: .top, endPoint: .bottom),
                                style: StrokeStyle(lineWidth: 6, lineCap: .round)
                            )
                            .frame(width: 70, height: 70)
                            .rotationEffect(.degrees(-90))
                        
                        Text("\(diversificationScore)")
                            .font(.headline.bold())
                            .foregroundStyle(.white)
                    }
                    Text("Diversifikation")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                
                // Risiko
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(riskColor.opacity(0.15))
                            .frame(width: 70, height: 70)
                        
                        Image(systemName: riskRating == "Hoch" ? "exclamationmark.triangle.fill" : riskRating == "Mittel" ? "flag.fill" : "shield.checkered")
                            .font(.title2)
                            .foregroundStyle(riskColor)
                    }
                    Text("Risiko: \(riskRating)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                
                // Item Count
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.05))
                            .frame(width: 70, height: 70)
                        
                        Text("\(inventoryService.inventory.count)")
                            .font(.title2.bold())
                            .foregroundStyle(.white)
                    }
                    Text("Items")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.05)))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 0.5))
    }
}

// MARK: - Trade-Lock Countdown View

struct TradeLockBadgeView: View {
    let item: CS2Item
    @State private var now = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        if item.isTradeLocked {
            let remaining = item.tradeLockRemainingSeconds
            let days = Int(remaining / 86400)
            let hours = Int(remaining.truncatingRemainder(dividingBy: 86400) / 3600)
            let minutes = Int(remaining.truncatingRemainder(dividingBy: 3600) / 60)
            
            HStack(spacing: 4) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 9))
                if days > 0 {
                    Text("\(days)T \(hours)h")
                } else {
                    Text("\(hours)h \(minutes)m")
                }
            }
            .font(.caption2.bold())
            .foregroundStyle(.orange)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Capsule().fill(Color.orange.opacity(0.15)))
            .onReceive(timer) { _ in
                now = Date()
            }
        }
    }
}

// MARK: - Share Portfolio Card

struct SharePortfolioCardView: View {
    let totalValue: String
    let itemCount: Int
    let topItem: String
    let changePercent: String
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("SKINSTOCK")
                        .font(.caption.bold())
                        .foregroundStyle(Color(hex: "00F0FF"))
                        .tracking(3)
                    Text("Portfolio")
                        .font(.title.bold())
                        .foregroundStyle(.white)
                }
                Spacer()
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.title)
                    .foregroundStyle(Color(hex: "00F0FF"))
            }
            
            Divider().background(Color.white.opacity(0.1))
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gesamtwert")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(totalValue)
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Änderung")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(changePercent)
                        .font(.headline)
                        .foregroundStyle(changePercent.hasPrefix("-") ? .red : .green)
                }
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Items")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("\(itemCount)")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Top Item")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(topItem)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .lineLimit(1)
                }
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "0a0a0a"), Color(hex: "1a1a2e")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(
                            LinearGradient(colors: [Color(hex: "00F0FF").opacity(0.3), Color.white.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            lineWidth: 1
                        )
                )
        )
        .frame(width: 340)
    }
}

// MARK: - OLED Glow Modifier

struct OLEDGlowModifier: ViewModifier {
    let color: Color
    let intensity: Double
    
    func body(content: Content) -> some View {
        content
            .shadow(color: color.opacity(intensity * 0.4), radius: 8, x: 0, y: 0)
            .shadow(color: color.opacity(intensity * 0.2), radius: 16, x: 0, y: 0)
    }
}

extension View {
    func oledGlow(color: Color, intensity: Double = 1.0) -> some View {
        modifier(OLEDGlowModifier(color: color, intensity: intensity))
    }
}

// MARK: - Collections Tracker

struct CollectionsView: View {
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var priceService: PriceService
    
    var collections: [(name: String, items: [CS2Item])] {
        var dict: [String: [CS2Item]] = [:]
        for item in inventoryService.inventory {
            if let coll = item.collectionName {
                dict[coll, default: []].append(item)
            }
        }
        return dict.map { (name: $0.key, items: $0.value) }.sorted { $0.items.count > $1.items.count }
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if collections.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "rectangle.stack")
                                .font(.system(size: 40))
                                .foregroundStyle(.secondary)
                            Text("Keine Collections gefunden")
                                .font(.headline)
                                .foregroundStyle(.white)
                        }
                        .padding(.top, 60)
                    } else {
                        ForEach(collections, id: \.name) { collection in
                            collectionCard(collection)
                        }
                    }
                    
                    Spacer().frame(height: 100)
                }
                .padding(20)
            }
            .navigationTitle("Collections")
            .background(Color.black.edgesIgnoringSafeArea(.all))
        }
        .preferredColorScheme(.dark)
    }
    
    @ViewBuilder
    private func collectionCard(_ collection: (name: String, items: [CS2Item])) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(collection.name)
                    .font(.headline)
                    .foregroundStyle(.white)
                Spacer()
                Text("\(collection.items.count) Items")
                    .font(.caption.bold())
                    .foregroundStyle(Color(hex: "00F0FF"))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(Color(hex: "00F0FF").opacity(0.1)))
            }
            
            let totalValue = collection.items.reduce(0.0) { $0 + priceService.getPrice(for: $1) }
            Text("Wert: \(userSettings.formattedPrice(totalValue))")
                .font(.subheadline)
                .foregroundStyle(.green)
            
            // Mini Item Grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 5), spacing: 8) {
                ForEach(collection.items) { item in
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.white.opacity(0.05))
                            .aspectRatio(1, contentMode: .fit)
                        
                        if let url = item.imageUrl {
                            AsyncImage(url: url) { phase in
                                if let image = phase.image {
                                    image.resizable().scaledToFit().padding(4)
                                } else {
                                    ProgressView().scaleEffect(0.5)
                                }
                            }
                        }
                    }
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(item.rarity.color.opacity(0.4), lineWidth: 1)
                    )
                    .oledGlow(color: item.rarity.color, intensity: 0.5)
                }
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.04)))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08), lineWidth: 0.5))
    }
}
