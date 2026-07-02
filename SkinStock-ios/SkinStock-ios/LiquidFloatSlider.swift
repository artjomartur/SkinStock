import SwiftUI
import UIKit // Für die Farb-Interpolation

struct LiquidFloatSlider: View {
    @Binding var value: Double // 0.0 bis 1.0
    
    @State private var isDragging: Bool = false
    
    // Geometrie
    private let trackHeight: CGFloat = 8
    private let thumbSize: CGFloat = 28
    
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let usableWidth = width - thumbSize
            
            // X-Position des Thumb-Centers
            let currentX = (usableWidth * CGFloat(value)) + (thumbSize / 2)
            let color = interpolatedColor(for: value)
            
            ZStack(alignment: .leading) {
                // 1. Hintergrund-Track (Glas)
                Capsule()
                    .fill(.ultraThinMaterial)
                    .frame(height: trackHeight)
                    .overlay(
                        Capsule().stroke(.white.opacity(0.1), lineWidth: 1)
                    )
                    .position(x: width / 2, y: thumbSize / 2)
                
                // 2. Aktiver Track (Gefüllt mit weichem Verlauf)
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.2), color],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: currentX, height: trackHeight)
                    .shadow(color: color.opacity(0.6), radius: 6, x: 0, y: 0)
                    .position(x: currentX / 2, y: thumbSize / 2)
                
                // 3. Liquid Glass Thumb
                ZStack {
                    // Hauptkörper des Thumbs (wird beim Ziehen flacher und breiter)
                    Capsule()
                        .fill(color)
                        .shadow(color: color.opacity(0.8), radius: isDragging ? 15 : 8, x: 0, y: isDragging ? 5 : 0)
                    
                    // Glanz-Effekt für den Glass-Look
                    Capsule()
                        .stroke(LinearGradient(colors: [.white.opacity(0.9), .clear], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1.5)
                        .padding(1)
                }
                .frame(
                    width: isDragging ? thumbSize * 1.6 : thumbSize,
                    height: isDragging ? thumbSize * 0.75 : thumbSize
                )
                // Die Verformung extrem weich animieren
                .animation(.interactiveSpring(response: 0.35, dampingFraction: 0.5, blendDuration: 0.2), value: isDragging)
                .position(x: currentX, y: thumbSize / 2)
                
                // 4. Unsichtbare Touch-Fläche (etwas größer für bessere UX)
                Rectangle()
                    .fill(Color.clear)
                    .frame(width: width, height: thumbSize * 2)
                    .position(x: width / 2, y: thumbSize / 2)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { gesture in
                                // Sofortige Verformung starten
                                if !isDragging {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                                        isDragging = true
                                    }
                                }
                                
                                // Wert berechnen
                                let locationX = gesture.location.x - (thumbSize / 2)
                                let clampedX = min(max(0, locationX), usableWidth)
                                
                                // Direkte Wertzuweisung (Animation für die Position nicht nötig, Drag soll 1:1 am Finger kleben)
                                value = Double(clampedX / usableWidth)
                            }
                            .onEnded { _ in
                                // Zurück in die runde Kapsel federn
                                withAnimation(.interpolatingSpring(stiffness: 300, damping: 15)) {
                                    isDragging = false
                                }
                            }
                    )
            }
        }
        .frame(height: thumbSize)
    }
    
    // MARK: - Color Interpolation (Sanfter Übergang der CS2 Wears)
    
    private func interpolatedColor(for value: Double) -> Color {
        // Stops basierend auf den CS2 Float-Grenzen
        let stops: [(Double, Color)] = [
            (0.00, Color(hex: "00FFFF")), // Factory New (Cyan)
            (0.07, Color(hex: "00FF77")), // Factory New / Minimal Wear Grenze (Mint)
            (0.15, Color(hex: "ADFF2F")), // Minimal Wear (GreenYellow)
            (0.38, Color(hex: "FFD700")), // Field-Tested (Gold)
            (0.45, Color(hex: "FF8C00")), // Well-Worn (DarkOrange)
            (1.00, Color(hex: "FF0033"))  // Battle-Scarred (Red)
        ]
        
        let clampedValue = max(0, min(1, value))
        
        // Finde das entsprechende Segment für den sanften Übergang
        for i in 0..<(stops.count - 1) {
            let (lowerBound, lowerColor) = stops[i]
            let (upperBound, upperColor) = stops[i+1]
            
            if clampedValue >= lowerBound && clampedValue <= upperBound {
                let segmentRange = upperBound - lowerBound
                let progress = (clampedValue - lowerBound) / segmentRange
                return blend(color1: lowerColor, color2: upperColor, progress: progress)
            }
        }
        return stops.last!.1
    }
    
    private func blend(color1: Color, color2: Color, progress: Double) -> Color {
        let uiColor1 = UIColor(color1)
        let uiColor2 = UIColor(color2)
        
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0
        
        uiColor1.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        uiColor2.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        
        let r = r1 + (r2 - r1) * CGFloat(progress)
        let g = g1 + (g2 - g1) * CGFloat(progress)
        let b = b1 + (b2 - b1) * CGFloat(progress)
        let a = a1 + (a2 - a1) * CGFloat(progress)
        
        return Color(red: Double(r), green: Double(g), blue: Double(b), opacity: Double(a))
    }
}

struct LiquidFloatSlider_PreviewWrapper: View {
    @State private var floatValue: Double = 0.15
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 40) {
                Text(String(format: "Float: %.4f", floatValue))
                    .font(.title2.monospacedDigit().weight(.bold))
                    .foregroundStyle(.white)
                
                LiquidFloatSlider(value: $floatValue)
                    .padding(.horizontal, 40)
            }
        }
    }
}

#Preview {
    LiquidFloatSlider_PreviewWrapper()
}
