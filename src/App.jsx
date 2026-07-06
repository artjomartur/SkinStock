/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createChart, AreaSeries, LineSeries } from 'lightweight-charts'

const lang = typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('de') ? 'de' : 'en';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Bell, 
  Activity,
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  BarChart2,
  LogOut,
  Crown,
  Star,
  Shield,
  Diamond,
  Package,
  FlaskConical,
  History,
  Eye,
  ChevronRight,
  X,
  RotateCw,
  AlertCircle,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import './App.css'
import { collections, getFloatLimits, findCollectionForSkin, getSkinRarity, rarityColors, nextRarityMap } from './components/CS2CollectionData'

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_login', title: 'Willkommen!', description: 'Melde dich zum ersten Mal an', icon: 'Star' },
  { id: 'portfolio_100', title: 'Starter', description: 'Portfolio-Wert über 100€', icon: 'TrendingUp' },
  { id: 'portfolio_500', title: 'Investor', description: 'Portfolio-Wert über 500€', icon: 'Wallet' },
  { id: 'portfolio_1000', title: 'Whaler', description: 'Portfolio-Wert über 1.000€', icon: 'Crown' },
  { id: 'portfolio_5000', title: 'High Roller', description: 'Portfolio-Wert über 5.000€', icon: 'Diamond' },
  { id: 'portfolio_10000', title: 'Legende', description: 'Portfolio-Wert über 10.000€', icon: 'Shield' },
  { id: 'items_5', title: 'Sammler', description: '5 Skins im Inventar', icon: 'Package' },
  { id: 'items_25', title: 'Hoarder', description: '25 Skins im Inventar', icon: 'Package' },
  { id: 'items_50', title: 'Arsenal', description: '50 Skins im Inventar', icon: 'Package' },
  { id: 'items_100', title: 'Museum', description: '100 Skins im Inventar', icon: 'Package' },
  { id: 'first_knife', title: 'Erste Klinge', description: 'Besitze ein Messer (★)', icon: 'Sparkles' },
  { id: 'first_gloves', title: 'Handarbeit', description: 'Besitze Handschuhe', icon: 'Sparkles' },
  { id: 'sticker_king', title: 'Sticker King', description: 'Besitze einen Skin mit 4 Stickern', icon: 'Sparkles' },
  { id: 'diversified', title: 'Diversifiziert', description: 'Besitze Skins in 5+ Seltenheitsstufen', icon: 'BarChart2' },
  { id: 'watchlist_add', title: 'Beobachter', description: 'Füge ein Item zur Watchlist hinzu', icon: 'Eye' }
];
import defaultInventory from './defaultInventory.json'
import Onboarding from './components/Onboarding'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import confetti from 'canvas-confetti'
import Tilt from 'react-parallax-tilt'
import CountUp from 'react-countup'
import ParticleBackground from './components/ParticleBackground'
import SpotlightCard from './components/SpotlightCard'
import DiversificationChart from './components/DiversificationChart'

// Helper for formatting prices
const formatPrice = (price, curr = 'EUR', mode = 'STEAM') => {
  let p = price;
  if (mode === 'CASHOUT') p = p * 0.75;
  if (curr === 'USD') p = p * 1.08;
  const sym = curr === 'USD' ? '$' : '€';
  return `${sym}${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const getRarityClass = (price) => {
  if (price > 200) return 'rarity-covert'
  if (price > 50) return 'rarity-classified'
  if (price > 10) return 'rarity-restricted'
  if (price > 2) return 'rarity-milspec'
  return 'rarity-industrial'
}

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

// Generate simulated historical chart data based on timeframe
function generateHistoricalData(basePrice, days = 30) {
  const data = []
  const now = new Date()
  let currentPrice = basePrice * (1 - (days / 600))

  for (let i = days; i >= 0; i--) {
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
function SkinChart({ data, currentPrice, isPositive }) {
  const chartContainerRef = useRef()
  const seriesRef = useRef()
  const smaSeriesRef = useRef()
  const chartRef = useRef()

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#8e8e93',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false }
      },
      timeScale: {
        borderVisible: false
      },
      rightPriceScale: {
        borderVisible: false
      },
      crosshair: {
        vertLine: {
          color: 'rgba(255, 255, 255, 0.15)',
          width: 1,
          style: 3, // dashed
          labelVisible: true,
          labelBackgroundColor: '#222'
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.15)',
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: '#222'
        }
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 180
    })
    chartRef.current = chart

    const isUp = isPositive !== false
    const lineColor = isUp ? '#34D399' : '#FF453A' // Opal colors
    const topColor = isUp ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 69, 58, 0.15)'
    const bottomColor = 'rgba(0, 0, 0, 0.0)'

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: lineColor,
      topColor: topColor,
      bottomColor: bottomColor,
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#ffffff',
      crosshairMarkerBackgroundColor: lineColor
    })
    seriesRef.current = areaSeries

    const areaData = data.map(item => ({
      time: item.time,
      value: item.close
    }))
    if (areaData.length > 0) {
      areaSeries.setData(areaData)
    }

    const smaSeries = chart.addSeries(LineSeries, {
      color: 'rgba(255, 171, 0, 0.8)',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    smaSeriesRef.current = smaSeries

    const smaData = []
    const windowSize = Math.min(7, Math.floor(data.length / 3) || 1)
    for (let i = 0; i < areaData.length; i++) {
      if (i < windowSize - 1) continue
      let sum = 0
      for (let j = 0; j < windowSize; j++) {
        sum += areaData[i - j].value
      }
      smaData.push({ time: areaData[i].time, value: sum / windowSize })
    }
    if (smaData.length > 0) {
      smaSeries.setData(smaData)
    }

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, isPositive])

  useEffect(() => {
    if (seriesRef.current && data.length > 0 && currentPrice) {
      const lastItem = data[data.length - 1]
      seriesRef.current.update({
        time: lastItem.time,
        value: currentPrice
      })

      if (smaSeriesRef.current) {
        const areaData = data.map(d => ({ time: d.time, value: d.close }))
        areaData[areaData.length - 1].value = currentPrice // update last point in memory
        
        const windowSize = Math.min(7, Math.floor(data.length / 3) || 1)
        if (areaData.length >= windowSize) {
          let sum = 0
          for (let j = 0; j < windowSize; j++) {
            sum += areaData[areaData.length - 1 - j].value
          }
          smaSeriesRef.current.update({
            time: lastItem.time,
            value: sum / windowSize
          })
        }
      }
    }
  }, [currentPrice, data])

  return <div ref={chartContainerRef} className="chart-canvas" />
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard') // 'market' | 'portfolio' | 'alerts'
  const [searchQuery, setSearchQuery] = useState('')
  const [chartTimeframe, setChartTimeframe] = useState('1M') // '1W', '1M', '3M', '1Y'
  const [skins, setSkins] = useState(() => {
    try {
      const stored = localStorage.getItem('skinstock_watchlist')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
      return []
    } catch {
      return []
    }
  })

  // Action Hub & Sheets State (Ported from iOS design)
  const [showActionHub, setShowActionHub] = useState(false)
  const [activeSheet, setActiveSheet] = useState(null) // 'watchlist' | 'achievements' | 'collections' | 'tradeup' | 'whatif' | 'arbitrage' | 'pricealerts'

  // Achievements State (Ported from AchievementService.swift)
  const [achievements, setAchievements] = useState(() => {
    try {
      const stored = localStorage.getItem('skinstock_achievements')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed]
          ACHIEVEMENT_DEFINITIONS.forEach(def => {
            if (!merged.some(a => a.id === def.id)) {
              merged.push({ ...def, isUnlocked: false, unlockedDate: null })
            }
          })
          return merged
        }
      }
    } catch (e) {
      console.error('Failed to load achievements', e)
    }
    return ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def, isUnlocked: false, unlockedDate: null }))
  })
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState(null)

  // Steam Median Prices cache for Arbitrage spreading
  const [steamMedianPrices, setSteamMedianPrices] = useState(() => {
    try {
      const stored = localStorage.getItem('skinstock_steam_median_prices')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return {}
  })

  // Selected Skin Detail Simulation State (Wear Simulator)
  const [selectedSkinFloat, setSelectedSkinFloat] = useState(0.15)

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Splash Screen States
  const [showSplash, setShowSplash] = useState(true)
  const [splashFadingOut, setSplashFadingOut] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Check if redirecting back from Steam OpenID login
    const params = new URLSearchParams(window.location.search);
    const claimedId = params.get('openid.claimed_id');
    if (claimedId) {
      const components = claimedId.split('/');
      const steamId = components[components.length - 1];
      if (steamId && steamId.length === 17) {
        localStorage.setItem('skinstock_steam_id', steamId);
        // Clean URL query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        setSteamIdInput(steamId);
        // Sign in anonymously to Firebase to allow firestore syncing if needed
        if (auth) {
          signInAnonymously(auth).catch(console.error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && minTimeElapsed) {
      setSplashFadingOut(true)
      const timer = setTimeout(() => {
        setShowSplash(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [authLoading, minTimeElapsed])



  useEffect(() => {
    localStorage.setItem('skinstock_watchlist', JSON.stringify(skins))
    if (user && db) {
      setDoc(doc(db, 'users', user.uid), { watchlist: skins }, { merge: true }).catch(console.error)
    }
  }, [skins, user])

  const [realInventoryItems, setRealInventoryItems] = useState(() => {
    try {
      const stored = localStorage.getItem('skinstock_real_inventory')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
      return defaultInventory
    } catch {
      return defaultInventory
    }
  })

  useEffect(() => {
    localStorage.setItem('skinstock_real_inventory', JSON.stringify(realInventoryItems))
    if (user && db) {
      setDoc(doc(db, 'users', user.uid), { inventory: realInventoryItems }, { merge: true }).catch(console.error)
    }
  }, [realInventoryItems, user])

  const [selectedSkinId, setSelectedSkinId] = useState(null)
  const [flashStates, setFlashStates] = useState({}) // skinId -> 'up' | 'down'
  
  // Real Steam Inventory state
  const [steamIdInput, setSteamIdInput] = useState(() => localStorage.getItem('skinstock_steam_id') || '')
  const [isFetchingInventory, setIsFetchingInventory] = useState(false)
  const [inventoryError, setInventoryError] = useState('')
  const [showManualImport, setShowManualImport] = useState(false)
  const [manualJson, setManualJson] = useState('')
  const [pricesDb, setPricesDb] = useState(null)
  const [, setLoadingPrices] = useState(false)
  
  // Display Modes
  const [currency, setCurrency] = useState('EUR') // 'EUR' | 'USD'
  const [valuationMode, setValuationMode] = useState('STEAM') // 'STEAM' | 'CASHOUT'
  
  // Alert states (Ported to local storage persistence)
  const [alerts, setAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem('skinstock_alerts')
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [alertType, setAlertType] = useState('above') // 'above' | 'below'
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    localStorage.setItem('skinstock_alerts', JSON.stringify(alerts))
  }, [alerts])

  useEffect(() => {
    localStorage.setItem('skinstock_steam_median_prices', JSON.stringify(steamMedianPrices))
  }, [steamMedianPrices])

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser && db) {
        try {
          const docRef = doc(db, 'users', currentUser.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            if (data.watchlist) setSkins(data.watchlist)
            if (data.inventory) setRealInventoryItems(data.inventory)
            if (data.steamId) {
              setSteamIdInput(data.steamId)
              localStorage.setItem('skinstock_steam_id', data.steamId)
            }
          } else {
            await setDoc(docRef, { watchlist: skins, inventory: realInventoryItems }, { merge: true })
          }
        } catch (e) {
          console.error("Firestore error:", e)
        }
      }
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])
  const fetchPricesDb = useCallback(async () => {
    if (pricesDb) return pricesDb
    setLoadingPrices(true)
    try {
      const res = await fetch('https://prices.csgotrader.app/latest/steam.json')
      const data = await res.json()
      setPricesDb(data)
      setLoadingPrices(false)
      return data
    } catch (err) {
      console.error('Failed to load prices database', err)
      setLoadingPrices(false)
      return null
    }
  }, [pricesDb])

  // Resolve SteamID64 from profile URL or numeric string
  const resolveSteamId = useCallback((input) => {
    const cleanInput = input.trim()
    const profileMatch = cleanInput.match(/profiles\/([0-9]{17})/)
    if (profileMatch) {
      return profileMatch[1]
    }
    if (/^[0-9]{17}$/.test(cleanInput)) {
      return cleanInput
    }
    return null
  }, [])

  // Parse Steam Inventory Data
  const parseSteamInventoryData = useCallback((data, prices) => {
    if (!data || !data.assets || !data.descriptions) {
      throw new Error('Ungültiges Steam-Inventar JSON (Fehlende Assets/Descriptions). Vergewissere dich, dass dein Profil öffentlich ist.')
    }

    const descMap = {}
    data.descriptions.forEach(d => {
      descMap[`${d.classid}_${d.instanceid}`] = d
    })

    const parsedItems = []
    const itemCounts = {}

    data.assets.forEach(asset => {
      const desc = descMap[`${asset.classid}_${asset.instanceid}`]
      if (desc && (asset.appid === 730 || desc.appid === 730)) {
        const hashName = desc.market_hash_name
        itemCounts[hashName] = (itemCounts[hashName] || 0) + 1
      }
    })

    const uniqueHashNames = Array.from(new Set(data.assets.map(asset => {
      const desc = descMap[`${asset.classid}_${asset.instanceid}`]
      return desc && (asset.appid === 730 || desc.appid === 730) ? desc.market_hash_name : null
    }).filter(Boolean)))

    uniqueHashNames.forEach(hashName => {
      const desc = data.descriptions.find(d => d.market_hash_name === hashName)
      if (!desc) return

      // Check if item is marketable/tradable via Steam API flags
      const isMarketable = desc.marketable === 1
      const isTradable = desc.tradable === 1

      const count = itemCounts[hashName] || 1
      
      let price = 0
      if (prices && prices[hashName]) {
        const itemPrices = prices[hashName]
        price = itemPrices.last_24h || itemPrices.last_7d || itemPrices.last_30d || itemPrices.last_90d || 0
      }
      
      if (!price) {
        const matchedInitial = INITIAL_SKINS.find(s => s.name === desc.name || hashName.includes(s.name))
        price = matchedInitial ? matchedInitial.price : (Math.random() * 45 + 5)
      }

      const wearTag = desc.tags?.find(t => t.category === 'Exterior')?.localized_tag_name || ''
      
      parsedItems.push({
        id: `real-${desc.classid}-${desc.instanceid}`,
        name: desc.name,
        marketHashName: hashName,
        wear: wearTag || desc.type || '',
        price: parseFloat(price.toFixed(2)),
        basePrice: parseFloat(price.toFixed(2)),
        prevPrice: parseFloat(price.toFixed(2)),
        change: 0,
        qty: count,
        marketable: isMarketable,
        tradable: isTradable,
        img: desc.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}/360fx360f` : ''
      })
    })

    // Sort: marketable items first, then non-marketable
    parsedItems.sort((a, b) => {
      if (a.marketable && !b.marketable) return -1
      if (!a.marketable && b.marketable) return 1
      return b.price * b.qty - a.price * a.qty
    })

    return parsedItems
  }, [])

  // Import inventory handler
  const handleImportInventory = useCallback(async (e) => {
    if (e) e.preventDefault()
    setInventoryError('')
    setIsFetchingInventory(true)
    playTradeSound('buy')

    const resolvedId = resolveSteamId(steamIdInput)
    if (!resolvedId) {
      setInventoryError('Bitte gib eine gültige 17-stellige SteamID64 (z.B. 7656119...) oder einen Profil-Link an.')
      setIsFetchingInventory(false)
      return
    }

    try {
      const prices = await fetchPricesDb()
      const steamUrl = `https://steamcommunity.com/inventory/${resolvedId}/730/2?l=german&count=1000`
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(steamUrl)}`
      
      const res = await fetch(proxyUrl)
      if (!res.ok) {
        throw new Error('Fehler beim Abrufen vom Steam-Server. Möglicherweise ist das Limit überschritten.')
      }
      
      const data = await res.json()
      const parsedItems = parseSteamInventoryData(data, prices)
      
      setRealInventoryItems(parsedItems)
      localStorage.setItem('skinstock_steam_id', resolvedId)
      localStorage.setItem('skinstock_real_inventory', JSON.stringify(parsedItems))
      
      if (parsedItems.length > 0) {
        setSelectedSkinId(parsedItems[0].id)
      }

      playTradeSound('buy')
    } catch (err) {
      console.error(err)
      setInventoryError(err.message || 'Abruf fehlgeschlagen. Vergewissere dich, dass dein Inventar öffentlich ist oder nutze das manuelle Einfügen.')
    } finally {
      setIsFetchingInventory(false)
    }
  }, [steamIdInput, resolveSteamId, fetchPricesDb, parseSteamInventoryData])

  // Manual import handler
  const handleManualImport = useCallback(async () => {
    try {
      setInventoryError('')
      const prices = await fetchPricesDb()
      const data = JSON.parse(manualJson)
      const parsedItems = parseSteamInventoryData(data, prices)
      
      setRealInventoryItems(parsedItems)
      localStorage.setItem('skinstock_real_inventory', JSON.stringify(parsedItems))
      
      if (parsedItems.length > 0) {
        setSelectedSkinId(parsedItems[0].id)
      }
      
      setShowManualImport(false)
      setManualJson('')
      playTradeSound('buy')
    } catch (err) {
      console.error(err)
      setInventoryError('Ungültiges JSON: ' + (err.message || 'Bitte kopiere das gesamte JSON von Steam.'))
    }
  }, [manualJson, parseSteamInventoryData, fetchPricesDb])

  // Disconnect inventory handler
  const handleDisconnectInventory = useCallback(() => {
    setRealInventoryItems([])
    localStorage.removeItem('skinstock_real_inventory')
    localStorage.removeItem('skinstock_steam_id')
    setSteamIdInput('')
    playTradeSound('sell')
  }, [])

  // Add item to watchlist
  const handleAddToWatchlist = useCallback((item) => {
    setSkins((prev) => {
      if (prev.some(s => s.id === item.id)) return prev
      const updated = [...prev, {
        id: item.id,
        name: item.name,
        marketHashName: item.marketHashName,
        wear: item.wear,
        price: item.price,
        basePrice: item.basePrice,
        prevPrice: item.prevPrice,
        change: item.change,
        img: item.img
      }]
      return updated
    })
    playTradeSound('buy')
  }, [])

  // Fresh prices fetch on mount for real inventory
  useEffect(() => {
    if (realInventoryItems.length > 0) {
      const timer = setTimeout(() => {
        fetchPricesDb().then(prices => {
          if (prices) {
            setRealInventoryItems(prev => {
              const updated = prev.map(item => {
                const hashName = item.marketHashName
                if (prices[hashName]) {
                  const itemPrices = prices[hashName]
                  const price = itemPrices.last_24h || itemPrices.last_7d || itemPrices.last_30d || itemPrices.last_90d || item.price
                  return {
                    ...item,
                    price: parseFloat(price.toFixed(2)),
                    basePrice: parseFloat(price.toFixed(2))
                  }
                }
                return item
              })
              localStorage.setItem('skinstock_real_inventory', JSON.stringify(updated))
              return updated
            })
          }
        })
      }, 0)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cache historical data for each skin
  const historicalDataMap = useMemo(() => {
    let days = 30;
    if (chartTimeframe === '1W') days = 7;
    else if (chartTimeframe === '3M') days = 90;
    else if (chartTimeframe === '1Y') days = 365;

    const map = {}
    INITIAL_SKINS.forEach((skin) => {
      map[skin.id] = generateHistoricalData(skin.basePrice, days)
    })
    realInventoryItems.forEach((skin) => {
      if (!map[skin.id]) map[skin.id] = generateHistoricalData(skin.basePrice, days)
    })
    skins.forEach((skin) => {
      if (!map[skin.id]) map[skin.id] = generateHistoricalData(skin.basePrice, days)
    })

    const totalPortfolioData = []
    if (realInventoryItems.length > 0) {
      for (let i = 0; i <= days; i++) {
        let close = 0, open = 0, high = 0, low = 0
        realInventoryItems.forEach(skin => {
          const hd = map[skin.id]
          if (hd && hd[i]) {
            close += hd[i].close; open += hd[i].open; high += hd[i].high; low += hd[i].low;
          }
        })
        const time = map[realInventoryItems[0].id]?.[i]?.time || ''
        if (time) totalPortfolioData.push({ time, close, open, high, low })
      }
    }

    const totalMarketData = []
    if (skins.length > 0) {
      for (let i = 0; i <= days; i++) {
        let close = 0, open = 0, high = 0, low = 0
        skins.forEach(skin => {
          const hd = map[skin.id]
          if (hd && hd[i]) {
            close += hd[i].close; open += hd[i].open; high += hd[i].high; low += hd[i].low;
          }
        })
        const time = map[skins[0].id]?.[i]?.time || ''
        if (time) totalMarketData.push({ time, close, open, high, low })
      }
    }

    map['total_portfolio'] = totalPortfolioData
    map['total_market'] = totalMarketData

    return map
  }, [realInventoryItems, skins, chartTimeframe])

  const filteredSkins = useMemo(() => {
    if (!searchQuery.trim()) return skins
    return skins.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [skins, searchQuery])

  const filteredPortfolio = useMemo(() => {
    if (!searchQuery.trim()) return realInventoryItems
    return realInventoryItems.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [realInventoryItems, searchQuery])

  const topMovers = useMemo(() => {
    const allItems = [...skins, ...realInventoryItems]
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values())
    const sorted = [...uniqueItems].sort((a, b) => b.change - a.change)
    const gainers = sorted.slice(0, 3).filter(s => s.change > 0)
    const losers = sorted.slice().reverse().slice(0, 3).filter(s => s.change < 0)
    return { gainers, losers }
  }, [skins, realInventoryItems])

  const selectedSkin = useMemo(() => {
    if (!selectedSkinId) {
      const items = activeTab === 'dashboard' ? realInventoryItems : skins
      if (!items || items.length === 0) {
        return {
          id: 'total',
          name: activeTab === 'dashboard' ? 'Gesamtportfolio' : 'Watchlist Gesamt',
          price: 0,
          basePrice: 0,
          prevPrice: 0,
          change: 0,
          wear: '',
          qty: 0,
          img: ''
        }
      }
      
      let totalPrice = 0
      let totalPrevPrice = 0
      items.forEach(s => {
        totalPrice += (s.price || 0) * (s.qty || 1)
        totalPrevPrice += (s.prevPrice || 0) * (s.qty || 1)
      })
      const change = totalPrevPrice === 0 ? 0 : ((totalPrice - totalPrevPrice) / totalPrevPrice) * 100

      return {
        id: 'total',
        name: activeTab === 'dashboard' ? 'Gesamtportfolio' : 'Watchlist Gesamt',
        price: totalPrice,
        basePrice: totalPrevPrice, // fallback
        prevPrice: totalPrevPrice,
        change: change,
        wear: '',
        qty: items.reduce((acc, item) => acc + (item.qty || 1), 0),
        img: ''
      }
    }

    let found = null
    if (selectedSkinId.startsWith('real-')) {
      found = realInventoryItems.find((s) => s.id === selectedSkinId)
    } else {
      found = skins.find((s) => s.id === selectedSkinId)
    }
    return found || {
      id: 'none',
      name: lang === 'de' ? 'Kein Item ausgewählt' : 'No Item Selected',
      price: 0,
      basePrice: 0,
      prevPrice: 0,
      change: 0,
      wear: '',
      qty: 0,
      img: ''
    }
  }, [skins, selectedSkinId, realInventoryItems, activeTab])

  const unlockAchievement = useCallback((id) => {
    setAchievements(prev => {
      const idx = prev.findIndex(a => a.id === id)
      if (idx !== -1 && !prev[idx].isUnlocked) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], isUnlocked: true, unlockedDate: new Date().toISOString() }
        setNewlyUnlockedAchievement(updated[idx])
        localStorage.setItem('skinstock_achievements', JSON.stringify(updated))
        
        // Auto-dismiss achievement toast after 3s
        setTimeout(() => {
          setNewlyUnlockedAchievement(null)
        }, 3000)
        return updated
      }
      return prev
    })
  }, [])

  const realInventorySummary = useMemo(() => {
    let holdingsValue = 0
    let totalInvested = 0
    let marketableValue = 0
    let nonMarketableCount = 0
    
    let distKnives = 0;
    let distGloves = 0;
    let distCases = 0;
    let distWeapons = 0;

    realInventoryItems.forEach((item) => {
      const itemVal = (item.price || 0) * item.qty
      holdingsValue += itemVal
      totalInvested += (item.basePrice || 0) * item.qty
      if (item.marketable !== false) {
        marketableValue += itemVal
      } else {
        nonMarketableCount += item.qty
      }
      
      const n = item.name.toLowerCase();
      if (n.includes('★') && !n.includes('glove') && !n.includes('handschuhe') && !n.includes('wrap')) {
        distKnives += itemVal;
      } else if ((n.includes('★') && (n.includes('glove') || n.includes('handschuhe') || n.includes('wrap'))) || n.includes('bloodhound') || n.includes('hand wraps')) {
        distGloves += itemVal;
      } else if (n.includes('case') || n.includes('kiste') || n.includes('container') || n.includes('capsule')) {
        distCases += itemVal;
      } else {
        distWeapons += itemVal;
      }
    })

    const pnlVal = parseFloat((holdingsValue - totalInvested).toFixed(2))
    const pnlPct = totalInvested === 0 ? 0 : parseFloat((pnlVal / totalInvested * 100).toFixed(2))

    return {
      totalValue: parseFloat(holdingsValue.toFixed(2)),
      marketableValue: parseFloat(marketableValue.toFixed(2)),
      nonMarketableCount,
      pnlVal,
      pnlPct,
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      distribution: {
        knives: distKnives,
        gloves: distGloves,
        cases: distCases,
        weapons: distWeapons
      }
    }
  }, [realInventoryItems])

  const evaluateAchievements = useCallback((inventoryList, totalValue, watchlistCount) => {
    if (totalValue >= 100) unlockAchievement('portfolio_100')
    if (totalValue >= 500) unlockAchievement('portfolio_500')
    if (totalValue >= 1000) unlockAchievement('portfolio_1000')
    if (totalValue >= 5000) unlockAchievement('portfolio_5000')
    if (totalValue >= 10000) unlockAchievement('portfolio_10000')
    
    if (inventoryList.length >= 5) unlockAchievement('items_5')
    if (inventoryList.length >= 25) unlockAchievement('items_25')
    if (inventoryList.length >= 50) unlockAchievement('items_50')
    if (inventoryList.length >= 100) unlockAchievement('items_100')
    
    const hasKnife = inventoryList.some(item => {
      const n = item.name.toLowerCase()
      return n.includes('★') && !n.includes('glove') && !n.includes('handschuhe') && !n.includes('wrap')
    })
    const hasGloves = inventoryList.some(item => {
      const n = item.name.toLowerCase()
      return (n.includes('★') && (n.includes('glove') || n.includes('handschuhe') || n.includes('wrap'))) || n.includes('bloodhound') || n.includes('hand wraps')
    })
    if (hasKnife) unlockAchievement('first_knife')
    if (hasGloves) unlockAchievement('first_gloves')
    
    const hasStickerKing = inventoryList.some(item => item.stickers && item.stickers.length >= 4)
    if (hasStickerKing) unlockAchievement('sticker_king')
    
    const rarities = new Set(inventoryList.map(item => getSkinRarity(item.name)))
    if (rarities.size >= 5) unlockAchievement('diversified')
    
    if (watchlistCount > 0) unlockAchievement('watchlist_add')
    
    unlockAchievement('first_login')
  }, [unlockAchievement])

  useEffect(() => {
    if (realInventoryItems) {
      evaluateAchievements(realInventoryItems, realInventorySummary.totalValue, skins.length)
    }
  }, [realInventoryItems, realInventorySummary.totalValue, skins.length, evaluateAchievements])

  const fetchSteamMedianPrice = useCallback(async (hashName) => {
    try {
      const encoded = encodeURIComponent(hashName)
      const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=${encoded}`
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      
      const res = await fetch(proxyUrl)
      if (!res.ok) throw new Error('Steam error')
      const json = await res.json()
      if (json && json.median_price) {
        const medianStr = json.median_price
        const cleaned = medianStr
          .replace('€', '')
          .replace('$', '')
          .replace(',', '.')
          .replace('--', '0')
          .trim()
        const price = parseFloat(cleaned)
        if (!isNaN(price)) {
          setSteamMedianPrices(prev => ({ ...prev, [hashName]: price }))
          return price
        }
      }
    } catch (e) {
      console.warn('Failed to fetch Steam price overview, using simulated fallback', e)
      const basePrice = pricesDb && pricesDb[hashName] 
        ? (pricesDb[hashName].last_24h || pricesDb[hashName].last_7d || 15)
        : 15
      const randomSpread = 0.05 + Math.random() * 0.15
      const simulatedPrice = basePrice * (1 + randomSpread)
      setSteamMedianPrices(prev => ({ ...prev, [hashName]: parseFloat(simulatedPrice.toFixed(2)) }))
      return simulatedPrice
    }
  }, [pricesDb])

  // Selected skin float & wear simulator details helper
  const getWearNameFromFloat = (f) => {
    if (f < 0.07) return 'Factory New'
    if (f < 0.15) return 'Minimal Wear'
    if (f < 0.38) return 'Field-Tested'
    if (f < 0.45) return 'Well-Worn'
    return 'Battle-Scarred'
  }

  const getSimulatedPrice = useCallback((skin, floatVal) => {
    if (!skin || skin.id === 'total' || skin.id === 'none') return 0
    const wearName = getWearNameFromFloat(floatVal)
    const cleanName = skin.name.split(' (')[0]
    const fullHashName = `${cleanName} (${wearName})`
    let price = 0
    if (pricesDb && pricesDb[fullHashName]) {
      const itemPrices = pricesDb[fullHashName]
      price = itemPrices.last_24h || itemPrices.last_7d || itemPrices.last_30d || 0
    }
    if (!price && skin.basePrice) {
      price = skin.basePrice
    }
    return price || 15.0
  }, [pricesDb])

  // Synchronize float value when a skin is selected
  useEffect(() => {
    if (selectedSkinId) {
      const current = selectedSkinId.startsWith('real-')
        ? realInventoryItems.find(s => s.id === selectedSkinId)
        : skins.find(s => s.id === selectedSkinId)
      if (current) {
        setSelectedSkinFloat(current.float !== undefined && current.float !== null ? current.float : 0.15)
      }
    }
  }, [selectedSkinId, skins, realInventoryItems])

  const playAlertSoundNotification = useCallback((skinName, type, target, currentPrice) => {
    playTradeSound('alert')
    const id = Date.now() + Math.random()
    const msg = type === 'above' 
      ? `Stieg über €${target.toFixed(2)} (Aktuell: €${currentPrice.toFixed(2)})`
      : `Fiel unter €${target.toFixed(2)} (Aktuell: €${currentPrice.toFixed(2)})`
    
    setToasts((prev) => [...prev, { id, skinName, msg }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const checkPriceAlerts = useCallback((skinId, price, skinName) => {
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
  }, [playAlertSoundNotification])

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

      setRealInventoryItems((prevItems) => {
        const updated = prevItems.map((skin) => {
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
        localStorage.setItem('skinstock_real_inventory', JSON.stringify(updated))
        return updated
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [checkPriceAlerts])

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



  const [hasFiredConfetti, setHasFiredConfetti] = useState(false)
  useEffect(() => {
    if (!hasFiredConfetti && realInventorySummary.pnlVal > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00d182', '#ffffff']
      })
      setHasFiredConfetti(true)
    }
  }, [realInventorySummary.pnlVal, hasFiredConfetti])

  const portfolioPnL = useMemo(() => {
    const data = historicalDataMap['total_portfolio'] || []
    const pnl = {
      pnl24hVal: 0, pnl24hPct: 0,
      pnl7dVal: 0, pnl7dPct: 0
    }
    if (data.length > 0) {
      const current = realInventorySummary.totalValue
      if (data.length >= 2) {
        const past24h = data[data.length - 2].close
        pnl.pnl24hVal = current - past24h
        pnl.pnl24hPct = past24h > 0 ? (pnl.pnl24hVal / past24h) * 100 : 0
      }
      if (data.length >= 8) {
        const past7d = data[data.length - 8].close
        pnl.pnl7dVal = current - past7d
        pnl.pnl7dPct = past7d > 0 ? (pnl.pnl7dVal / past7d) * 100 : 0
      } else if (data.length > 2) {
        const past7d = data[0].close
        pnl.pnl7dVal = current - past7d
        pnl.pnl7dPct = past7d > 0 ? (pnl.pnl7dVal / past7d) * 100 : 0
      }
    }
    return pnl
  }, [historicalDataMap, realInventorySummary.totalValue])

  const globalMarketTrends = useMemo(() => {
    if (!pricesDb) return { gainers: [], losers: [] }
    const items = []
    Object.keys(pricesDb).forEach(name => {
      const p = pricesDb[name]
      if (p && p.last_24h > 5 && p.last_7d > 5) {
        const changePct = ((p.last_24h - p.last_7d) / p.last_7d) * 100
        if (Math.abs(changePct) < 200 && Math.abs(changePct) > 0) {
          items.push({ name, price: p.last_24h, change: changePct })
        }
      }
    })
    items.sort((a, b) => b.change - a.change)
    return {
      gainers: items.slice(0, 5),
      losers: items.slice(-5).reverse()
    }
  }, [pricesDb])

  // Technical Analysis & Simulated Order Book
  const simulatedOrderBook = useMemo(() => {
    if (!selectedSkin || selectedSkin.price <= 0) return { bids: [], asks: [] }
    const bids = []
    const asks = []
    const price = selectedSkin.price
    
    for (let i = 1; i <= 5; i++) {
      const askDiff = 0.001 * i * price
      const askPrice = price + askDiff
      const askQty = Math.floor(((price * i * 7) % 19) + 1)
      asks.push({ price: parseFloat(askPrice.toFixed(2)), qty: askQty })
      
      const bidDiff = 0.001 * i * price
      const bidPrice = price - bidDiff
      const bidQty = Math.floor(((price * i * 13) % 23) + 1)
      bids.push({ price: parseFloat(bidPrice.toFixed(2)), qty: bidQty })
    }
    
    asks.reverse()
    return { bids, asks }
  }, [selectedSkin])

  const selectedSkinSma = useMemo(() => {
    const dataKey = selectedSkinId || (activeTab === 'dashboard' ? 'total_portfolio' : 'total_market')
    const histData = historicalDataMap[dataKey] || []
    if (histData.length === 0) return 0
    const windowSize = Math.min(7, histData.length)
    let sum = 0
    const prices = histData.map(d => d.close)
    if (prices.length > 0) {
      prices[prices.length - 1] = selectedSkin.price
    }
    const count = Math.min(windowSize, prices.length)
    for (let i = 0; i < count; i++) {
      sum += prices[prices.length - 1 - i]
    }
    return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0
  }, [historicalDataMap, selectedSkinId, selectedSkin.price, activeTab])

  const selectedSkinRsi = useMemo(() => {
    const change = selectedSkin.change || 0
    const baseRsi = 50 + change * 4
    return Math.min(95, Math.max(5, Math.round(baseRsi)))
  }, [selectedSkin.change])

  const selectedSkinSignal = useMemo(() => {
    if (!selectedSkinSma) return 'HOLD'
    const ratio = selectedSkin.price / selectedSkinSma
    if (ratio > 1.005) return 'BUY'
    if (ratio < 0.995) return 'SELL'
    return 'HOLD'
  }, [selectedSkin.price, selectedSkinSma])

  // Advanced Analytics for the Analytics Tab
  const averageVolatility = useMemo(() => {
    if (realInventoryItems.length === 0) return 0
    let totalValue = 0
    let weightedVolSum = 0
    
    realInventoryItems.forEach(item => {
      const hist = historicalDataMap[item.id] || []
      if (hist.length > 0) {
        const highs = hist.map(h => h.high)
        const lows = hist.map(l => l.low)
        const maxHigh = Math.max(...highs)
        const minLow = Math.min(...lows)
        const vol = minLow > 0 ? ((maxHigh - minLow) / minLow * 100) : 0
        const itemVal = (item.price || 0) * item.qty
        weightedVolSum += vol * itemVal
        totalValue += itemVal
      }
    })
    
    return totalValue > 0 ? parseFloat((weightedVolSum / totalValue).toFixed(2)) : 0
  }, [realInventoryItems, historicalDataMap])

  const riskScore = useMemo(() => {
    if (realInventoryItems.length === 0) return { score: 0, label: 'N/A' }
    let totalValue = 0
    let weightedRiskSum = 0
    
    realInventoryItems.forEach(item => {
      const itemVal = (item.price || 0) * item.qty
      const n = item.name.toLowerCase()
      let itemRisk = 5
      if (n.includes('★') && !n.includes('glove') && !n.includes('handschuhe') && !n.includes('wrap')) {
        itemRisk = 3
      } else if ((n.includes('★') && (n.includes('glove') || n.includes('handschuhe') || n.includes('wrap'))) || n.includes('bloodhound') || n.includes('hand wraps')) {
        itemRisk = 3
      } else if (n.includes('case') || n.includes('kiste') || n.includes('container') || n.includes('capsule')) {
        itemRisk = 8
      }
      
      weightedRiskSum += itemRisk * itemVal
      totalValue += itemVal
    })
    
    if (totalValue === 0) return { score: 0, label: 'N/A' }
    const score = parseFloat((weightedRiskSum / totalValue).toFixed(1))
    let label = lang === 'de' ? 'Ausgewogen' : 'Balanced'
    if (score < 4.5) label = lang === 'de' ? 'Konservativ' : 'Conservative'
    else if (score > 6.5) label = lang === 'de' ? 'Spekulativ' : 'Speculative'
    
    return { score, label }
  }, [realInventoryItems])

  const profitDistribution = useMemo(() => {
    let win = 0
    let breakEven = 0
    let loss = 0
    
    realInventoryItems.forEach(item => {
      const netPrice = (item.price || 0) * 0.85
      if (item.price > item.basePrice && netPrice < item.basePrice) {
        breakEven += item.qty
      } else if (netPrice >= item.basePrice) {
        win += item.qty
      } else {
        loss += item.qty
      }
    })
    
    return { win, breakEven, loss }
  }, [realInventoryItems])

  const performers = useMemo(() => {
    if (realInventoryItems.length === 0) return { best: [], worst: [] }
    const sorted = [...realInventoryItems].sort((a, b) => b.change - a.change)
    return {
      best: sorted.slice(0, 3).filter(item => item.change > 0),
      worst: sorted.slice().reverse().slice(0, 3).filter(item => item.change < 0)
    }
  }, [realInventoryItems])

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout failed", error);
      }
    }
  };

  // If splash is showing and auth is still loading, just render splash screen
  if (showSplash && authLoading) {
    return (
      <div className={`splash-overlay ${splashFadingOut ? 'fade-out' : ''}`}>
        <div className="splash-container">
          <div className="splash-logo-wrapper">
            <div className="splash-logo-glow" />
            <img src="/logo.png" alt="SkinStock Logo" className="splash-logo" />
          </div>
          <div className="splash-text-group">
            <h1 className="splash-title">SkinStock</h1>
            <p className="splash-subtitle">CS2 Market Ticker</p>
          </div>
          <div className="splash-loader-wrapper">
            <div className="splash-loader-ring" />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!user || !steamIdInput) {
      return (
        <Onboarding 
          user={user} 
          setSteamIdInput={setSteamIdInput} 
          currency={currency}
          setCurrency={setCurrency}
          valuationMode={valuationMode}
          setValuationMode={setValuationMode}
        />
      );
    }
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

      <aside className="app-sidebar glass-panel">
        <div className="sidebar-logo">
          <Activity className="logo-icon" size={24} />
          <span className="logo-text">SkinStock</span>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart2 size={20} />
            <span>{lang === 'de' ? 'Übersicht' : 'Overview'}</span>
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={20} />
            <span>{lang === 'de' ? 'Analysen' : 'Analytics'}</span>
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Wallet size={20} />
            <span>{lang === 'de' ? 'Inventar' : 'Inventory'}</span>
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <LogOut size={20} />
            <span>{lang === 'de' ? 'Einstellungen' : 'Settings'}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {realInventoryItems.length > 0 ? (
            <div className="sidebar-balance">
              <span className="balance-label">{lang === 'de' ? 'Inventarwert' : 'Inventory Value'}</span>
              <span className="balance-amount">{formatPrice(realInventorySummary.totalValue, currency, valuationMode)}</span>
            </div>
          ) : (
            <div className="sidebar-status-tag">
              {lang === 'de' ? 'Nicht verbunden' : 'Not Connected'}
            </div>
          )}
        </div>
      </aside>

      <div className="app-main-wrapper">
        <header className="app-header">
          <div className="logo-group">
            <Activity className="logo-icon" size={24} />
            <h1 className="logo-text">SkinStock</h1>
          </div>
          <div className="balance-card">
            {realInventoryItems.length > 0 ? (
              <>
                <span className="balance-label">{lang === 'de' ? 'Inventarwert' : 'Inventory Value'}</span>
                <span className="balance-amount">{formatPrice(realInventorySummary.totalValue, currency, valuationMode)}</span>
              </>
            ) : (
              <>
                <span className="balance-label">{lang === 'de' ? 'Status' : 'Status'}</span>
                <span className="balance-amount" style={{ color: 'var(--color-red)', textShadow: 'none', fontSize: '13px', fontWeight: '600' }}>
                  {lang === 'de' ? 'Nicht verbunden' : 'Not Connected'}
                </span>
              </>
            )}
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button 
              className="mode-toggle-btn"
              onClick={() => setCurrency(c => c === 'EUR' ? 'USD' : 'EUR')}
            >
              {currency}
            </button>
            <button 
              className={`mode-toggle-btn ${valuationMode === 'CASHOUT' ? 'active-cashout' : ''}`}
              onClick={() => setValuationMode(m => m === 'STEAM' ? 'CASHOUT' : 'STEAM')}
            >
              {valuationMode === 'STEAM' ? 'Steam' : 'Cashout'}
            </button>
          </div>
        </header>

        <main className="app-content scrollbar-hide">
          {activeTab === 'dashboard' && (
            <div className="dashboard-view layout-split">
              <div className="layout-main">
                <div className="chart-card">
                  <div className="chart-header-tr">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="chart-title-tr">{lang === 'de' ? 'Gesamtportfolio' : 'Total Portfolio'}</h3>
                        <div className="chart-price-tr">{formatPrice(realInventorySummary.totalValue, currency, valuationMode)}</div>
                        <div className={`chart-change-tr ${realInventorySummary.pnlPct >= 0 ? 'price-up' : 'price-down'}`}>
                          {realInventorySummary.pnlPct >= 0 ? '+' : ''}{realInventorySummary.pnlPct.toFixed(2)}% {lang === 'de' ? 'Heute' : 'Today'}
                        </div>
                      </div>
                      <div className="timeframe-nav" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
                        {['1W', '1M', '3M', '1Y'].map(tf => (
                          <button 
                            key={tf} 
                            className={`timeframe-btn ${chartTimeframe === tf ? 'active' : ''}`}
                            onClick={() => setChartTimeframe(tf)}
                            style={{
                              background: chartTimeframe === tf ? 'rgba(255,255,255,0.1)' : 'transparent',
                              color: chartTimeframe === tf ? '#fff' : '#94a3b8',
                              border: 'none',
                              padding: '4px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: chartTimeframe === tf ? '600' : '400'
                            }}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="chart-body-container">
                    <SkinChart 
                      data={historicalDataMap['total_portfolio'] || []} 
                      currentPrice={realInventorySummary.totalValue} 
                      isPositive={realInventorySummary.pnlPct >= 0}
                    />
                  </div>
                </div>

                {realInventoryItems.length > 0 && (
                  <div className="dashboard-widgets" style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#fff' }}>
                        {lang === 'de' ? 'Kategorien' : 'Categories'}
                      </h4>
                      <DiversificationChart data={[
                        { name: lang === 'de' ? 'Messer' : 'Knives', val: realInventorySummary.distribution.knives, color: '#ff3b30', pct: realInventorySummary.totalValue ? (realInventorySummary.distribution.knives / realInventorySummary.totalValue) * 100 : 0 },
                        { name: lang === 'de' ? 'Handschuhe' : 'Gloves', val: realInventorySummary.distribution.gloves, color: '#ff9500', pct: realInventorySummary.totalValue ? (realInventorySummary.distribution.gloves / realInventorySummary.totalValue) * 100 : 0 },
                        { name: lang === 'de' ? 'Kisten' : 'Cases', val: realInventorySummary.distribution.cases, color: '#ffcc00', pct: realInventorySummary.totalValue ? (realInventorySummary.distribution.cases / realInventorySummary.totalValue) * 100 : 0 },
                        { name: lang === 'de' ? 'Waffen' : 'Weapons', val: realInventorySummary.distribution.weapons, color: '#00d182', pct: realInventorySummary.totalValue ? (realInventorySummary.distribution.weapons / realInventorySummary.totalValue) * 100 : 0 }
                      ]} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-view" style={{ padding: '0 16px', paddingBottom: '120px' }}>
              <div className="section-header" style={{ marginTop: '16px' }}>
                <h2 className="section-title">{lang === 'de' ? 'Erweiterte Analysen' : 'Advanced Analytics'}</h2>
              </div>
              
              <div className="dashboard-widgets" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="portfolio-summary" style={{ padding: '20px', marginBottom: '0' }}>
                  <div className="stat-label-tr">{lang === 'de' ? 'Risikoprofil' : 'Risk Profile'}</div>
                  <div className="stat-value-tr" style={{ fontSize: '24px', color: riskScore.score > 6.5 ? 'var(--color-red)' : riskScore.score < 4.5 ? 'var(--color-green)' : 'var(--color-amber)' }}>
                    {riskScore.label}
                  </div>
                  <div className="stat-change-tr" style={{ color: 'var(--text-secondary)' }}>Score: {riskScore.score}/10</div>
                </div>
                
                <div className="portfolio-summary" style={{ padding: '20px', marginBottom: '0' }}>
                  <div className="stat-label-tr">{lang === 'de' ? 'Ø Volatilität' : 'Avg Volatility'}</div>
                  <div className="stat-value-tr" style={{ fontSize: '24px' }}>
                    {averageVolatility}%
                  </div>
                  <div className="stat-change-tr" style={{ color: 'var(--text-secondary)' }}>{lang === 'de' ? 'Historische Schwankung' : 'Historical fluctuation'}</div>
                </div>
              </div>

              <div className="portfolio-summary" style={{ alignItems: 'stretch' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>{lang === 'de' ? 'Gewinn- & Verlustverteilung' : 'Profit & Loss Distribution'}</h3>
                <div style={{ display: 'flex', width: '100%', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: `${(profitDistribution.win / (profitDistribution.win + profitDistribution.loss + profitDistribution.breakEven || 1)) * 100}%`, background: 'var(--color-green)' }} />
                  <div style={{ width: `${(profitDistribution.breakEven / (profitDistribution.win + profitDistribution.loss + profitDistribution.breakEven || 1)) * 100}%`, background: 'var(--color-amber)' }} />
                  <div style={{ width: `${(profitDistribution.loss / (profitDistribution.win + profitDistribution.loss + profitDistribution.breakEven || 1)) * 100}%`, background: 'var(--color-red)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-green)' }}/> Profit</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-amber)' }}/> Break-even</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-red)' }}/> Loss</div>
                </div>
              </div>

              <div className="dashboard-widgets" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="portfolio-summary" style={{ flex: '1 1 300px', alignItems: 'stretch' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>{lang === 'de' ? 'Top Performer (Inventar)' : 'Top Performers (Inv)'}</h3>
                  {performers.best.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{item.name}</div>
                      <div className="price-up">+{item.change.toFixed(1)}%</div>
                    </div>
                  ))}
                  {performers.best.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>-</div>}
                </div>

                <div className="portfolio-summary" style={{ flex: '1 1 300px', alignItems: 'stretch' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>{lang === 'de' ? 'Flops (Inventar)' : 'Underperformers (Inv)'}</h3>
                  {performers.worst.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{item.name}</div>
                      <div className="price-down">{item.change.toFixed(1)}%</div>
                    </div>
                  ))}
                  {performers.worst.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>-</div>}
                </div>
              </div>

              <div className="portfolio-summary" style={{ alignItems: 'stretch' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>{lang === 'de' ? 'Globale Markttrends' : 'Global Market Trends'}</h3>
                <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trending Up 🚀</div>
                    {globalMarketTrends.gainers.map((item, idx) => (
                      <div key={`g-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', background: 'rgba(52, 211, 153, 0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.name}</div>
                        <div className="price-up">+{item.change.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trending Down 📉</div>
                    {globalMarketTrends.losers.map((item, idx) => (
                      <div key={`l-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', background: 'rgba(255, 69, 58, 0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.name}</div>
                        <div className="price-down">{item.change.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="inventory-view">
              <div className="inventory-header">
                <div className="search-bar">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder={lang === 'de' ? 'Skins suchen...' : 'Search skins...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="inventory-grid">
                {filteredPortfolio.length === 0 ? (
                  <div className="empty-state">
                    <Activity size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p>{lang === 'de' ? 'Keine Skins gefunden.' : 'No skins found.'}</p>
                  </div>
                ) : (
                  filteredPortfolio.map((item) => {
                    const price = formatPrice(item.price, currency, valuationMode);
                    return (
                      <div key={item.id} className={`skin-card ${getRarityClass(item.price)}`} onClick={() => setSelectedSkinId(item.id)}>
                        <div className="skin-card-image">
                          <img src={item.img} alt={item.name} />
                          {item.qty > 1 && <div className="skin-card-qty">x{item.qty}</div>}
                        </div>
                        <div className="skin-card-details">
                          <div className="skin-card-name" title={item.name}>{item.name}</div>
                          <div className="skin-card-price">{price}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-view" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
              <h2>{lang === 'de' ? 'Einstellungen' : 'Settings'}</h2>
              
              <div className="settings-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                <h3 style={{ marginBottom: '16px' }}>{lang === 'de' ? 'Steam Inventar' : 'Steam Inventory'}</h3>
                {realInventoryItems.length > 0 ? (
                  <div>
                    <p style={{ marginBottom: '16px', color: '#94a3b8' }}>
                      {lang === 'de' ? 'Dein Inventar ist verbunden.' : 'Your inventory is connected.'}
                    </p>
                    <button onClick={handleDisconnectInventory} className="steam-import-btn" style={{ background: 'rgba(255,59,48,0.2)', color: '#ff3b30' }}>
                      {lang === 'de' ? 'Verbindung trennen' : 'Disconnect'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleImportInventory} className="steam-input-form">
                    <div className="steam-input-wrapper">
                      <input
                        type="text"
                        className="steam-input"
                        placeholder={lang === 'de' ? 'SteamID64 eingeben' : 'Enter SteamID64'}
                        value={steamIdInput}
                        onChange={(e) => setSteamIdInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="steam-import-btn" disabled={isFetchingInventory}>
                      {isFetchingInventory ? 'Loading...' : 'Import'}
                    </button>
                  </form>
                )}
              </div>

              {user && (
                <div className="settings-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                  <h3 style={{ marginBottom: '16px' }}>Account</h3>
                  <button onClick={handleLogout} className="steam-import-btn" style={{ background: 'rgba(255,59,48,0.2)', color: '#ff3b30' }}>
                    <LogOut size={16} style={{ display: 'inline', marginRight: '8px' }}/>
                    {lang === 'de' ? 'Abmelden' : 'Log Out'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <nav className="tab-bar">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart2 size={24} />
            <span className="tab-label">{lang === 'de' ? 'Übersicht' : 'Overview'}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={24} />
            <span className="tab-label">{lang === 'de' ? 'Analysen' : 'Analytics'}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Wallet size={24} />
            <span className="tab-label">{lang === 'de' ? 'Inventar' : 'Inventory'}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <LogOut size={24} />
            <span className="tab-label">{lang === 'de' ? 'Einstellungen' : 'Settings'}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

  // --- SUB-COMPONENTS FOR SHEETS (Proper React components to support state/hooks) ---

  const WatchlistSheet = ({ filteredSkins, currency, valuationMode, setSkins, playTradeSound, setSelectedSkinId, formatPrice }) => {
    return (
      <div className="sheet-content">
        <div className="inventory-grid" style={{ padding: 0 }}>
          {filteredSkins.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '60px', textAlign: 'center', width: '100%' }}>
              <Eye size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>Keine Skins auf der Watchlist.</p>
            </div>
          ) : (
            filteredSkins.map((item) => {
              const price = formatPrice(item.price, currency, valuationMode);
              return (
                <div key={item.id} className={`skin-card ${getRarityClass(item.price)}`} onClick={() => setSelectedSkinId(item.id)}>
                  <div className="skin-card-image">
                    <img src={item.img} alt={item.name} />
                  </div>
                  <div className="skin-card-details">
                    <div className="skin-card-name" title={item.name}>{item.name}</div>
                    <div className="skin-card-price" style={{ color: 'var(--color-green)' }}>{price}</div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSkins(prev => prev.filter(s => s.id !== item.id));
                      playTradeSound('sell');
                    }}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,59,48,0.2)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3b30', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const AchievementsSheet = ({ achievements }) => {
    const unlocked = achievements.filter(a => a.isUnlocked).length;
    const total = achievements.length;
    const progress = total > 0 ? (unlocked / total) * 100 : 0;

    return (
      <div className="sheet-content scrollbar-hide">
        <div className="achievements-progress-wrapper">
          <div className="achievements-circle-ring">
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
              <circle cx="50" cy="50" r="42" stroke="url(#goldGradient)" strokeWidth="6" fill="transparent" 
                strokeDasharray={`${2 * Math.PI * 42}`} 
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`} 
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{unlocked}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>/ {total}</span>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#ffd700', fontWeight: 'bold', textShadow: '0 0 8px rgba(255,215,0,0.2)' }}>
            {progress.toFixed(0)}% Freigeschaltet
          </div>
        </div>

        <div className="achievements-list">
          {achievements.map((achievement) => {
            return (
              <div key={achievement.id} className={`achievement-row ${achievement.isUnlocked ? 'unlocked' : ''}`}>
                <div className="achievement-icon-circle">
                  {achievement.isUnlocked ? <Crown size={18} /> : <Shield size={18} style={{ opacity: 0.3 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: achievement.isUnlocked ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    {achievement.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    {achievement.description}
                  </div>
                </div>
                {achievement.isUnlocked ? (
                  <CheckCircle2 size={18} color="#FFD700" />
                ) : (
                  <AlertCircle size={18} style={{ opacity: 0.2 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const CollectionsSheet = ({ realInventoryItems, currency, valuationMode, formatPrice, setSelectedSkinId }) => {
    const grouped = {};
    realInventoryItems.forEach((item) => {
      const colName = findCollectionForSkin(item.name);
      if (colName) {
        if (!grouped[colName]) grouped[colName] = [];
        grouped[colName].push(item);
      }
    });

    const collectionList = Object.keys(grouped).map(name => ({
      name,
      items: grouped[name]
    })).sort((a, b) => b.items.length - a.items.length);

    return (
      <div className="sheet-content scrollbar-hide">
        {collectionList.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '60px', textAlign: 'center' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>Keine Sammlungs-Skins im Inventar gefunden.</p>
          </div>
        ) : (
          collectionList.map((col) => {
            const totalValue = col.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            return (
              <div key={col.name} className="collection-card">
                <div className="collection-card-header">
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>{col.name}</h4>
                  <span className="collection-card-badge">{col.items.length} Items</span>
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                  Wert: {formatPrice(totalValue, currency, valuationMode)}
                </div>
                
                <div className="collection-items-mini-grid">
                  {col.items.map((item, idx) => {
                    const rarityName = getSkinRarity(item.name);
                    return (
                      <div 
                        key={`${item.id}-${idx}`} 
                        className={`collection-mini-item rarity-glow-${rarityName.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                        onClick={() => setSelectedSkinId(item.id)}
                        style={{ cursor: 'pointer' }}
                        title={item.name}
                      >
                        <img src={item.img} alt={item.name} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const TradeUpSheet = ({ realInventoryItems, pricesDb, currency, formatPrice, unlockAchievement }) => {
    const [selectedTradeUpIds, setSelectedTradeUpIds] = useState([]);
    const [simResult, setSimResult] = useState(null);
    const [simPnL, setSimPnL] = useState(0);
    const [showSimResultModal, setShowSimResultModal] = useState(false);

    const tradeUpEligible = realInventoryItems.filter(item => {
      const cat = item.skinCategory;
      const rarity = getSkinRarity(item.name);
      return cat !== 'Knife' && cat !== 'Gloves' && cat !== 'Container' && rarity !== 'Covert' && rarity !== 'Contraband';
    });

    const selectedItems = realInventoryItems.filter(item => selectedTradeUpIds.includes(item.id));
    const firstSelected = selectedItems[0];

    const eligibleFiltered = tradeUpEligible.filter(item => {
      if (firstSelected) {
        const firstRarity = getSkinRarity(firstSelected.name);
        const itemRarity = getSkinRarity(item.name);
        return itemRarity === firstRarity && !selectedTradeUpIds.includes(item.id);
      }
      return true;
    });

    const runTradeUpSim = () => {
      if (selectedItems.length !== 10) return;
      
      const currentRarity = getSkinRarity(firstSelected.name);
      const nextRarity = nextRarityMap[currentRarity];
      if (!nextRarity) return;

      const itemCollections = selectedItems.map(item => {
        const colName = findCollectionForSkin(item.name);
        return collections.find(c => c.name === colName) || collections[0];
      });

      const outcomeWeights = {};
      itemCollections.forEach(col => {
        const outcomes = col.itemsByRarity[nextRarity] || [];
        if (outcomes.length > 0) {
          const contribution = 0.10 / outcomes.length;
          outcomes.forEach(outSkin => {
            if (outcomeWeights[outSkin]) {
              outcomeWeights[outSkin].weight += contribution;
            } else {
              outcomeWeights[outSkin] = { weight: contribution, collection: col };
            }
          });
        }
      });

      const outcomesList = Object.keys(outcomeWeights).map(skin => ({
        skin,
        weight: outcomeWeights[skin].weight,
        collection: outcomeWeights[skin].collection
      }));

      if (outcomesList.length === 0) {
        const fallbackCol = collections[0];
        const outcomes = fallbackCol.itemsByRarity[nextRarity] || [];
        outcomes.forEach(outSkin => {
          outcomesList.push({ skin: outSkin, weight: 1.0 / outcomes.length, collection: fallbackCol });
        });
      }

      const totalWeight = outcomesList.reduce((sum, o) => sum + o.weight, 0);
      const rand = Math.random() * totalWeight;
      let accum = 0;
      let selectedOutcome = outcomesList[0];
      for (const entry of outcomesList) {
        accum += entry.weight;
        if (rand <= accum) {
          selectedOutcome = entry;
          break;
        }
      }

      const totalInputFloat = selectedItems.reduce((sum, item) => {
        if (item.float !== undefined && item.float !== null) return sum + item.float;
        const wear = item.wear?.toLowerCase() || '';
        if (wear.includes('new')) return sum + 0.03;
        if (wear.includes('minimal')) return sum + 0.11;
        if (wear.includes('tested')) return sum + 0.22;
        if (wear.includes('worn')) return sum + 0.41;
        return sum + 0.70;
      }, 0);
      const avgFloat = totalInputFloat / 10.0;

      const bounds = getFloatLimits(selectedOutcome.skin);
      const outcomeFloat = avgFloat * (bounds.max - bounds.min) + bounds.min;

      let outcomeWear = 'Field-Tested';
      if (outcomeFloat < 0.07) outcomeWear = 'Factory New';
      else if (outcomeFloat < 0.15) outcomeWear = 'Minimal Wear';
      else if (outcomeFloat < 0.38) outcomeWear = 'Field-Tested';
      else if (outcomeFloat < 0.45) outcomeWear = 'Well-Worn';
      else outcomeWear = 'Battle-Scarred';

      const fullHash = `${selectedOutcome.skin} (${outcomeWear})`;
      let priceVal = 0;
      if (pricesDb && pricesDb[fullHash]) {
        const itemPrices = pricesDb[fullHash];
        priceVal = itemPrices.last_24h || itemPrices.last_7d || 15.0;
      } else {
        priceVal = (firstSelected.price * 2.2) * (1 + (Math.random() - 0.5) * 0.2);
      }

      const totalCost = selectedItems.reduce((sum, item) => sum + item.price, 0);
      const pnl = priceVal - totalCost;

      setSimResult({
        name: selectedOutcome.skin,
        hashName: fullHash,
        rarity: nextRarity,
        float: outcomeFloat,
        wear: outcomeWear,
        price: priceVal,
        collection: selectedOutcome.collection.name,
        img: firstSelected.img
      });
      setSimPnL(pnl);
      setShowSimResultModal(true);

      unlockAchievement('watchlist_add');
    };

    return (
      <div className="sheet-content scrollbar-hide">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Ausgewählt ({selectedItems.length}/10)
            </span>
            {selectedItems.length > 0 && (
              <button 
                onClick={() => setSelectedTradeUpIds([])} 
                style={{ background: 'transparent', border: 'none', color: '#ff3b30', fontSize: '12px', cursor: 'pointer' }}
              >
                Zurücksetzen
              </button>
            )}
          </div>
          
          {selectedItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', textAlign: 'center', gap: '8px' }}>
              <FlaskConical size={32} color="#00F0FF" />
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>Trade-Up Rechner</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '0 20px' }}>
                Wähle 10 Skins der gleichen Seltenheitsstufe aus.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
              {selectedItems.map((item) => {
                const rarityName = getSkinRarity(item.name);
                const rColor = rarityColors[rarityName] || '#fff';
                return (
                  <div 
                    key={item.id}
                    style={{ flexShrink: 0, position: 'relative', width: '56px', height: '56px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${rColor}50`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                  >
                    <img src={item.img} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button 
                      onClick={() => setSelectedTradeUpIds(prev => prev.filter(id => id !== item.id))}
                      style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ff3b30', border: 'none', color: '#fff', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedItems.length === 10 && (
          <button 
            onClick={runTradeUpSim} 
            className="onboarding-btn primary-btn"
            style={{ width: '100%', background: 'linear-gradient(135deg, #00f0ff 0%, #00ff77 100%)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(0, 240, 255, 0.25)', marginBottom: '20px' }}
          >
            Trade-Up starten 🧪
          </button>
        )}

        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
            Verfügbare Skins
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '40vh', overflowY: 'auto' }}>
            {eligibleFiltered.map(item => {
              const rarityName = getSkinRarity(item.name);
              const rColor = rarityColors[rarityName] || '#94a3b8';
              return (
                <div 
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}
                >
                  <div style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={item.img} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '10px', color: rColor, fontWeight: '600', marginTop: '2px' }}>
                      {rarityName}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>{formatPrice(item.price, currency, 'STEAM')}</span>
                    <button 
                      onClick={() => {
                        if (selectedTradeUpIds.length < 10) {
                          setSelectedTradeUpIds(prev => [...prev, item.id]);
                        }
                      }}
                      style={{ background: 'rgba(0, 240, 255, 0.1)', border: 'none', color: '#00F0FF', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
                      disabled={selectedTradeUpIds.length >= 10}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {eligibleFiltered.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                Keine passenden Skins im Inventar vorhanden.
              </div>
            )}
          </div>
        </div>

        {showSimResultModal && simResult && (
          <div className="sheet-overlay show" style={{ zIndex: 10100 }} onClick={() => setShowSimResultModal(false)}>
            <div className="sheet-container detail-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
              <div className="sheet-header">
                <h3 className="sheet-title">TRADE-UP ERGEBNIS</h3>
                <button className="sheet-close-btn" onClick={() => setShowSimResultModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="sheet-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', border: `1px solid ${rarityColors[simResult.rarity] || '#fff'}50` }}>
                  <img src={simResult.img} alt={simResult.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{simResult.name}</h4>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: rarityColors[simResult.rarity] }}>{simResult.rarity}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Upgrade Wert</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '4px 0' }}>{formatPrice(simResult.price, currency, 'STEAM')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: simPnL >= 0 ? '#10b981' : '#ef4444', background: simPnL >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', marginTop: '6px' }}>
                    {simPnL >= 0 ? `Gewinn: +${formatPrice(simPnL, currency, 'STEAM')}` : `Verlust: ${formatPrice(simPnL, currency, 'STEAM')}`}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%', paddingTop: '12px' }}>
                  Float des Ergebnisses: <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 'bold' }}>{simResult.float.toFixed(6)}</span> ({simResult.wear})
                </div>

                <button 
                  className="onboarding-btn primary-btn" 
                  style={{ width: '100%' }}
                  onClick={() => {
                    setShowSimResultModal(false);
                    setSelectedTradeUpIds([]);
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const WhatIfSheet = ({ currency, formatPrice }) => {
    const [investAmount, setInvestAmount] = useState('1000');
    const [timeframe, setTimeframe] = useState('1 Jahr');
    const [category, setCategory] = useState('Cases');
    const [result, setResult] = useState(null);

    const calculateWhatIf = () => {
      const amt = parseFloat(investAmount);
      if (isNaN(amt) || amt <= 0) return;

      let multiplier = 1.0;
      if (timeframe === '3 Monate') {
        if (category === 'Cases') multiplier = 1.12;
        else if (category === 'Skins (Mittelwert)') multiplier = 1.03;
        else if (category === 'High-Tier (Knives/Gloves)') multiplier = 1.05;
        else if (category === 'Aufkleber (Stickers)') multiplier = 0.95;
      } else if (timeframe === '6 Monate') {
        if (category === 'Cases') multiplier = 1.25;
        else if (category === 'Skins (Mittelwert)') multiplier = 1.08;
        else if (category === 'High-Tier (Knives/Gloves)') multiplier = 1.10;
        else if (category === 'Aufkleber (Stickers)') multiplier = 1.15;
      } else if (timeframe === '1 Jahr') {
        if (category === 'Cases') multiplier = 1.68;
        else if (category === 'Skins (Mittelwert)') multiplier = 1.20;
        else if (category === 'High-Tier (Knives/Gloves)') multiplier = 1.28;
        else if (category === 'Aufkleber (Stickers)') multiplier = 1.45;
      } else if (timeframe === '2 Jahre') {
        if (category === 'Cases') multiplier = 2.45;
        else if (category === 'Skins (Mittelwert)') multiplier = 1.40;
        else if (category === 'High-Tier (Knives/Gloves)') multiplier = 1.65;
        else if (category === 'Aufkleber (Stickers)') multiplier = 2.10;
      }

      const finalVal = amt * multiplier;
      const profitVal = finalVal - amt;
      const roi = (multiplier - 1.0) * 100;

      setResult({
        finalVal,
        profitVal,
        roi
      });
    };

    return (
      <div className="sheet-content scrollbar-hide">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', color: '#fff', fontWeight: 'bold', marginBottom: '6px' }}>Was wäre wenn...</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
            Simuliere, wie viel Gewinn du gemacht hättest, wenn du in der Vergangenheit investiert hättest.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>Investierter Betrag</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginRight: '8px' }}>{currency === 'EUR' ? '€' : '$'}</span>
              <input 
                type="number" 
                value={investAmount} 
                onChange={(e) => setInvestAmount(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 'bold', outline: 'none', width: '100%' }} 
                placeholder="1000"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>Einstiegszeitpunkt</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {['3 Monate', '6 Monate', '1 Jahr', '2 Jahre'].map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  style={{ background: timeframe === tf ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: timeframe === tf ? '#fff' : 'rgba(255,255,255,0.4)', padding: '6px 0', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>Investment-Kategorie</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
            >
              {['Cases', 'Skins (Mittelwert)', 'High-Tier (Knives/Gloves)', 'Aufkleber (Stickers)'].map(cat => (
                <option key={cat} value={cat} style={{ background: '#0a0a0a' }}>{cat}</option>
              ))}
            </select>
          </div>

          <button 
            type="button"
            onClick={calculateWhatIf} 
            className="onboarding-btn primary-btn"
            style={{ marginTop: '8px', background: 'linear-gradient(135deg, #00f0ff 0%, #00ff77 100%)', color: '#000', fontWeight: 'bold' }}
          >
            Simulation berechnen 🔮
          </button>
        </div>

        {result && (
          <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '18px', textAlign: 'center' }} className="slide-in-right">
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#00F0FF', letterSpacing: '2px', textTransform: 'uppercase' }}>Simulationsergebnis</div>
            
            <div style={{ margin: '14px 0' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Wert heute</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
                {formatPrice(result.finalVal, currency, 'STEAM')}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Reingewinn</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>
                  +{formatPrice(result.profitVal, currency, 'STEAM')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Rendite (ROI)</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>
                  +{result.roi.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ArbitrageSheet = ({ realInventoryItems, skins, pricesDb, steamMedianPrices, currency, formatPrice, fetchSteamMedianPrice, setSelectedSkinId }) => {
    const [tab, setTab] = useState(0);
    const [loadingMap, setLoadingMap] = useState({});

    const items = tab === 0 
      ? Array.from(new Map(realInventoryItems.map(item => [item.marketHashName, item])).values())
      : skins;

    const triggerCheck = async (hashName) => {
      setLoadingMap(prev => ({ ...prev, [hashName]: true }));
      await fetchSteamMedianPrice(hashName);
      setLoadingMap(prev => ({ ...prev, [hashName]: false }));
    };

    const checkAll = async () => {
      for (const item of items.slice(0, 5)) {
        if (steamMedianPrices[item.marketHashName] === undefined) {
          triggerCheck(item.marketHashName);
          await new Promise(r => setTimeout(r, 800));
        }
      }
    };

    return (
      <div className="sheet-content scrollbar-hide" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => setTab(0)}
            style={{ background: tab === 0 ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: tab === 0 ? '#fff' : 'rgba(255,255,255,0.4)', padding: '8px 0', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Dein Inventar
          </button>
          <button
            type="button"
            onClick={() => setTab(1)}
            style={{ background: tab === 1 ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: tab === 1 ? '#fff' : 'rgba(255,255,255,0.4)', padding: '8px 0', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Beobachtungsliste
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', borderRadius: '12px', padding: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
          <Info size={16} color="#00F0FF" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Arbitrage-Spread:</strong> Günstiger auf Skinport kaufen, teurer auf Steam verkaufen. Ein Spread über <strong>15%</strong> deckt die Steam-Gebühr.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <button 
            type="button"
            onClick={checkAll}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <RotateCw size={12} style={{ marginRight: '4px' }} />
            Fehlende laden (Max 5)
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '40vh', overflowY: 'auto' }}>
          {items.map(item => {
            const skinportPrice = pricesDb && pricesDb[item.marketHashName]
              ? (pricesDb[item.marketHashName].last_24h || pricesDb[item.marketHashName].last_7d || item.price)
              : item.price;
            
            const steamPrice = steamMedianPrices[item.marketHashName];
            const spread = steamPrice && steamPrice > 0 ? ((steamPrice - skinportPrice) / steamPrice) * 100 : null;
            const profit = spread !== null && spread >= 15.0;

            return (
              <div 
                key={item.id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}
              >
                <div style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${rarityColors[getSkinRarity(item.name)] || '#fff'}30` }}>
                  <img src={item.img} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    Skinport: {formatPrice(skinportPrice, currency, 'STEAM')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {steamPrice ? (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                        Steam: {formatPrice(steamPrice, currency, 'STEAM')}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: spread >= 15.0 ? '#10b981' : (spread >= 0 ? '#f59e0b' : '#ef4444'), marginTop: '2px' }}>
                        Spread: {spread.toFixed(1)}% {profit ? '(Profit)' : '(Lust)'}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerCheck(item.marketHashName)}
                      className="onboarding-btn primary-btn"
                      style={{ padding: '4px 10px', fontSize: '10px', height: 'auto', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.2)' }}
                      disabled={loadingMap[item.marketHashName]}
                    >
                      {loadingMap[item.marketHashName] ? 'Lade...' : 'Vergleichen'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', padding: '40px' }}>
              Keine passenden Items vorhanden.
            </div>
          )}
        </div>
      </div>
    );
  };

  const PriceAlertsSheet = ({ skins, realInventoryItems, currency, formatPrice, alerts, setAlerts, playTradeSound, handleDeleteAlert }) => {
    const [targetPrice, setTargetPrice] = useState('');
    const [type, setType] = useState('above');
    const [selectedSkinName, setSelectedSkinName] = useState('');

    const allItems = [...skins, ...realInventoryItems];
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.name, item])).values());

    const createAlert = (e) => {
      e.preventDefault();
      const priceVal = parseFloat(targetPrice);
      if (isNaN(priceVal) || priceVal <= 0 || !selectedSkinName) return;

      const matchedSkin = uniqueItems.find(s => s.name === selectedSkinName);
      if (!matchedSkin) return;

      const newAlert = {
        id: Date.now(),
        skinId: matchedSkin.id,
        skinName: matchedSkin.name,
        hashName: matchedSkin.marketHashName || matchedSkin.name,
        type,
        target: priceVal,
        isActive: true
      };

      setAlerts(prev => [...prev, newAlert]);
      setTargetPrice('');
      playTradeSound('buy');
    };

    return (
      <div className="sheet-content scrollbar-hide">
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Neuen Preisalarm einrichten</div>
          
          <form onSubmit={createAlert} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Skin auswählen</label>
              <select
                value={selectedSkinName}
                onChange={(e) => setSelectedSkinName(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                required
              >
                <option value="">-- Skin auswählen --</option>
                {uniqueItems.map(skin => (
                  <option key={skin.id} value={skin.name} style={{ background: '#0a0a0a' }}>{skin.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Alarmtyp</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="above" style={{ background: '#0a0a0a' }}>{"Steigt über (>=)"}</option>
                  <option value="below" style={{ background: '#0a0a0a' }}>{"Fällt unter (<=)"}</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Zielpreis ({currency === 'EUR' ? '€' : '$'})</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  placeholder="25.50"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="onboarding-btn primary-btn"
              style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #00ff77 100%)', color: '#000', fontWeight: 'bold', marginTop: '4px' }}
            >
              Alarm erstellen 🔔
            </button>
          </form>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
            Deine aktiven Preisalarme
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '30vh', overflowY: 'auto' }}>
            {alerts.map(alert => (
              <div 
                key={alert.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.skinName}
                  </div>
                  <div style={{ fontSize: '11px', color: alert.type === 'above' ? '#10b981' : '#ef4444', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {alert.type === 'above' ? 'Steigt über' : 'Fällt unter'}{' '}
                    {formatPrice(alert.target, currency, 'STEAM')}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeleteAlert(alert.id)}
                  style={{ background: 'rgba(255,59,48,0.15)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3b30', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {alerts.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textAlign: 'center', padding: '24px' }}>
                Keine Preisalarme definiert.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- SUB-RENDERERS FOR HUB AND DETAIL OVERLAYS ---

  const renderAchievementToast = () => {
    if (!newlyUnlockedAchievement) return null;
    return (
      <div className={`achievement-toast ${newlyUnlockedAchievement ? 'show' : ''}`}>
        <div className="achievement-toast-icon-wrapper">
          <Sparkles size={20} />
        </div>
        <div className="achievement-toast-content">
          <div className="achievement-toast-title">Achievement freigeschaltet! 🎉</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
            {newlyUnlockedAchievement.title}
          </div>
          <div className="achievement-toast-desc">{newlyUnlockedAchievement.description}</div>
        </div>
      </div>
    );
  };

  const renderActionHub = () => {
    if (!user || !steamIdInput) return null;
    return (
      <>
        {/* Floating Action Button */}
        <div className="fab-container">
          <button 
            className={`fab-btn ${showActionHub ? 'active' : ''}`}
            onClick={() => setShowActionHub(!showActionHub)}
            title="SkinStock Hub"
          >
            <div className="fab-inner">
              <Plus size={20} style={{ transform: showActionHub ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }} />
            </div>
          </button>
        </div>

        {/* Action Hub Overlay Modal */}
        <div className={`action-hub-overlay ${showActionHub ? 'show' : ''}`} onClick={() => setShowActionHub(false)}>
          <div className="action-hub-card" onClick={(e) => e.stopPropagation()}>
            <div className="action-hub-header">SkinStock Hub</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textAlign: 'center', padding: '0 20px', marginBottom: '8px' }}>
              Wähle ein Werkzeug aus, um dein Portfolio zu optimieren.
            </div>

            <div className="action-hub-buttons">
              <button className="action-hub-item" onClick={() => { setActiveSheet('watchlist'); setShowActionHub(false); }}>
                <div className="action-hub-icon-box"><Eye size={18} /></div>
                <div className="action-hub-info">
                  <div className="action-hub-title">{lang === 'de' ? 'Beobachtungsliste' : 'Watchlist'}</div>
                  <div className="action-hub-desc">{lang === 'de' ? 'Skins & Spreads tracken' : 'Track skins & spreads'}</div>
                </div>
                <ChevronRight className="action-hub-chevron" size={16} />
              </button>

              <button className="action-hub-item" onClick={() => { setActiveSheet('achievements'); setShowActionHub(false); }}>
                <div className="action-hub-icon-box"><Crown size={18} /></div>
                <div className="action-hub-info">
                  <div className="action-hub-title">{lang === 'de' ? 'Erfolge / Achievements' : 'Achievements'}</div>
                  <div className="action-hub-desc">{lang === 'de' ? 'Löse Meilensteine ein' : 'Complete milestones'}</div>
                </div>
                <ChevronRight className="action-hub-chevron" size={16} />
              </button>

              <button className="action-hub-item" onClick={() => { setActiveSheet('collections'); setShowActionHub(false); }}>
                <div className="action-hub-icon-box"><Package size={18} /></div>
                <div className="action-hub-info">
                  <div className="action-hub-title">{lang === 'de' ? 'Sammlungen' : 'Collections'}</div>
                  <div className="action-hub-desc">{lang === 'de' ? 'Kollektionen vervollständigen' : 'Complete skin collections'}</div>
                </div>
                <ChevronRight className="action-hub-chevron" size={16} />
              </button>

              <button className="action-hub-item" onClick={() => { setActiveSheet('tradeup'); setShowActionHub(false); }}>
                <div className="action-hub-icon-box"><FlaskConical size={18} /></div>
                <div className="action-hub-info">
                  <div className="action-hub-title">{lang === 'de' ? 'Trade-Up Rechner' : 'Trade-Up Calculator'}</div>
                  <div className="action-hub-desc">{lang === 'de' ? 'Simuliere rentable Aufwertungen' : 'Simulate profitable trade-ups'}</div>
                </div>
                <ChevronRight className="action-hub-chevron" size={16} />
              </button>

              <button className="action-hub-item" onClick={() => { setActiveSheet('whatif'); setShowActionHub(false); }}>
                <div className="action-hub-icon-box"><History size={18} /></div>
                <div className="action-hub-info">
                  <div className="action-hub-title">{lang === 'de' ? 'Was-wäre-wenn Rechner' : 'What-If Calculator'}</div>
                  <div className="action-hub-desc">{lang === 'de' ? 'Simuliere historische ROI' : 'Simulate historical ROI'}</div>
                </div>
                <ChevronRight className="action-hub-chevron" size={16} />
              </button>

              <button className="action-hub-item" onClick={() => { setActiveSheet('arbitrage'); setShowActionHub(false); }}>
                <div className="action-hub-icon-box"><TrendingUp size={18} /></div>
                <div className="action-hub-info">
                  <div className="action-hub-title">{lang === 'de' ? 'Arbitrage-Finder' : 'Arbitrage Finder'}</div>
                  <div className="action-hub-desc">{lang === 'de' ? 'Finde unterbewertete Skins' : 'Find undervalued skins'}</div>
                </div>
                <ChevronRight className="action-hub-chevron" size={16} />
              </button>

              <button className="action-hub-item" onClick={() => { setActiveSheet('pricealerts'); setShowActionHub(false); }}>
                <div className="action-hub-icon-box"><Bell size={18} /></div>
                <div className="action-hub-info">
                  <div className="action-hub-title">{lang === 'de' ? 'Preisalarme' : 'Price Alerts'}</div>
                  <div className="action-hub-desc">{lang === 'de' ? 'Verwalte deine Benachrichtigungen' : 'Manage your alerts'}</div>
                </div>
                <ChevronRight className="action-hub-chevron" size={16} />
              </button>
            </div>

            <button className="sheet-close-btn" style={{ marginTop: '8px' }} onClick={() => setShowActionHub(false)}>
              <X size={16} />
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderSheets = () => {
    if (!activeSheet) return null;

    let title = '';
    let content = null;

    if (activeSheet === 'watchlist') {
      title = lang === 'de' ? 'Beobachtungsliste' : 'Watchlist';
      content = (
        <WatchlistSheet 
          filteredSkins={filteredSkins} 
          currency={currency} 
          valuationMode={valuationMode} 
          setSkins={setSkins} 
          playTradeSound={playTradeSound} 
          setSelectedSkinId={setSelectedSkinId} 
          formatPrice={formatPrice} 
        />
      );
    } else if (activeSheet === 'achievements') {
      title = lang === 'de' ? 'Erfolge (Achievements)' : 'Achievements';
      content = <AchievementsSheet achievements={achievements} />;
    } else if (activeSheet === 'collections') {
      title = lang === 'de' ? 'Sammlungen (Collections)' : 'Collections';
      content = (
        <CollectionsSheet 
          realInventoryItems={realInventoryItems} 
          currency={currency} 
          valuationMode={valuationMode} 
          formatPrice={formatPrice} 
          setSelectedSkinId={setSelectedSkinId} 
        />
      );
    } else if (activeSheet === 'tradeup') {
      title = lang === 'de' ? 'Trade-Up Rechner' : 'Trade-Up';
      content = (
        <TradeUpSheet 
          realInventoryItems={realInventoryItems} 
          pricesDb={pricesDb} 
          currency={currency} 
          formatPrice={formatPrice} 
          unlockAchievement={unlockAchievement} 
        />
      );
    } else if (activeSheet === 'whatif') {
      title = lang === 'de' ? 'Was-wäre-wenn Rechner' : 'What-If Rechner';
      content = <WhatIfSheet currency={currency} formatPrice={formatPrice} />;
    } else if (activeSheet === 'arbitrage') {
      title = lang === 'de' ? 'Arbitrage-Finder' : 'Arbitrage Finder';
      content = (
        <ArbitrageSheet 
          realInventoryItems={realInventoryItems} 
          skins={skins}
          pricesDb={pricesDb} 
          steamMedianPrices={steamMedianPrices} 
          currency={currency} 
          formatPrice={formatPrice} 
          fetchSteamMedianPrice={fetchSteamMedianPrice} 
          setSelectedSkinId={setSelectedSkinId} 
        />
      );
    } else if (activeSheet === 'pricealerts') {
      title = lang === 'de' ? 'Preisalarme' : 'Price Alerts';
      content = (
        <PriceAlertsSheet 
          skins={skins} 
          realInventoryItems={realInventoryItems} 
          currency={currency} 
          formatPrice={formatPrice} 
          alerts={alerts} 
          setAlerts={setAlerts} 
          playTradeSound={playTradeSound} 
          handleDeleteAlert={handleDeleteAlert} 
        />
      );
    }

    return (
      <div className="sheet-overlay show" onClick={() => setActiveSheet(null)}>
        <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-header">
            <h3 className="sheet-title">{title}</h3>
            <button className="sheet-close-btn" onClick={() => setActiveSheet(null)}>
              <X size={16} />
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  };

  const renderSkinDetailModal = () => {
    if (!selectedSkinId || selectedSkinId === 'total' || selectedSkinId === 'none') return null;
    
    const skin = selectedSkinId.startsWith('real-')
      ? realInventoryItems.find(s => s.id === selectedSkinId)
      : skins.find(s => s.id === selectedSkinId);
      
    if (!skin) return null;
    
    const simPrice = getSimulatedPrice(skin, selectedSkinFloat);
    const simWear = getWearNameFromFloat(selectedSkinFloat);
    const collectionName = findCollectionForSkin(skin.name) || 'None';
    
    const rarityName = getSkinRarity(skin.name);
    const rarityColor = rarityColors[rarityName] || '#94a3b8';
    
    const cost = skin.basePrice || skin.price;
    const profitVal = simPrice - cost;
    const roiPct = cost > 0 ? ((simPrice - cost) / cost) * 100 : 0;
    
    const smaVal = selectedSkinSma || simPrice;
    const rsiVal = selectedSkinRsi || 50;
    const signal = selectedSkinSignal || 'HOLD';
    
    const asks = simulatedOrderBook.asks || [];
    const bids = simulatedOrderBook.bids || [];
    
    const inWatchlist = skins.some(s => s.name === skin.name);
    
    return (
      <div className="sheet-overlay show" onClick={() => setSelectedSkinId(null)}>
        <div className="sheet-container detail-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-header">
            <h3 className="sheet-title">{lang === 'de' ? 'Skin-Details' : 'Skin Details'}</h3>
            <button className="sheet-close-btn" onClick={() => setSelectedSkinId(null)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="detail-modal-content scrollbar-hide">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', marginBottom: '24px' }}>
              <div 
                className={`rarity-glow-${rarityName.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '24px', 
                  background: 'rgba(255,255,255,0.02)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '12px'
                }}
              >
                <img src={skin.img} alt={skin.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }} />
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{skin.name}</h4>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: rarityColor, background: `${rarityColor}1c`, padding: '4px 8px', borderRadius: '99px' }}>
                    {rarityName}
                  </span>
                  {collectionName !== 'None' && (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-accent)', background: 'rgba(226, 201, 255, 0.08)', padding: '4px 8px', borderRadius: '99px' }}>
                      {collectionName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {lang === 'de' ? 'Simulierter Preis' : 'Simulated Price'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: '4px 0' }}>
                {formatPrice(simPrice, currency, valuationMode)}
              </div>
              <div style={{ fontSize: '11px', color: profitVal >= 0 ? '#10b981' : '#ef4444' }}>
                {profitVal >= 0 ? '+' : ''}{formatPrice(profitVal, currency, valuationMode)} ({profitVal >= 0 ? '+' : ''}{roiPct.toFixed(1)}% ROI)
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Wear-Simulator</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: rarityColor }}>{simWear}</span>
              </div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', color: '#fff' }}>
                Float: {selectedSkinFloat.toFixed(4)}
              </div>
              <div className="float-slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.0001" 
                  value={selectedSkinFloat} 
                  onChange={(e) => setSelectedSkinFloat(parseFloat(e.target.value))} 
                  className="float-custom-slider"
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Einkaufspreis</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                  {formatPrice(cost, currency, 'STEAM')}
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Technical Signal</div>
                <div style={{ marginTop: '4px' }}>
                  <span className={`indicator-badge indicator-${signal.toLowerCase()}`}>{signal}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>Technische Indikatoren</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>SMA (7 Tage):</span>{' '}
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{formatPrice(smaVal, currency, 'STEAM')}</span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>RSI (14 Tage):</span>{' '}
                  <span style={{ color: rsiVal > 70 ? '#ef4444' : (rsiVal < 30 ? '#10b981' : '#f59e0b'), fontWeight: 'bold' }}>
                    {rsiVal}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>Simuliertes Orderbuch</div>
              <table className="order-book-table">
                <thead>
                  <tr>
                    <th>Typ</th>
                    <th>Preis ({currency})</th>
                    <th>Menge</th>
                  </tr>
                </thead>
                <tbody>
                  {asks.map((ask, idx) => (
                    <tr key={`ask-${idx}`} className="order-book-row-ask">
                      <td>ASK (Verkauf)</td>
                      <td>{ask.price.toFixed(2)}</td>
                      <td>{ask.qty}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 'bold', color: '#fff' }}>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '4px' }}>Mittelkurs: {simPrice.toFixed(2)}</td>
                  </tr>
                  {bids.map((bid, idx) => (
                    <tr key={`bid-${idx}`} className="order-book-row-bid">
                      <td>BID (Kauf)</td>
                      <td>{bid.price.toFixed(2)}</td>
                      <td>{bid.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                className="onboarding-btn secondary-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  if (inWatchlist) {
                    setSkins(prev => prev.filter(s => s.name !== skin.name));
                    playTradeSound('sell');
                  } else {
                    handleAddToWatchlist(skin);
                  }
                }}
              >
                <Eye size={16} style={{ marginRight: '6px' }} />
                {inWatchlist ? 'Watchlist verlassen' : 'Auf Watchlist'}
              </button>
              
              <button 
                type="button"
                className="onboarding-btn primary-btn"
                style={{ flex: 1 }}
                onClick={() => setSelectedSkinId(null)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {renderActionHub()}
      {renderSheets()}
      {renderSkinDetailModal()}
      {renderAchievementToast()}
      {showSplash && (
        <div className={`splash-overlay ${splashFadingOut ? 'fade-out' : ''}`}>
          <div className="splash-container">
            <div className="splash-logo-wrapper">
              <div className="splash-logo-glow" />
              <img src="/logo.png" alt="SkinStock Logo" className="splash-logo" />
            </div>
            <div className="splash-text-group">
              <h1 className="splash-title">SkinStock</h1>
              <p className="splash-subtitle">CS2 Market Ticker</p>
            </div>
            <div className="splash-loader-wrapper">
              <div className="splash-loader-ring" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
