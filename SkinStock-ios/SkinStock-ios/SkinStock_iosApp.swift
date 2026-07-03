//
//  SkinStock_iosApp.swift
//  SkinStock-ios
//
//  Created by Artjom Becker on 02.07.26.
//

import SwiftUI
import FirebaseCore

class AppDelegate: NSObject, UIApplicationDelegate {
  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    FirebaseApp.configure()
    return true
  }
}

@main
struct SkinStock_iosApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var appState = AppStateManager()
    @StateObject private var authManager = AuthManager()
    @StateObject private var steamService = SteamService()
    @StateObject private var userSettings = UserSettings()
    
    // Core Logic Services
    @StateObject private var priceService = PriceService()
    @StateObject private var priceHistoryStore = PriceHistoryStore()
    @StateObject private var inventoryService = InventoryService()
    @StateObject private var inventoryViewModel = InventoryViewModel()
    @StateObject private var watchlistService = WatchlistService()
    @StateObject private var achievementService = AchievementService()
    @StateObject private var notificationService = NotificationService()
    
    var body: some Scene {
        WindowGroup {
            Group {
                switch appState.status {
                case .onboarding:
                    OnboardingView(
                        authManager: authManager,
                        steamService: steamService
                    )
                    .environmentObject(appState)
                    .environmentObject(userSettings)
                    
                case .steamLogin:
                    SteamLoginView(steamService: steamService)
                    .environmentObject(appState)
                    
                case .mainApp:
                    MainNavigationContainer()
                        .environmentObject(appState)
                        .environmentObject(authManager)
                        .environmentObject(steamService)
                        .environmentObject(userSettings)
                        .environmentObject(priceService)
                        .environmentObject(priceHistoryStore)
                        .environmentObject(inventoryService)
                        .environmentObject(inventoryViewModel)
                        .environmentObject(watchlistService)
                        .environmentObject(achievementService)
                        .environmentObject(notificationService)
                        .onAppear {
                            notificationService.requestPermission()
                        }
                }
            }
            .preferredColorScheme(userSettings.selectedTheme.colorScheme)
        }
    }
}
