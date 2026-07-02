import Foundation
import SwiftUI

import Combine

enum AppStatus: String {
    case onboarding
    case steamLogin
    case mainApp
}

@MainActor
class AppStateManager: ObservableObject {
    @Published var status: AppStatus
    
    // Einfache Persistenz, damit der User nach dem App-Neustart direkt im richtigen Screen landet
    private static let statusKey = "app_status_key"
    
    init() {
        if let savedStatus = UserDefaults.standard.string(forKey: Self.statusKey),
           let parsedStatus = AppStatus(rawValue: savedStatus) {
            self.status = parsedStatus
        } else {
            self.status = .onboarding
        }
    }
    
    func changeStatus(to newStatus: AppStatus) {
        self.status = newStatus
        UserDefaults.standard.set(newStatus.rawValue, forKey: Self.statusKey)
    }
}
