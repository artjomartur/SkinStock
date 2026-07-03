import SwiftUI

struct InvestmentHubView: View {
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var watchlistService: WatchlistService
    @EnvironmentObject var achievementService: AchievementService
    @EnvironmentObject var inventoryService: InventoryService
    
    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Tools")) {
                    NavigationLink {
                        WatchlistView()
                    } label: {
                        Label("Beobachtungsliste (Watchlist)", systemImage: "eye.fill")
                    }
                    
                    NavigationLink {
                        AchievementsListView()
                    } label: {
                        Label("Erfolge (Achievements)", systemImage: "crown.fill")
                    }
                    
                    NavigationLink {
                        CollectionsView()
                    } label: {
                        Label("Sammlungen (Collections)", systemImage: "shippingbox.fill")
                    }
                    
                    NavigationLink {
                        TradeUpCalculatorView()
                    } label: {
                        Label("Trade-Up Rechner", systemImage: "flask.fill")
                    }
                    
                    NavigationLink {
                        WhatIfView()
                    } label: {
                        Label("Was-wäre-wenn Rechner", systemImage: "clock.arrow.circlepath")
                    }
                    
                    NavigationLink {
                        PriceAlertsView()
                            .environmentObject(userSettings)
                            .environmentObject(priceService)
                    } label: {
                        Label("Preisalarme", systemImage: "bell.fill")
                    }
                }
            }
            .navigationTitle("SkinStock Hub")
        }
    }
}
