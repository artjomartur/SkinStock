//
//  SkinStockWidgetLiveActivity.swift
//  SkinStockWidget
//
//  Created by Artjom Becker on 09.07.26.
//

import ActivityKit
import WidgetKit
import SwiftUI

import ActivityKit
import WidgetKit
import SwiftUI

struct SkinStockWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SkinStockWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            HStack {
                Image(systemName: "case.fill")
                    .foregroundColor(.orange)
                    .font(.title2)
                
                VStack(alignment: .leading) {
                    Text(context.attributes.portfolioName)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("Live Sync aktiv")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text(formattedPrice(context.state.totalValue))
                        .font(.title3.bold())
                        .foregroundColor(.white)
                    
                    let isPositive = context.state.trend >= 0
                    Text("\(isPositive ? "+" : "")\(formattedPrice(context.state.trend))")
                        .font(.caption.bold())
                        .foregroundColor(isPositive ? .green : .red)
                }
            }
            .padding()
            .activityBackgroundTint(Color(red: 0.1, green: 0.1, blue: 0.15))
            .activitySystemActionForegroundColor(Color.white)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: "case.fill").foregroundColor(.orange)
                        Text("SkinStock").font(.headline)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("LIVE").font(.caption.bold()).foregroundColor(.red)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text("Inventarwert:")
                            .foregroundColor(.gray)
                        Spacer()
                        Text(formattedPrice(context.state.totalValue))
                            .font(.title2.bold())
                    }
                    .padding(.top, 5)
                }
            } compactLeading: {
                Image(systemName: "case.fill").foregroundColor(.orange)
            } compactTrailing: {
                Text(shortFormattedPrice(context.state.totalValue))
                    .font(.caption.bold())
            } minimal: {
                Image(systemName: "case.fill").foregroundColor(.orange)
            }
            .widgetURL(URL(string: "cs2app://portfolio"))
            .keylineTint(Color.orange)
        }
    }
    
    private func formattedPrice(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "EUR"
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: value)) ?? "\(value) €"
    }
    
    private func shortFormattedPrice(_ value: Double) -> String {
        if value >= 1000 {
            return String(format: "%.1fk", value / 1000.0)
        }
        return String(format: "%.0f", value)
    }
}
