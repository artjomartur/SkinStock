//
//  ContentView.swift
//  SkinStock-ios
//
//  Created by Artjom Becker on 02.07.26.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 1. Tiefschwarzer, adaptiver Grund
                Color.black.ignoresSafeArea()
                
                // 2. Diffuse Ambient-Glows im Hintergrund
                ambientBackground
                
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 24) {
                        // Header
                        PortfolioHeaderView(totalValue: viewModel.totalValue)
                        
                        // Inventar-Liste
                        VStack(spacing: 16) {
                            ForEach(viewModel.inventory) { item in
                                NavigationLink(destination: SkinDetailView(item: item)) {
                                    SkinCardView(item: item)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("SkinStock")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
            }
        }
    }
    
    // Großflächige, sehr weiche Farbkleckse im Hintergrund
    private var ambientBackground: some View {
        ZStack {
            Circle()
                .fill(Color(hex: "EB4B4B").opacity(0.12))
                .blur(radius: 120)
                .frame(width: 300, height: 300)
                .offset(x: 100, y: -250)
            
            Circle()
                .fill(Color(hex: "8847FF").opacity(0.12))
                .blur(radius: 150)
                .frame(width: 350, height: 350)
                .offset(x: -150, y: 300)
        }
        .ignoresSafeArea()
    }
}

// MARK: - Subcomponents

struct PortfolioHeaderView: View {
    let totalValue: Double
    // Mock Trend Daten für den Chart
    let trendData: [Double] = [10000, 10200, 10100, 10500, 10400, 11000, 11500, 11300, 11800, 12200, 12450]
    let trendColor = Color(hex: "4B69FF") // Mil-Spec Blue
    
    var body: some View {
        ZStack {
            // Dynamischer Trendgraph im Hintergrund der Kapsel
            MiniTrendChart(data: trendData, color: trendColor)
                .padding(.top, 40) // Chart etwas nach unten schieben, damit der Text frei bleibt
            
            VStack(spacing: 8) {
                Text("Gesamtguthaben")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .tracking(1.5)
                
                Text(totalValue, format: .currency(code: "USD"))
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5) // Text abheben
                
                HStack(spacing: 6) {
                    Image(systemName: "arrow.up.right")
                        .font(.caption.weight(.bold))
                    Text("+5.2%")
                        .font(.subheadline.weight(.semibold))
                    Text("Heute")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                }
                .foregroundStyle(trendColor)
                .padding(.vertical, 8)
                .padding(.horizontal, 14)
                .background(trendColor.opacity(0.15))
                .clipShape(Capsule())
            }
            .padding(.vertical, 32)
        }
        .frame(maxWidth: .infinity)
        // Liquid Glass als schwebende Kapsel (sehr hohe Corner Radius)
        .glassBackgroundEffect(rarityColor: trendColor.opacity(0.5), cornerRadius: 40)
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
}

// Miniatur Trend-Chart mit weicher Bezier-Kurve und Schattierung
struct MiniTrendChart: View {
    var data: [Double]
    var color: Color
    
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height
            
            if data.count > 1 {
                let minData = data.min() ?? 0
                let maxData = data.max() ?? 1
                let range = maxData - minData
                let stepX = width / CGFloat(data.count - 1)
                
                let points = data.enumerated().map { index, value in
                    CGPoint(
                        x: CGFloat(index) * stepX,
                        y: height - (CGFloat(value - minData) / CGFloat(range == 0 ? 1 : range)) * (height * 0.6)
                    )
                }
                
                // Smoothe Bezier Kurve
                let path = Path { p in
                    p.move(to: points[0])
                    for i in 1..<points.count {
                        let p0 = points[i-1]
                        let p1 = points[i]
                        let control1 = CGPoint(x: p0.x + (p1.x - p0.x) / 2, y: p0.y)
                        let control2 = CGPoint(x: p0.x + (p1.x - p0.x) / 2, y: p1.y)
                        p.addCurve(to: p1, control1: control1, control2: control2)
                    }
                }
                
                // Füllbereich mit Gradient
                let fillPath = Path { p in
                    p.addPath(path)
                    p.addLine(to: CGPoint(x: width, y: height))
                    p.addLine(to: CGPoint(x: 0, y: height))
                    p.closeSubpath()
                }
                
                fillPath
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.4), color.opacity(0.0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                
                path
                    .stroke(color, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
                    .shadow(color: color.opacity(0.8), radius: 10, x: 0, y: 5)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 40, style: .continuous)) // Chart nicht über die Kapsel laufen lassen
    }
}

struct SkinCardView: View {
    let item: CS2Item
    
    var body: some View {
        HStack(spacing: 16) {
            // Platzhalter für 3D-Modell / Icon
            ZStack {
                Color.clear
                Image(systemName: "photo")
                    .foregroundStyle(.white.opacity(0.5))
            }
            .frame(width: 80, height: 80)
            .glassBackgroundEffect(rarityColor: item.rarity.color, cornerRadius: 16)
            
            VStack(alignment: .leading, spacing: 6) {
                Text(item.name)
                    .font(.headline)
                    .foregroundStyle(.white)
                
                HStack {
                    if let wear = item.wear {
                        Text(wear)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let float = item.float {
                        Text("(\(String(format: "%.3f", float)))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                
                if let phase = item.phase {
                    Text(phase)
                        .font(.caption2.weight(.medium))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(item.rarity.color.opacity(0.15))
                        .clipShape(Capsule())
                        .foregroundStyle(item.rarity.color)
                }
            }
            
            Spacer(minLength: 0)
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(item.lastPrice, format: .currency(code: item.currency))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                
                Text(item.rarity.rawValue)
                    .font(.caption2)
                    .foregroundStyle(item.rarity.color)
            }
        }
        .padding(16)
        // Die Karte selbst bekommt den Glow basierend auf der Rarity
        .glassBackgroundEffect(rarityColor: item.rarity.color)
    }
}

#Preview {
    ContentView()
}
