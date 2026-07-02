//
//  SkinStock_iosApp.swift
//  SkinStock-ios
//
//  Created by Artjom Becker on 02.07.26.
//

import SwiftUI

@main
struct SkinStock_iosApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var steamService = SteamService()
    
    // Einfacher Weg, um zu tracken, ob der User das Onboarding durch hat
    @AppStorage("has_completed_onboarding") private var hasCompletedOnboarding: Bool = false
    
    var body: some Scene {
        WindowGroup {
            if hasCompletedOnboarding {
                MainTabView()
                    // Diese Services an die child views weiterreichen, falls nötig
                    .environmentObject(authManager)
                    .environmentObject(steamService)
            } else {
                OnboardingView(
                    authManager: authManager,
                    steamService: steamService,
                    isOnboardingComplete: $hasCompletedOnboarding
                )
            }
        }
    }
}
