import SwiftUI
import Charts

struct TrendlineView: View {
    let data: [PriceHistoryPoint]
    var showAxes: Bool = true
    var lineWidth: CGFloat = 2.0
    var showIndicator: Bool = true
    
    @State private var selectedDate: Date?
    
    // Gradient Colors
    private var isProfitable: Bool {
        guard let first = data.first, let last = data.last else { return true }
        return last.price >= first.price
    }
    
    private var chartColor: Color {
        isProfitable ? Color(hex: "00FF77") : Color.red
    }
    
    private var gradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [
                chartColor.opacity(0.3),
                chartColor.opacity(0.0)
            ]),
            startPoint: .top,
            endPoint: .bottom
        )
    }
    
    // Berechnet den am nächsten liegenden Punkt basierend auf der Hover-Date
    private var selectedPoint: PriceHistoryPoint? {
        guard let selectedDate = selectedDate else { return nil }
        return data.min(by: { abs($0.date.timeIntervalSince(selectedDate)) < abs($1.date.timeIntervalSince(selectedDate)) })
    }
    
    var body: some View {
        if data.isEmpty {
            Text("Keine Daten")
                .foregroundColor(.secondary)
        } else {
            Chart {
                if showIndicator, let firstPrice = data.first?.price {
                    RuleMark(y: .value("Start", firstPrice))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))
                        .foregroundStyle(Color.white.opacity(0.3))
                        .annotation(position: .top, alignment: .leading) {
                            Text("Start (\(String(format: "%.2f", firstPrice)))")
                                .font(.system(size: 8))
                                .foregroundColor(Color.white.opacity(0.5))
                                .padding(.leading, 2)
                        }
                }
                
                ForEach(data) { point in
                    LineMark(
                        x: .value("Datum", point.date),
                        y: .value("Preis", point.price)
                    )
                    .interpolationMethod(.monotone)
                    .lineStyle(StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
                    .foregroundStyle(chartColor)
                    
                    AreaMark(
                        x: .value("Datum", point.date),
                        yStart: .value("Min", (data.map { $0.price }.min() ?? 0) * 0.95),
                        yEnd: .value("Preis", point.price)
                    )
                    .interpolationMethod(.monotone)
                    .foregroundStyle(gradient)
                }
                
                if showIndicator, let selected = selectedPoint {
                    RuleMark(x: .value("Auswahl", selected.date))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))
                        .foregroundStyle(Color.white.opacity(0.5))
                        .annotation(position: .top, overflowResolution: .init(x: .fit(to: .chart), y: .fit(to: .chart))) {
                            VStack(spacing: 2) {
                                Text(selected.price, format: .currency(code: "EUR"))
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                                Text(selected.date, style: .date)
                                    .font(.system(size: 9))
                                    .foregroundColor(.secondary)
                            }
                            .padding(6)
                            .background(Color.black.opacity(0.8))
                            .cornerRadius(6)
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white.opacity(0.2), lineWidth: 1))
                        }
                }
            }
            .chartXAxis(showAxes ? .visible : .hidden)
            .chartYAxis(showAxes ? .visible : .hidden)
            .chartYScale(domain: .automatic(includesZero: false))
            .chartXSelection(value: showIndicator ? $selectedDate : .constant(nil))
            .onChange(of: selectedPoint?.id) { oldValue, newValue in
                if newValue != nil && oldValue != newValue {
                    // Sehr feines Vibrationsfeedback
                    UISelectionFeedbackGenerator().selectionChanged()
                }
            }
        }
    }
}
