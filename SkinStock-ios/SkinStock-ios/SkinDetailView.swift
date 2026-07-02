import SwiftUI

struct SkinDetailView: View {
    let item: CS2Item
    @State private var floatValue: Double
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var priceHistoryStore: PriceHistoryStore
    @EnvironmentObject var userSettings: UserSettings
    @State private var selectedTimeframe: Timeframe = .month
    
    init(item: CS2Item) {
        self.item = item
        _floatValue = State(initialValue: item.float ?? 0.15)
    }
    
    var body: some View {
        ZStack {
            // 1. Tiefschwarzer, tiefer Raum
            Color.black.ignoresSafeArea()
            
            // 2. Chromatische Vollbild-Farben (basierend auf Rarity)
            chromaticBackground
            
            VStack {
                // Header (Back Button, Titel)
                header
                
                Spacer()
                
                // 3. Transluzente Glasscheibe mit schwebendem 3D-Item
                ZStack {
                    // Glasscheibe
                    RoundedRectangle(cornerRadius: 40, style: .continuous)
                        .fill(.ultraThinMaterial)
                        .frame(height: 280)
                        .overlay(
                            RoundedRectangle(cornerRadius: 40, style: .continuous)
                                .stroke(
                                    LinearGradient(
                                        colors: [.white.opacity(0.4), .white.opacity(0.05), item.rarity.color.opacity(0.3)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )
                        .shadow(color: item.rarity.color.opacity(0.15), radius: 40, x: 0, y: 20)
                        .padding(.horizontal, 24)
                    
                    // Schwebendes Bild
                    VStack {
                        if let url = item.imageUrl {
                            AsyncImage(url: url) { phase in
                                if let image = phase.image {
                                    image
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 140, height: 140)
                                        .shadow(color: .black.opacity(0.6), radius: 25, x: 0, y: 15)
                                        .offset(y: -40)
                                } else {
                                    Image(systemName: "arkit")
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 140, height: 140)
                                        .foregroundStyle(LinearGradient(colors: [.white, .white.opacity(0.7)], startPoint: .top, endPoint: .bottom))
                                        .shadow(color: .black.opacity(0.6), radius: 25, x: 0, y: 15)
                                        .offset(y: -40)
                                }
                            }
                        } else {
                            Image(systemName: "arkit")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 140, height: 140)
                                .foregroundStyle(LinearGradient(colors: [.white, .white.opacity(0.7)], startPoint: .top, endPoint: .bottom))
                                .shadow(color: .black.opacity(0.6), radius: 25, x: 0, y: 15)
                                .offset(y: -40)
                        }
                        
                        Text(item.name)
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.white)
                    }
                }
                
                Spacer()
                
                // Preis und interaktiver Chart
                VStack(spacing: 16) {
                    
                    // Preis (Brutto oder Netto je nach Einstellung)
                    let displayPrice = userSettings.showNetValue
                        ? priceService.getNetPrice(for: item, marketplace: userSettings.preferredMarketplace)
                        : priceService.getPrice(for: item)
                    
                    VStack(spacing: 2) {
                        Text(userSettings.formattedPrice(displayPrice))
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .shadow(color: item.rarity.color.opacity(0.5), radius: 10, x: 0, y: 5)
                        
                        if userSettings.showNetValue {
                            Text("Netto (\(userSettings.preferredMarketplace.rawValue))")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.top, 10)
                    
                    // Arbitrage Spread
                    if let spread = priceService.arbitrageSpread(for: item.hashName) {
                        HStack(spacing: 4) {
                            Image(systemName: spread > 0 ? "arrow.triangle.2.circlepath" : "equal.circle")
                                .font(.caption2)
                            Text(spread > 0 ? "Skinport \(String(format: "%.1f", spread))% günstiger als Steam" : "Kein Spread")
                                .font(.caption2)
                        }
                        .foregroundStyle(spread > 5 ? Color(hex: "00FF77") : .secondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.white.opacity(0.05)))
                    }
                    
                    // Chart & Picker
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Preisverlauf")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Spacer()
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
                            TrendlineView(data: history, showAxes: false, lineWidth: 2, showIndicator: true)
                                .frame(height: 180)
                        } else {
                            VStack(spacing: 8) {
                                Image(systemName: "clock.arrow.circlepath")
                                    .font(.title3)
                                    .foregroundStyle(.secondary)
                                Text("Preis-Historie baut sich auf...")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(height: 180)
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.horizontal, 40)
                }
                .padding(.bottom, 20)
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
                    .foregroundStyle(.white)
                    .padding(14)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 1))
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
                    .foregroundStyle(.white)
                    .padding(14)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 1))
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
        marketable: true
    )
    SkinDetailView(item: mockItem)
        .environmentObject(PriceService())
        .environmentObject(PriceHistoryStore())
        .environmentObject(UserSettings())
}
