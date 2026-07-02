import SwiftUI

struct LiquidGlassEffect: ViewModifier {
    var rarityColor: Color
    var cornerRadius: CGFloat = 24
    
    func body(content: Content) -> some View {
        content
            // 1. Die adaptive, milchige Basis (Transzendenz)
            .background(.ultraThinMaterial)
            // 2. Subtiler Glow von hinten
            .background(
                rarityColor
                    .opacity(0.1)
                    .blur(radius: 20)
            )
            // 3. Dünne, halbtransparente Ränder
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        LinearGradient(
                            colors: [
                                rarityColor.opacity(0.15),
                                rarityColor.opacity(0.08),
                                .white.opacity(0.1)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            // 4. Sanfter Drop-Shadow nach außen
            .shadow(color: rarityColor.opacity(0.1), radius: 15, x: 0, y: 10)
    }
}

extension View {
    func glassBackgroundEffect(rarityColor: Color, cornerRadius: CGFloat = 24) -> some View {
        self.modifier(LiquidGlassEffect(rarityColor: rarityColor, cornerRadius: cornerRadius))
    }
}

// MARK: - Helpers
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
