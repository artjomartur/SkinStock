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
  LogOut
} from 'lucide-react'
import './App.css'
import defaultInventory from './defaultInventory.json'
import Onboarding from './components/Onboarding'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
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

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)



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
  
  // Alert states
  const [alerts, setAlerts] = useState([])
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [alertType, setAlertType] = useState('above') // 'above' | 'below'
  const [toasts, setToasts] = useState([])

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

  if (authLoading) {
    return <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>Loading...</div>;
  }

  if (!user || !steamIdInput) {
    return <Onboarding user={user} setSteamIdInput={setSteamIdInput} />;
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
}
