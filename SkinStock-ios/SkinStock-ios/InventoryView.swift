import SwiftUI

struct InventoryView: View {
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var viewModel: InventoryViewModel
    @EnvironmentObject var userSettings: UserSettings
    
    // Grid Layout: 2 Spalten auf iPhone, mehr auf iPad
    let columns = [
        GridItem(.adaptive(minimum: 160, maximum: 200), spacing: 16)
    ]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                if inventoryService.inventory.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "archivebox")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("Dein Inventar ist leer oder lädt...")
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 100)
                } else {
                    LazyVGrid(columns: columns, spacing: 16) {
                        ForEach(viewModel.displayedItems) { item in
                            NavigationLink(destination: SkinDetailView(item: item)) {
                                InventoryGridItemView(item: item)
                                    .environmentObject(userSettings)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(16)
                    // Platz für das TabBar Overlay lassen
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Inventar")
            .searchable(text: $viewModel.searchText, prompt: "Skins suchen...")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Picker("Sortieren nach", selection: $viewModel.sortOption) {
                            ForEach(SortOption.allCases, id: \.self) { option in
                                Text(option.rawValue).tag(option)
                            }
                        }
                        
                        Divider()
                        
                        Toggle("Nur Verkaufbare", isOn: $viewModel.showOnlyMarketable)
                        
                        Divider()
                        
                        Picker("Kategorie", selection: $viewModel.selectedCategory) {
                            Text("Alle").tag(String?.none)
                            ForEach(viewModel.availableCategories, id: \.self) { category in
                                Text(category).tag(String?.some(category))
                            }
                        }
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .background(Color.black.edgesIgnoringSafeArea(.all))
            .onReceive(inventoryService.$inventory) { newInventory in
                viewModel.updateData(inventory: newInventory, priceService: priceService)
            }
            .onReceive(priceService.$priceMap) { _ in
                viewModel.updateData(inventory: inventoryService.inventory, priceService: priceService)
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct InventoryGridItemView: View {
    let item: CS2Item
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var priceHistoryStore: PriceHistoryStore
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.05))
                    .aspectRatio(1, contentMode: .fit)
                
                if let url = item.imageUrl {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image
                                .resizable()
                                .scaledToFit()
                                .padding(12)
                        } else if phase.error != nil {
                            Image(systemName: "photo")
                                .foregroundColor(.white.opacity(0.5))
                        } else {
                            ProgressView()
                        }
                    }
                } else {
                    Image(systemName: "photo")
                        .foregroundColor(.white.opacity(0.5))
                }
                
                // Rarity Rand unten
                VStack {
                    Spacer()
                    Rectangle()
                        .fill(item.rarity.color)
                        .frame(height: 4)
                }
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.caption)
                    .fontWeight(.bold)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .foregroundColor(.white)
                
                HStack {
                    Text(userSettings.formattedPrice(priceService.getPrice(for: item)))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                    
                    Spacer()
                    
                    if let wear = item.wear {
                        Text(wear.prefix(2).uppercased())
                            .font(.system(size: 10, weight: .bold))
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Color.white.opacity(0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                            .foregroundColor(.white)
                    }
                }
                
                // Mini Trendline (echte Daten)
                let history = priceHistoryStore.getHistory(for: item.hashName, timeframe: .week)
                if history.count >= 2 {
                    TrendlineView(data: history, showAxes: false, lineWidth: 1.5, showIndicator: false)
                        .frame(height: 20)
                        .padding(.top, 2)
                }
            }
        }
        .padding(8)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.02)))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
    }
}

#Preview {
    InventoryView()
        .environmentObject(SteamService())
        .environmentObject(UserSettings())
}
