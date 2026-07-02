import SwiftUI
import AuthenticationServices

struct SteamLoginView: View {
    @EnvironmentObject var appState: AppStateManager
    @ObservedObject var steamService: SteamService
    
    @State private var isLoginPresented = false
    @State private var loginError: String?
    @State private var isLoading = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            // Subtiler Hintergrund-Glow
            Circle()
                .fill(Color(hex: "4B69FF").opacity(0.15))
                .blur(radius: 120)
                .frame(width: 400, height: 400)
                .offset(y: -100)
            
            VStack(spacing: 24) {
                Spacer()
                
                Image(systemName: "link.badge.plus")
                    .font(.system(size: 60))
                    .foregroundStyle(Color(hex: "FF2E93"))
                    .padding(.bottom, 20)
                
                Text("Steam verbinden")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(.white)
                
                Text("Verbinde deinen Account sicher über Steam OpenID, um dein CS2-Inventar automatisch zu laden.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                
                if let error = loginError {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                        .padding(.horizontal, 40)
                        .multilineTextAlignment(.center)
                }
                
                Button {
                    loginError = nil
                    isLoginPresented = true
                } label: {
                    ZStack {
                        if isLoading {
                            ProgressView().tint(.black)
                        } else {
                            HStack {
                                Image(systemName: "person.crop.circle.badge.checkmark")
                                Text("Mit Steam einloggen")
                            }
                            .font(.headline)
                            .foregroundStyle(.black)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color(hex: "D1FF4D"))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .shadow(color: Color(hex: "D1FF4D").opacity(0.3), radius: 15, x: 0, y: 5)
                }
                .padding(.horizontal, 40)
                .padding(.top, 30)
                .disabled(isLoading)
                
                Button {
                    withAnimation {
                        appState.changeStatus(to: .mainApp)
                    }
                } label: {
                    Text("Ohne Steam fortfahren (Mock Data)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 10)
                
                Spacer()
            }
        }
        .sheet(isPresented: $isLoginPresented) {
            NavigationView {
                SteamWebView(url: steamService.getSteamAuthURL()) { callbackUrl in
                    isLoginPresented = false
                    isLoading = true
                    Task {
                        do {
                            try await steamService.handleSteamCallback(url: callbackUrl)
                            withAnimation {
                                appState.changeStatus(to: .mainApp)
                            }
                        } catch {
                            loginError = "Login fehlgeschlagen: \(error.localizedDescription)"
                            isLoading = false
                        }
                    }
                }
                .navigationTitle("Steam Login")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Abbrechen") {
                            isLoginPresented = false
                        }
                    }
                }
            }
        }
    }
}
