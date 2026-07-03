import SwiftUI

enum AppTab: Hashable {
    case overview
    case analytics
    case hub
    case inventory
    case account
}

@available(iOS 18.0, *)
struct MainNavigationView: View {
    @State private var selectedTab: AppTab = .overview
    @EnvironmentObject var appState: AppStateManager
    
    var body: some View {
        TabView(selection: $selectedTab) {
            
            Tab("Übersicht", systemImage: "square.grid.2x2", value: .overview) {
                ContentView()
            }
            
            Tab("Analyse", systemImage: "chart.bar", value: .analytics) {
                AnalyticsView()
            }
            
            Tab("Tools", systemImage: "plus.circle.fill", value: .hub) {
                InvestmentHubView()
            }
            
            Tab("Inventar", systemImage: "archivebox", value: .inventory) {
                InventoryView()
            }
            
            Tab("Account", systemImage: "person.crop.circle", value: .account) {
                AccountView()
            }
            .customizationBehavior(.disabled, for: .sidebar)
        }
        .tabViewStyle(.sidebarAdaptable)
        .tint(.primary)
    }
}

// Universal Wrapper
struct MainNavigationContainer: View {
    @EnvironmentObject var steamService: SteamService
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var watchlistService: WatchlistService
    @EnvironmentObject var achievementService: AchievementService
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var notificationService: NotificationService
    
    var body: some View {
        ZStack(alignment: .top) {
            Group {
                if #available(iOS 18.0, *) {
                    MainNavigationView()
                } else {
                    MainNavigationViewFallback()
                }
            }
            
            // Achievement Toast Banner at root level
            if let achievement = achievementService.newlyUnlocked {
                AchievementBannerView(achievement: achievement)
                    .padding(.top, 50)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(100)
            }
        }
        .onAppear {
            if let steamId = steamService.profile?.steamId64 {
                Task {
                    await inventoryService.fetchInventory(for: steamId)
                    
                    // Erfolge auswerten
                    let totalVal = priceService.calculateTotalValue(inventory: inventoryService.inventory)
                    achievementService.evaluate(
                        inventory: inventoryService.inventory,
                        totalValue: totalVal,
                        watchlistCount: watchlistService.items.count
                    )
                }
            }
        }
    }
}

// Fallback für ältere iOS Versionen (iOS 17 und drunter)
struct MainNavigationViewFallback: View {
    @State private var selectedTab: AppTab = .overview
    @EnvironmentObject var appState: AppStateManager
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ContentView()
                .tabItem {
                    Label("Übersicht", systemImage: "square.grid.2x2")
                }
                .tag(AppTab.overview)
            
            AnalyticsView()
                .tabItem {
                    Label("Analyse", systemImage: "chart.bar")
                }
                .tag(AppTab.analytics)
            
            InvestmentHubView()
                .tabItem {
                    Label("Tools", systemImage: "plus.circle.fill")
                }
                .tag(AppTab.hub)
            
            InventoryView()
                .tabItem {
                    Label("Inventar", systemImage: "archivebox")
                }
                .tag(AppTab.inventory)
            
            AccountView()
                .tabItem {
                    Label("Account", systemImage: "person.crop.circle")
                }
                .tag(AppTab.account)
        }
        .tint(.primary)
    }
}

#Preview {
    MainNavigationContainer()
}
