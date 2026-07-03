import Foundation
import SwiftUI
import Combine

enum CurrencyType: String, CaseIterable, Identifiable, Codable {
    case eur = "EUR"
    case usd = "USD"
    case gbp = "GBP"
    case chf = "CHF"
    case cny = "CNY"
    case rub = "RUB"
    case pln = "PLN"
    case cad = "CAD"
    case uah = "UAH"
    
    var id: String { self.rawValue }
    
    var symbol: String {
        switch self {
        case .eur: return "€"
        case .usd: return "$"
        case .gbp: return "£"
        case .chf: return "CHF"
        case .cny: return "¥"
        case .rub: return "₽"
        case .pln: return "zł"
        case .cad: return "C$"
        case .uah: return "₴"
        }
    }
}

struct PriceAlert: Codable, Identifiable, Hashable {
    var id: UUID
    var hashName: String
    var targetPrice: Double // Basis in USD
    var isAbove: Bool
    var isActive: Bool
}

enum ThemeType: String, CaseIterable, Identifiable, Codable {
    case system = "System"
    case light = "Hell"
    case dark = "Dunkel"
    
    var id: String { self.rawValue }
    
    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

class UserSettings: ObservableObject {
    @Published var selectedCurrency: CurrencyType = .eur
    @Published var showAbsoluteValues: Bool = false
    @Published var showNetValue: Bool = false
    @Published var preferredMarketplace: Marketplace = .skinport
    @Published var priceAlerts: [PriceAlert] = []
    @Published var selectedTheme: ThemeType = .system
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        if let savedTheme = UserDefaults.standard.string(forKey: "selectedTheme"),
           let theme = ThemeType(rawValue: savedTheme) {
            self.selectedTheme = theme
        }
        
        if let alertsData = UserDefaults.standard.data(forKey: "priceAlerts"),
           let decoded = try? JSONDecoder().decode([PriceAlert].self, from: alertsData) {
            self.priceAlerts = decoded
        }
        
        if let savedString = UserDefaults.standard.string(forKey: "selectedCurrency"),
           let type = CurrencyType(rawValue: savedString) {
            self.selectedCurrency = type
        }
        self.showAbsoluteValues = UserDefaults.standard.bool(forKey: "showAbsoluteValues")
        self.showNetValue = UserDefaults.standard.bool(forKey: "showNetValue")
        if let mpString = UserDefaults.standard.string(forKey: "preferredMarketplace"),
           let mp = Marketplace(rawValue: mpString) {
            self.preferredMarketplace = mp
        }
        
        $selectedTheme
            .dropFirst()
            .sink { newValue in
                UserDefaults.standard.set(newValue.rawValue, forKey: "selectedTheme")
            }
            .store(in: &cancellables)
            
        $selectedCurrency
            .dropFirst()
            .sink { newValue in
                UserDefaults.standard.set(newValue.rawValue, forKey: "selectedCurrency")
            }
            .store(in: &cancellables)
            
        $showAbsoluteValues
            .dropFirst()
            .sink { newValue in
                UserDefaults.standard.set(newValue, forKey: "showAbsoluteValues")
            }
            .store(in: &cancellables)
        
        $showNetValue
            .dropFirst()
            .sink { newValue in
                UserDefaults.standard.set(newValue, forKey: "showNetValue")
            }
            .store(in: &cancellables)
        
        $preferredMarketplace
            .dropFirst()
            .sink { newValue in
                UserDefaults.standard.set(newValue.rawValue, forKey: "preferredMarketplace")
            }
            .store(in: &cancellables)
    }
    
    // Umrechnungskurse von der Basis USD
    private func rate(for currency: CurrencyType) -> Double {
        switch currency {
        case .usd: return 1.0
        case .eur: return 0.92
        case .gbp: return 0.79
        case .chf: return 0.89
        case .cny: return 7.25
        case .rub: return 90.0
        case .pln: return 4.0
        case .cad: return 1.36
        case .uah: return 40.50
        }
    }
    
    func convertPrice(_ priceInUSD: Double) -> Double {
        return priceInUSD * rate(for: selectedCurrency)
    }
    
    func formattedPrice(_ priceInUSD: Double) -> String {
        let converted = convertPrice(priceInUSD)
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = selectedCurrency.rawValue
        formatter.locale = locale(for: selectedCurrency)
        
        return formatter.string(from: NSNumber(value: converted)) ?? "\(converted) \(selectedCurrency.symbol)"
    }
    
    private func locale(for currency: CurrencyType) -> Locale {
        switch currency {
        case .eur: return Locale(identifier: "de_DE")
        case .usd: return Locale(identifier: "en_US")
        case .gbp: return Locale(identifier: "en_GB")
        case .chf: return Locale(identifier: "de_CH")
        case .cny: return Locale(identifier: "zh_CN")
        case .rub: return Locale(identifier: "ru_RU")
        case .pln: return Locale(identifier: "pl_PL")
        case .cad: return Locale(identifier: "en_CA")
        case .uah: return Locale(identifier: "uk_UA")
        }
    }
    
    func saveAlerts() {
        if let encoded = try? JSONEncoder().encode(priceAlerts) {
            UserDefaults.standard.set(encoded, forKey: "priceAlerts")
        }
    }
    
    func addAlert(hashName: String, targetPriceUSD: Double, isAbove: Bool) {
        let alert = PriceAlert(id: UUID(), hashName: hashName, targetPrice: targetPriceUSD, isAbove: isAbove, isActive: true)
        priceAlerts.append(alert)
        saveAlerts()
    }
    
    func deleteAlert(at offsets: IndexSet) {
        priceAlerts.remove(atOffsets: offsets)
        saveAlerts()
    }
    
    func toggleAlertActive(id: UUID) {
        if let index = priceAlerts.firstIndex(where: { $0.id == id }) {
            priceAlerts[index].isActive.toggle()
            saveAlerts()
        }
    }
}
