import SwiftUI

struct ArbitrageView: View {
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var watchlistService: WatchlistService
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedSegment = 0 // 0 = Inventar, 1 = Watchlist
    @State private var loadingMap: [String: Bool] = [:]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Segment Picker
                Picker("", selection: $selectedSegment) {
                    Text("Dein Inventar").tag(0)
                    Text("Beobachtungsliste").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                .background(Color.black)
                
                // Info Banner
                HStack(spacing: 8) {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(Color(hex: "00F0FF"))
                    Text("Arbitrage = Kaufen auf Skinport, Verkaufen auf Steam. Ein Spread über 15% deckt die Steam-Gebühr.")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.black)
                
                List {
                    let items = selectedSegment == 0 ? inventoryItems : watchlistItems
                    
                    if items.isEmpty {
                        Section {
                            VStack(spacing: 12) {
                                Image(systemName: selectedSegment == 0 ? "archivebox" : "eye.slash")
                                    .font(.system(size: 40))
                                    .foregroundColor(.gray)
                                Text(selectedSegment == 0 ? "Keine Items im Inventar" : "Keine Items auf der Watchlist")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                            .padding(.vertical, 40)
                            .frame(maxWidth: .infinity)
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                    } else {
                        Section(header: Text("Skins")) {
                            ForEach(items, id: \.hashName) { item in
                                arbitrageRow(for: item)
                            }
                        }
                        .listRowBackground(Color.white.opacity(0.02))
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
            .navigationTitle("Arbitrage-Finder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Schließen") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: checkAllVisible) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .foregroundColor(.white)
                }
            }
            .background(Color.black.edgesIgnoringSafeArea(.all))
        }
        .preferredColorScheme(.dark)
    }
    
    // Helper types to unify Row rendering
    struct ArbitrageItem {
        let name: String
        let hashName: String
        let imageUrl: URL?
        let rarity: SkinRarity
    }
    
    private var inventoryItems: [ArbitrageItem] {
        // Group by hashName so we don't display duplicates
        var seen = Set<String>()
        return inventoryService.inventory.compactMap { item in
            guard !seen.contains(item.hashName) else { return nil }
            seen.insert(item.hashName)
            return ArbitrageItem(name: item.name, hashName: item.hashName, imageUrl: item.imageUrl, rarity: item.rarity)
        }
    }
    
    private var watchlistItems: [ArbitrageItem] {
        watchlistService.items.map { item in
            ArbitrageItem(name: item.name, hashName: item.hashName, imageUrl: item.imageUrl, rarity: item.rarity)
        }
    }
    
    @ViewBuilder
    private func arbitrageRow(for item: ArbitrageItem) -> some View {
        HStack(spacing: 12) {
            // Image Box
            ZStack {
                Color.black.opacity(0.4)
                if let url = item.imageUrl {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFit().frame(width: 40, height: 40)
                    } placeholder: {
                        ProgressView().scaleEffect(0.6)
                    }
                } else {
                    Image(systemName: "photo").foregroundColor(.white.opacity(0.2))
                }
            }
            .frame(width: 48, height: 48)
            .cornerRadius(8)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(item.rarity.color.opacity(0.4), lineWidth: 0.5))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.subheadline.bold())
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                let skinportPrice = priceService.priceMap[item.hashName] ?? 0.0
                Text("Skinport: \(userSettings.formattedPrice(skinportPrice))")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if let steamPrice = priceService.steamMedianPrices[item.hashName] {
                let skinportPrice = priceService.priceMap[item.hashName] ?? 0.0
                let spread = priceService.arbitrageSpread(for: item.hashName) ?? 0.0
                let steamFee = Marketplace.steam.feeRate
                let netSteamPrice = steamPrice * (1.0 - steamFee)
                let netProfit = netSteamPrice - skinportPrice
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Steam: \(userSettings.formattedPrice(steamPrice))")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                    
                    HStack(spacing: 4) {
                        Text("\(spread >= 0 ? "+" : "")\(String(format: "%.1f", spread))%")
                        Text(netProfit >= 0 ? "(Profit)" : "(Lust)")
                            .font(.system(size: 7))
                    }
                    .font(.caption2.bold())
                    .foregroundColor(spread >= 15.0 ? .green : (spread >= 0 ? .orange : .red))
                }
            } else {
                if loadingMap[item.hashName] == true {
                    ProgressView().scaleEffect(0.8)
                } else {
                    Button(action: {
                        fetchSteamPrice(for: item.hashName)
                    }) {
                        Text("Vergleichen")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.black)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(hex: "00F0FF"))
                            .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func fetchSteamPrice(for hashName: String) {
        loadingMap[hashName] = true
        Task {
            await priceService.fetchSteamMedianPrice(for: hashName)
            loadingMap[hashName] = false
        }
    }
    
    private func checkAllVisible() {
        let items = selectedSegment == 0 ? inventoryItems : watchlistItems
        Task {
            for item in items.prefix(8) { // Max 8 parallel to prevent immediate rate limit
                if priceService.steamMedianPrices[item.hashName] == nil {
                    fetchSteamPrice(for: item.hashName)
                    try? await Task.sleep(nanoseconds: 1_500_000_000) // Sleep 1.5s between requests to be gentle to Steam Community API
                }
            }
        }
    }
}
