import SwiftUI

struct SkinDetailView: View {
    let item: CS2Item
    @State private var floatValue: Double
    @Environment(\.dismiss) private var dismiss
    
    init(item: CS2Item) {
        self.item = item
        // Initiale Float Value (Fallback auf 0.15 falls nil)
        _floatValue = State(initialValue: item.float ?? 0.15)
    }
    
    var body: some View {
        ZStack {
            // 1. Tiefschwarzer, tiefer Raum
            Color.black.ignoresSafeArea()
            
            // 2. Chromatische Vollbild-Farben (Animiert durch Float-Value)
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
                        .frame(height: 320)
                        // Chromatische Kante
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
                    
                    // Schwebendes Modell (Mock für 3D / PNG)
                    // Da noch keine echten Assets da sind, nutzen wir ein schönes Symbol
                    VStack {
                        Image(systemName: "arkit")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 180, height: 180)
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.white, .white.opacity(0.7)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .shadow(color: .black.opacity(0.6), radius: 25, x: 0, y: 15)
                            .offset(y: -40) // Item schwebt leicht aus der Scheibe heraus
                        
                        Text(item.name)
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.white)
                    }
                }
                
                Spacer()
                
                // Details und LiquidFloatSlider
                VStack(spacing: 28) {
                    
                    VStack(spacing: 8) {
                        Text("Float Value")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                            .tracking(2)
                        
                        Text(String(format: "%.4f", floatValue))
                            .font(.system(size: 28, design: .monospaced).weight(.black))
                            .foregroundStyle(.white)
                    }
                    
                    // Der interaktive Slider, der du eben ausprobieren wolltest
                    LiquidFloatSlider(value: $floatValue)
                        .padding(.horizontal, 40)
                    
                    // Preis
                    Text(item.lastPrice, format: .currency(code: item.currency))
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.top, 10)
                        .shadow(color: item.rarity.color.opacity(0.5), radius: 10, x: 0, y: 5)
                }
                .padding(.bottom, 50)
            }
        }
        .navigationBarBackButtonHidden(true)
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
            
            // Dynamische Farbe, die auf den Slider reagiert!
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
    
    // Hilfsfunktion, um die grobe Farbe des Sliders für den Hintergrund-Glow zu berechnen
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
        name: "Karambit | Doppler",
        float: 0.032,
        phase: "Phase 2",
        wear: "Factory New",
        lastPrice: 1200.0,
        currency: "USD",
        skinCategory: "Knife",
        rarity: .covert
    )
    return SkinDetailView(item: mockItem)
}
