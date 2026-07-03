import SwiftUI

struct AccountView: View {
    @EnvironmentObject var appState: AppStateManager
    @EnvironmentObject var steamService: SteamService
    @EnvironmentObject var userSettings: UserSettings
    
    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 16) {
                        if let profile = steamService.profile {
                            if let url = profile.avatarUrl {
                                AsyncImage(url: url) { phase in
                                    if let image = phase.image {
                                        image
                                            .resizable()
                                            .scaledToFill()
                                    } else {
                                        ProgressView()
                                    }
                                }
                                .frame(width: 60, height: 60)
                                .clipShape(Circle())
                            } else {
                                Circle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 60, height: 60)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(profile.name)
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                Text("ID: \(profile.steamId64)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        } else {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 60, height: 60)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Lade Profil...")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                } header: {
                    Text("Dein Steam Profil")
                }
                .listRowBackground(Color.white.opacity(0.05))
                
                Section {
                    Picker("Währung", selection: $userSettings.selectedCurrency) {
                        ForEach(CurrencyType.allCases) { currency in
                            Text(currency.rawValue).tag(currency)
                        }
                    }
                    .pickerStyle(.menu)
                    
                    Picker("Design", selection: $userSettings.selectedTheme) {
                        ForEach(ThemeType.allCases) { theme in
                            Text(theme.rawValue).tag(theme)
                        }
                    }
                    .pickerStyle(.menu)
                    
                    Toggle("Netto-Wert anzeigen", isOn: $userSettings.showNetValue)
                    
                    if userSettings.showNetValue {
                        Picker("Marktplatz", selection: $userSettings.preferredMarketplace) {
                            ForEach(Marketplace.allCases) { mp in
                                HStack {
                                    Text(mp.rawValue)
                                    Spacer()
                                    Text(mp.displayFee)
                                        .foregroundColor(.secondary)
                                }
                                .tag(mp)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                } header: {
                    Text("Einstellungen")
                } footer: {
                    if userSettings.showNetValue {
                        Text("Der Netto-Wert zeigt dir, wie viel echtes Geld du nach Verkaufsgebühren auf dein Bankkonto überwiesen bekommst.")
                    }
                }
                .listRowBackground(Color.white.opacity(0.05))
                
                Section {
                    NavigationLink {
                        WatchlistView()
                    } label: {
                        Label("Beobachtungsliste (Watchlist)", systemImage: "eye.fill")
                    }
                    
                    NavigationLink {
                        AchievementsListView()
                    } label: {
                        Label("Erfolge (Achievements)", systemImage: "crown.fill")
                    }
                    
                    NavigationLink {
                        CollectionsView()
                    } label: {
                        Label("Sammlungen (Collections)", systemImage: "shippingbox.fill")
                    }
                    
                    NavigationLink {
                        TradeUpCalculatorView()
                    } label: {
                        Label("Trade-Up Rechner", systemImage: "flask.fill")
                    }
                    
                    NavigationLink {
                        WhatIfView()
                    } label: {
                        Label("Was-wäre-wenn Rechner", systemImage: "clock.arrow.circlepath")
                    }
                } header: {
                    Text("Investment Tools")
                }
                .listRowBackground(Color.white.opacity(0.05))
                
                Section {
                    Button(role: .destructive) {
                        withAnimation {
                            appState.changeStatus(to: .onboarding)
                        }
                    } label: {
                        HStack {
                            Text("Abmelden")
                            Spacer()
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                        }
                    }
                }
                .listRowBackground(Color.white.opacity(0.05))
            }
            .navigationTitle("Account")
            .scrollContentBackground(.hidden)
            .background(Color.black.edgesIgnoringSafeArea(.all))
        }
    }
}

#Preview {
    AccountView()
        .environmentObject(AppStateManager())
        .environmentObject(SteamService())
        .environmentObject(UserSettings())
}
