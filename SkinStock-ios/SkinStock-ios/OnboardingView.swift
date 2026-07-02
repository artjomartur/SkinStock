import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppStateManager
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
                    AuthStepView(authManager: authManager, onAuthenticated: {
                        withAnimation { appState.changeStatus(to: .steamLogin) }
                    })
                    .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                }
                
                Spacer()
                
                // Step Indicators
                HStack(spacing: 8) {
                    ForEach(0..<3) { i in
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
            let color = step == 0 ? Color(hex: "00FF77") : (step == 1 ? Color(hex: "D32CE6") : Color(hex: "4B69FF"))
            
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

// MARK: - Auth Step View
struct AuthStepView: View {
    @ObservedObject var authManager: AuthManager
    var onAuthenticated: () -> Void
    
    @State private var isLogin = false
    @State private var email = ""
    @State private var password = ""
    @State private var errorMsg = ""
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "lock.shield.fill")
                .font(.system(size: 50))
                .foregroundStyle(Color(hex: "00F0FF"))
                .padding(.bottom, 10)
            
            Text(isLogin ? "Willkommen zurück" : "Account erstellen")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)
            
            if !errorMsg.isEmpty {
                Text(errorMsg)
                    .font(.footnote)
                    .foregroundStyle(Color.red)
                    .padding(.horizontal, 40)
                    .multilineTextAlignment(.center)
            }
            
            VStack(spacing: 16) {
                // Glass Inputs
                TextField("E-Mail Adresse", text: $email)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.1), lineWidth: 1))
                    .foregroundStyle(.white)
                
                SecureField("Passwort", text: $password)
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.1), lineWidth: 1))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 40)
            
            Button {
                Task {
                    isLoading = true
                    errorMsg = ""
                    do {
                        if isLogin {
                            try await authManager.signIn(email: email, password: password)
                        } else {
                            try await authManager.signUp(email: email, password: password)
                        }
                        onAuthenticated()
                    } catch {
                        errorMsg = error.localizedDescription
                    }
                    isLoading = false
                }
            } label: {
                ZStack {
                    if isLoading {
                        ProgressView().tint(.black)
                    } else {
                        Text(isLogin ? "Anmelden" : "Registrieren")
                            .font(.headline)
                            .foregroundStyle(.black)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color(hex: "00F0FF"))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: Color(hex: "00F0FF").opacity(0.3), radius: 15, x: 0, y: 5)
            }
            .padding(.horizontal, 40)
            .padding(.top, 10)
            .disabled(isLoading)
            
            Button {
                withAnimation { isLogin.toggle() }
            } label: {
                Text(isLogin ? "Noch keinen Account? Hier registrieren" : "Bereits einen Account? Hier einloggen")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 10)
        }
    }
}

