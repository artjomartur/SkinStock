import SwiftUI
import Charts

struct TrendlineView: View {
    let data: [PriceHistoryPoint]
    var showAxes: Bool = true
    var lineWidth: CGFloat = 2.0
    var showIndicator: Bool = true
    
    @State private var selectedDate: Date?
    
    var showSMA: Bool = false
    var smaPeriod: Int = 7
    
    // Berechnet die SMA-Linie
    private var smaData: [PriceHistoryPoint] {
        var smaPoints: [PriceHistoryPoint] = []
        for i in 0..<data.count {
            let start = max(0, i - smaPeriod + 1)
            let subset = data[start...i]
            let avg = subset.reduce(0.0) { $0 + $1.price } / Double(subset.count)
            // Kopiere ID aus data für Stabilität
            smaPoints.append(PriceHistoryPoint(date: data[i].date, price: avg))
        }
        return smaPoints
    }
    
    // Gradient Colors
    private var isProfitable: Bool {
        guard let first = data.first, let last = data.last else { return true }
        return last.price >= first.price
    }
    
    private var chartColor: Color {
        isProfitable ? Color(hex: "00FF77") : Color(hex: "FF4D6A")
    }
    
    private var gradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [
                chartColor.opacity(0.25),
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
        if data.count < 2 {
            Text("Keine Daten")
                .foregroundColor(.secondary)
                .font(.caption)
        } else {
            Chart {
                // Startlinie (dezente gestrichelte Linie, ohne Text-Annotation)
                if showIndicator, let firstPrice = data.first?.price {
                    RuleMark(y: .value("Start", firstPrice))
                        .lineStyle(StrokeStyle(lineWidth: 0.5, dash: [4, 4]))
                        .foregroundStyle(Color.white.opacity(0.15))
                }
                
                ForEach(data) { point in
                    LineMark(
                        x: .value("Datum", point.date),
                        y: .value("Preis", point.price)
                    )
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
                    .foregroundStyle(chartColor)
                    
                    AreaMark(
                        x: .value("Datum", point.date),
                        yStart: .value("Min", (data.map { $0.price }.min() ?? 0)),
                        yEnd: .value("Preis", point.price)
                    )
                    .interpolationMethod(.catmullRom)
                    .foregroundStyle(gradient)
                }
                
                // SMA Trendlinie (Cyan gestrichelt)
                if showSMA {
                    ForEach(smaData) { point in
                        LineMark(
                            x: .value("Datum", point.date),
                            y: .value("Preis", point.price)
                        )
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                        .foregroundStyle(Color(hex: "00F0FF"))
                    }
                }
                
                if showIndicator, let selected = selectedPoint {
                    RuleMark(x: .value("Auswahl", selected.date))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 3]))
                        .foregroundStyle(Color.white.opacity(0.4))
                        .annotation(position: .top, overflowResolution: .init(x: .fit(to: .chart), y: .fit(to: .chart))) {
                            VStack(spacing: 2) {
                                Text(selected.price, format: .currency(code: "EUR"))
                                    .font(.system(size: 11, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                                Text(selected.date, style: .date)
                                    .font(.system(size: 8))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(.ultraThinMaterial)
                            .cornerRadius(8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.15), lineWidth: 0.5))
                        }
                    
                    PointMark(
                        x: .value("Auswahl", selected.date),
                        y: .value("Preis", selected.price)
                    )
                    .symbolSize(40)
                    .foregroundStyle(chartColor)
                    .annotation(position: .bottom) {
                        Circle()
                            .fill(chartColor)
                            .frame(width: 6, height: 6)
                            .shadow(color: chartColor, radius: 4)
                    }
                }
            }
            .chartXAxis(showAxes ? .visible : .hidden)
            .chartYAxis(showAxes ? .visible : .hidden)
            .chartYScale(domain: .automatic(includesZero: false))
            .chartXSelection(value: showIndicator ? $selectedDate : .constant(nil))
            .clipShape(RoundedRectangle(cornerRadius: 4))
            .onChange(of: selectedPoint?.id) { oldValue, newValue in
                if newValue != nil && oldValue != newValue {
                    UISelectionFeedbackGenerator().selectionChanged()
                }
            }
        }
    }
}
