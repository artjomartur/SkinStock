import SwiftUI

// MARK: - App Route definitions for CS2 Inventory Finance
enum CS2Tab: String, CaseIterable, Identifiable {
    case portfolio = "Portfolio"
    case inventory = "Inventar"
    case analytics = "Analyse"
    case account = "Account"
    
    var id: String { self.rawValue }
    
    var systemImage: String {
        switch self {
        case .portfolio: return "chart.pie.fill"
        case .inventory: return "archivebox.fill"
        case .analytics: return "chart.bar.xaxis"
        case .account: return "person.crop.circle.fill"
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab: CS2Tab = .portfolio
    @Namespace private var glassNamespace
    @State private var showActionHub: Bool = false
    
    // Sub-view presentation states
    @State private var showWatchlist: Bool = false
    @State private var showAchievements: Bool = false
    @State private var showCollections: Bool = false
    @State private var showTradeUp: Bool = false
    @State private var showWhatIf: Bool = false
    
    @EnvironmentObject var inventoryService: InventoryService
    @EnvironmentObject var steamService: SteamService
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var watchlistService: WatchlistService
    @EnvironmentObject var achievementService: AchievementService
    @EnvironmentObject var userSettings: UserSettings
    
    init() {
        UITabBar.appearance().isHidden = true
    }
    
    var body: some View {
        ZStack(alignment: .bottom) {
            
            // 1. Pure OLED Black Background (completely black as requested)
            Color.black.ignoresSafeArea()
            
            // 2. Main content views
            mainTabViewContent
            
            // 3. Liquid Glass Tab Bar
            customTabBar
            
            // 4. Action Hub Overlay
            if showActionHub {
                actionHubOverlay
            }
            
            // 5. Achievement Toast Banner
            if let achievement = achievementService.newlyUnlocked {
                VStack {
                    AchievementBannerView(achievement: achievement)
                        .padding(.top, 50)
                    Spacer()
                }
                .transition(.move(edge: .top).combined(with: .opacity))
                .zIndex(100)
            }
        }
        .sheet(isPresented: $showWatchlist) {
            WatchlistView()
                .environmentObject(watchlistService)
                .environmentObject(priceService)
                .environmentObject(userSettings)
        }
        .sheet(isPresented: $showAchievements) {
            AchievementsListView()
                .environmentObject(achievementService)
        }
        .sheet(isPresented: $showCollections) {
            CollectionsView()
                .environmentObject(inventoryService)
                .environmentObject(priceService)
                .environmentObject(userSettings)
        }
        .sheet(isPresented: $showTradeUp) {
            TradeUpCalculatorView()
                .environmentObject(inventoryService)
                .environmentObject(priceService)
                .environmentObject(userSettings)
        }
        .sheet(isPresented: $showWhatIf) {
            WhatIfView()
                .environmentObject(userSettings)
                .environmentObject(priceService)
        }
        .onAppear {
            if let steamId = steamService.profile?.steamId64 {
                Task {
                    await inventoryService.fetchInventory(for: steamId)
                    // Evaluate achievements after load
                    let totalVal = priceService.calculateTotalValue(inventory: inventoryService.inventory)
                    achievementService.evaluate(inventory: inventoryService.inventory, totalValue: totalVal, watchlistCount: watchlistService.items.count)
                }
            }
        }
    }
    
    // MARK: - Action Hub Overlay
    
    private var actionHubOverlay: some View {
        ZStack {
            // Dark Blur Background
            Color.black.opacity(0.6)
                .background(.ultraThinMaterial)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation(.spring) {
                        showActionHub = false
                    }
                }
            
            // Floating menu card
            VStack(spacing: 20) {
                Text("SKINSTOCK")
                    .font(.caption2.bold())
                    .foregroundStyle(Color(hex: "00F0FF"))
                    .tracking(3)
                
                VStack(spacing: 12) {
                    actionHubButton(title: "Beobachtungsliste", icon: "eye.fill", desc: "Skins & Spreads tracken") {
                        showWatchlist = true
                        showActionHub = false
                    }
                    
                    actionHubButton(title: "Erfolge / Achievements", icon: "crown.fill", desc: "Löse Meilensteine ein") {
                        showAchievements = true
                        showActionHub = false
                    }
                    
                    actionHubButton(title: "Sammlungen", icon: "shippingbox.fill", desc: "Collections vervollständigen") {
                        showCollections = true
                        showActionHub = false
                    }
                    
                    actionHubButton(title: "Trade-Up Rechner", icon: "flask.fill", desc: "Simuliere rentable Aufwertungen") {
                        showTradeUp = true
                        showActionHub = false
                    }
                    
                    actionHubButton(title: "Was-wäre-wenn Rechner", icon: "clock.arrow.circlepath", desc: "Simuliere historische ROI") {
                        showWhatIf = true
                        showActionHub = false
                    }
                }
                .padding(.horizontal, 20)
                
                Button(action: {
                    withAnimation(.spring) {
                        showActionHub = false
                    }
                }) {
                    Image(systemName: "xmark")
                        .font(.title3.bold())
                        .foregroundColor(.white)
                        .padding(14)
                        .background(Circle().fill(Color.white.opacity(0.1)))
                }
                .padding(.top, 10)
            }
            .padding(.vertical, 24)
            .background(RoundedRectangle(cornerRadius: 30).fill(Color.white.opacity(0.04)))
            .overlay(RoundedRectangle(cornerRadius: 30).stroke(Color.white.opacity(0.12), lineWidth: 1))
            .padding(.horizontal, 24)
            .shadow(color: Color.black.opacity(0.5), radius: 30, x: 0, y: 15)
        }
    }
    
    private func actionHubButton(title: String, icon: String, desc: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: icon)
                        .font(.title3)
                        .foregroundColor(Color(hex: "00F0FF"))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                    Text(desc)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.03)))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.06), lineWidth: 0.5))
        }
    }
    
    // MARK: - Subviews
    private var mainTabViewContent: some View {
        TabView(selection: $selectedTab) {
            ContentView()
                .tag(CS2Tab.portfolio)
            
            InventoryView()
                .tag(CS2Tab.inventory)
            
            AnalyticsView()
                .tag(CS2Tab.analytics)
            
            AccountView()
                .tag(CS2Tab.account)
        }
    }
    
    private var customTabBar: some View {
        ZStack {
            // Centered capsule tab bar (pill)
            tabsRow
                .frame(maxWidth: 300)
            
            // Separated, round floating button on the far right
            HStack {
                Spacer()
                fabButton
            }
            .padding(.trailing, 20)
        }
        .padding(.bottom, 10)
    }
    
    @ViewBuilder
    private func tabBackground(for tab: CS2Tab) -> some View {
        if selectedTab == tab {
            Capsule()
                .fill(Color.white.opacity(0.1))
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
            .foregroundStyle(selectedTab == tab ? Color(hex: "00F0FF") : Color.white.opacity(0.4))
        }
        .buttonStyle(.plain)
        .background(tabBackground(for: tab))
    }
    
    private var fabButton: some View {
        Button(action: {
            withAnimation(.spring) {
                showActionHub.toggle()
            }
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
                            colors: [Color(hex: "00F0FF"), Color(hex: "00FF77")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 36, height: 36)
                    .shadow(color: Color(hex: "00F0FF").opacity(0.4), radius: 6)
                    .overlay(
                        Image(systemName: showActionHub ? "xmark" : "plus")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.black)
                    )
            }
        }
    }
}

#Preview {
    MainTabView()
}
