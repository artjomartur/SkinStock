import SwiftUI
import Charts

struct AnalyticsView: View {
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var priceService: PriceService
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
            let history = priceService.getPriceHistory(for: item.hashName, timeframe: selectedTimeframe)
            if let first = history.first, let last = history.last, first.price > 0 {
                let diff = last.price - first.price
                let pct = (diff / first.price) * 100
                list.append(ItemPerformance(item: item, percentChange: pct, absoluteChange: diff, currentValue: last.price))
            }
        }
        return list
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
                        // Chart Section
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Portfolio Aufteilung")
                                .font(.headline)
                                .foregroundColor(.white)
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
                                            .foregroundColor(.white)
                                        Spacer()
                                        Text(userSettings.formattedPrice(data.value))
                                            .font(.subheadline.bold())
                                            .foregroundColor(.white)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.05)))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                        
                        // Performance Section
                        VStack(alignment: .leading, spacing: 16) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Performance")
                                        .font(.headline)
                                        .foregroundColor(.white)
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
                                .tint(.white)
                            }
                            
                            let topMovers = performanceList.sorted { $0.percentChange > $1.percentChange }.prefix(3)
                            let topLosers = performanceList.sorted { $0.percentChange < $1.percentChange }.prefix(3)
                            
                            if !topMovers.isEmpty {
                                Text("Top Movers 🚀")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.green)
                                    .padding(.top, 8)
                                
                                ForEach(topMovers) { perf in
                                    performanceRow(perf: perf, isUp: true)
                                        .transition(.move(edge: .leading).combined(with: .opacity))
                                }
                            }
                            
                            if !topLosers.isEmpty {
                                Text("Top Losers 📉")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.red)
                                    .padding(.top, 8)
                                
                                ForEach(topLosers) { perf in
                                    performanceRow(perf: perf, isUp: false)
                                        .transition(.move(edge: .trailing).combined(with: .opacity))
                                }
                            }
                        }
                        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: selectedTimeframe)
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.05)))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                        
                        // Platz für das TabBar Overlay
                        Spacer().frame(height: 100)
                    }
                }
                .padding(20)
                .animation(.spring(response: 0.5, dampingFraction: 0.7), value: selectedTimeframe)
            }
            .navigationTitle("Analyse")
            .background(Color(red: 0.05, green: 0.05, blue: 0.1).edgesIgnoringSafeArea(.all))
        }
        .preferredColorScheme(.dark)
    }
    
    @ViewBuilder
    private func performanceRow(perf: ItemPerformance, isUp: Bool) -> some View {
        HStack {
            VStack(alignment: .leading) {
                Text(perf.item.name)
                    .font(.subheadline.bold())
                    .foregroundColor(.white)
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
                    .foregroundColor(.white)
                
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
}

#Preview {
    AnalyticsView()
        .environmentObject(InventoryService())
        .environmentObject(PriceService())
        .environmentObject(UserSettings())
}
