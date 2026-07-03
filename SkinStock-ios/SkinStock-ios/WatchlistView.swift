import SwiftUI

struct WatchlistView: View {
    @EnvironmentObject var watchlistService: WatchlistService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var priceHistoryStore: PriceHistoryStore
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var achievementService: AchievementService
    @EnvironmentObject var inventoryService: InventoryService
    
    @State private var searchText = ""
    @State private var searchResults: [SkinportSearchItem] = []
    @State private var isSearching = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Search Bar
                    HStack(spacing: 12) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(.secondary)
                        TextField("Skin suchen...", text: $searchText)
                            .foregroundColor(.primary)
                            .autocapitalization(.none)
                            .onSubmit { searchSkins() }
                    }
                    .padding(14)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Color.primary.opacity(0.06)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.primary.opacity(0.1), lineWidth: 0.5))
                    .padding(.horizontal, 20)
                    
                    // Search Results
                    if !searchResults.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Suchergebnisse")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 20)
                            
                            ForEach(searchResults, id: \.hashName) { result in
                                searchResultRow(result)
                            }
                        }
                    }
                    
                    // Watchlist Items
                    if watchlistService.items.isEmpty && searchResults.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "eye.slash")
                                .font(.system(size: 40))
                                .foregroundStyle(.secondary)
                            Text("Deine Watchlist ist leer")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text("Suche nach Skins die du kaufen möchtest")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.top, 60)
                    } else if !watchlistService.items.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Beobachtet (\(watchlistService.items.count))")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 20)
                            
                            ForEach(watchlistService.items) { item in
                                watchlistRow(item)
                            }
                        }
                    }
                    
                    Spacer().frame(height: 100)
                }
                .padding(.top, 10)
            }
            .navigationTitle("Watchlist")
            .background(Color(uiColor: .systemBackground).edgesIgnoringSafeArea(.all))
        }
    }
    
    // MARK: - Search
    
    private func searchSkins() {
        guard !searchText.isEmpty else { return }
        isSearching = true
        
        // Suche in der priceMap des PriceServices
        let matches = priceService.priceMap.filter {
            $0.key.localizedCaseInsensitiveContains(searchText)
        }
        
        self.searchResults = matches.map {
            SkinportSearchItem(hashName: $0.key, price: $0.value)
        }.sorted { $0.hashName < $1.hashName }
        
        isSearching = false
    }
    
    @ViewBuilder
    private func searchResultRow(_ result: SkinportSearchItem) -> some View {
        let alreadyWatching = watchlistService.isWatching(hashName: result.hashName)
        
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(result.hashName)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Text(userSettings.formattedPrice(result.price))
                    .font(.caption)
                    .foregroundStyle(.green)
            }
            
            Spacer()
            
            Button {
                if !alreadyWatching {
                    watchlistService.addItem(
                        hashName: result.hashName,
                        name: result.hashName,
                        imageUrl: nil,
                        rarity: .milSpec,
                        targetPrice: nil
                    )
                    // Trigger evaluation
                    let totalVal = priceService.calculateTotalValue(inventory: inventoryService.inventory)
                    achievementService.evaluate(
                        inventory: inventoryService.inventory,
                        totalValue: totalVal,
                        watchlistCount: watchlistService.items.count
                    )
                }
            } label: {
                Image(systemName: alreadyWatching ? "checkmark.circle.fill" : "plus.circle")
                    .foregroundStyle(alreadyWatching ? .green : Color(hex: "00F0FF"))
                    .font(.title3)
            }
            .disabled(alreadyWatching)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
    }
    
    @ViewBuilder
    private func watchlistRow(_ item: WatchlistItem) -> some View {
        let currentPrice = priceService.priceMap[item.hashName] ?? 0
        
        HStack(spacing: 12) {
            // Mini Chart
            let history = priceHistoryStore.getHistory(for: item.hashName, timeframe: .week)
            if history.count >= 2 {
                TrendlineView(data: history, showAxes: false, lineWidth: 1.5, showIndicator: false)
                    .frame(width: 60, height: 30)
            } else {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.primary.opacity(0.05))
                    .frame(width: 60, height: 30)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.subheadline.bold())
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                
                if currentPrice > 0 {
                    Text(userSettings.formattedPrice(currentPrice))
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            }
            
            Spacer()
            
            // Zielpreis Badge
            if let target = item.targetPrice, currentPrice > 0 {
                let isBelow = currentPrice <= target
                Text(isBelow ? "🎯 Kaufen!" : "Ziel: \(userSettings.formattedPrice(target))")
                    .font(.caption2.bold())
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(isBelow ? Color.green.opacity(0.2) : Color.primary.opacity(0.05)))
                    .foregroundStyle(isBelow ? .green : .secondary)
            }
            
            Button {
                withAnimation(.spring) {
                    watchlistService.removeItem(item)
                }
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.red.opacity(0.7))
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color.primary.opacity(0.03)))
        .padding(.horizontal, 12)
    }
}

struct SkinportSearchItem {
    let hashName: String
    let price: Double
}
