import Foundation
import UserNotifications
import Combine

class NotificationService: ObservableObject {
    @Published var hasPermission = false
    
    init() {
        checkPermission()
    }
    
    func checkPermission() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                self.hasPermission = settings.authorizationStatus == .authorized
            }
        }
    }
    
    func requestPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                self.hasPermission = granted
            }
        }
    }
    
    /// Sendet eine sofortige lokale Push-Notification (z.B. für Preisalarme)
    func sendPriceAlert(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Notification Error: \(error.localizedDescription)")
            }
        }
    }
    
    /// Schaut nach signifikanten Preisänderungen und triggert ggf. Alarme
    func checkPriceAlerts(inventory: [CS2Item], priceHistoryStore: PriceHistoryStore, priceService: PriceService) {
        for item in inventory {
            let history = priceHistoryStore.getHistory(for: item.hashName, timeframe: .day)
            let currentPrice = priceService.getPrice(for: item)
            
            if let last = history.last, last.price > 0 {
                let changePercent = ((currentPrice - last.price) / last.price) * 100
                
                // Preisänderung von mehr als 5% löst Benachrichtigung aus
                if abs(changePercent) >= 5.0 {
                    let direction = changePercent > 0 ? "gestiegen 🚀" : "gefallen 📉"
                    sendPriceAlert(
                        title: "Preis-Alarm für \(item.name)!",
                        body: "Der Preis ist um \(String(format: "%.1f", changePercent))% \(direction) auf \(currentPrice) €."
                    )
                }
            }
        }
    }
}
