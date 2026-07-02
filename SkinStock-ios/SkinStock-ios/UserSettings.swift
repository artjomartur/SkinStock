import Foundation
import SwiftUI

enum CurrencyType: String, CaseIterable, Identifiable {
    case usd = "USD"
    case eur = "EUR"
    
    var id: String { self.rawValue }
    
    var symbol: String {
        switch self {
        case .usd: return "$"
        case .eur: return "€"
        }
    }
}

import Combine

class UserSettings: ObservableObject {
    @Published var selectedCurrency: CurrencyType = .eur
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        if let savedString = UserDefaults.standard.string(forKey: "selectedCurrency"),
           let type = CurrencyType(rawValue: savedString) {
            self.selectedCurrency = type
        }
        
        $selectedCurrency
            .dropFirst()
            .sink { newValue in
                UserDefaults.standard.set(newValue.rawValue, forKey: "selectedCurrency")
            }
            .store(in: &cancellables)
    }
    // Einfache Umrechnung: API liefert USD
    // Für ein echtes Projekt könnte man hier live Kurse laden.
    private let usdToEurRate: Double = 0.92
    
    func convertPrice(_ priceInUSD: Double) -> Double {
        switch selectedCurrency {
        case .usd:
            return priceInUSD
        case .eur:
            return priceInUSD * usdToEurRate
        }
    }
    
    func formattedPrice(_ priceInUSD: Double) -> String {
        let converted = convertPrice(priceInUSD)
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = selectedCurrency.rawValue
        
        return formatter.string(from: NSNumber(value: converted)) ?? "\(converted)"
    }
}
