import SwiftUI

// MARK: - Liquid Glass System Modifier
// Fakes the hallucinated "iOS 26 Native Liquid Glass" behavior perfectly in current iOS versions.

public struct LiquidGlassModifier: ViewModifier {
    var cornerRadius: CGFloat
    
    public func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(.ultraThinMaterial)
                    // Inner shadow for depth
                    .shadow(color: .black.opacity(0.15), radius: 2, x: 0, y: 1)
            )
            .overlay(
                // Specular highlight (simulating light hitting the top edge of thick glass)
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        LinearGradient(
                            colors: [.white.opacity(0.8), .white.opacity(0.0)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1.5
                    )
            )
            // Chromatic aberration / volumetric shadow
            .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 12)
    }
}

public extension View {
    /// Applies a volumetric Liquid Glass effect with specular highlights and refraction.
    func glassEffect(cornerRadius: CGFloat = 24) -> some View {
        self.modifier(LiquidGlassModifier(cornerRadius: cornerRadius))
    }
}

// MARK: - Dynamic Colorful Backdrop
// A view that renders the glowing orbs that make Liquid Glass look so good
public struct LiquidGlassBackdrop: View {
    @State private var isAnimating = false
    
    public init() {}
    
    public var body: some View {
        ZStack {
            // Dark Base
            Color(red: 0.05, green: 0.05, blue: 0.08)
                .ignoresSafeArea()
            
            // Doppler Pink Orb
            Circle()
                .fill(Color(red: 1.0, green: 0.18, blue: 0.58))
                .frame(width: 300, height: 300)
                .blur(radius: 120)
                .offset(x: isAnimating ? 100 : -50, y: isAnimating ? -100 : -150)
            
            // Emerald/Cyan Orb
            Circle()
                .fill(Color(red: 0.0, green: 1.0, blue: 0.66))
                .frame(width: 350, height: 350)
                .blur(radius: 140)
                .offset(x: isAnimating ? -100 : 100, y: isAnimating ? 200 : 100)
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.easeInOut(duration: 8.0).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}
