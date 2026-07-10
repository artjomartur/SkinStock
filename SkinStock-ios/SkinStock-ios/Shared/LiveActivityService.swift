import Foundation
import ActivityKit
import WidgetKit

@available(iOS 16.1, *)
class LiveActivityService {
    static let shared = LiveActivityService()
    private var currentActivity: Activity<SkinStockWidgetAttributes>?
    
    func startActivity(portfolioName: String, totalValue: Double, trend: Double) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("Live Activities are not enabled.")
            return
        }
        
        let attributes = SkinStockWidgetAttributes(portfolioName: portfolioName)
        let contentState = SkinStockWidgetAttributes.ContentState(totalValue: totalValue, trend: trend)
        
        do {
            if let existingActivity = Activity<SkinStockWidgetAttributes>.activities.first {
                currentActivity = existingActivity
                updateActivity(totalValue: totalValue, trend: trend)
            } else {
                let activityContent = ActivityContent(state: contentState, staleDate: nil)
                currentActivity = try Activity.request(attributes: attributes, content: activityContent)
                print("Live Activity started successfully.")
            }
        } catch {
            print("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }
    
    func updateActivity(totalValue: Double, trend: Double) {
        guard let currentActivity = currentActivity else { return }
        
        let contentState = SkinStockWidgetAttributes.ContentState(totalValue: totalValue, trend: trend)
        let activityContent = ActivityContent(state: contentState, staleDate: nil)
        
        Task {
            await currentActivity.update(activityContent)
            print("Live Activity updated.")
        }
    }
    
    func endActivity() {
        guard let currentActivity = currentActivity else { return }
        
        Task {
            let contentState = currentActivity.content.state
            let activityContent = ActivityContent(state: contentState, staleDate: nil)
            await currentActivity.end(activityContent, dismissalPolicy: .immediate)
            self.currentActivity = nil
            print("Live Activity ended.")
        }
    }
}
