import SwiftUI

struct PriceAlertsView: View {
    @EnvironmentObject var userSettings: UserSettings
    @EnvironmentObject var priceService: PriceService
    @EnvironmentObject var watchlistService: WatchlistService
    @EnvironmentObject var inventoryService: InventoryService
    
    @State private var showingAddAlert = false
    
    // Add Alert fields
    @State private var selectedSkin: String = ""
    @State private var targetPriceString: String = ""
    @State private var isAbove = false
    @State private var searchQuery = ""
    
    var body: some View {
        NavigationStack {
            List {
                if userSettings.priceAlerts.isEmpty {
                    Section {
                        VStack(spacing: 12) {
                            Image(systemName: "bell.slash")
                                .font(.system(size: 40))
                                .foregroundColor(.gray)
                            Text("Keine Preisalarme aktiv")
                                .font(.headline)
                                .foregroundColor(.primary)
                            Text("Erstelle einen Alarm, um benachrichtigt zu werden, wenn ein Skin einen bestimmten Preis erreicht.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.vertical, 20)
                        .frame(maxWidth: .infinity)
                    }
                } else {
                    Section(header: Text("Aktive Alarme")) {
                        ForEach(userSettings.priceAlerts) { alert in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(alert.hashName)
                                        .font(.subheadline.bold())
                                        .lineLimit(1)
                                        .foregroundColor(.primary)
                                    
                                    HStack(spacing: 4) {
                                        Image(systemName: alert.isAbove ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                                            .foregroundColor(alert.isAbove ? .green : .red)
                                        Text(alert.isAbove ? "Steigt über" : "Fällt unter")
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                        Text(userSettings.formattedPrice(alert.targetPrice))
                                            .font(.caption.bold())
                                            .foregroundColor(.primary)
                                    }
                                }
                                
                                Spacer()
                                
                                Toggle("", isOn: Binding(
                                    get: { alert.isActive },
                                    set: { _ in userSettings.toggleAlertActive(id: alert.id) }
                                ))
                                .labelsHidden()
                                .tint(Color(hex: "00F0FF"))
                            }
                        }
                        .onDelete(perform: userSettings.deleteAlert)
                    }
                }
            }
            .navigationTitle("Preisalarme")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddAlert = true }) {
                        Image(systemName: "plus")
                            .foregroundColor(Color(hex: "00F0FF"))
                    }
                }
            }
            .sheet(isPresented: $showingAddAlert) {
                NavigationStack {
                    Form {
                        Section(header: Text("Skin auswählen")) {
                            TextField("Suchen...", text: $searchQuery)
                                .autocorrectionDisabled()
                            
                            let matches = priceService.priceMap.keys.filter {
                                searchQuery.isEmpty ? true : $0.localizedCaseInsensitiveContains(searchQuery)
                            }.prefix(5)
                            
                            ForEach(Array(matches), id: \.self) { skinName in
                                Button(action: {
                                    selectedSkin = skinName
                                    // Setze Standardpreis als Startpunkt
                                    if let basePrice = priceService.priceMap[skinName] {
                                        let currentRate = userSettings.convertPrice(1.0)
                                        targetPriceString = String(format: "%.2f", basePrice * currentRate)
                                    }
                                }) {
                                    HStack {
                                        Text(skinName)
                                            .foregroundColor(selectedSkin == skinName ? Color(hex: "00F0FF") : .primary)
                                        Spacer()
                                        if selectedSkin == skinName {
                                            Image(systemName: "checkmark")
                                                .foregroundColor(Color(hex: "00F0FF"))
                                        }
                                    }
                                }
                            }
                        }
                        
                        if !selectedSkin.isEmpty {
                            Section(header: Text("Alarm-Bedingung")) {
                                Picker("Richtung", selection: $isAbove) {
                                    Text("Fällt unter").tag(false)
                                    Text("Steigt über").tag(true)
                                }
                                .pickerStyle(SegmentedPickerStyle())
                                
                                HStack {
                                    Text("Zielpreis (\(userSettings.selectedCurrency.symbol))")
                                    Spacer()
                                    TextField("Preis", text: $targetPriceString)
                                        .keyboardType(.decimalPad)
                                        .multilineTextAlignment(.trailing)
                                        .frame(width: 100)
                                }
                            }
                            
                            Button(action: {
                                if let inputVal = Double(targetPriceString.replacingOccurrences(of: ",", with: ".")) {
                                    // Umrechnen in USD (Basispreis)
                                    let currentRate = userSettings.convertPrice(1.0)
                                    let usdVal = inputVal / currentRate
                                    userSettings.addAlert(hashName: selectedSkin, targetPriceUSD: usdVal, isAbove: isAbove)
                                    showingAddAlert = false
                                    // Reset fields
                                    selectedSkin = ""
                                    targetPriceString = ""
                                    searchQuery = ""
                                }
                            }) {
                                Text("Alarm hinzufügen")
                                    .frame(maxWidth: .infinity)
                                    .alignmentGuide(.leading) { _ in 0 }
                            }
                            .disabled(targetPriceString.isEmpty)
                        }
                    }
                    .navigationTitle("Alarm hinzufügen")
                }
            }
        }
    }
}
