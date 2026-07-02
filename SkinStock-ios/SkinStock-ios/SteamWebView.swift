import SwiftUI
import WebKit

struct SteamWebView: UIViewRepresentable {
    let url: URL
    let onCallback: (URL) -> Void
    
    func makeUIView(context: Context) -> WKWebView {
        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences = prefs
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        let request = URLRequest(url: url)
        uiView.load(request)
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: SteamWebView
        
        init(_ parent: SteamWebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url {
                // Steam leitet uns nach dem Login zurück an unsere angebliche Domain
                if url.absoluteString.starts(with: "https://steamcommunity.com/login_success") {
                    decisionHandler(.cancel)
                    parent.onCallback(url)
                    return
                }
            }
            decisionHandler(.allow)
        }
    }
}
