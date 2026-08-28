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
    @EnvironmentObject var priceHistoryStore: PriceHistoryStore
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var notificationService: NotificationService
    @State private var selectedTimeframe: Timeframe = .month
    
    var body: some View {
        NavigationStack {
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    Spacer().frame(height: 10)
                    
                    if let error = inventoryService.error {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                Text("Inventar Fehler")
                            }
                            .font(.subheadline.bold())
                            .foregroundColor(.white)
                            
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.8))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                    
                    // Glass Portfolio Card
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 4) {
                            // Brutto vs. Netto Label
                            HStack(spacing: 6) {
                                Text(userSettings.showNetValue ? "Netto-Wert" : "Gesamtwert")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                Button {
                                    withAnimation(.spring(response: 0.3)) {
                                        userSettings.showNetValue.toggle()
                                    }
                                } label: {
                                    Image(systemName: userSettings.showNetValue ? "banknote.fill" : "banknote")
                                        .font(.caption)
                                        .foregroundStyle(userSettings.showNetValue ? Color(hex: "00FF77") : .secondary)
                                }
                            }
                            
                            let grossValue = priceService.calculateTotalValue(inventory: inventoryService.inventory, includeSticker: userSettings.includeStickerValue)
                            let displayValue = userSettings.showNetValue
                                ? priceService.calculateNetValue(inventory: inventoryService.inventory, marketplace: userSettings.preferredMarketplace, includeSticker: userSettings.includeStickerValue)
                                : grossValue
                            
                            Text(userSettings.formattedPrice(displayValue))
                                .font(.system(.title, design: .rounded))
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                                .contentTransition(.numericText())
                            
                            // Netto-Info
                            if userSettings.showNetValue {
                                HStack(spacing: 4) {
                                    Text("nach \(userSettings.preferredMarketplace.displayFee) Gebühren")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    
                                    Menu {
                                        ForEach(Marketplace.allCases) { mp in
                                            Button {
                                                userSettings.preferredMarketplace = mp
                                            } label: {
                                                HStack {
                                                    Text("\(mp.rawValue) (\(mp.displayFee))")
                                                    if mp == userSettings.preferredMarketplace {
                                                        Image(systemName: "checkmark")
                                                    }
                                                }
                                            }
                                        }
                                    } label: {
                                        Text(userSettings.preferredMarketplace.rawValue)
                                            .font(.caption2.bold())
                                            .foregroundStyle(.primary)
                                    }
                                }
                            }
                            
                            // Real Investment Buy-in ROI
                            let hasAnyBuyIn = inventoryService.inventory.contains { userSettings.buyInPrice(for: $0.assetid) != nil }
                            if hasAnyBuyIn {
                                let totalBuyIn = inventoryService.inventory.reduce(0.0) { sum, item in
                                    let itemPrice = priceService.getPrice(for: item, includeSticker: userSettings.includeStickerValue)
                                    let buyInPrice = userSettings.buyInPrice(for: item.assetid) ?? itemPrice
                                    return sum + buyInPrice
                                }
                                let profit = displayValue - totalBuyIn
                                let roiPercent = totalBuyIn > 0 ? (profit / totalBuyIn) * 100 : 0
                                let isUp = profit >= 0
                                
                                HStack(spacing: 8) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Kaufpreis")
                                            .font(.system(size: 10))
                                            .foregroundColor(.secondary)
                                        Text(userSettings.formattedPrice(totalBuyIn))
                                            .font(.caption2.bold())
                                            .foregroundColor(.primary)
                                    }
                                    
                                    Spacer()
                                    
                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text(isUp ? "Profit" : "Verlust")
                                            .font(.system(size: 10))
                                            .foregroundColor(.secondary)
                                        Text("\(isUp ? "+" : "")\(userSettings.formattedPrice(profit)) (\(isUp ? "+" : "")\(String(format: "%.1f", roiPercent))%)")
                                            .font(.caption2.bold())
                                            .foregroundColor(isUp ? .green : .red)
                                    }
                                }
                                .padding(8)
                                .background(RoundedRectangle(cornerRadius: 10).fill(Color.primary.opacity(0.02)))
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.primary.opacity(0.05), lineWidth: 0.5))
                            }
                            
                            // Performance aus der echten Historie
                            let history = priceHistoryStore.getPortfolioHistory(inventory: inventoryService.inventory, priceService: priceService, timeframe: selectedTimeframe)
                            if history.count >= 2, let first = history.first, let last = history.last, first.price > 0 {
                                let diff = last.price - first.price
                                let percent = (diff / first.price) * 100
                                let isUp = diff >= 0
                                HStack {
                                    Image(systemName: isUp ? "arrow.up.right" : "arrow.down.right")
                                    if userSettings.showAbsoluteValues {
                                        Text("\(isUp ? "+" : "")\(userSettings.formattedPrice(abs(diff))) (\(selectedTimeframe.rawValue))")
                                    } else {
                                        Text("\(isUp ? "+" : "")\(String(format: "%.1f", percent))% (\(selectedTimeframe.rawValue))")
                                    }
                                }
                                .font(.caption2)
                                .foregroundColor(isUp ? .green : .red)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    withAnimation(.spring) {
                                        userSettings.showAbsoluteValues.toggle()
                                    }
                                }
                            }
                        }
                        
                        // Main Trendline (echte Daten)
                        let chartHistory = priceHistoryStore.getPortfolioHistory(inventory: inventoryService.inventory, priceService: priceService, timeframe: selectedTimeframe)
                        if chartHistory.count >= 2 {
                            TrendlineView(data: chartHistory, showAxes: false, lineWidth: 3.0)
                                .frame(height: 120)
                                .padding(.vertical, 8)
                        } else {
                            VStack(spacing: 8) {
                                Image(systemName: "chart.line.uptrend.xyaxis")
                                    .font(.title2)
                                    .foregroundStyle(.secondary)
                                Text("Chart-Daten bauen sich über die Zeit auf")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(height: 120)
                            .frame(maxWidth: .infinity)
                        }
                        
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
                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.primary.opacity(0.04)))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.primary.opacity(0.1), lineWidth: 1))
                    
                    // Goal Progress Bar
                    if userSettings.targetValue > 0 {
                        let totalVal = userSettings.showNetValue
                            ? priceService.calculateNetValue(inventory: inventoryService.inventory, marketplace: userSettings.preferredMarketplace, includeSticker: userSettings.includeStickerValue)
                            : priceService.calculateTotalValue(inventory: inventoryService.inventory, includeSticker: userSettings.includeStickerValue)
                        GoalProgressView(currentValue: totalVal)
                    }
                    
                    // Portfolio-Score
                    if !inventoryService.inventory.isEmpty {
                        PortfolioScoreView()
                    }
                    
                    // Item Listings
                    Text("Deine Top Investment-Objekte")
                        .font(.headline)
                        .foregroundColor(.primary)
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
            .navigationTitle("Portfolio")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        if let pdfURL = ExportService.generatePDF(inventory: inventoryService.inventory, priceService: priceService, userSettings: userSettings) {
                            ShareLink(item: pdfURL) {
                                Label("PDF Report exportieren", systemImage: "doc.text.fill")
                            }
                        }
                        
                        if let csvURL = ExportService.generateCSV(inventory: inventoryService.inventory, priceService: priceService, userSettings: userSettings) {
                            ShareLink(item: csvURL) {
                                Label("CSV Tabelle exportieren", systemImage: "tablecells.fill")
                            }
                        }
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundColor(.primary)
                    }
                }
            }
            .background(Color(uiColor: .systemBackground).edgesIgnoringSafeArea(.all))
        }
        .onAppear {
            // Trigger price fetch and record to history
            if !inventoryService.inventory.isEmpty {
                Task {
                    try? await priceService.fetchPrices()
                    // Preise in die Historie schreiben
                    priceHistoryStore.recordAllPrices(priceMap: priceService.priceMap)
                    // Preisalarme prüfen
                    priceService.checkCustomPriceAlerts(userSettings: userSettings, notificationService: notificationService)
                    
                    // Widget synchronisieren
                    let totalVal = priceService.calculateTotalValue(inventory: inventoryService.inventory, includeSticker: userSettings.includeStickerValue)
                    let historyPoints = priceHistoryStore.getPortfolioHistory(inventory: inventoryService.inventory, priceService: priceService, timeframe: .day)
                    let historyArray = historyPoints.map { $0.price }
                    priceService.syncWidgetData(totalValue: totalVal, history: historyArray)
                }
            }
        }
    }
}

// MARK: - Subcomponents

struct SkinCardView: View {
    let item: CS2Item
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var priceService: PriceService
    
    var body: some View {
        HStack(spacing: 16) {
            // Image Box
            ZStack {
                Color.black.opacity(0.2)
                
                if let url = item.imageUrl {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image
                                .resizable()
                                .scaledToFit()
                                .padding(8)
                        } else if phase.error != nil {
                            Image(systemName: "photo")
                                .foregroundColor(Color.white.opacity(0.3))
                        } else {
                            ProgressView().scaleEffect(0.8)
                        }
                    }
                } else {
                    Image(systemName: "photo")
                        .foregroundColor(Color.white.opacity(0.3))
                }
            }
            .frame(width: 72, height: 72)
            .background(RoundedRectangle(cornerRadius: 14).fill(Color.white.opacity(0.04)))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(item.rarity.color.opacity(0.4), lineWidth: 1)
            )
            .oledGlow(color: item.rarity.color, intensity: 0.6)
            
            VStack(alignment: .leading, spacing: 6) {
                Text(item.name)
                    .font(.system(.subheadline, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                HStack(spacing: 6) {
                    if let wear = item.wear {
                        Text(wear)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.secondary)
                    }
                    if let float = item.float {
                        Text("(\(String(format: "%.3f", float)))")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary.opacity(0.8))
                    }
                    
                    TradeLockBadgeView(item: item)
                }
                
                // Mini stickers
                if !item.stickers.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(item.stickers.prefix(4), id: \.self) { sticker in
                            Text(sticker.name.prefix(3).uppercased())
                                .font(.system(size: 7, weight: .black))
                                .foregroundColor(.black)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 2)
                                .background(Color(hex: "00F0FF"))
                                .cornerRadius(3)
                        }
                    }
                }
            }
            
            Spacer(minLength: 4)
            
            VStack(alignment: .trailing, spacing: 4) {
                let price = priceService.getPrice(for: item, includeSticker: userSettings.includeStickerValue)
                let displayPrice = userSettings.showNetValue
                    ? priceService.getNetPrice(for: item, marketplace: userSettings.preferredMarketplace, includeSticker: userSettings.includeStickerValue)
                    : price
                
                Text(userSettings.formattedPrice(displayPrice))
                    .font(.system(.subheadline, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text(item.rarity.rawValue)
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundColor(item.rarity.color)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color.primary.opacity(0.03))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color.primary.opacity(0.06), lineWidth: 0.5)
        )
    }
}

struct GoalProgressView: View {
    @EnvironmentObject var userSettings: UserSettings
    let currentValue: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("INVESTMENT-ZIEL")
                        .font(.caption2.bold())
                        .foregroundColor(.secondary)
                        .tracking(1.5)
                    
                    Text(userSettings.targetName.isEmpty ? "Meilenstein" : userSettings.targetName)
                        .font(.headline)
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                let percent = userSettings.targetValue > 0 ? min((currentValue / userSettings.targetValue) * 100, 100) : 0
                Text(String(format: "%.1f%%", percent))
                    .font(.system(.title3, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(percent >= 100 ? .green : .primary)
            }
            
            // Progress bar
            let progress = userSettings.targetValue > 0 ? min(currentValue / userSettings.targetValue, 1.0) : 0
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.primary.opacity(0.1))
                        .frame(height: 8)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: progress >= 1.0 ? [.green, .green.opacity(0.8)] : [.primary, .primary.opacity(0.6)],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * CGFloat(progress), height: 8)
                }
            }
            .frame(height: 8)
            
            HStack {
                Text(userSettings.formattedPrice(currentValue))
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("Ziel: \(userSettings.formattedPrice(userSettings.targetValue))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.primary.opacity(0.04)))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.primary.opacity(0.08), lineWidth: 0.5))
        .padding(.horizontal, 20)
    }
}

#Preview {
    ContentView()
        .environmentObject(SteamService())
}
