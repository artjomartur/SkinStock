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
            mainTabViewContent
            customTabBar
        }
    }
    
    // MARK: - Subviews
    private var mainTabViewContent: some View {
        TabView(selection: $selectedTab) {
            ContentView()
                .tag(CS2Tab.today)
            
            ZStack {
                Color.black.ignoresSafeArea()
                Text("News+ View").foregroundStyle(.white)
            }
            .tag(CS2Tab.news)
            
            ZStack {
                Color.black.ignoresSafeArea()
                Text("Sports View").foregroundStyle(.white)
            }
            .tag(CS2Tab.sports)
            
            ZStack {
                Color.black.ignoresSafeArea()
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
    
    private var tabsRow: some View {
        HStack(spacing: 0) {
            ForEach(CS2Tab.allCases) { tab in
                Button(action: {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.82)) {
                        selectedTab = tab
                    }
                }) {
                    VStack(spacing: 4) {
                        Image(systemName: tab.systemImage)
                            .font(.system(size: 17))
                        Text(tab.rawValue)
                            .font(.system(size: 10, weight: .extrabold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .foregroundColor(selectedTab == tab ? .black : .primary.opacity(0.6))
                }
                .background(
                    ZStack {
                        if selectedTab == tab {
                            Capsule()
                                .fill(Color.black.opacity(0.05))
                                .matchedGeometryEffect(id: "activeTabFallback", in: glassNamespace)
                        }
                    }
                )
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 60)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24))
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(.white.opacity(0.2), lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.2), radius: 15, x: 0, y: 8)
    }
    
    private var fabButton: some View {
        Button(action: {
            isSearchActive.toggle()
        }) {
            ZStack {
                Circle()
                    .frame(width: 58, height: 58)
                    .background(.ultraThinMaterial, in: Circle())
                    .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 0.5))
                    .shadow(color: .black.opacity(0.2), radius: 15, x: 0, y: 8)
                
                Circle()
                    .fill(Color.red)
                    .frame(width: 36, height: 36)
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
