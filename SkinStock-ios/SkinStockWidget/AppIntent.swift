//
//  AppIntent.swift
//  SkinStockWidget
//
//  Created by Artjom Becker on 09.07.26.
//

import WidgetKit
import AppIntents

@available(iOS 17.0, *)
struct RefreshInventoryIntent: AppIntent {
    static var title: LocalizedStringResource = "Refresh Inventory"
    static var description = IntentDescription("Refreshes the CS2 inventory prices.")

    func perform() async throws -> some IntentResult {
        // In a real scenario with shared frameworks, we would call PriceService.shared.fetchPrices() here.
        // For now, we simulate a network delay and trigger a timeline reload.
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        // Notify WidgetKit to reload the timeline
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
