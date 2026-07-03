import Foundation
import UIKit
import PDFKit

class ExportService {
    static func generateCSV(inventory: [CS2Item], priceService: PriceService, userSettings: UserSettings) -> URL? {
        var csvString = "Name, Wear, Sticker, Rarität, Preis (\(userSettings.selectedCurrency.rawValue))\n"
        for item in inventory {
            let price = priceService.getPrice(for: item)
            let stickersStr = item.stickers.isEmpty ? "Keine" : item.stickers.compactMap { $0.name }.joined(separator: "; ")
            let convertedPrice = userSettings.convertPrice(price)
            let row = "\"\(item.name)\", \"\(item.wear ?? "N/A")\", \"\(stickersStr)\", \"\(item.rarity.rawValue)\", \"\(String(format: "%.2f", convertedPrice))\"\n"
            csvString.append(row)
        }
        
        let fileManager = FileManager.default
        let tempDir = fileManager.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent("SkinStock_Portfolio.csv")
        
        do {
            try csvString.write(to: fileURL, atomically: true, encoding: .utf8)
            return fileURL
        } catch {
            return nil
        }
    }
    
    static func generatePDF(inventory: [CS2Item], priceService: PriceService, userSettings: UserSettings) -> URL? {
        let totalValue = priceService.calculateTotalValue(inventory: inventory)
        
        let format = UIGraphicsPDFRendererFormat()
        let pageBounds = CGRect(x: 0, y: 0, width: 612, height: 792) // Letter size
        
        let renderer = UIGraphicsPDFRenderer(bounds: pageBounds, format: format)
        
        let fileManager = FileManager.default
        let tempDir = fileManager.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent("SkinStock_Report.pdf")
        
        do {
            try renderer.writePDF(to: fileURL) { context in
                context.beginPage()
                
                // Clean white layout
                UIColor.white.setFill()
                UIRectFill(pageBounds)
                
                // Title Header
                let titleAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.boldSystemFont(ofSize: 26),
                    .foregroundColor: UIColor.black
                ]
                "SKINSTOCK PORTFOLIO REPORT".draw(at: CGPoint(x: 40, y: 40), withAttributes: titleAttributes)
                
                // Creation timestamp
                let dateStr = DateFormatter.localizedString(from: Date(), dateStyle: .long, timeStyle: .short)
                let subtitleAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 11),
                    .foregroundColor: UIColor.gray
                ]
                "Erstellt am: \(dateStr)".draw(at: CGPoint(x: 40, y: 72), withAttributes: subtitleAttributes)
                
                // Total Portfolio Value Display
                let statsValAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.boldSystemFont(ofSize: 22),
                    .foregroundColor: UIColor(red: 0, green: 0.65, blue: 0.35, alpha: 1)
                ]
                let formattedTotal = userSettings.formattedPrice(totalValue)
                "Portfolio-Gesamtwert: \(formattedTotal)".draw(at: CGPoint(x: 40, y: 105), withAttributes: statsValAttributes)
                
                // Subtle separating line
                let path = UIBezierPath()
                path.move(to: CGPoint(x: 40, y: 145))
                path.addLine(to: CGPoint(x: 572, y: 145))
                path.lineWidth = 0.75
                UIColor.lightGray.setStroke()
                path.stroke()
                
                // Column Headers
                let boldFont = UIFont.boldSystemFont(ofSize: 10)
                "Waffe & Finish".draw(at: CGPoint(x: 40, y: 165), withAttributes: [.font: boldFont, .foregroundColor: UIColor.gray])
                "Zustand / Wear".draw(at: CGPoint(x: 340, y: 165), withAttributes: [.font: boldFont, .foregroundColor: UIColor.gray])
                "Wert".draw(at: CGPoint(x: 500, y: 165), withAttributes: [.font: boldFont, .foregroundColor: UIColor.gray])
                
                var currentY: CGFloat = 190
                let regularFont = UIFont.systemFont(ofSize: 10)
                
                for item in inventory.prefix(22) { // Show up to top 22 items
                    if currentY > 740 {
                        context.beginPage()
                        currentY = 40
                    }
                    
                    let price = priceService.getPrice(for: item)
                    
                    // Item Name (draw in bounds to support wrapping/ellipses)
                    item.name.draw(in: CGRect(x: 40, y: currentY, width: 290, height: 16), withAttributes: [
                        .font: regularFont,
                        .foregroundColor: UIColor.black
                    ])
                    
                    // Wear quality text
                    let wearText = item.wear ?? "N/A"
                    wearText.draw(at: CGPoint(x: 340, y: currentY), withAttributes: [
                        .font: regularFont,
                        .foregroundColor: UIColor.darkGray
                    ])
                    
                    // Item current price
                    let formattedPrice = userSettings.formattedPrice(price)
                    formattedPrice.draw(at: CGPoint(x: 500, y: currentY), withAttributes: [
                        .font: boldFont,
                        .foregroundColor: UIColor.black
                    ])
                    
                    currentY += 20
                }
                
                if inventory.count > 22 {
                    let note = "...und \(inventory.count - 22) weitere Gegenstände (die vollständige Liste ist in der CSV-Datei enthalten)."
                    note.draw(at: CGPoint(x: 40, y: currentY + 10), withAttributes: [
                        .font: UIFont.italicSystemFont(ofSize: 10),
                        .foregroundColor: UIColor.gray
                    ])
                }
            }
            return fileURL
        } catch {
            return nil
        }
    }
}
