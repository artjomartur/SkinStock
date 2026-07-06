import SwiftUI

struct SkinDetailView: View {
    let item: CS2Item
    @State private var floatValue: Double
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var priceHistoryStore: PriceHistoryStore
    @EnvironmentObject var userSettings: UserSettings
    @State private var selectedTimeframe: Timeframe = .month
    @State private var showSMA: Bool = false
    
    init(item: CS2Item) {
        self.item = item
        _floatValue = State(initialValue: item.float ?? 0.15)
    }
    
    private var simulatedWear: String {
        let f = floatValue
        if f < 0.07 { return "Factory New" }
        else if f < 0.15 { return "Minimal Wear" }
        else if f < 0.38 { return "Field-Tested" }
        else if f < 0.45 { return "Well-Worn" }
        else { return "Battle-Scarred" }
    }
    
    private var simulatedPrice: Double {
        let reconstructedHashName = "\(item.name) (\(simulatedWear))"
        let basePrice = priceService.priceMap[reconstructedHashName] ?? item.lastPrice
        return basePrice
    }
    
    var body: some View {
        ZStack {
            // 1. Tiefschwarzer, tiefer Raum
            Color(uiColor: .systemBackground).ignoresSafeArea()
            
            // 2. Chromatische Vollbild-Farben (basierend auf Rarity)
            chromaticBackground
            
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 20) {
                    // Header (Back Button, Titel)
                    header
                    
                    // 3. Transluzente Glasscheibe mit schwebendem Item
                    ZStack {
                        RoundedRectangle(cornerRadius: 32, style: .continuous)
                            .fill(.ultraThinMaterial)
                            .frame(height: 220)
                            .overlay(
                                RoundedRectangle(cornerRadius: 32, style: .continuous)
                                    .stroke(
                                        LinearGradient(
                                            colors: [.white.opacity(0.4), .white.opacity(0.05), item.rarity.color.opacity(0.3)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 1
                                    )
                            )
                            .shadow(color: item.rarity.color.opacity(0.12), radius: 30, x: 0, y: 15)
                            .padding(.horizontal, 20)
                        
                        VStack(spacing: 8) {
                            if let url = item.imageUrl {
                                AsyncImage(url: url) { phase in
                                    if let image = phase.image {
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 110, height: 110)
                                            .shadow(color: .black.opacity(0.5), radius: 20, x: 0, y: 10)
                                    } else {
                                        Image(systemName: "cube.transparent")
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 80, height: 80)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                }
                            } else {
                                Image(systemName: "cube.transparent")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 80, height: 80)
                                    .foregroundStyle(.white.opacity(0.4))
                            }
                            
                            Text(item.name)
                                .font(.headline.weight(.bold))
                                .foregroundStyle(.primary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 40)
                            
                            // Badges for Collection & Trade-Lock
                            HStack(spacing: 8) {
                                if let coll = item.collectionName {
                                    Text(coll)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(.secondary)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Capsule().fill(Color.primary.opacity(0.08)))
                                }
                                
                                TradeLockBadgeView(item: item)
                            }
                            
                            // Stickers
                            if !item.stickers.isEmpty {
                                HStack(spacing: 6) {
                                    ForEach(item.stickers, id: \.self) { sticker in
                                        Text(sticker.name.prefix(4).uppercased())
                                            .font(.system(size: 8, weight: .black))
                                            .foregroundColor(.black)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 3)
                                            .background(Color(hex: "00F0FF"))
                                            .cornerRadius(4)
                                            .shadow(color: Color(hex: "00F0FF").opacity(0.3), radius: 2)
                                    }
                                }
                                .padding(.top, 2)
                            }
                        }
                        .offset(y: -10)
                    }
                    
                    // Preis (Simuliert basierend auf Slider)
                    let baseSimulatedPrice = simulatedPrice
                    let displayPrice = userSettings.showNetValue
                        ? baseSimulatedPrice * (1.0 - userSettings.preferredMarketplace.feeRate)
                        : baseSimulatedPrice
                    
                    VStack(spacing: 4) {
                        Text(userSettings.formattedPrice(displayPrice))
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(.primary)
                        
                        if userSettings.showNetValue {
                            Text("Netto (\(userSettings.preferredMarketplace.rawValue))")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        
                        let overpay = calculateStickerOverpay()
                        if overpay > 0 {
                            Text("+ \(userSettings.formattedPrice(overpay)) Sticker-Wert")
                                .font(.caption2.bold())
                                .foregroundStyle(Color(hex: "00FF77"))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Capsule().fill(Color.green.opacity(0.12)))
                                .padding(.top, 4)
                        }
                    }
                    
                    // Arbitrage Spread
                    if let spread = priceService.arbitrageSpread(for: item.hashName), spread > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.caption2)
                            Text("Skinport \(String(format: "%.1f", spread))% günstiger als Steam")
                                .font(.caption2)
                        }
                        .foregroundStyle(spread > 5 ? Color(hex: "00FF77") : .secondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Capsule().fill(Color.white.opacity(0.06)))
                    }
                    
                    // Float-Simulator Karte
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Wear-Simulator")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(simulatedWear)
                                .font(.caption.bold())
                                .foregroundStyle(item.rarity.color)
                        }
                        
                        Text(String(format: "Float: %.4f", floatValue))
                            .font(.system(.subheadline, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        LiquidFloatSlider(value: $floatValue)
                            .padding(.vertical, 4)
                    }
                    .padding(20)
                    .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.04)))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.08), lineWidth: 0.5))
                    .padding(.horizontal, 20)
                    
                    // Einkaufspreis-Karte
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Einkaufspreis")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                            .tracking(1)
                        
                        HStack {
                            Text(userSettings.selectedCurrency.symbol)
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextField("Kaufpreis eingeben", text: Binding(
                                get: {
                                    if let priceUSD = userSettings.buyInPrice(for: item.assetid) {
                                        let currentRate = userSettings.convertPrice(1.0)
                                        return String(format: "%.2f", priceUSD * currentRate)
                                    }
                                    return ""
                                },
                                set: { newValue in
                                    if let input = Double(newValue.replacingOccurrences(of: ",", with: ".")) {
                                        let currentRate = userSettings.convertPrice(1.0)
                                        userSettings.setBuyInPrice(for: item.assetid, priceUSD: input / currentRate)
                                    } else if newValue.isEmpty {
                                        userSettings.setBuyInPrice(for: item.assetid, priceUSD: nil)
                                    }
                                }
                            ))
                            .keyboardType(.decimalPad)
                            .font(.subheadline.bold())
                            .foregroundColor(.primary)
                            
                            if userSettings.buyInPrice(for: item.assetid) != nil {
                                Button {
                                    userSettings.setBuyInPrice(for: item.assetid, priceUSD: nil)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.primary.opacity(0.04)))
                        
                        // Rendite-Anzeige falls Kaufpreis gesetzt ist
                        if let buyInUSD = userSettings.buyInPrice(for: item.assetid) {
                            let diff = simulatedPrice - buyInUSD
                            let roi = buyInUSD > 0 ? (diff / buyInUSD) * 100 : 0
                            let isProfit = diff >= 0
                            
                            HStack {
                                Text(isProfit ? "Gewinn:" : "Verlust:")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                Text("\(isProfit ? "+" : "")\(userSettings.formattedPrice(diff)) (\(isProfit ? "+" : "")\(String(format: "%.1f", roi))%)")
                                    .font(.subheadline.bold())
                                    .foregroundColor(isProfit ? .green : .red)
                            }
                            .padding(.top, 4)
                        }
                    }
                    .padding(20)
                    .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.04)))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.08), lineWidth: 0.5))
                    .padding(.horizontal, 20)
                    
                    // Chart & Picker
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Preisverlauf")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.secondary)
                            Spacer()
                            Button {
                                withAnimation {
                                    showSMA.toggle()
                                }
                            } label: {
                                Text("SMA")
                                    .font(.caption2.bold())
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(showSMA ? Color(hex: "00F0FF") : Color.white.opacity(0.1))
                                    .foregroundColor(showSMA ? .black : .white)
                                    .cornerRadius(6)
                            }
                            
                            Picker("Zeitraum", selection: $selectedTimeframe) {
                                ForEach(Timeframe.allCases) { tf in
                                    Text(tf.rawValue).tag(tf)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .tint(.white)
                        }
                        
                        let history = priceHistoryStore.getHistory(for: item.hashName, timeframe: selectedTimeframe)
                        if history.count >= 2 {
                            TrendlineView(data: history, showAxes: false, lineWidth: 2, showIndicator: true, showSMA: showSMA)
                                .frame(height: 200)
                        } else {
                            VStack(spacing: 8) {
                                Image(systemName: "clock.arrow.circlepath")
                                    .font(.title3)
                                    .foregroundStyle(.secondary)
                                Text("Preis-Historie baut sich auf...")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(height: 200)
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(20)
                    .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.04)))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.08), lineWidth: 0.5))
                    .padding(.horizontal, 20)
                    
                    Spacer().frame(height: 40)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .onAppear {
            // Lade Steam Median-Preis für Arbitrage
            Task {
                await priceService.fetchSteamMedianPrice(for: item.hashName)
            }
        }
    }
    
    // MARK: - Header
    private var header: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.primary)
                    .padding(14)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.primary.opacity(0.2), lineWidth: 1))
            }
            
            Spacer()
            
            Text(item.skinCategory)
                .font(.subheadline.weight(.semibold))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
            
            Spacer()
            
            Button {
                // Action: Share oder Favorit
            } label: {
                Image(systemName: "heart")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.primary)
                    .padding(14)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.primary.opacity(0.2), lineWidth: 1))
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
    }
    
    // MARK: - Chromatische Reflexionen
    private var chromaticBackground: some View {
        ZStack {
            // Statische Farbe der Skin-Seltenheit (Rarity)
            Circle()
                .fill(item.rarity.color.opacity(0.2))
                .blur(radius: 120)
                .frame(width: 350, height: 350)
                .offset(x: -120, y: -150)
            
            // Dynamische Farbe
            let dynamicColor = dynamicFloatColor(floatValue)
            Circle()
                .fill(dynamicColor.opacity(0.15))
                .blur(radius: 150)
                .frame(width: 450, height: 450)
                .offset(x: 150, y: 200)
                .animation(.easeInOut(duration: 0.3), value: floatValue)
        }
        .ignoresSafeArea()
    }
    
    private func dynamicFloatColor(_ value: Double) -> Color {
        let clamped = max(0, min(1, value))
        if clamped < 0.07 { return Color(hex: "00FFFF") }
        if clamped < 0.15 { return Color(hex: "00FF77") }
        if clamped < 0.38 { return Color(hex: "ADFF2F") }
        if clamped < 0.45 { return Color(hex: "FF8C00") }
        return Color(hex: "FF0033")
    }
    
    private func calculateStickerOverpay() -> Double {
        guard !item.stickers.isEmpty else { return 0 }
        var overpay = 0.0
        for sticker in item.stickers {
            let nameLower = sticker.name.lowercased()
            if nameLower.contains("katowice 2014") || nameLower.contains("ibuypower") || nameLower.contains("titan") {
                overpay += 150.0
            } else if nameLower.contains("holo") || nameLower.contains("gold") {
                overpay += 15.0
            } else {
                overpay += 2.0
            }
        }
        return overpay
    }
}

// MARK: - Preview
#Preview {
    let mockItem = CS2Item(
        id: UUID(),
        assetid: "123",
        classid: "456",
        instanceid: "789",
        name: "Karambit | Doppler",
        hashName: "★ Karambit | Doppler (Factory New)",
        float: 0.032,
        phase: "Phase 2",
        wear: "Factory New",
        lastPrice: 1200.0,
        currency: "USD",
        skinCategory: "Knife",
        rarity: .covert,
        imageUrl: nil,
        marketable: true,
        tradable: true,
        stickers: [],
        firstSeenDate: nil,
        collectionName: nil
    )
    SkinDetailView(item: mockItem)
        .environmentObject(PriceService())
        .environmentObject(PriceHistoryStore())
        .environmentObject(UserSettings())
}
