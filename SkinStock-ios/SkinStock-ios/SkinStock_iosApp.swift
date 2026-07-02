//
//  SkinStock_iosApp.swift
//  SkinStock-ios
//
//  Created by Artjom Becker on 02.07.26.
//

import SwiftUI

@main
struct SkinStock_iosApp: App {
    @StateObject private var appState = AppStateManager()
    @StateObject private var authManager = AuthManager()
    @StateObject private var steamService = SteamService()
    
    var body: some Scene {
        WindowGroup {
            switch appState.status {
            case .onboarding:
                OnboardingView(
                    authManager: authManager,
                    steamService: steamService
                )
                .environmentObject(appState)
                
            case .steamLogin:
                SteamLoginView(steamService: steamService)
                .environmentObject(appState)
                
            case .mainApp:
                MainNavigationContainer()
                    .environmentObject(appState)
                    .environmentObject(authManager)
                    .environmentObject(steamService)
            }
        }
    }
}
