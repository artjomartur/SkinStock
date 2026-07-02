import Foundation
import SwiftUI
import Combine
// WICHTIG: Sobald das Firebase iOS SDK hinzugefügt wurde, entkommentiere diese Zeilen:
// import FirebaseAuth
// import FirebaseCore

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUserEmail: String? = nil
    
    // Für das MVP simulieren wir den Login, bis du das Firebase Package in Xcode geladen hast.
    // Sobald Firebase in Xcode ist, tausche den Code in den Funktionen aus!
    
    init() {
        // Firebase Setup (Auskommentiert bis Package da ist):
        /*
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        
        Auth.auth().addStateDidChangeListener { auth, user in
            self.isAuthenticated = user != nil
            self.currentUserEmail = user?.email
        }
        */
        
        // Mock State:
        self.isAuthenticated = UserDefaults.standard.bool(forKey: "mock_is_auth")
    }
    
    func signIn(email: String, password: String) async throws {
        // Firebase Implementierung:
        /*
        try await Auth.auth().signIn(withEmail: email, password: password)
        */
        
        // Mock Implementierung:
        try await Task.sleep(nanoseconds: 1_000_000_000)
        UserDefaults.standard.set(true, forKey: "mock_is_auth")
        self.isAuthenticated = true
    }
    
    func signUp(email: String, password: String) async throws {
        // Firebase Implementierung:
        /*
        try await Auth.auth().createUser(withEmail: email, password: password)
        */
        
        // Mock Implementierung:
        try await Task.sleep(nanoseconds: 1_000_000_000)
        UserDefaults.standard.set(true, forKey: "mock_is_auth")
        self.isAuthenticated = true
    }
    
    func signOut() {
        // Firebase Implementierung:
        /*
        do {
            try Auth.auth().signOut()
        } catch {
            print("Error signing out: \(error)")
        }
        */
        
        // Mock Implementierung:
        UserDefaults.standard.set(false, forKey: "mock_is_auth")
        self.isAuthenticated = false
    }
}
