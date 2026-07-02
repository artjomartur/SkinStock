import SwiftUI

// MARK: - App Route definitions for CS2 Inventory Finance
enum CS2Tab: String, CaseIterable, Identifiable {
    case today = "Today"
    case news = "News+"
    case sports = "Sports"
    case audio = "Audio"
    
    var id: String { self.rawValue }
    
    var systemImage: String {
        switch self {
        case .today: return "newspaper"
        case .news: return "newspaper.fill"
        case .sports: return "sportscourt"
        case .audio: return "headphones"
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab: CS2Tab = .today
    @Namespace private var glassNamespace
    @State private var isSearchActive: Bool = false
    
    init() {
        UITabBar.appearance().isHidden = true
    }
    
    var body: some View {
        ZStack(alignment: .bottom) {
            
            // 1. Dynamic Animated Liquid Glass Backdrop
            LiquidGlassBackdrop()
            
            // 2. Main content views
            mainTabViewContent
            
            // 3. Liquid Glass Tab Bar
            customTabBar
        }
    }
    
    // MARK: - Subviews
    private var mainTabViewContent: some View {
        TabView(selection: $selectedTab) {
            ContentView()
                .tag(CS2Tab.today)
            
            ZStack {
                Text("News+ View").foregroundStyle(.white)
            }
            .tag(CS2Tab.news)
            
            ZStack {
                Text("Sports View").foregroundStyle(.white)
            }
            .tag(CS2Tab.sports)
            
            ZStack {
                VStack(spacing: 20) {
                    Text("Audio View").foregroundStyle(.white)
                    
                    Button("Onboarding neu starten") {
                        UserDefaults.standard.set(false, forKey: "has_completed_onboarding")
                    }
                    .font(.headline)
                    .foregroundStyle(.black)
                    .padding()
                    .background(Color(hex: "00F0FF"))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .tag(CS2Tab.audio)
        }
    }
    
    private var customTabBar: some View {
        HStack(spacing: 12) {
            tabsRow
            fabButton
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 10)
    }
    
    @ViewBuilder
    private func tabBackground(for tab: CS2Tab) -> some View {
        if selectedTab == tab {
            Capsule()
                .fill(Color.black.opacity(0.05))
                .matchedGeometryEffect(id: "activeTabFallback", in: glassNamespace)
        } else {
            Color.clear
        }
    }
    
    private var tabsRow: some View {
        HStack(spacing: 0) {
            ForEach(CS2Tab.allCases) { tab in
                tabButton(for: tab)
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 60)
        // Verwende unseren neuen Liquid Glass Modifier!
        .glassEffect(cornerRadius: 24)
    }
    
    private func tabButton(for tab: CS2Tab) -> some View {
        Button(action: {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.82)) {
                selectedTab = tab
            }
        }) {
            VStack(spacing: 4) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 18))
                Text(tab.rawValue)
                    .font(.system(size: 10, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .foregroundColor(selectedTab == tab ? Color.black : Color.secondary)
        }
        .background(tabBackground(for: tab))
    }
    
    private var fabButton: some View {
        Button(action: {
            isSearchActive.toggle()
        }) {
            ZStack {
                Circle()
                    .frame(width: 58, height: 58)
                    .background(
                        Circle().fill(.ultraThinMaterial)
                    )
                    .overlay(
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.35), Color.white.opacity(0.05)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                ),
                                lineWidth: 1.0
                            )
                    )
                    .shadow(color: Color.black.opacity(0.25), radius: 15, x: 0, y: 10)
                
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color(red: 1.0, green: 0.16, blue: 0.37), Color(red: 1.0, green: 0.0, blue: 0.23)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 36, height: 36)
                    .shadow(color: Color(red: 1.0, green: 0.0, blue: 0.23).opacity(0.4), radius: 6)
                    .overlay(
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                    )
            }
        }
    }
}

#Preview {
    MainTabView()
}
