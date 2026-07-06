import SwiftUI
import Charts

struct AnalyticsView: View {
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var priceHistoryStore: PriceHistoryStore
    @EnvironmentObject var userSettings: UserSettings
    
    // Berechnet den Gesamtwert pro Seltenheitsstufe
    var valueByRarity: [(rarity: SkinRarity, value: Double)] {
        var dict: [SkinRarity: Double] = [:]
        for item in inventoryService.inventory {
            let price = priceService.getPrice(for: item)
            dict[item.rarity, default: 0] += price
        }
        
        return dict.map { (rarity: $0.key, value: $0.value) }
            .sorted { $0.value > $1.value }
    }
    
    var totalValue: Double {
        priceService.calculateTotalValue(inventory: inventoryService.inventory)
    }
    @State private var selectedTimeframe: Timeframe = .month
    
    struct ItemPerformance: Identifiable {
        let item: CS2Item
        let percentChange: Double
        let absoluteChange: Double
        let currentValue: Double
        var id: UUID { item.id }
    }
    
    var performanceList: [ItemPerformance] {
        var list: [ItemPerformance] = []
        for item in inventoryService.inventory {
            let history = priceHistoryStore.getHistory(for: item.hashName, timeframe: selectedTimeframe)
            let currentPrice = priceService.getPrice(for: item)
            
            if history.count >= 2, let first = history.first {
                let diff = currentPrice - first.price
                let pct = first.price > 0 ? (diff / first.price) * 100 : 0
                list.append(ItemPerformance(item: item, percentChange: pct, absoluteChange: diff, currentValue: currentPrice))
            } else {
                // Noch keine Historie – zeige 0% Änderung
                list.append(ItemPerformance(item: item, percentChange: 0, absoluteChange: 0, currentValue: currentPrice))
            }
        }
        return list
    }
    
    // MARK: - Liquiditäts-Score
    
    struct LiquidityBreakdown {
        let liquidPercent: Double   // Sofort verkaufsbereit
        let illiquidPercent: Double // Sammlerstücke (schwer verkaufbar)
        let liquidValue: Double
        let illiquidValue: Double
    }
    
    var liquidityBreakdown: LiquidityBreakdown {
        let total = totalValue
        guard total > 0 else {
            return LiquidityBreakdown(liquidPercent: 0, illiquidPercent: 0, liquidValue: 0, illiquidValue: 0)
        }
        
        var liquidValue = 0.0
        var illiquidValue = 0.0
        
        for item in inventoryService.inventory {
            let price = priceService.getPrice(for: item)
            // Items > 500€ oder nicht marktfähig gelten als illiquid
            if price > 500 || !item.marketable {
                illiquidValue += price
            } else {
                liquidValue += price
            }
        }
        
        return LiquidityBreakdown(
            liquidPercent: (liquidValue / total) * 100,
            illiquidPercent: (illiquidValue / total) * 100,
            liquidValue: liquidValue,
            illiquidValue: illiquidValue
        )
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    
                    if inventoryService.inventory.isEmpty {
                        Text("Nicht genug Daten für eine Analyse.")
                            .foregroundColor(.secondary)
                            .padding(.top, 50)
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else {
                        // Liquiditäts-Score
                        liquiditySection
                        
                        // Investment-Rendite (ROI)
                        investmentRoiSection
                        
                        // Chart Section
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Portfolio Aufteilung")
                                .font(.headline)
                                .foregroundColor(.primary)
                            Text("Nach Seltenheit (Wert)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            Chart(valueByRarity, id: \.rarity) { data in
                                SectorMark(
                                    angle: .value("Wert", data.value),
                                    innerRadius: .ratio(0.6),
                                    angularInset: 2.0
                                )
                                .cornerRadius(4)
                                .foregroundStyle(data.rarity.color)
                                .annotation(position: .overlay) {
                                    if (data.value / totalValue) > 0.05 {
                                        Text("\(Int((data.value / totalValue) * 100))%")
                                            .font(.caption2.bold())
                                            .foregroundColor(.white)
                                    }
                                }
                            }
                            .frame(height: 250)
                            .padding(.vertical)
                            
                            // Legende
                            VStack(spacing: 12) {
                                ForEach(valueByRarity, id: \.rarity) { data in
                                    HStack {
                                        Circle()
                                            .fill(data.rarity.color)
                                            .frame(width: 10, height: 10)
                                        Text(data.rarity.rawValue)
                                            .font(.subheadline)
                                            .foregroundColor(.primary)
                                        Spacer()
                                        Text(userSettings.formattedPrice(data.value))
                                            .font(.subheadline.bold())
                                            .foregroundColor(.primary)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color.primary.opacity(0.05)))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.primary.opacity(0.1), lineWidth: 1))
                        
                        // Performance Section
                        VStack(alignment: .leading, spacing: 16) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Performance")
                                        .font(.headline)
                                        .foregroundColor(.primary)
                                    Text("Top Gewinner & Verlierer")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Picker("Zeitraum", selection: $selectedTimeframe) {
                                    ForEach(Timeframe.allCases) { tf in
                                        Text(tf.rawValue).tag(tf)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                                .tint(.primary)
                            }
                            
                            let sorted = performanceList.sorted { $0.percentChange > $1.percentChange }
                            let topMovers = sorted.prefix(3)
                            let topLosers = sorted.suffix(3).reversed()
                            
                            if !topMovers.isEmpty {
                                Text("Top Movers 🚀")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.green)
                                    .padding(.top, 8)
                                    
                                ForEach(Array(topMovers)) { perf in
                                    performanceRow(perf: perf, isUp: perf.percentChange >= 0)
                                        .transition(.move(edge: .leading).combined(with: .opacity))
                                }
                            }
                            
                            if !topLosers.isEmpty {
                                Text("Top Losers 📉")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.red)
                                    .padding(.top, 8)
                                    
                                ForEach(Array(topLosers)) { perf in
                                    performanceRow(perf: perf, isUp: perf.percentChange >= 0)
                                        .transition(.move(edge: .trailing).combined(with: .opacity))
                                }
                            }
                        }
                        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: selectedTimeframe)
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color.primary.opacity(0.05)))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.primary.opacity(0.1), lineWidth: 1))
                        
                        // Platz für das TabBar Overlay
                        Spacer().frame(height: 100)
                    }
                }
                .padding(20)
                .animation(.spring(response: 0.5, dampingFraction: 0.7), value: selectedTimeframe)
            }
            .navigationTitle("Analyse")
            .background(Color(uiColor: .systemBackground).edgesIgnoringSafeArea(.all))
        }
    }
    
    // MARK: - Liquiditäts-Barometer
    
    private var liquiditySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Liquiditäts-Score")
                .font(.headline)
                .foregroundColor(.primary)
            Text("Wie schnell ist dein Portfolio verkaufbar?")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            let breakdown = liquidityBreakdown
            
            // Barometer
            GeometryReader { geo in
                HStack(spacing: 2) {
                    // Liquid
                    if breakdown.liquidPercent > 0 {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(hex: "00FF77"))
                            .frame(width: geo.size.width * CGFloat(breakdown.liquidPercent / 100))
                    }
                    // Illiquid
                    if breakdown.illiquidPercent > 0 {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(hex: "FF6B35"))
                            .frame(width: geo.size.width * CGFloat(breakdown.illiquidPercent / 100))
                    }
                }
            }
            .frame(height: 12)
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .background(RoundedRectangle(cornerRadius: 6).fill(Color.primary.opacity(0.05)))
            
            // Legende
            HStack(spacing: 20) {
                HStack(spacing: 6) {
                    Circle().fill(Color(hex: "00FF77")).frame(width: 8, height: 8)
                    VStack(alignment: .leading) {
                        Text("Liquid (\(String(format: "%.0f", breakdown.liquidPercent))%)")
                            .font(.caption2.bold())
                            .foregroundColor(.primary)
                        Text(userSettings.formattedPrice(breakdown.liquidValue))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                
                HStack(spacing: 6) {
                    Circle().fill(Color(hex: "FF6B35")).frame(width: 8, height: 8)
                    VStack(alignment: .leading) {
                        Text("Illiquid (\(String(format: "%.0f", breakdown.illiquidPercent))%)")
                            .font(.caption2.bold())
                            .foregroundColor(.primary)
                        Text(userSettings.formattedPrice(breakdown.illiquidValue))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.primary.opacity(0.05)))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.primary.opacity(0.1), lineWidth: 1))
    }
    
    @ViewBuilder
    private func performanceRow(perf: ItemPerformance, isUp: Bool) -> some View {
        HStack {
            VStack(alignment: .leading) {
                Text(perf.item.name)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                    .lineLimit(1)
                if let wear = perf.item.wear {
                    Text(wear)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text(userSettings.formattedPrice(perf.currentValue))
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                
                if userSettings.showAbsoluteValues {
                    Text("\(isUp ? "+" : "")\(userSettings.formattedPrice(abs(perf.absoluteChange)))")
                        .font(.caption.bold())
                        .foregroundColor(isUp ? .green : .red)
                } else {
                    Text("\(isUp ? "+" : "")\(String(format: "%.1f", perf.percentChange))%")
                        .font(.caption.bold())
                        .foregroundColor(isUp ? .green : .red)
                }
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture {
            withAnimation(.spring) {
                userSettings.showAbsoluteValues.toggle()
            }
        }
    }
    
    private var investmentRoiSection: some View {
        let hasAnyBuyIn = inventoryService.inventory.contains { userSettings.buyInPrice(for: $0.assetid) != nil }
        
        return VStack(alignment: .leading, spacing: 12) {
            Text("Investment-Rendite (ROI)")
                .font(.headline)
                .foregroundColor(.primary)
            Text("Tatsächliche Performance basierend auf deinen Einkaufspreisen.")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            if !hasAnyBuyIn {
                VStack(spacing: 8) {
                    Image(systemName: "arrow.up.right.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                    Text("Trage in den Skin-Details deine Einkaufspreise ein, um deine reale Rendite zu berechnen.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color.primary.opacity(0.02)))
            } else {
                let totalBuyIn = inventoryService.inventory.reduce(0.0) { sum, item in
                    let itemPrice = priceService.getPrice(for: item, includeSticker: userSettings.includeStickerValue)
                    let buyInPrice = userSettings.buyInPrice(for: item.assetid) ?? itemPrice
                    return sum + buyInPrice
                }
                let currentVal = priceService.calculateTotalValue(inventory: inventoryService.inventory, includeSticker: userSettings.includeStickerValue)
                let profit = currentVal - totalBuyIn
                let roiPercent = totalBuyIn > 0 ? (profit / totalBuyIn) * 100 : 0
                let isUp = profit >= 0
                
                let buyInCount = inventoryService.inventory.filter { userSettings.buyInPrice(for: $0.assetid) != nil }.count
                let totalCount = inventoryService.inventory.count
                
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Einkaufswert")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text(userSettings.formattedPrice(totalBuyIn))
                                .font(.subheadline.bold())
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Marktwert")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text(userSettings.formattedPrice(currentVal))
                                .font(.subheadline.bold())
                        }
                    }
                    
                    Divider().background(Color.white.opacity(0.1))
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Reingewinn")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text("\(isUp ? "+" : "")\(userSettings.formattedPrice(profit))")
                                .font(.title3.bold())
                                .foregroundColor(isUp ? .green : .red)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Rendite (ROI)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text("\(isUp ? "+" : "")\(String(format: "%.1f", roiPercent))%")
                                .font(.title3.bold())
                                .foregroundColor(isUp ? .green : .red)
                        }
                    }
                    
                    Text("\(buyInCount) von \(totalCount) Skins mit Einkaufspreis erfasst")
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                        .padding(.top, 4)
                }
            }
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.primary.opacity(0.05)))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.primary.opacity(0.1), lineWidth: 1))
    }
}

#Preview {
    AnalyticsView()
        .environmentObject(InventoryService())
        .environmentObject(PriceService())
        .environmentObject(PriceHistoryStore())
        .environmentObject(UserSettings())
}
