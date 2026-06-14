import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createChart } from 'lightweight-charts'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Bell, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import './App.css'

// Initial skins list
const INITIAL_SKINS = [
  {
    id: 'ak47-redline',
    name: 'AK-47 | Redline (FT)',
    wear: '0.1982',
    basePrice: 18.50,
    price: 18.50,
    prevPrice: 18.50,
    change: 1.25,
    img: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVypdDEYTwqLx4QC5yFiLkTE61Y1V251_vRYc1chQEB6FAo7C_E-H1RfC0DKBOyDSOCj1MDWwVNqLQdZsOi2KzVl7ODbefGFwdy0x9iElrH3ZePVwDkDupNyjOyX8Yr0iVft_0tsYjr3cdLDdwZrNF6D_VK4luzqh5-_58nMyQ/360fx360f'
  },
  {
    id: 'awp-asiimov',
    name: 'AWP | Asiimov (FT)',
    wear: '0.2741',
    basePrice: 142.00,
    price: 142.00,
    prevPrice: 142.00,
    change: -0.42,
    img: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVypdDEYTwqLx4QC5yFiLkTE61Y1V251_vRYc1chQEB6FAo7C_E-H1RfC0DKBOyDSOCj1MDWwVNqLQdZsOi2KzVl8vPcfGKFwdywzNiElrH3ZeLVwz0CvZZy2LnErN_231bsrktoYW-idYfAI1A6M17Yq1q8xebvh5_u49c/360fx360f'
  },
  {
    id: 'm4a4-howl',
    name: 'M4A4 | Howl (FN)',
    wear: '0.0312',
    basePrice: 3250.00,
    price: 3250.00,
    prevPrice: 3250.00,
    change: 2.10,
    img: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVypdDEYTwqLx4QC5yFiLkTE61Y1V251_vRYc1chQEB6FAo7C_E-H1RfC0DKBOyDSOCj1MDWwVNqLQdZsOi2KzVl8vPcfGKFwdy5x9iElrH3ZeLVwTkDsZNw2bmT8Yr0jVjt_0VoMjr2cIbEcAM5NF-Gr1m3lennhJ_-58nMzg/360fx360f'
  },
  {
    id: 'karambit-fade',
    name: '★ Karambit | Fade (FN)',
    wear: '0.0089',
    basePrice: 1750.00,
    price: 1750.00,
    prevPrice: 1750.00,
    change: -1.15,
    img: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVypdDEYTwqLx4QC5yFiLkTE61Y1V251_vRYc1chQEB6FAo7C_E-H1RfC0DKBOyDSOCj1MDWwVNqLQdZsOi2KzVl8vPcfGKFwdy2z9iElrH3ZeKVwTsFupZxiO_X8Yr2glG3rxY_MWqjJ9DAdVJqMF2D-VK-k-y70J--u5nMnQ/360fx360f'
  },
  {
    id: 'gloves-fade',
    name: '★ Specialist Gloves | Fade (MW)',
    wear: '0.1145',
    basePrice: 620.00,
    price: 620.00,
    prevPrice: 620.00,
    change: 0.85,
    img: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVypdDEYTwqLx4QC5yFiLkTE61Y1V251_vRYc1chQEB6FAo7C_E-H1RfC0DKBOyDSOCj1MDWwVNqLQdZsOi2KzVl8vPcfGKFwdy2x9iElrH3ZeKVwD4EupswiLyV8Yr0jVewrBY-MGyjIYbBIFFsMl6C-FK7lOy505u8tNnKmA/360fx360f'
  },
  {
    id: 'case-bravo',
    name: 'Operation Bravo Case',
    wear: 'Container',
    basePrice: 42.50,
    price: 42.50,
    prevPrice: 42.50,
    change: -0.10,
    img: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVypdDEYTwqLx4QC5yFiLkTE61Y1V251_vRYc1chQEB6FAo7C_E-H1RfC0DKBOyDSOCj1MDWwVNqLQdZsOi2KzVl4vOcfGKFwdywz9iElrH3ZeLVwz4FvMZziO_X8Yr2gVWwrBFsNm2jcYeBIAM6M1-G-lO7l-zs1sif/360fx360f'
  }
]

// Generate simulated 30-day historical chart data
function generateHistoricalData(basePrice) {
  const data = []
  const now = new Date()
  let currentPrice = basePrice * 0.95

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const timeStr = date.toISOString().split('T')[0]

    const open = currentPrice
    const close = currentPrice * (1 + (Math.random() - 0.48) * 0.03)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)

    data.push({
      time: timeStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    })

    currentPrice = close
  }
  return data
}

// Web Audio API Synthesizer
function playTradeSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    if (type === 'buy') {
      // Ascending trade sound
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.setValueAtTime(554.37, now + 0.08)
      osc.frequency.setValueAtTime(659.25, now + 0.16)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    } else if (type === 'sell') {
      // Descending trade sound
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(659.25, now)
      osc.frequency.setValueAtTime(554.37, now + 0.08)
      osc.frequency.setValueAtTime(440, now + 0.16)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    } else {
      // Alert chime (C6 arpeggio)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.setValueAtTime(659.25, now + 0.07)
      osc.frequency.setValueAtTime(783.99, now + 0.14)
      osc.frequency.setValueAtTime(1046.50, now + 0.21)
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    }

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(now + 0.5)
  } catch (e) {
    console.warn('Audio failed', e)
  }
}

// Chart Component using lightweight-charts
function SkinChart({ data, currentPrice }) {
  const chartContainerRef = useRef()
  const seriesRef = useRef()
  const chartRef = useRef()

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: 'Outfit, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.02)' },
        horzLines: { color: 'rgba(255,255,255,0.02)' }
      },
      timeScale: {
        borderVisible: false
      },
      rightPriceScale: {
        borderVisible: false
      },
      crosshair: {
        vertLine: { color: 'rgba(0, 255, 102, 0.15)', labelVisible: false },
        horzLine: { color: 'rgba(0, 255, 102, 0.15)', labelVisible: false }
      },
      width: chartContainerRef.current.clientWidth,
      height: 220
    })
    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00ff66',
      downColor: '#ff3b30',
      borderUpColor: '#00ff66',
      borderDownColor: '#ff3b30',
      wickUpColor: '#00ff66',
      wickDownColor: '#ff3b30'
    })
    seriesRef.current = candlestickSeries

    candlestickSeries.setData(data)

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data])

  useEffect(() => {
    if (seriesRef.current && data.length > 0 && currentPrice) {
      const lastCandle = { ...data[data.length - 1] }
      lastCandle.close = currentPrice
      if (currentPrice > lastCandle.high) lastCandle.high = currentPrice
      if (currentPrice < lastCandle.low) lastCandle.low = currentPrice
      seriesRef.current.update(lastCandle)
    }
  }, [currentPrice, data])

  return <div ref={chartContainerRef} style={{ width: '100%', height: '220px' }} />
}

export default function App() {
  const [activeTab, setActiveTab] = useState('market') // 'market' | 'portfolio' | 'alerts' | 'activity'
  const [skins, setSkins] = useState(INITIAL_SKINS)
  const [selectedSkinId, setSelectedSkinId] = useState('ak47-redline')
  const [flashStates, setFlashStates] = useState({}) // skinId -> 'up' | 'down'
  
  // Wallet / Paper Trading state
  const [balance, setBalance] = useState(1000.00)
  const [holdings, setHoldings] = useState({}) // skinId -> { qty, avgPrice }
  const [transactions, setTransactions] = useState([])
  
  // Trade Inputs
  const [tradeQty, setTradeQty] = useState(1)
  
  // Alert states
  const [alerts, setAlerts] = useState([])
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [alertType, setAlertType] = useState('above') // 'above' | 'below'
  const [toasts, setToasts] = useState([])

  // Cache historical data for each skin
  const historicalDataMap = useMemo(() => {
    const map = {}
    INITIAL_SKINS.forEach((skin) => {
      map[skin.id] = generateHistoricalData(skin.basePrice)
    })
    return map
  }, [])

  const selectedSkin = useMemo(() => {
    return skins.find((s) => s.id === selectedSkinId)
  }, [skins, selectedSkinId])

  // Price Simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSkins((prevSkins) => {
        return prevSkins.map((skin) => {
          // 48% chance down, 52% chance up (natural upward bias)
          const changePercent = (Math.random() - 0.48) * 0.7
          const newPrice = parseFloat((skin.price * (1 + changePercent / 100)).toFixed(2))
          
          let flash = null
          if (newPrice > skin.price) {
            flash = 'up'
          } else if (newPrice < skin.price) {
            flash = 'down'
          }

          if (flash) {
            setFlashStates((prev) => ({ ...prev, [skin.id]: flash }))
            setTimeout(() => {
              setFlashStates((prev) => ({ ...prev, [skin.id]: null }))
            }, 800)
          }

          // Check Alerts
          checkPriceAlerts(skin.id, newPrice, skin.name)

          const totalChange = parseFloat(((newPrice - skin.basePrice) / skin.basePrice * 100).toFixed(2))

          return {
            ...skin,
            prevPrice: skin.price,
            price: newPrice,
            change: totalChange
          }
        })
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [alerts])

  const checkPriceAlerts = (skinId, price, skinName) => {
    setAlerts((prevAlerts) => {
      const triggered = []
      const remaining = []

      prevAlerts.forEach((alert) => {
        if (alert.skinId === skinId) {
          if (alert.type === 'above' && price >= alert.target) {
            triggered.push(alert)
          } else if (alert.type === 'below' && price <= alert.target) {
            triggered.push(alert)
          } else {
            remaining.push(alert)
          }
        } else {
          remaining.push(alert)
        }
      })

      triggered.forEach((alert) => {
        // Trigger Toast & Play Sound
        playAlertSoundNotification(skinName, alert.type, alert.target, price)
      })

      return remaining
    })
  }

  const playAlertSoundNotification = (skinName, type, target, currentPrice) => {
    playTradeSound('alert')
    const id = Date.now() + Math.random()
    const msg = type === 'above' 
      ? `Stieg über €${target.toFixed(2)} (Aktuell: €${currentPrice.toFixed(2)})`
      : `Fiel unter €${target.toFixed(2)} (Aktuell: €${currentPrice.toFixed(2)})`
    
    setToasts((prev) => [...prev, { id, skinName, msg }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  // Trading actions
  const handleBuy = () => {
    const totalCost = selectedSkin.price * tradeQty
    if (balance < totalCost) return

    setBalance((prev) => parseFloat((prev - totalCost).toFixed(2)))
    setHoldings((prev) => {
      const current = prev[selectedSkinId] || { qty: 0, avgPrice: 0 }
      const newQty = current.qty + tradeQty
      const newAvg = parseFloat(((current.qty * current.avgPrice + totalCost) / newQty).toFixed(2))
      return {
        ...prev,
        [selectedSkinId]: { qty: newQty, avgPrice: newAvg }
      }
    })

    setTransactions((prev) => [
      {
        id: Date.now(),
        type: 'buy',
        skinName: selectedSkin.name,
        qty: tradeQty,
        price: selectedSkin.price,
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ])

    playTradeSound('buy')
    // Trigger mobile vibration if available
    if (navigator.vibrate) {
      navigator.vibrate(60)
    }
  }

  const handleSell = () => {
    const currentHolding = holdings[selectedSkinId]
    if (!currentHolding || currentHolding.qty < tradeQty) return

    const totalRevenue = selectedSkin.price * tradeQty
    setBalance((prev) => parseFloat((prev + totalRevenue).toFixed(2)))
    
    setHoldings((prev) => {
      const current = prev[selectedSkinId]
      const newQty = current.qty - tradeQty
      if (newQty === 0) {
        const updated = { ...prev }
        delete updated[selectedSkinId]
        return updated
      }
      return {
        ...prev,
        [selectedSkinId]: { ...current, qty: newQty }
      }
    })

    setTransactions((prev) => [
      {
        id: Date.now(),
        type: 'sell',
        skinName: selectedSkin.name,
        qty: tradeQty,
        price: selectedSkin.price,
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ])

    playTradeSound('sell')
    if (navigator.vibrate) {
      navigator.vibrate(60)
    }
  }

  // Alerts configuration
  const handleAddAlert = (e) => {
    e.preventDefault()
    const target = parseFloat(alertTargetPrice)
    if (isNaN(target) || target <= 0) return

    const newAlert = {
      id: Date.now(),
      skinId: selectedSkinId,
      skinName: selectedSkin.name,
      type: alertType,
      target
    }

    setAlerts((prev) => [...prev, newAlert])
    setAlertTargetPrice('')
    playTradeSound('buy')
  }

  const handleDeleteAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    playTradeSound('sell')
  }

  // Portfolio PNL Calculations
  const portfolioSummary = useMemo(() => {
    let holdingsValue = 0
    let totalInvested = 0
    
    Object.entries(holdings).forEach(([skinId, data]) => {
      const currentSkin = skins.find((s) => s.id === skinId)
      if (currentSkin) {
        holdingsValue += currentSkin.price * data.qty
        totalInvested += data.avgPrice * data.qty
      }
    })

    const totalValue = parseFloat((balance + holdingsValue).toFixed(2))
    const pnlVal = parseFloat((holdingsValue - totalInvested).toFixed(2))
    const pnlPct = totalInvested === 0 ? 0 : parseFloat((pnlVal / totalInvested * 100).toFixed(2))

    return {
      totalValue,
      holdingsValue: parseFloat(holdingsValue.toFixed(2)),
      pnlVal,
      pnlPct
    }
  }, [holdings, skins, balance])

  const maxAffordableQty = useMemo(() => {
    if (!selectedSkin) return 0
    return Math.floor(balance / selectedSkin.price)
  }, [balance, selectedSkin])

  const holdingQty = useMemo(() => {
    return holdings[selectedSkinId]?.qty || 0
  }, [holdings, selectedSkinId])

  return (
    <div className="app-layout">
      {/* Toast Alert Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <Bell className="toast-icon" size={18} />
            <div className="toast-content">
              <div className="toast-title">{toast.skinName}</div>
              <div className="toast-msg">{toast.msg}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="logo-group">
          <Activity className="logo-icon" size={24} />
          <h1 className="logo-text">SkinStock</h1>
        </div>
        <div className="balance-card">
          <span className="balance-label">{lang === 'de' ? 'Spielgeld-Guthaben' : 'Paper Balance'}</span>
          <span className="balance-amount">€{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </header>

      {/* App Content */}
      <main className="app-content scrollbar-hide">
        {activeTab === 'market' && (
          <div className="market-view">
            {/* Candlestick Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title-group">
                  <h3 className="chart-title">{selectedSkin.name}</h3>
                  <span className="chart-sub">{lang === 'de' ? 'TradingView Lightweight Chart' : 'TradingView Charts'}</span>
                </div>
                <div className="chart-price-group">
                  <span className="chart-price">€{selectedSkin.price.toFixed(2)}</span>
                  <span className={`skin-change ${selectedSkin.change >= 0 ? 'price-up' : 'price-down'}`}>
                    {selectedSkin.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {selectedSkin.change >= 0 ? '+' : ''}{selectedSkin.change}%
                  </span>
                </div>
              </div>
              <div className="chart-body-container">
                <SkinChart 
                  data={historicalDataMap[selectedSkinId]} 
                  currentPrice={selectedSkin.price} 
                />
              </div>
            </div>

            {/* Paper Trading Execution Panel */}
            <div className="trade-box">
              <h4 className="section-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
                {lang === 'de' ? 'Paper Trading Ausführung' : 'Paper Trade Execution'}
              </h4>
              <div className="trade-inputs">
                <div className="trade-input-group">
                  <label>{lang === 'de' ? 'Menge' : 'Amount'}</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="trade-input" 
                    value={tradeQty} 
                    onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="trade-input-group" style={{ flexGrow: 2 }}>
                  <label>{lang === 'de' ? 'Gesamtsumme' : 'Total Value'}</label>
                  <div className="trade-input" style={{ background: 'rgba(0,0,0,0.1)', borderStyle: 'dashed', display: 'flex', alignItems: 'center' }}>
                    €{(selectedSkin.price * tradeQty).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="trade-buttons">
                <button 
                  className="trade-btn trade-btn--buy" 
                  disabled={balance < selectedSkin.price * tradeQty}
                  onClick={handleBuy}
                >
                  {lang === 'de' ? 'Kaufen (Long)' : 'Buy (Long)'}
                </button>
                <button 
                  className="trade-btn trade-btn--sell" 
                  disabled={holdingQty < tradeQty}
                  onClick={handleSell}
                >
                  {lang === 'de' ? 'Verkaufen (Short)' : 'Sell (Short)'}
                </button>
              </div>
            </div>

            {/* Skins Watchlist */}
            <div style={{ marginTop: '20px' }}>
              <div className="section-header">
                <h3 className="section-title">{lang === 'de' ? 'Beobachtungsliste' : 'Watchlist'}</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {lang === 'de' ? 'Preise ticken live' : 'Prices tick live'}
                </span>
              </div>
              <div className="watchlist">
                {skins.map((skin) => (
                  <div 
                    key={skin.id} 
                    className={`skin-row ${selectedSkinId === skin.id ? 'skin-row--selected' : ''} ${flashStates[skin.id] === 'up' ? 'flash-up' : flashStates[skin.id] === 'down' ? 'flash-down' : ''}`}
                    onClick={() => {
                      setSelectedSkinId(skin.id)
                      setTradeQty(1)
                    }}
                  >
                    <div className="skin-info-left">
                      <div className="skin-icon-container">
                        <img src={skin.img} alt={skin.name} className="skin-img" />
                      </div>
                      <div className="skin-meta">
                        <span className="skin-name">{skin.name}</span>
                        <span className="skin-wear-badge">Float: {skin.wear}</span>
                      </div>
                    </div>
                    <div className="skin-info-right">
                      <span className="skin-price">€{skin.price.toFixed(2)}</span>
                      <span className={`skin-change ${skin.change >= 0 ? 'price-up' : 'price-down'}`}>
                        {skin.change >= 0 ? '+' : ''}{skin.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-view">
            {/* Portfolio Summary Card */}
            <div className="portfolio-summary">
              <div className="stat-item">
                <span className="stat-label">{lang === 'de' ? 'Gesamtwert' : 'Total Net Worth'}</span>
                <span className="stat-value">€{portfolioSummary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="stat-item" style={{ alignItems: 'flex-end' }}>
                <span className="stat-label">{lang === 'de' ? 'Rendite (P&L)' : 'Return (P&L)'}</span>
                <span className={`stat-value ${portfolioSummary.pnlVal >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                  {portfolioSummary.pnlVal >= 0 ? '+' : ''}€{portfolioSummary.pnlVal.toFixed(2)} ({portfolioSummary.pnlPct}%)
                </span>
              </div>
            </div>

            <div className="section-header">
              <h3 className="section-title">{lang === 'de' ? 'Deine Bestände' : 'Your Holdings'}</h3>
            </div>

            {Object.keys(holdings).length === 0 ? (
              <div className="empty-state">
                <Wallet size={36} style={{ marginBottom: '10px', opacity: 0.3 }} />
                <div>{lang === 'de' ? 'Keine aktiven Bestände vorhanden. Kaufe Skins auf der Ticker-Seite!' : 'No active holdings. Buy skins on the Ticker page!'}</div>
              </div>
            ) : (
              <div className="portfolio-list">
                {Object.entries(holdings).map(([skinId, data]) => {
                  const skin = skins.find((s) => s.id === skinId)
                  if (!skin) return null
                  const currentVal = skin.price * data.qty
                  const investedVal = data.avgPrice * data.qty
                  const itemPnl = parseFloat((currentVal - investedVal).toFixed(2))
                  const itemPnlPct = parseFloat((itemPnl / investedVal * 100).toFixed(2))

                  return (
                    <div key={skinId} className="portfolio-card">
                      <div className="skin-info-left">
                        <div className="skin-icon-container">
                          <img src={skin.img} alt={skin.name} className="skin-img" />
                        </div>
                        <div className="skin-meta">
                          <span className="skin-name">{skin.name}</span>
                          <span className="qty-label">{data.qty}x @ avg. €{data.avgPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="skin-info-right">
                        <span className="skin-price">€{currentVal.toFixed(2)}</span>
                        <span className={`pnl-badge ${itemPnl >= 0 ? 'pnl-badge--up' : 'pnl-badge--down'}`}>
                          {itemPnl >= 0 ? '+' : ''}€{itemPnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-view">
            {/* Create Alert Form */}
            <div className="trade-box" style={{ marginBottom: '20px' }}>
              <h4 className="section-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
                {lang === 'de' ? 'Neuen Preis-Alert erstellen' : 'Create Price Alert'}
              </h4>
              <form onSubmit={handleAddAlert}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="trade-input-group">
                    <label>{lang === 'de' ? 'Ausgewählter Skin' : 'Selected Skin'}</label>
                    <div className="trade-input" style={{ background: 'rgba(0,0,0,0.1)', borderStyle: 'solid' }}>
                      {selectedSkin.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="trade-input-group" style={{ flexGrow: 1 }}>
                      <label>{lang === 'de' ? 'Bedingung' : 'Condition'}</label>
                      <select 
                        className="trade-input" 
                        value={alertType}
                        onChange={(e) => setAlertType(e.target.value)}
                        style={{ height: '38px', padding: '0 8px' }}
                      >
                        <option value="above">{lang === 'de' ? 'Steigt über (>=)' : 'Rises above (>=)'}</option>
                        <option value="below">{lang === 'de' ? 'Fällt unter (<=)' : 'Drops below (<=)'}</option>
                      </select>
                    </div>
                    <div className="trade-input-group" style={{ flexGrow: 1 }}>
                      <label>{lang === 'de' ? 'Zielpreis (€)' : 'Target Price (€)'}</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="e.g. 19.50"
                        className="trade-input" 
                        value={alertTargetPrice}
                        onChange={(e) => setAlertTargetPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="sandbox-btn" style={{ margin: '8px 0 0 0', width: '100%', height: '40px', background: 'linear-gradient(135deg, #ffb700 0%, #ff9500 100%)', boxShadow: '0 4px 15px rgba(255, 183, 0, 0.25)' }}>
                    <Plus size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {lang === 'de' ? 'Alert hinzufügen' : 'Add Alert'}
                  </button>
                </div>
              </form>
            </div>

            <div className="section-header">
              <h3 className="section-title">{lang === 'de' ? 'Aktive Alarme' : 'Active Alerts'}</h3>
            </div>

            {alerts.length === 0 ? (
              <div className="empty-state">
                <Bell size={36} style={{ marginBottom: '10px', opacity: 0.3 }} />
                <div>{lang === 'de' ? 'Keine aktiven Alarme eingerichtet.' : 'No active alerts set.'}</div>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div key={alert.id} className="alert-card">
                    <div className="alert-details">
                      <Bell size={16} style={{ color: 'var(--color-amber)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="skin-name" style={{ fontSize: '13px' }}>{alert.skinName}</span>
                        <span className="alert-condition">
                          {alert.type === 'above' ? (
                            <>{lang === 'de' ? 'Wenn Preis steigt über' : 'If price goes above'} <span className="alert-trigger-price">€{alert.target.toFixed(2)}</span></>
                          ) : (
                            <>{lang === 'de' ? 'Wenn Preis fällt unter' : 'If price goes below'} <span className="alert-trigger-price">€{alert.target.toFixed(2)}</span></>
                          )}
                        </span>
                      </div>
                    </div>
                    <button className="alert-delete-btn" onClick={() => handleDeleteAlert(alert.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-view">
            <div className="section-header">
              <h3 className="section-title">{lang === 'de' ? 'Handelsverlauf' : 'Trade History'}</h3>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <History size={36} style={{ marginBottom: '10px', opacity: 0.3 }} />
                <div>{lang === 'de' ? 'Noch keine Transaktionen getätigt.' : 'No transactions recorded yet.'}</div>
              </div>
            ) : (
              <div className="portfolio-list">
                {transactions.map((tx) => (
                  <div key={tx.id} className="portfolio-card" style={{ borderLeft: `3px solid ${tx.type === 'buy' ? 'var(--color-green)' : 'var(--color-red)'}` }}>
                    <div className="skin-info-left" style={{ paddingLeft: '4px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="skin-name" style={{ fontSize: '14px' }}>{tx.skinName}</span>
                        <span className="qty-label" style={{ fontSize: '10px' }}>
                          {tx.type === 'buy' ? (
                            <span style={{ color: 'var(--color-green)', fontWeight: '700' }}>{lang === 'de' ? 'GEKAUFT' : 'BOUGHT'}</span>
                          ) : (
                            <span style={{ color: 'var(--color-red)', fontWeight: '700' }}>{lang === 'de' ? 'VERKAUFT' : 'SOLD'}</span>
                          )}{' '}
                          {tx.qty}x @ €{tx.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="skin-info-right">
                      <span className="skin-price">€{(tx.price * tx.qty).toFixed(2)}</span>
                      <span style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>{tx.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Tab Navigation Bar */}
      <nav className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'market' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          <Activity className="tab-icon" />
          <span>Ticker</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'portfolio' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <Wallet className="tab-icon" />
          <span>{lang === 'de' ? 'Depot' : 'Portfolio'}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell className="tab-icon" />
          <span>Alarme</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <History className="tab-icon" />
          <span>{lang === 'de' ? 'Verlauf' : 'History'}</span>
        </button>
      </nav>
    </div>
  )
}
