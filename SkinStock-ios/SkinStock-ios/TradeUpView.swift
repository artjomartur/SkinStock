import SwiftUI

struct TradeUpCalculatorView: View {
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var userSettings: UserSettings
    
    @State private var selectedItems: [CS2Item] = []
    @State private var simulatedResult: CS2Item? = nil
    @State private var profitLoss: Double = 0.0
    @State private var showResult = false
    
    // Filtere Items, die für Trade-Up infrage kommen (Consumer bis Classified, keine Knives/Gloves/Cases)
    var tradeUpEligibleItems: [CS2Item] {
        inventoryService.inventory.filter { item in
            let cat = item.skinCategory
            return cat != "Knife" && cat != "Gloves" && cat != "Container" && item.rarity != .covert && item.rarity != .contraband
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack {
                if selectedItems.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "flask.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(Color(hex: "00F0FF"))
                            .shadow(color: Color(hex: "00F0FF").opacity(0.3), radius: 10)
                        
                        Text("Trade-Up Rechner")
                            .font(.title2.bold())
                            .foregroundColor(.white)
                        
                        Text("Wähle genau 10 Skins der gleichen Seltenheitsstufe aus, um den Trade-Up zu simulieren.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                    }
                    .padding(.top, 40)
                } else {
                    // Selected Items horizontal list
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Ausgewählt (\(selectedItems.count)/10)")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 20)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(selectedItems) { item in
                                    ZStack(alignment: .topTrailing) {
                                        VStack(spacing: 4) {
                                            if let url = item.imageUrl {
                                                AsyncImage(url: url) { image in
                                                    image.resizable().scaledToFit().frame(width: 50, height: 50)
                                                } placeholder: {
                                                    ProgressView().scaleEffect(0.5)
                                                }
                                            }
                                            Text(item.name)
                                                .font(.system(size: 8))
                                                .foregroundColor(.white)
                                                .lineLimit(1)
                                                .frame(width: 60)
                                        }
                                        .padding(8)
                                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.04)))
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(item.rarity.color.opacity(0.4), lineWidth: 1))
                                        
                                        Button {
                                            selectedItems.removeAll { $0.id == item.id }
                                        } label: {
                                            Image(systemName: "minus.circle.fill")
                                                .foregroundStyle(.red)
                                                .font(.caption)
                                        }
                                        .offset(x: 4, y: -4)
                                    }
                                }
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                        }
                    }
                    .padding(.top, 10)
                }
                
                // Trigger button
                if selectedItems.count == 10 {
                    Button(action: runSimulatedTradeUp) {
                        Text("Trade-Up starten 🧪")
                            .font(.headline.bold())
                            .foregroundColor(.black)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(
                                LinearGradient(colors: [Color(hex: "00F0FF"), Color(hex: "00FF77")], startPoint: .leading, endPoint: .trailing)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: Color(hex: "00F0FF").opacity(0.3), radius: 10)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                }
                
                // List of eligible items to add
                ScrollView {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Deine verfügbaren Skins")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 20)
                        
                        let filtered = tradeUpEligibleItems.filter { item in
                            // Nur Items gleicher Rarity wie bereits ausgewählte zulassen
                            if let first = selectedItems.first {
                                return item.rarity == first.rarity && !selectedItems.contains(where: { $0.id == item.id })
                            }
                            return true
                        }
                        
                        if filtered.isEmpty {
                            Text("Keine passenden Skins im Inventar.")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 20)
                                .padding(.top, 20)
                        } else {
                            ForEach(filtered) { item in
                                HStack {
                                    if let url = item.imageUrl {
                                        AsyncImage(url: url) { image in
                                            image.resizable().scaledToFit().frame(width: 40, height: 40)
                                        } placeholder: {
                                            ProgressView().scaleEffect(0.5)
                                        }
                                    }
                                    
                                    VStack(alignment: .leading) {
                                        Text(item.name)
                                            .font(.subheadline.bold())
                                            .foregroundColor(.white)
                                        Text(item.rarity.rawValue)
                                            .font(.caption2)
                                            .foregroundColor(item.rarity.color)
                                    }
                                    
                                    Spacer()
                                    
                                    Text(userSettings.formattedPrice(priceService.getPrice(for: item)))
                                        .font(.caption)
                                        .foregroundColor(.green)
                                        .padding(.trailing, 8)
                                    
                                    Button {
                                        if selectedItems.count < 10 {
                                            selectedItems.append(item)
                                        }
                                    } label: {
                                        Image(systemName: "plus.circle.fill")
                                            .foregroundColor(Color(hex: "00F0FF"))
                                            .font(.title3)
                                    }
                                }
                                .padding(10)
                                .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.02)))
                                .padding(.horizontal, 20)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Trade-Up")
            .background(Color.black.edgesIgnoringSafeArea(.all))
            .sheet(isPresented: $showResult) {
                if let result = simulatedResult {
                    tradeUpResultSheet(result: result)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
    
    private func runSimulatedTradeUp() {
        guard selectedItems.count == 10, let first = selectedItems.first else { return }
        
        // Finde ein mögliches Ergebnis der nächsthöheren Seltenheit
        let nextRarity = first.rarity.nextTier ?? .covert
        
        // Suche aus dem gesamten Preis-Map nach Skins dieser Rarity und Kategorie
        let possibleUpgrades = priceService.priceMap.filter { key, price in
            // Einfache Zuordnung über Rarity-Keywords im Name
            if nextRarity == .covert {
                return price > 10.0 // Einfacher Filter
            }
            return price > 2.0
        }
        
        let randomUpgrade = possibleUpgrades.randomElement() ?? (key: "AK-47 | Redline (Field-Tested)", value: 25.0)
        
        let totalCost = selectedItems.reduce(0.0) { $0 + priceService.getPrice(for: $1) }
        let outcomeValue = randomUpgrade.value
        
        profitLoss = outcomeValue - totalCost
        
        simulatedResult = CS2Item(
            id: UUID(),
            assetid: "simulated",
            classid: "simulated",
            instanceid: "simulated",
            name: randomUpgrade.key,
            hashName: randomUpgrade.key,
            float: 0.15,
            phase: nil,
            wear: "Field-Tested",
            lastPrice: outcomeValue,
            currency: "EUR",
            skinCategory: "Rifle",
            rarity: nextRarity,
            imageUrl: nil,
            marketable: true,
            tradable: true,
            stickers: [],
            firstSeenDate: Date(),
            collectionName: nil
        )
        
        showResult = true
    }
    
    @ViewBuilder
    private func tradeUpResultSheet(result: CS2Item) -> some View {
        VStack(spacing: 24) {
            Text("TRADE-UP ERGEBNIS")
                .font(.caption.bold())
                .tracking(3)
                .foregroundColor(Color(hex: "00F0FF"))
            
            Text(result.name)
                .font(.title2.bold())
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            
            Text(result.rarity.rawValue)
                .font(.headline)
                .foregroundColor(result.rarity.color)
            
            VStack(spacing: 8) {
                Text("Wert des Upgrades")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(userSettings.formattedPrice(result.lastPrice))
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            }
            
            HStack(spacing: 6) {
                Image(systemName: profitLoss >= 0 ? "arrow.triangle.2.circlepath" : "exclamationmark.triangle")
                Text(profitLoss >= 0 ? "Gewinn: +\(userSettings.formattedPrice(profitLoss))" : "Verlust: \(userSettings.formattedPrice(profitLoss))")
            }
            .font(.headline)
            .foregroundColor(profitLoss >= 0 ? .green : .red)
            .padding()
            .background(RoundedRectangle(cornerRadius: 12).fill(profitLoss >= 0 ? Color.green.opacity(0.1) : Color.red.opacity(0.1)))
            
            Button("Schließen") {
                showResult = false
                selectedItems.removeAll()
            }
            .font(.headline)
            .foregroundColor(.black)
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .padding(.horizontal, 40)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.edgesIgnoringSafeArea(.all))
    }
}
