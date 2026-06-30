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
          labelVisible: false
        },
        horzLine: {
          visible: false,
          labelVisible: false
        }
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 180
    })
    chartRef.current = chart

    const isUp = isPositive !== false
    const lineColor = isUp ? '#00d182' : '#ff3b30'
    const topColor = isUp ? 'rgba(0, 209, 130, 0.15)' : 'rgba(255, 59, 48, 0.15)'
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
    areaSeries.setData(areaData)

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
    smaSeries.setData(smaData)

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
  const [activeTab, setActiveTab] = useState('market') // 'market' | 'portfolio' | 'alerts'
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
  
  // Alert states
  const [alerts, setAlerts] = useState([])
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [alertType, setAlertType] = useState('above') // 'above' | 'below'
  const [toasts, setToasts] = useState([])

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
      const items = activeTab === 'portfolio' ? realInventoryItems : skins
      if (!items || items.length === 0) {
        return {
          id: 'total',
          name: activeTab === 'portfolio' ? 'Gesamtportfolio' : 'Watchlist Gesamt',
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
        name: activeTab === 'portfolio' ? 'Gesamtportfolio' : 'Watchlist Gesamt',
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
      const itemVal = item.price * item.qty
      holdingsValue += itemVal
      totalInvested += item.basePrice * item.qty
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
    const dataKey = selectedSkinId || (activeTab === 'portfolio' ? 'total_portfolio' : 'total_market')
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
        const itemVal = item.price * item.qty
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
      const itemVal = item.price * item.qty
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
      const netPrice = item.price * 0.85
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

      {/* Sidebar for Desktop */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <Activity className="logo-icon" size={24} />
          <span className="logo-text">SkinStock</span>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-btn ${activeTab === 'market' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
          >
            <Activity size={20} />
            <span>Ticker</span>
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <Wallet size={20} />
            <span>{lang === 'de' ? 'Depot' : 'Portfolio'}</span>
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={20} />
            <span>{lang === 'de' ? 'Analyse' : 'Analytics'}</span>
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={20} />
            <span>Alarme</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <button 
              onClick={handleLogout}
              className="sidebar-nav-btn"
              style={{ width: '100%', marginBottom: '16px', color: 'var(--color-red)' }}
            >
              <LogOut size={20} />
              <span>{lang === 'de' ? 'Abmelden' : 'Log Out'}</span>
            </button>
          )}
          {realInventoryItems.length > 0 ? (
            <div className="sidebar-balance">
              <span className="balance-label">{lang === 'de' ? 'Inventarwert' : 'Inventory Value'}</span>
              <span className="balance-amount">€{realInventorySummary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ) : (
            <div className="sidebar-status-tag">
              {lang === 'de' ? 'Nicht verbunden' : 'Not Connected'}
            </div>
          )}
        </div>
      </aside>

      <div className="app-main-wrapper">
        {/* Header */}
        <header className="app-header">
        <div className="logo-group">
          <Activity className="logo-icon" size={24} />
          <h1 className="logo-text">SkinStock</h1>
        </div>
        <div className="balance-card">
          {realInventoryItems.length > 0 ? (
            <>
              <span className="balance-label">{lang === 'de' ? 'Inventarwert' : 'Inventory Value'}</span>
              <span className="balance-amount">€{realInventorySummary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
      </header>

      {/* App Content */}
      <main className="app-content scrollbar-hide">
        {activeTab === 'market' && (
          <div className="market-view layout-split">
            <div className="layout-main">
              {/* Smooth Line Chart */}
              <div className="chart-card">
                <div className="chart-header-tr">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="chart-title-tr">{selectedSkin.name}</h3>
                      <div className="chart-price-tr">€{selectedSkin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className={`chart-change-tr ${selectedSkin.change >= 0 ? 'price-up' : 'price-down'}`}>
                        {selectedSkin.change >= 0 ? '+' : ''}{selectedSkin.change.toFixed(2)}% {lang === 'de' ? 'Heute' : 'Today'}
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
                    data={historicalDataMap[selectedSkinId || (activeTab === 'portfolio' ? 'total_portfolio' : 'total_market')] || []} 
                    currentPrice={selectedSkin.price} 
                    isPositive={selectedSkin.change >= 0}
                  />
                </div>
              </div>

              {/* Technical Analysis & Order Book Row */}
              <div className="analytics-ticker-row">
                {/* Technical Indicators */}
                <div className="trade-box" style={{ marginTop: 0 }}>
                  <h4 className="section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                    {lang === 'de' ? 'Technische Indikatoren' : 'Technical Indicators'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>SMA (7 {lang === 'de' ? 'Tage' : 'Days'}):</span>
                      <span style={{ fontWeight: '600', color: '#fff' }}>€{selectedSkinSma.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>RSI (14):</span>
                      <span style={{ fontWeight: '600', color: selectedSkinRsi > 70 ? 'var(--color-red)' : selectedSkinRsi < 30 ? 'var(--color-green)' : '#fff' }}>
                        {selectedSkinRsi} ({selectedSkinRsi > 70 ? (lang === 'de' ? 'Überkauft' : 'Overbought') : selectedSkinRsi < 30 ? (lang === 'de' ? 'Überverkauft' : 'Oversold') : 'Neutral'})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Trend-Empfehlung:' : 'Trend Signal:'}</span>
                      <span style={{ 
                        fontWeight: '700', 
                        color: selectedSkinSignal === 'BUY' ? 'var(--color-green)' : selectedSkinSignal === 'SELL' ? 'var(--color-red)' : 'var(--color-amber)' 
                      }}>
                        {selectedSkinSignal === 'BUY' ? (lang === 'de' ? 'KAUFEN' : 'BUY') : selectedSkinSignal === 'SELL' ? (lang === 'de' ? 'VERKAUFEN' : 'SELL') : (lang === 'de' ? 'HALTEN' : 'HOLD')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated Order Book */}
                <div className="trade-box" style={{ marginTop: 0 }}>
                  <h4 className="section-title" style={{ fontSize: '14px', marginBottom: '10px' }}>
                    {lang === 'de' ? 'Simuliertes Orderbuch' : 'Simulated Order Book'}
                  </h4>
                  <div className="order-book-table" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    <div className="order-book-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '4px' }}>
                      <span>{lang === 'de' ? 'Preis (€)' : 'Price (€)'}</span>
                      <span style={{ textAlign: 'right' }}>{lang === 'de' ? 'Menge (Qty)' : 'Size (Qty)'}</span>
                    </div>
                    {/* Asks (Sell offers) - Red */}
                    <div className="asks-list">
                      {simulatedOrderBook.asks.map((ask, idx) => (
                        <div key={'ask-'+idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', color: 'var(--color-red)', padding: '2px 0' }}>
                          <span>{ask.price.toFixed(2)}</span>
                          <span style={{ textAlign: 'right', color: '#f87171' }}>{ask.qty}</span>
                        </div>
                      ))}
                    </div>
                    {/* Current Spread divider */}
                    <div className="spread-divider" style={{ textAlign: 'center', color: '#fff', fontSize: '10px', padding: '3px 0', borderY: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', margin: '4px 0', borderRadius: '4px' }}>
                      Spread: €{(simulatedOrderBook.asks[simulatedOrderBook.asks.length - 1]?.price - simulatedOrderBook.bids[0]?.price || 0).toFixed(2)}
                    </div>
                    {/* Bids (Buy offers) - Green */}
                    <div className="bids-list">
                      {simulatedOrderBook.bids.map((bid, idx) => (
                        <div key={'bid-'+idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', color: 'var(--color-green)', padding: '2px 0' }}>
                          <span>{bid.price.toFixed(2)}</span>
                          <span style={{ textAlign: 'right', color: '#34d399' }}>{bid.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Execution Panel or Real Steam Position details */}
              {selectedSkinId ? (selectedSkinId.startsWith('real-') ? (
                <div className="trade-box">
                  <h4 className="section-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
                    {lang === 'de' ? 'Echte Steam-Position' : 'Real Steam Position'}
                  </h4>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Menge im Inventar:' : 'Amount in Inventory:'}</span>
                      <span style={{ fontWeight: '600' }}>{selectedSkin.qty}x</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Einstandswert:' : 'Acquisition Value:'}</span>
                      <span style={{ fontWeight: '600' }}>€{(selectedSkin.basePrice * selectedSkin.qty).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Aktueller Marktwert:' : 'Current Market Value:'}</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-green)' }}>€{(selectedSkin.price * selectedSkin.qty).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Wertentwicklung:' : 'Return:'}</span>
                      <span style={{ fontWeight: '600', color: selectedSkin.price >= selectedSkin.basePrice ? 'var(--color-green)' : 'var(--color-red)' }}>
                        {selectedSkin.price >= selectedSkin.basePrice ? '+' : ''}
                        {((selectedSkin.price - selectedSkin.basePrice) * selectedSkin.qty).toFixed(2)}€ ({selectedSkin.basePrice > 0 ? (((selectedSkin.price - selectedSkin.basePrice) / selectedSkin.basePrice * 100).toFixed(2)) : 0}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Verkaufbar:' : 'Marketable:'}</span>
                      <span style={{ fontWeight: '600', color: selectedSkin.marketable !== false ? 'var(--color-green)' : 'var(--color-red)' }}>
                        {selectedSkin.marketable !== false 
                          ? (lang === 'de' ? '✓ Ja' : '✓ Yes') 
                          : (lang === 'de' ? '✗ Nein' : '✗ No')}
                      </span>
                    </div>
                    {(() => {
                      const data = historicalDataMap[selectedSkinId] || [];
                      if (!data.length) return null;
                      const high = Math.max(...data.map(d => d.high));
                      const low = Math.min(...data.map(d => d.low));
                      const vol = low > 0 ? ((high - low) / low * 100).toFixed(2) : 0;
                      return (
                        <div className="advanced-metrics" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <h5 style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {lang === 'de' ? 'Marktdaten (' + chartTimeframe + ')' : 'Market Data (' + chartTimeframe + ')'}
                          </h5>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                            <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Hoch:' : 'High:'}</span>
                            <span style={{ fontWeight: '600' }}>€{high.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                            <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Tief:' : 'Low:'}</span>
                            <span style={{ fontWeight: '600' }}>€{low.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Volatilität:' : 'Volatility:'}</span>
                            <span style={{ fontWeight: '600' }}>{vol}%</span>
                          </div>
                        </div>
                      )
                    })()}
                    {!skins.some(s => s.id === selectedSkin.id) && (
                      <button 
                        onClick={() => handleAddToWatchlist(selectedSkin)}
                        className="steam-import-btn"
                        style={{ marginTop: '12px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                      >
                        <Plus size={14} />
                        {lang === 'de' ? 'Zu Beobachtungsliste hinzufügen' : 'Add to Watchlist'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="trade-box">
                  <h4 className="section-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
                    {lang === 'de' ? 'Preis-Alarm einrichten' : 'Set Price Alert'}
                  </h4>
                  <form onSubmit={handleAddAlert}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <div className="trade-input-group" style={{ flex: 1 }}>
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
                      <div className="trade-input-group" style={{ flex: 1 }}>
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
                    <button type="submit" className="steam-import-btn" style={{ height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Plus size={16} />
                      {lang === 'de' ? 'Alarm hinzufügen' : 'Add Alert'}
                    </button>
                  </form>
                </div>
              )) : null}
            </div>

            <aside className="layout-side">
              {/* Skins Watchlist */}
              <div className="section-header">
                <h3 className="section-title">{lang === 'de' ? 'Beobachtungsliste' : 'Watchlist'}</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {lang === 'de' ? 'Preise ticken live' : 'Prices tick live'}
                </span>
              </div>
              <div className="search-input-wrapper" style={{ margin: '0 16px 12px 16px', position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder={lang === 'de' ? 'Suchen...' : 'Search...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 8px 8px 30px', color: '#fff', fontSize: '13px', outline: 'none' }}
                />
              </div>

              {/* Top Movers Widget */}
              {topMovers.gainers.length > 0 && !searchQuery && (
                <div className="top-movers-widget" style={{ margin: '0 16px 16px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Movers</h4>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
                    {topMovers.gainers.map(g => (
                      <div key={'gainer-'+g.id} style={{ minWidth: '90px', background: 'rgba(0,209,130,0.1)', border: '1px solid rgba(0,209,130,0.2)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setSelectedSkinId(selectedSkinId === g.id ? null : g.id)}>
                        <div style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-green)', marginTop: '2px' }}>+{g.change.toFixed(2)}%</div>
                      </div>
                    ))}
                    {topMovers.losers.map(l => (
                      <div key={'loser-'+l.id} style={{ minWidth: '90px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setSelectedSkinId(selectedSkinId === l.id ? null : l.id)}>
                        <div style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-red)', marginTop: '2px' }}>{l.change.toFixed(2)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="watchlist">
                {filteredSkins.length === 0 ? (
                  <div className="empty-state">
                    {lang === 'de' 
                      ? 'Keine Skins gefunden.' 
                      : 'No skins found.'}
                  </div>
                ) : (
                  filteredSkins.map((skin) => (
                    <div 
                      key={skin.id} 
                      className={`skin-row ${selectedSkinId === skin.id ? 'skin-row--selected' : ''} ${flashStates[skin.id] === 'up' ? 'flash-up' : flashStates[skin.id] === 'down' ? 'flash-down' : ''}`}
                      onClick={() => {
                        setSelectedSkinId(selectedSkinId === skin.id ? null : skin.id)
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`skin-change ${skin.change >= 0 ? 'price-up' : 'price-down'}`}>
                            {skin.change >= 0 ? '+' : ''}{skin.change.toFixed(2)}%
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSkins(prev => prev.filter(s => s.id !== skin.id))
                            }}
                            className="alert-delete-btn"
                            style={{ padding: '2px', border: 'none', background: 'transparent' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-view">
            {realInventoryItems.length === 0 ? (
              <div className="steam-import-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
                <BarChart2 size={36} style={{ color: 'var(--color-green)', marginBottom: '16px' }} />
                <h4>{lang === 'de' ? 'Keine Analysedaten verfügbar' : 'No Analytics Data Available'}</h4>
                <p>
                  {lang === 'de' 
                    ? 'Verbinde dein Steam-Inventar im Depot-Tab, um detaillierte Portfoliostatisiken, Risikoanalysen und Gewinn/Verlust-Auswertungen zu sehen.' 
                    : 'Connect your Steam inventory in the Portfolio tab to view detailed portfolio statistics, risk analysis, and P&L breakdowns.'}
                </p>
                <button className="steam-import-btn" onClick={() => setActiveTab('portfolio')}>
                  {lang === 'de' ? 'Zum Depot wechseln' : 'Go to Portfolio'}
                </button>
              </div>
            ) : (
              <div className="analytics-grid">
                {/* Overview Card */}
                <div className="analytics-card main-summary-card">
                  <h3 className="card-subtitle">{lang === 'de' ? 'Investitionsübersicht' : 'Investment Overview'}</h3>
                  <div className="overview-stats-grid">
                    <div className="overview-stat">
                      <span className="stat-label">{lang === 'de' ? 'Aktueller Wert' : 'Current Value'}</span>
                      <span className="stat-val text-large">€{realInventorySummary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="overview-stat">
                      <span className="stat-label">{lang === 'de' ? 'Investiertes Kapital' : 'Invested Capital'}</span>
                      <span className="stat-val text-large">€{realInventorySummary.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="overview-stat">
                      <span className="stat-label">{lang === 'de' ? 'Gesamtertrag (PnL)' : 'Total Return (PnL)'}</span>
                      <span className={`stat-val text-large ${realInventorySummary.pnlVal >= 0 ? 'price-up' : 'price-down'}`}>
                        {realInventorySummary.pnlVal >= 0 ? '+' : ''}€{realInventorySummary.pnlVal.toFixed(2)} ({realInventorySummary.pnlPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Short-Term Performance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div className="overview-stat" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px' }}>
                      <span className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{lang === 'de' ? '24h Performance' : '24h Performance'}</span>
                      <span className={`stat-val ${portfolioPnL.pnl24hVal >= 0 ? 'price-up' : 'price-down'}`} style={{ fontSize: '15px' }}>
                        {portfolioPnL.pnl24hVal >= 0 ? '+' : ''}€{portfolioPnL.pnl24hVal.toFixed(2)} ({portfolioPnL.pnl24hPct.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="overview-stat" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px' }}>
                      <span className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{lang === 'de' ? '7-Tage Performance' : '7-Day Performance'}</span>
                      <span className={`stat-val ${portfolioPnL.pnl7dVal >= 0 ? 'price-up' : 'price-down'}`} style={{ fontSize: '15px' }}>
                        {portfolioPnL.pnl7dVal >= 0 ? '+' : ''}€{portfolioPnL.pnl7dVal.toFixed(2)} ({portfolioPnL.pnl7dPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Fee Breakdown */}
                  <div className="fee-breakdown-section" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <h4 className="section-title-small" style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>
                      {lang === 'de' ? 'Netto-Auszahlungsschätzungen' : 'Net Cashout Estimates'}
                    </h4>
                    <div className="fee-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span className="fee-label" style={{ color: '#94a3b8' }} title={lang === 'de' ? 'Steam Marktplatzgebühr von 15%' : 'Steam Market Fee of 15%'}>
                        {lang === 'de' ? 'Steam-Netto (15% Gebühr):' : 'Steam Net (15% fee):'}
                      </span>
                      <span className="fee-value" style={{ fontWeight: '600' }}>€{(realInventorySummary.totalValue * 0.85).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="fee-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span className="fee-label" style={{ color: '#94a3b8' }} title={lang === 'de' ? 'Drittanbieter Verkauf & Auszahlung ca. 10% Gebühr' : '3rd party selling and withdrawal average 10% fee'}>
                        {lang === 'de' ? 'Cashout-Netto (10% Gebühr):' : 'Cashout Net (10% fee):'}
                      </span>
                      <span className="fee-value text-green" style={{ fontWeight: '700', color: 'var(--color-green)' }}>€{(realInventorySummary.totalValue * 0.90).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Risk and Volatility Card */}
                <div className="analytics-card">
                  <h3 className="card-subtitle">{lang === 'de' ? 'Risikoprofil & Volatilität' : 'Risk Profile & Volatility'}</h3>
                  <div className="risk-metrics">
                    <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="metric-title" style={{ fontSize: '13px', fontWeight: '600' }}>{lang === 'de' ? 'Risiko-Klasse' : 'Risk Class'}</div>
                        <div className="metric-desc" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {lang === 'de' 
                            ? 'Basierend auf dem Anteil von Kisten (hoch) vs. Messern (niedrig).'
                            : 'Based on portion of cases (high) vs knives (low).'}
                        </div>
                      </div>
                      <div className="metric-badge-container">
                        <span className={`risk-badge risk-${riskScore.label.toLowerCase()}`} style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: riskScore.label === 'Spekulativ' || riskScore.label === 'Speculative' ? 'rgba(255,59,48,0.15)' : riskScore.label === 'Konservativ' || riskScore.label === 'Conservative' ? 'rgba(0,209,130,0.15)' : 'rgba(255,171,0,0.15)',
                          color: riskScore.label === 'Spekulativ' || riskScore.label === 'Speculative' ? 'var(--color-red)' : riskScore.label === 'Konservativ' || riskScore.label === 'Conservative' ? 'var(--color-green)' : 'var(--color-amber)'
                        }}>
                          {riskScore.score} · {riskScore.label}
                        </span>
                      </div>
                    </div>

                    <div className="metric-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="metric-title" style={{ fontSize: '13px', fontWeight: '600' }}>{lang === 'de' ? 'Durchschnittliche Volatilität' : 'Average Volatility'}</div>
                        <div className="metric-desc" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {lang === 'de'
                            ? 'Gewichtete Preisschwankung über den gewählten Zeitraum.'
                            : 'Weighted price fluctuation over the selected timeframe.'}
                        </div>
                      </div>
                      <span className="metric-value-large" style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{averageVolatility}%</span>
                    </div>
                  </div>
                </div>

                {/* Diversification & Distribution Card */}
                <div className="analytics-card">
                  <h3 className="card-subtitle">{lang === 'de' ? 'Diversifikation' : 'Diversification'}</h3>
                  <div className="diversification-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { name: lang === 'de' ? 'Messer' : 'Knives', val: realInventorySummary.distribution.knives, color: '#fbbf24' },
                      { name: lang === 'de' ? 'Handschuhe' : 'Gloves', val: realInventorySummary.distribution.gloves, color: '#f87171' },
                      { name: lang === 'de' ? 'Waffen-Skins' : 'Weapons', val: realInventorySummary.distribution.weapons, color: '#60a5fa' },
                      { name: lang === 'de' ? 'Kisten & Kapseln' : 'Cases', val: realInventorySummary.distribution.cases, color: '#a78bfa' }
                    ].map(cat => {
                      const pct = realInventorySummary.totalValue > 0 ? (cat.val / realInventorySummary.totalValue * 100) : 0;
                      return (
                        <div key={cat.name} className="diversification-row">
                          <div className="div-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span className="div-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span className="color-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} /> 
                              {cat.name}
                            </span>
                            <span className="div-values" style={{ fontWeight: '600' }}>€{cat.val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="progress-bg" style={{ height: '6px', background: '#1c1c1e', borderRadius: '3px', overflow: 'hidden' }}>
                            <div className="progress-bar" style={{ height: '100%', width: `${pct}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Break-Even / Profit distribution Card */}
                <div className="analytics-card">
                  <h3 className="card-subtitle">{lang === 'de' ? 'Profitabilitäts-Verteilung' : 'Profitability Distribution'}</h3>
                  <div className="be-stats">
                    <p className="section-desc" style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      {lang === 'de' 
                        ? 'Aufteilung deiner Items nach Gewinn/Verlust (inkl. 15% Steam-Gebühr):' 
                        : 'Your item quantities split by profit/loss (incl. 15% Steam fee):'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#1c1c1e', marginBottom: '16px' }}>
                      <div style={{ width: `${(profitDistribution.win / (realInventoryItems.length || 1)) * 100}%`, background: 'var(--color-green)' }} title="Profit" />
                      <div style={{ width: `${(profitDistribution.breakEven / (realInventoryItems.length || 1)) * 100}%`, background: 'var(--color-amber)' }} title="Break-Even" />
                      <div style={{ width: `${(profitDistribution.loss / (realInventoryItems.length || 1)) * 100}%`, background: 'var(--color-red)' }} title="Loss" />
                    </div>
                    <div className="be-legend" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="legend-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-green)' }} />
                        <span className="legend-text">{lang === 'de' ? 'Im Gewinn' : 'In Profit'} ({profitDistribution.win}x)</span>
                      </div>
                      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="legend-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-amber)' }} />
                        <span className="legend-text">{lang === 'de' ? 'Break-Even (vor Gebühr)' : 'Break-Even'} ({profitDistribution.breakEven}x)</span>
                      </div>
                      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="legend-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-red)' }} />
                        <span className="legend-text">{lang === 'de' ? 'Im Verlust' : 'In Loss'} ({profitDistribution.loss}x)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Global Market Trends Card */}
                <div className="analytics-card" style={{ gridColumn: '1 / -1' }}>
                  <h3 className="card-subtitle">{lang === 'de' ? 'Globale Markttrends (letzte 24h vs 7d)' : 'Global Market Trends (last 24h vs 7d)'}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '12px' }}>
                    
                    <div style={{ background: 'rgba(0, 209, 130, 0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0, 209, 130, 0.1)' }}>
                      <h4 style={{ fontSize: '13px', color: 'var(--color-green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={16} />
                        {lang === 'de' ? 'Top Gewinner' : 'Top Gainers'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {globalMarketTrends.gainers.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Lade Daten...</div>
                        ) : globalMarketTrends.gainers.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.name}</span>
                            <span style={{ fontWeight: '600', color: 'var(--color-green)' }}>+{item.change.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255, 59, 48, 0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 59, 48, 0.1)' }}>
                      <h4 style={{ fontSize: '13px', color: 'var(--color-red)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingDown size={16} />
                        {lang === 'de' ? 'Top Verlierer' : 'Top Losers'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {globalMarketTrends.losers.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Lade Daten...</div>
                        ) : globalMarketTrends.losers.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.name}</span>
                            <span style={{ fontWeight: '600', color: 'var(--color-red)' }}>{item.change.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Performers Card */}
                <div className="analytics-card double-width" style={{ gridColumn: 'span 2' }}>
                  <h3 className="card-subtitle">{lang === 'de' ? 'Top- & Flop-Performers' : 'Top & Flop Performers'}</h3>
                  <div className="performers-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '12px' }}>
                    <div className="perf-column">
                      <h4 className="column-title text-green" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-green)', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        ▲ Top {lang === 'de' ? 'Gewinner' : 'Gainers'}
                      </h4>
                      {performers.best.length === 0 ? (
                        <div className="perf-empty" style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>
                          {lang === 'de' ? 'Keine Positionen im Plus.' : 'No positions in profit.'}
                        </div>
                      ) : (
                        performers.best.map(item => (
                          <div key={item.id} className="perf-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                            <span className="perf-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{item.name}</span>
                            <span className="perf-pct price-up" style={{ fontWeight: '700', color: 'var(--color-green)' }}>+{item.change.toFixed(2)}%</span>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="perf-column">
                      <h4 className="column-title text-red" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-red)', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        ▼ {lang === 'de' ? 'Größte Verlierer' : 'Biggest Losers'}
                      </h4>
                      {performers.worst.length === 0 ? (
                        <div className="perf-empty" style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>
                          {lang === 'de' ? 'Keine Positionen im Minus.' : 'No positions in loss.'}
                        </div>
                      ) : (
                        performers.worst.map(item => (
                          <div key={item.id} className="perf-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                            <span className="perf-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{item.name}</span>
                            <span className="perf-pct price-down" style={{ fontWeight: '700', color: 'var(--color-red)' }}>{item.change.toFixed(2)}%</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-view layout-split">
            {realInventoryItems.length === 0 ? (
              <div className="layout-main" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <div className="steam-import-card">
                  <div className="steam-logo-container">
                    <Activity size={28} />
                  </div>
                  <h4>{lang === 'de' ? 'Steam-Inventar beobachten' : 'Observe Steam Inventory'}</h4>
                  <p>
                    {lang === 'de' 
                      ? 'Verbinde dein öffentliches Steam-Inventar, um den Wert deiner CS2-Skins live zu verfolgen – wie bei Trade Republic.' 
                      : 'Connect your public Steam inventory to track the live value of your CS2 skins – just like Trade Republic.'}
                  </p>

                  {inventoryError && (
                    <div className="alert-box">
                      <AlertTriangle size={18} style={{ color: 'var(--color-red)', flexShrink: 0, marginTop: '2px' }} />
                      <div className="alert-box-content">
                        <div className="alert-box-title">{lang === 'de' ? 'Import fehlgeschlagen' : 'Import Failed'}</div>
                        <div className="alert-box-desc">{inventoryError}</div>
                        {resolveSteamId(steamIdInput) && (
                          <a 
                            href={`https://steamcommunity.com/inventory/${resolveSteamId(steamIdInput)}/730/2?l=german`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="alert-box-link"
                          >
                            {lang === 'de' ? 'Prüfen, ob dein Inventar-Link im Browser lädt ↗' : 'Check if your inventory link loads in browser ↗'}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleImportInventory} className="steam-input-form">
                    <div className="steam-input-wrapper">
                      <input
                        type="text"
                        className="steam-input"
                        placeholder={lang === 'de' ? 'SteamID64 eingeben (z.B. 7656119...)' : 'Enter SteamID64 (e.g. 7656119...)'}
                        value={steamIdInput}
                        onChange={(e) => setSteamIdInput(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="steam-import-btn"
                      disabled={isFetchingInventory}
                    >
                      {isFetchingInventory ? (lang === 'de' ? 'Lade Inventar...' : 'Loading Inventory...') : (lang === 'de' ? 'Importieren' : 'Import')}
                    </button>
                  </form>

                  <div className="import-help-links">
                    <a 
                      href="https://steamid.io" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="import-help-btn"
                    >
                      {lang === 'de' ? 'Wo finde ich meine SteamID?' : 'Where is my SteamID?'}
                    </a>
                    <button 
                      type="button" 
                      className="import-help-btn"
                      onClick={() => setShowManualImport(true)}
                    >
                      {lang === 'de' ? 'Manuell einfügen (JSON)' : 'Insert manually (JSON)'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="layout-main">
                  {/* Real Inventory Summary Card */}
                  <div className="portfolio-summary">
                    <span className="stat-label-tr">{lang === 'de' ? 'Gesamtwert' : 'Total Net Worth'}</span>
                    <span className="stat-value-tr">€{realInventorySummary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className={`stat-change-tr ${realInventorySummary.pnlVal >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                      {realInventorySummary.pnlVal >= 0 ? '+' : ''}€{realInventorySummary.pnlVal.toFixed(2)} ({realInventorySummary.pnlPct}%) {lang === 'de' ? 'Gesamt' : 'Total'}
                    </span>
                    {realInventorySummary.nonMarketableCount > 0 && (
                      <div className="portfolio-marketable-info">
                        <span className="marketable-value">
                          {lang === 'de' ? 'Verkaufbar:' : 'Marketable:'} €{realInventorySummary.marketableValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="non-marketable-count">
                          {realInventorySummary.nonMarketableCount} {lang === 'de' ? 'Items nicht verkaufbar' : 'items not marketable'}
                        </span>
                      </div>
                    )}
                    {realInventorySummary.totalValue > 0 && (
                      <div className="portfolio-distribution" style={{ marginTop: '12px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{lang === 'de' ? 'Diversifikation' : 'Diversification'}</span>
                        </div>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: '#1c1c1e' }}>
                          <div style={{ width: `${(realInventorySummary.distribution.knives / realInventorySummary.totalValue) * 100}%`, background: '#fbbf24' }} title="Knives" />
                          <div style={{ width: `${(realInventorySummary.distribution.gloves / realInventorySummary.totalValue) * 100}%`, background: '#f87171' }} title="Gloves" />
                          <div style={{ width: `${(realInventorySummary.distribution.weapons / realInventorySummary.totalValue) * 100}%`, background: '#60a5fa' }} title="Weapons" />
                          <div style={{ width: `${(realInventorySummary.distribution.cases / realInventorySummary.totalValue) * 100}%`, background: '#a78bfa' }} title="Cases" />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></div>{lang === 'de' ? 'Messer' : 'Knives'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171' }}></div>{lang === 'de' ? 'Handschuhe' : 'Gloves'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }}></div>{lang === 'de' ? 'Waffen' : 'Weapons'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa' }}></div>{lang === 'de' ? 'Kisten' : 'Cases'}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Skin Chart (Desktop Only) */}
                  <div className="chart-card desktop-portfolio-chart">
                    <div className="chart-header-tr">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 className="chart-title-tr">{selectedSkin.name} ({lang === 'de' ? 'Live Chart' : 'Live Chart'})</h3>
                          <div className="chart-price-tr">€{selectedSkin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className={`chart-change-tr ${selectedSkin.change >= 0 ? 'price-up' : 'price-down'}`}>
                            {selectedSkin.change >= 0 ? '+' : ''}{selectedSkin.change.toFixed(2)}% {lang === 'de' ? 'Heute' : 'Today'}
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
                        data={historicalDataMap[selectedSkinId || (activeTab === 'portfolio' ? 'total_portfolio' : 'total_market')] || []} 
                        currentPrice={selectedSkin.price} 
                        isPositive={selectedSkin.change >= 0}
                      />
                    </div>
                  </div>

                  {/* Selected Position details (Desktop Only) */}
                  {selectedSkinId && selectedSkinId.startsWith('real-') && (
                    <div className="trade-box desktop-portfolio-trade" style={{ marginTop: '0' }}>
                      <h4 className="section-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
                        {lang === 'de' ? 'Echte Steam-Position' : 'Real Steam Position'}
                      </h4>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Menge im Inventar:' : 'Amount in Inventory:'}</span>
                          <span style={{ fontWeight: '600' }}>{selectedSkin.qty}x</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Einstandswert:' : 'Acquisition Value:'}</span>
                          <span style={{ fontWeight: '600' }}>€{(selectedSkin.basePrice * selectedSkin.qty).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Aktueller Marktwert:' : 'Current Market Value:'}</span>
                          <span style={{ fontWeight: '600', color: 'var(--color-green)' }}>€{(selectedSkin.price * selectedSkin.qty).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Wertentwicklung:' : 'Return:'}</span>
                          <span style={{ fontWeight: '600', color: selectedSkin.price >= selectedSkin.basePrice ? 'var(--color-green)' : 'var(--color-red)' }}>
                            {selectedSkin.price >= selectedSkin.basePrice ? '+' : ''}
                            {((selectedSkin.price - selectedSkin.basePrice) * selectedSkin.qty).toFixed(2)}€ ({selectedSkin.basePrice > 0 ? (((selectedSkin.price - selectedSkin.basePrice) / selectedSkin.basePrice * 100).toFixed(2)) : 0}%)
                          </span>
                        </div>
                        <div className="advanced-pnl" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                          <h5 style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {lang === 'de' ? 'Profit & Loss Rechner' : 'Profit & Loss Calc'}
                          </h5>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                            <span style={{ color: '#94a3b8' }} title={lang === 'de' ? 'Steam Gebühr 15%' : 'Steam Fee 15%'}>{lang === 'de' ? 'Steam Break-Even:' : 'Steam Break-Even:'}</span>
                            <span style={{ fontWeight: '600', color: selectedSkin.price >= (selectedSkin.basePrice / 0.85) ? 'var(--color-green)' : '#fff' }}>
                              €{(selectedSkin.basePrice / 0.85).toFixed(2)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#94a3b8' }} title={lang === 'de' ? 'Drittanbieter 10% Gebühr' : '3rd Party 10% Fee'}>{lang === 'de' ? 'Cashout-Wert:' : 'Cashout Value:'}</span>
                            <span style={{ fontWeight: '600', color: (selectedSkin.price * 0.9) >= selectedSkin.basePrice ? 'var(--color-green)' : 'var(--color-red)' }}>
                              €{(selectedSkin.price * 0.9 * selectedSkin.qty).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {(() => {
                          const data = historicalDataMap[selectedSkinId] || [];
                          if (!data.length) return null;
                          const high = Math.max(...data.map(d => d.high));
                          const low = Math.min(...data.map(d => d.low));
                          const vol = low > 0 ? ((high - low) / low * 100).toFixed(2) : 0;
                          return (
                            <div className="advanced-metrics" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <h5 style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {lang === 'de' ? 'Marktdaten (' + chartTimeframe + ')' : 'Market Data (' + chartTimeframe + ')'}
                              </h5>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Hoch:' : 'High:'}</span>
                                <span style={{ fontWeight: '600' }}>€{high.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Tief:' : 'Low:'}</span>
                                <span style={{ fontWeight: '600' }}>€{low.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#94a3b8' }}>{lang === 'de' ? 'Volatilität:' : 'Volatility:'}</span>
                                <span style={{ fontWeight: '600' }}>{vol}%</span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="disconnect-wrapper" style={{ marginTop: '24px' }}>
                    <button 
                      type="button" 
                      className="import-help-btn"
                      onClick={handleDisconnectInventory}
                      style={{ color: 'var(--color-red)' }}
                    >
                      {lang === 'de' ? 'Verbindung trennen' : 'Disconnect Account'}
                    </button>
                    <button 
                      type="button" 
                      className="import-help-btn"
                      onClick={() => handleImportInventory()}
                      disabled={isFetchingInventory}
                    >
                      {isFetchingInventory ? (lang === 'de' ? 'Aktualisiere...' : 'Refreshing...') : (lang === 'de' ? 'Inventar neu laden ↻' : 'Reload Inventory ↻')}
                    </button>
                  </div>
                </div>

                <aside className="layout-side">
                  <div className="section-header">
                    <h3 className="section-title">{lang === 'de' ? 'Dein Steam-Bestand' : 'Your Steam Holdings'}</h3>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {lang === 'de' ? 'Preise ticken live' : 'Prices tick live'}
                    </span>
                  </div>
                  <div className="search-input-wrapper" style={{ margin: '0 16px 12px 16px', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder={lang === 'de' ? 'Im Inventar suchen...' : 'Search inventory...'}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 8px 8px 30px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div className="portfolio-list">
                    {filteredPortfolio.length === 0 ? (
                      <div className="empty-state">
                        {lang === 'de' ? 'Keine passenden Items gefunden.' : 'No matching items found.'}
                      </div>
                    ) : filteredPortfolio.map((item) => {
                      const currentVal = item.price * item.qty
                      const investedVal = item.basePrice * item.qty
                      const itemPnl = parseFloat((currentVal - investedVal).toFixed(2))
                      const itemPnlPct = parseFloat((investedVal > 0 ? (itemPnl / investedVal * 100) : 0).toFixed(2))

                      return (
                        <div 
                          key={item.id} 
                          className={`portfolio-card skin-row ${selectedSkinId === item.id ? 'skin-row--selected' : ''} ${flashStates[item.id] === 'up' ? 'flash-up' : flashStates[item.id] === 'down' ? 'flash-down' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedSkinId(selectedSkinId === item.id ? null : item.id)
                            if (window.matchMedia('(max-width: 767px)').matches && selectedSkinId !== item.id) {
                              setActiveTab('market')
                            }
                          }}
                        >
                          <div className="skin-info-left">
                            <div className="skin-icon-container">
                              <img src={item.img} alt={item.name} className="skin-img" />
                              {item.marketable === false && (
                                <span className="not-marketable-dot" title={lang === 'de' ? 'Nicht verkaufbar' : 'Not marketable'} />
                              )}
                            </div>
                            <div className="skin-meta">
                              <span className="skin-name">{item.name}</span>
                              <span className="qty-label">
                                {item.qty}x • {item.wear}
                                {item.marketable === false && (
                                  <span className="not-marketable-tag">{lang === 'de' ? ' • Nicht verkaufbar' : ' • Not marketable'}</span>
                                )}
                              </span>
                              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                {lang === 'de' 
                                  ? `Ø Kauf: €${item.basePrice.toFixed(2)} | Break-Even: €${(item.basePrice / 0.85).toFixed(2)}` 
                                  : `Avg Buy: €${item.basePrice.toFixed(2)} | Break-Even: €${(item.basePrice / 0.85).toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                          <div className="skin-info-right">
                            <span className="skin-price">€{currentVal.toFixed(2)}</span>
                            <span className={`pnl-badge ${itemPnl >= 0 ? 'pnl-badge--up' : 'pnl-badge--down'}`}>
                              {itemPnl >= 0 ? '+' : ''}€{itemPnl.toFixed(2)} ({itemPnlPct}%)
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </aside>
              </>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-view layout-split">
            <div className="layout-main">
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

            <aside className="layout-side">
              {/* Create Alert Form */}
              <div className="trade-box" style={{ marginTop: '0' }}>
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
                    <button type="submit" className="steam-import-btn" style={{ margin: '8px 0 0 0', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Plus size={16} />
                      {lang === 'de' ? 'Alert hinzufügen' : 'Add Alert'}
                    </button>
                  </div>
                </form>
              </div>
            </aside>
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
          className={`tab-btn ${activeTab === 'analytics' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 className="tab-icon" />
          <span>{lang === 'de' ? 'Analyse' : 'Analytics'}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell className="tab-icon" />
          <span>Alarme</span>
        </button>
      </nav>
      </div>

      {/* Manual Import Modal */}
      {showManualImport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{lang === 'de' ? 'Steam-Inventar manuell einfügen' : 'Manually Paste Steam Inventory'}</h3>
            <p>
              {lang === 'de' 
                ? 'Aufgrund von Steam-Sicherheitsbeschränkungen kann das automatische Laden fehlschlagen. Kopiere das JSON von diesem Link und füge es unten ein:' 
                : 'Due to Steam security limits, automatic load might fail. Copy the JSON from this link and paste it below:'}
            </p>
            <a 
              href={`https://steamcommunity.com/inventory/${resolveSteamId(steamIdInput)}/730/2?l=german`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="alert-box-link"
              style={{ display: 'block', marginBottom: '16px', fontWeight: 'bold', fontSize: '13px' }}
            >
              {lang === 'de' ? 'Hier klicken, um dein Steam-Inventar JSON zu öffnen ↗' : 'Click here to open your Steam inventory JSON ↗'}
            </a>
            <textarea
              className="manual-json-textarea"
              placeholder={lang === 'de' ? 'Füge hier das kopierte JSON ein (z.B. { "assets": [...], "descriptions": [...] })' : 'Paste copied JSON here...'}
              value={manualJson}
              onChange={(e) => setManualJson(e.target.value)}
            />
            <div className="modal-buttons">
              <button 
                className="steam-import-btn" 
                onClick={handleManualImport}
                style={{ background: 'linear-gradient(135deg, #00ff66 0%, #00cc52 100%)', height: '40px', padding: '0' }}
              >
                {lang === 'de' ? 'Importieren' : 'Import'}
              </button>
              <button 
                className="steam-import-btn cancel-btn" 
                onClick={() => setShowManualImport(false)}
                style={{ height: '40px', padding: '0' }}
              >
                {lang === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
