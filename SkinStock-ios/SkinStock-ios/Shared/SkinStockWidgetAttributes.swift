import ActivityKit
import Foundation

public struct SkinStockWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var totalValue: Double
        public var trend: Double // e.g. change in last 24h
        
        public init(totalValue: Double, trend: Double) {
            self.totalValue = totalValue
            self.trend = trend
        }
    }

    public var portfolioName: String
    
    public init(portfolioName: String) {
        self.portfolioName = portfolioName
    }
}
