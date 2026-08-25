import WidgetKit
import SwiftUI
import AppIntents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), totalValue: 1234.56, history: [1100, 1150, 1120, 1200, 1180, 1234.56])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let (val, hist) = fetchWidgetData()
        let entry = SimpleEntry(date: Date(), totalValue: val, history: hist)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let (val, hist) = fetchWidgetData()
        let entry = SimpleEntry(date: Date(), totalValue: val, history: hist)
        // Reload every hour as a fallback
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func fetchWidgetData() -> (Double, [Double]) {
        let defaults = UserDefaults(suiteName: "group.com.artjombecker.skinstock")
        let total = defaults?.double(forKey: "widgetTotalValue") ?? 0.0
        let history = defaults?.array(forKey: "widgetHistory") as? [Double] ?? []
        return (total, history)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let totalValue: Double
    let history: [Double]
}

struct SparklineShape: Shape {
    let data: [Double]
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        guard data.count > 1, let min = data.min(), let max = data.max() else { return path }
        
        let range = max - min == 0 ? 1 : max - min
        let stepX = rect.width / CGFloat(data.count - 1)
        
        for (index, value) in data.enumerated() {
            let x = CGFloat(index) * stepX
            let y = rect.height - CGFloat((value - min) / range) * rect.height
            
            if index == 0 {
                path.move(to: CGPoint(x: x, y: y))
            } else {
                path.addLine(to: CGPoint(x: x, y: y))
            }
        }
        return path
    }
}

struct SkinStockWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                VStack {
                    Image(systemName: "case.fill")
                        .font(.caption2)
                    Text(shortFormattedPrice(entry.totalValue))
                        .font(.system(size: 10, weight: .bold))
                }
            }
        case .accessoryRectangular:
            VStack(alignment: .leading) {
                HStack {
                    Image(systemName: "case.fill")
                    Text("SkinStock")
                        .font(.headline)
                }
                Text(formattedPrice(entry.totalValue))
                    .font(.title3.bold())
            }
        case .accessoryInline:
            Text("CS2: \(formattedPrice(entry.totalValue))")
        default:
            ZStack(alignment: .leading) {
                // Premium Dark Mesh Gradient Background
                LinearGradient(
                    colors: [Color(red: 0.08, green: 0.08, blue: 0.12), Color(red: 0.04, green: 0.04, blue: 0.06)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                // Subtle glowing accent
                Circle()
                    .fill(Color.purple.opacity(0.4))
                    .blur(radius: 40)
                    .frame(width: 100, height: 100)
                    .offset(x: -20, y: -40)
                
                Circle()
                    .fill(Color.orange.opacity(0.3))
                    .blur(radius: 40)
                    .frame(width: 100, height: 100)
                    .offset(x: 100, y: 100)

                VStack(alignment: .leading, spacing: 0) {
                    // Header
                    HStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(colors: [.orange, .red], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 24, height: 24)
                            Image(systemName: "case.fill")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                        }
                        
                        Text("SkinStock")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundColor(.white.opacity(0.9))
                            .textCase(.uppercase)
                        
                        Spacer()
                        
                        if #available(iOS 17.0, *) {
                            Button(intent: RefreshInventoryIntent()) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white.opacity(0.7))
                                    .padding(6)
                                    .background(Color.white.opacity(0.1))
                                    .clipShape(Circle())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.bottom, 8)
                    
                    // Sparkline Chart
                    if entry.history.count > 1 {
                        let isPositive = entry.history.last! >= entry.history.first!
                        let chartColor = isPositive ? Color.green : Color.red
                        
                        SparklineShape(data: entry.history)
                            .stroke(chartColor, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                            .frame(height: 35)
                            .shadow(color: chartColor.opacity(0.5), radius: 3, x: 0, y: 2)
                            .padding(.vertical, 4)
                    } else {
                        Spacer()
                    }
                    
                    Spacer()
                    
                    // Content
                    Text("INVENTARWERT")
                        .font(.system(size: 11, weight: .semibold, design: .default))
                        .foregroundColor(.white.opacity(0.5))
                        .tracking(1.2)
                    
                    Text(formattedPrice(entry.totalValue))
                        .font(.system(size: family == .systemSmall ? 26 : 36, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.4)
                        .shadow(color: .black.opacity(0.2), radius: 2, x: 0, y: 2)
                }
                .padding(16)
            }
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

struct SkinStockWidget: Widget {
    let kind: String = "SkinStockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SkinStockWidgetEntryView(entry: entry)
                // Remove default padding to let the ZStack fill the widget completely
                .padding(-20)
                .containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("SkinStock Inventar")
        .description("Premium CS2 Inventarwert-Anzeige.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

#Preview(as: .systemSmall) {
    SkinStockWidget()
} timeline: {
    SimpleEntry(date: .now, totalValue: 1337.42, history: [1100, 1200, 1150, 1337.42])
}
