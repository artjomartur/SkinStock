import SwiftUI
import AuthenticationServices

struct OnboardingView: View {
    @EnvironmentObject var appState: AppStateManager
    @EnvironmentObject var userSettings: UserSettings
    @ObservedObject var authManager: AuthManager
    @ObservedObject var steamService: SteamService
    
    @State private var step = 0
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            chromaticBackground
            
            VStack {
                Spacer()
                
                if step == 0 {
                    IntroStepView(
                        icon: "briefcase.fill",
                        color: Color(hex: "00FF77"),
                        title: "Dein CS2 Portfolio",
                        description: "Behalte den Überblick über all deine Skins. Verfolge den Gesamtwert deines Inventars in Echtzeit.",
                        buttonText: "Weiter",
                        action: { withAnimation { step = 1 } }
                    )
                    .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                } else if step == 1 {
                    IntroStepView(
                        icon: "chart.xyaxis.line",
                        color: Color(hex: "D32CE6"),
                        title: "Analysen & Trends",
                        description: "Nutze technische Indikatoren und Marktdaten, um den perfekten Kauf- oder Verkaufszeitpunkt zu finden.",
                        buttonText: "Loslegen",
                        action: { withAnimation { step = 2 } }
                    )
                    .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                } else if step == 2 {
                    SettingsStepView(onNext: {
                        withAnimation { step = 3 }
                    })
                    .environmentObject(userSettings)
                    .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                } else if step == 3 {
                    AuthStepView(authManager: authManager, onAuthenticated: {
                        withAnimation { appState.changeStatus(to: .steamLogin) }
                    })
                    .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                }
                
                Spacer()
                
                // Step Indicators (4 steps now)
                HStack(spacing: 8) {
                    ForEach(0..<4) { i in
                        Circle()
                            .fill(i == step ? Color.white : Color.white.opacity(0.2))
                            .frame(width: 8, height: 8)
                            .scaleEffect(i == step ? 1.2 : 1.0)
                            .animation(.spring(), value: step)
                    }
                }
                .padding(.bottom, 40)
            }
        }
    }
    
    private var chromaticBackground: some View {
        ZStack {
            let color = step == 0 ? Color(hex: "00FF77") : (step == 1 ? Color(hex: "D32CE6") : (step == 2 ? Color(hex: "00F0FF") : Color(hex: "4B69FF")))
            
            Circle()
                .fill(color.opacity(0.15))
                .blur(radius: 120)
                .frame(width: 400, height: 400)
                .offset(x: -100, y: -200)
                .animation(.easeInOut(duration: 1.0), value: step)
            
            Circle()
                .fill(Color(hex: "D1FF4D").opacity(0.1))
                .blur(radius: 150)
                .frame(width: 350, height: 350)
                .offset(x: 150, y: 300)
        }
        .ignoresSafeArea()
    }
}

// MARK: - Intro Step View
struct IntroStepView: View {
    let icon: String
    let color: Color
    let title: String
    let description: String
    let buttonText: String
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundStyle(color)
                .shadow(color: color.opacity(0.5), radius: 20, x: 0, y: 10)
                .padding(.bottom, 20)
            
            Text(title)
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(.white)
            
            Text(description)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Button(action: action) {
                Text(buttonText)
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color(hex: "D1FF4D"))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .shadow(color: Color(hex: "D1FF4D").opacity(0.3), radius: 15, x: 0, y: 5)
            }
            .padding(.horizontal, 40)
            .padding(.top, 30)
        }
    }
}

// MARK: - Settings Step View
struct SettingsStepView: View {
    @EnvironmentObject var userSettings: UserSettings
    var onNext: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "slider.horizontal.3")
                .font(.system(size: 60))
                .foregroundStyle(Color(hex: "00F0FF"))
                .shadow(color: Color(hex: "00F0FF").opacity(0.5), radius: 20, x: 0, y: 10)
                .padding(.bottom, 10)
            
            Text("Einstellungen")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(.white)
            
            Text("Passe deine Währung und deinen favorisierten Marktplatz an.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            VStack(spacing: 20) {
                // Währungsauswahl
                VStack(alignment: .leading, spacing: 8) {
                    Text("WÄHRUNG")
                        .font(.caption2.bold())
                        .foregroundColor(.secondary)
                        .tracking(1)
                    
                    Picker("Währung", selection: $userSettings.selectedCurrency) {
                        ForEach(CurrencyType.allCases) { type in
                            Text("\(type.rawValue) (\(type.symbol))").tag(type)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .tint(.white)
                    .padding(.horizontal, 16)
                    .frame(height: 48)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.06)))
                }
                
                // Marktplatzauswahl
                VStack(alignment: .leading, spacing: 8) {
                    Text("BEVORZUGTER MARKTPLATZ")
                        .font(.caption2.bold())
                        .foregroundColor(.secondary)
                        .tracking(1)
                    
                    Picker("Marktplatz", selection: $userSettings.preferredMarketplace) {
                        ForEach(Marketplace.allCases) { mp in
                            Text("\(mp.rawValue) (Gebühr: \(mp.displayFee))").tag(mp)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .tint(.white)
                    .padding(.horizontal, 16)
                    .frame(height: 48)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.06)))
                }
            }
            .padding(.horizontal, 40)
            .padding(.top, 10)
            
            Button(action: onNext) {
                Text("Speichern & Weiter")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color(hex: "00F0FF"))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .shadow(color: Color(hex: "00F0FF").opacity(0.3), radius: 15, x: 0, y: 5)
            }
            .padding(.horizontal, 40)
            .padding(.top, 10)
        }
    }
}

// MARK: - Auth Step View
struct AuthStepView: View {
    @ObservedObject var authManager: AuthManager
    var onAuthenticated: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "gamecontroller.fill")
                .font(.system(size: 60))
                .foregroundStyle(Color(hex: "4B69FF"))
                .shadow(color: Color(hex: "4B69FF").opacity(0.5), radius: 20, x: 0, y: 10)
                .padding(.bottom, 20)
            
            Text("Mit Steam verbinden")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(.white)
            
            Text("Um dein Inventar abzurufen, musst du dich mit deinem Steam-Account anmelden. Wir speichern keine privaten Daten.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Button {
                onAuthenticated()
            } label: {
                HStack {
                    Image(systemName: "link")
                        .font(.title3)
                    Text("Jetzt mit Steam anmelden")
                        .font(.headline)
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color(hex: "4B69FF"))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: Color(hex: "4B69FF").opacity(0.3), radius: 15, x: 0, y: 5)
            }
            .padding(.horizontal, 40)
            .padding(.top, 30)
        }
    }
}
