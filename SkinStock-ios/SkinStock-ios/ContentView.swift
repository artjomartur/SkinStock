//
//  ContentView.swift
//  SkinStock-ios
//
//  Created by Artjom Becker on 02.07.26.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var steamService: SteamService
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var userSettings: UserSettings
    @State private var selectedTimeframe: Timeframe = .month
    
    var body: some View {
        NavigationStack {
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("FINANZ RADAR")
                                .font(.system(.caption, design: .rounded))
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                                .tracking(2)
                            Text("Portfolio")
                                .font(.system(.largeTitle, design: .rounded))
                                .fontWeight(.black)
                                .foregroundColor(.white)
                        }
                        Spacer()
                    }
                    .padding(.top, 60)
                    
                    // Glass Portfolio Card
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Gesamtwert")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            let totalValue = priceService.calculateTotalValue(inventory: inventoryService.inventory)
                            
                            Text(userSettings.formattedPrice(totalValue))
                                .font(.system(.title, design: .rounded))
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            // Let's compute profit/loss based on timeframe mock data
                            let history = priceService.getPortfolioHistory(inventory: inventoryService.inventory, timeframe: selectedTimeframe)
                            if let first = history.first, let last = history.last {
                                let diff = last.price - first.price
                                let percent = (diff / first.price) * 100
                                let isUp = diff >= 0
                                HStack {
                                    Image(systemName: isUp ? "arrow.trend.up" : "arrow.trend.down")
                                    Text("\(isUp ? "+" : "")\(String(format: "%.1f", percent))% (\(selectedTimeframe.rawValue))")
                                }
                                .font(.caption2)
                                .foregroundColor(isUp ? .green : .red)
                            }
                        }
                        
                        // Main Trendline
                        TrendlineView(data: priceService.getPortfolioHistory(inventory: inventoryService.inventory, timeframe: selectedTimeframe), showAxes: false, lineWidth: 3.0)
                            .frame(height: 120)
                            .padding(.vertical, 8)
                        
                        // Timeframe Picker
                        Picker("Zeitraum", selection: $selectedTimeframe) {
                            ForEach(Timeframe.allCases) { timeframe in
                                Text(timeframe.rawValue).tag(timeframe)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    // The Liquid Glass Effect requested by the user
                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.04)))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                    
                    // Item Listings
                    Text("Deine Top Investment-Objekte")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.top, 10)
                    
                    VStack(spacing: 16) {
                        let sortedItems = inventoryService.inventory.sorted { priceService.getPrice(for: $0) > priceService.getPrice(for: $1) }
                        
                        ForEach(sortedItems.prefix(5)) { item in
                            var displayItem = item
                            let price = priceService.getPrice(for: item)
                            displayItem.lastPrice = price
                            
                            return NavigationLink(destination: SkinDetailView(item: displayItem)) {
                                SkinCardView(item: displayItem)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.bottom, 120) // Spacing for the custom TabBar
                }
                .padding(.horizontal, 20)
            }
        }
        .onAppear {
            // Trigger price fetch in the background if we have an inventory
            if !inventoryService.inventory.isEmpty {
                Task {
                    try? await priceService.fetchPrices()
                }
            }
        }
    }
}

// MARK: - Subcomponents

struct SkinCardView: View {
    let item: CS2Item
    @EnvironmentObject var userSettings: UserSettings
    
    var body: some View {
        HStack(spacing: 16) {
            // Placeholder for 3D Model / Icon
            ZStack {
                Color.clear
                if let url = item.imageUrl {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image
                                .resizable()
                                .scaledToFit()
                                .padding(8)
                        } else if phase.error != nil {
                            Image(systemName: "photo")
                                .foregroundColor(Color.white.opacity(0.5))
                        } else {
                            ProgressView()
                        }
                    }
                } else {
                    Image(systemName: "photo")
                        .foregroundColor(Color.white.opacity(0.5))
                }
            }
            .frame(width: 80, height: 80)
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.05)))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(item.rarity.color.opacity(0.5), lineWidth: 1))
            
            VStack(alignment: .leading, spacing: 6) {
                Text(item.name)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                HStack {
                    if let wear = item.wear {
                        Text(wear)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    if let float = item.float {
                        Text("(\(String(format: "%.3f", float)))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                if let phase = item.phase {
                    Text(phase)
                        .font(.caption2.weight(.medium))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(item.rarity.color.opacity(0.15))
                        .clipShape(Capsule())
                        .foregroundColor(item.rarity.color)
                }
            }
            
            Spacer(minLength: 0)
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(userSettings.formattedPrice(item.lastPrice))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                Text(item.rarity.rawValue)
                    .font(.caption2)
                    .foregroundColor(item.rarity.color)
            }
        }
        .padding()
        // Adopting the requested background styling for Liquid Glass
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.02)))
    }
}

#Preview {
    ContentView()
        .environmentObject(SteamService())
}
