//
//  SplashView.swift
//  SkinStock-ios
//
//  Created by Antigravity on 06.07.26.
//

import SwiftUI

struct SplashView: View {
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0.0
    @State private var glowOpacity: Double = 0.0
    @State private var textOpacity: Double = 0.0
    @State private var textOffset: CGFloat = 20
    @State private var rotationAngle: Double = 0.0
    
    var body: some View {
        ZStack {
            // Dark premium background matching the theme
            Color.black
                .ignoresSafeArea()
            
            // Subtle ambient background gradient glow
            RadialGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.15, green: 0.1, blue: 0.25).opacity(0.4),
                    Color.black
                ]),
                center: .center,
                startRadius: 10,
                endRadius: 400
            )
            .ignoresSafeArea()
            
            VStack(spacing: 24) {
                Spacer()
                
                // Logo Container with glowing glassmorphism-like drop shadow
                ZStack {
                    // Glow Layer
                    Image("Logo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 140, height: 140)
                        .blur(radius: 20)
                        .foregroundColor(Color(red: 0.88, green: 0.79, blue: 1.0)) // Accent tint
                        .opacity(glowOpacity)
                    
                    // Main Logo
                    Image("Logo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 130, height: 130)
                        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 28, style: .continuous)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            Color.white.opacity(0.15),
                                            Color.white.opacity(0.02),
                                            Color(red: 0.88, green: 0.79, blue: 1.0).opacity(0.1)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )
                        .shadow(color: Color.black.opacity(0.4), radius: 10, x: 0, y: 10)
                        .scaleEffect(logoScale)
                        .opacity(logoOpacity)
                }
                
                // Typography & Subtitles
                VStack(spacing: 8) {
                    Text("SkinStock")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .tracking(1.5)
                    
                    Text("CS2 MARKET TICKER")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundColor(Color(red: 0.88, green: 0.79, blue: 1.0).opacity(0.8)) // Opal-like purple accent
                        .tracking(4)
                }
                .opacity(textOpacity)
                .offset(y: textOffset)
                
                Spacer()
                
                // Subtle premium loading indicator
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.05), lineWidth: 2)
                        .frame(width: 24, height: 24)
                    
                    Circle()
                        .trim(from: 0.0, to: 0.3)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.2, green: 0.83, blue: 0.6), // Green accent
                                    Color(red: 0.88, green: 0.79, blue: 1.0)  // Purple accent
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            style: StrokeStyle(lineWidth: 2, lineCap: .round)
                        )
                        .frame(width: 24, height: 24)
                        .rotationEffect(Angle(degrees: rotationAngle))
                }
                .opacity(logoOpacity)
                .padding(.bottom, 40)
            }
        }
        .onAppear {
            // Logo entrance spring animation
            withAnimation(.spring(response: 0.8, dampingFraction: 0.7, blendDuration: 0)) {
                logoScale = 1.0
                logoOpacity = 1.0
            }
            
            // Delayed ambient glow animation
            withAnimation(.easeIn(duration: 0.8).delay(0.2)) {
                glowOpacity = 0.6
            }
            
            // Text sliding fade-in animation
            withAnimation(.easeOut(duration: 0.6).delay(0.4)) {
                textOpacity = 1.0
                textOffset = 0
            }
            
            // Infinite rotation for the premium loader
            withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                rotationAngle = 360
            }
        }
    }
}

#Preview {
    SplashView()
}
