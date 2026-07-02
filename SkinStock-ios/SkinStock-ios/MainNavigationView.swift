import SwiftUI

enum AppTab: Hashable {
    case overview
    case analytics
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
            
            Tab("Inventar", systemImage: "archivebox", value: .inventory) {
                InventoryView()
            }
            
            Tab("Account", systemImage: "person.crop.circle", value: .account) {
                AccountView()
            }
            .customizationBehavior(.disabled, for: .sidebar)
            // Optional: Wenn du den Tab auf dem iPad ganz unten rechts abtrennen willst (wie z.B. Suche oder Einstellungen)
            // kannst du auch den Parameter `role: .search` im Tab-Initialisierer testen.
        }
        .tabViewStyle(.sidebarAdaptable)
    }
}

// Universal Wrapper
struct MainNavigationContainer: View {
    @EnvironmentObject var steamService: SteamService
    @EnvironmentObject var inventoryService: InventoryService
    
    var body: some View {
        Group {
            if #available(iOS 18.0, *) {
                MainNavigationView()
            } else {
                MainNavigationViewFallback()
            }
        }
        .onAppear {
            if let steamId = steamService.profile?.steamId64 {
                Task {
                    await inventoryService.fetchInventory(for: steamId)
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
    }
}

#Preview {
    MainNavigationContainer()
}
