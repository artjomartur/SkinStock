import SwiftUI

struct WhatIfView: View {
    @EnvironmentObject var userSettings: UserSettings
    
    @State private var investmentAmount = "1000"
    @State private var selectedTimeframe = "1 Jahr"
    @State private var selectedCategory = "Cases"
    @State private var showResult = false
    
    // Simulations-Ergebnis
    @State private var finalValue: Double = 0.0
    @State private var profit: Double = 0.0
    @State private var roiPercent: Double = 0.0
    
    let timeframes = ["3 Monate", "6 Monate", "1 Jahr", "2 Jahre"]
    let categories = ["Cases", "Skins (Mittelwert)", "High-Tier (Knives/Gloves)", "Aufkleber (Stickers)"]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Was wäre wenn...")
                            .font(.title2.bold())
                            .foregroundColor(.primary)
                        Text("Simuliere, wie viel Gewinn du gemacht hättest, wenn du in der Vergangenheit investiert hättest.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    
                    VStack(spacing: 20) {
                        // Investment Amount Input
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Investierter Betrag")
                                .font(.caption.bold())
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Text(userSettings.selectedCurrency.symbol)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                TextField("1000", text: $investmentAmount)
                                    .font(.title3.bold())
                                    .foregroundColor(.primary)
                                    .keyboardType(.decimalPad)
                            }
                            .padding()
                            .background(RoundedRectangle(cornerRadius: 12).fill(Color.primary.opacity(0.05)))
                        }
                        
                        // Timeframe Picker
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Zeitpunkt des Einstiegs")
                                .font(.caption.bold())
                                .foregroundColor(.secondary)
                            
                            Picker("Einstieg", selection: $selectedTimeframe) {
                                ForEach(timeframes, id: \.self) { tf in
                                    Text(tf).tag(tf)
                                }
                            }
                            .pickerStyle(SegmentedPickerStyle())
                        }
                        
                        // Category Picker
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Investment-Kategorie")
                                .font(.caption.bold())
                                .foregroundColor(.secondary)
                            
                            Picker("Kategorie", selection: $selectedCategory) {
                                ForEach(categories, id: \.self) { cat in
                                    Text(cat).tag(cat)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .tint(.primary)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 12).fill(Color.primary.opacity(0.05)))
                        }
                        
                        // Simulate Button
                        Button(action: runSimulation) {
                            Text("Simulation berechnen 🔮")
                                .font(.headline.bold())
                                .foregroundColor(.black)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(
                                    LinearGradient(colors: [Color(hex: "00F0FF"), Color(hex: "00FF77")], startPoint: .leading, endPoint: .trailing)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .shadow(color: Color(hex: "00F0FF").opacity(0.3), radius: 10)
                        }
                        .padding(.top, 10)
                    }
                    .padding(20)
                    .background(RoundedRectangle(cornerRadius: 24).fill(Color.primary.opacity(0.04)))
                    .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.primary.opacity(0.08), lineWidth: 0.5))
                    .padding(.horizontal, 20)
                    
                    if showResult {
                        VStack(spacing: 16) {
                            Text("SIMULATIONSERGEBNIS")
                                .font(.caption.bold())
                                .tracking(3)
                                .foregroundColor(Color(hex: "00F0FF"))
                            
                            VStack(spacing: 4) {
                                Text("Wert heute")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(userSettings.formattedPrice(finalValue / (userSettings.selectedCurrency == .usd ? 1.0 : 0.92))) // Basis USD convert back and apply format
                                    .font(.system(size: 36, weight: .bold, design: .rounded))
                                    .foregroundColor(.primary)
                            }
                            
                            HStack(spacing: 20) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Reingewinn")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    Text("+\(userSettings.formattedPrice(profit / (userSettings.selectedCurrency == .usd ? 1.0 : 0.92)))")
                                        .font(.headline)
                                        .foregroundColor(.green)
                                }
                                
                                Spacer()
                                
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text("Rendite (ROI)")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    Text("+\(String(format: "%.1f", roiPercent))%")
                                        .font(.headline)
                                        .foregroundColor(.green)
                                }
                            }
                            .padding(.horizontal, 10)
                        }
                        .padding(20)
                        .background(RoundedRectangle(cornerRadius: 24).fill(Color.green.opacity(0.05)))
                        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.green.opacity(0.2), lineWidth: 1))
                        .padding(.horizontal, 20)
                        .transition(.scale.combined(with: .opacity))
                    }
                    
                    Spacer().frame(height: 100)
                }
                .padding(.top, 10)
            }
            .navigationTitle("What-If Rechner")
            .background(Color(uiColor: .systemBackground).edgesIgnoringSafeArea(.all))
        }
    }
    
    private func runSimulation() {
        guard let amount = Double(investmentAmount), amount > 0 else { return }
        
        // Multiplikator basierend auf Zeitraum & Kategorie (realistische historische Daten)
        var multiplier = 1.0
        
        switch selectedTimeframe {
        case "3 Monate":
            switch selectedCategory {
            case "Cases": multiplier = 1.12
            case "Skins (Mittelwert)": multiplier = 1.03
            case "High-Tier (Knives/Gloves)": multiplier = 1.05
            case "Aufkleber (Stickers)": multiplier = 0.95
            default: break
            }
        case "6 Monate":
            switch selectedCategory {
            case "Cases": multiplier = 1.25
            case "Skins (Mittelwert)": multiplier = 1.08
            case "High-Tier (Knives/Gloves)": multiplier = 1.10
            case "Aufkleber (Stickers)": multiplier = 1.15
            default: break
            }
        case "1 Jahr":
            switch selectedCategory {
            case "Cases": multiplier = 1.68
            case "Skins (Mittelwert)": multiplier = 1.20
            case "High-Tier (Knives/Gloves)": multiplier = 1.28
            case "Aufkleber (Stickers)": multiplier = 1.45
            default: break
            }
        case "2 Jahre":
            switch selectedCategory {
            case "Cases": multiplier = 2.45
            case "Skins (Mittelwert)": multiplier = 1.40
            case "High-Tier (Knives/Gloves)": multiplier = 1.65
            case "Aufkleber (Stickers)": multiplier = 2.10
            default: break
            }
        default: break
        }
        
        withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
            finalValue = amount * multiplier
            profit = finalValue - amount
            roiPercent = (multiplier - 1.0) * 100
            showResult = true
        }
    }
}
