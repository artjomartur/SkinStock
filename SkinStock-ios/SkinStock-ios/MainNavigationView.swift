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
                Text("Analyse Content")
            }
            
            Tab("Inventar", systemImage: "archivebox", value: .inventory) {
                Text("Inventar Content")
            }
            
            Tab("Account", systemImage: "person.crop.circle", value: .account) {
                VStack(spacing: 20) {
                    Text("Account Content")
                    
                    Button("Onboarding neu starten") {
                        withAnimation {
                            appState.changeStatus(to: .onboarding)
                        }
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding()
                    .background(Color.blue)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
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
    var body: some View {
        if #available(iOS 18.0, *) {
            MainNavigationView()
        } else {
            MainNavigationViewFallback()
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
            
            Text("Analyse Content")
                .tabItem {
                    Label("Analyse", systemImage: "chart.bar")
                }
                .tag(AppTab.analytics)
            
            Text("Inventar Content")
                .tabItem {
                    Label("Inventar", systemImage: "archivebox")
                }
                .tag(AppTab.inventory)
            
            VStack(spacing: 20) {
                Text("Account Content")
                
                Button("Onboarding neu starten") {
                    withAnimation {
                        appState.changeStatus(to: .onboarding)
                    }
                }
                .font(.headline)
                .foregroundStyle(.white)
                .padding()
                .background(Color.blue)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
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
