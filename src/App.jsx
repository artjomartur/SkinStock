import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createChart, AreaSeries } from 'lightweight-charts'

const lang = typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('de') ? 'de' : 'en';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Bell, 
  Activity,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import './App.css'
import defaultInventory from './defaultInventory.json'

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
function SkinChart({ data, currentPrice, isPositive }) {
  const chartContainerRef = useRef()
  const seriesRef = useRef()
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
      height: 220
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
    }
  }, [currentPrice, data])

  return <div ref={chartContainerRef} style={{ width: '100%', height: '220px' }} />
}

export default function App() {
  const [activeTab, setActiveTab] = useState('market') // 'market' | 'portfolio' | 'alerts'
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

  useEffect(() => {
    localStorage.setItem('skinstock_watchlist', JSON.stringify(skins))
  }, [skins])
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
  const [selectedSkinId, setSelectedSkinId] = useState(() => {
    try {
      const stored = localStorage.getItem('skinstock_real_inventory')
      let items = defaultInventory
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed
        }
      }
      return items && items.length > 0 ? items[0].id : 'ak47-redline'
    } catch {
      return 'ak47-redline'
    }
  })
  const [flashStates, setFlashStates] = useState({}) // skinId -> 'up' | 'down'
  
  // Real Steam Inventory state
  const [steamIdInput, setSteamIdInput] = useState(() => localStorage.getItem('skinstock_steam_id') || '76561198308463275')
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
        img: desc.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url}/360fx360f` : ''
      })
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
    const map = {}
    INITIAL_SKINS.forEach((skin) => {
      map[skin.id] = generateHistoricalData(skin.basePrice)
    })
    realInventoryItems.forEach((skin) => {
      map[skin.id] = generateHistoricalData(skin.basePrice)
    })
    return map
  }, [realInventoryItems])

  const selectedSkin = useMemo(() => {
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
  }, [skins, selectedSkinId, realInventoryItems])

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

    realInventoryItems.forEach((item) => {
      holdingsValue += item.price * item.qty
      totalInvested += item.basePrice * item.qty
    })

    const pnlVal = parseFloat((holdingsValue - totalInvested).toFixed(2))
    const pnlPct = totalInvested === 0 ? 0 : parseFloat((pnlVal / totalInvested * 100).toFixed(2))

    return {
      totalValue: parseFloat(holdingsValue.toFixed(2)),
      pnlVal,
      pnlPct
    }
  }, [realInventoryItems])

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
            className={`sidebar-nav-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={20} />
            <span>Alarme</span>
          </button>
        </nav>

        <div className="sidebar-footer">
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
                  <h3 className="chart-title-tr">{selectedSkin.name}</h3>
                  <div className="chart-price-tr">€{selectedSkin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className={`chart-change-tr ${selectedSkin.change >= 0 ? 'price-up' : 'price-down'}`}>
                    {selectedSkin.change >= 0 ? '+' : ''}{selectedSkin.change.toFixed(2)}% {lang === 'de' ? 'Heute' : 'Today'}
                  </div>
                </div>
                <div className="chart-body-container">
                  <SkinChart 
                    data={historicalDataMap[selectedSkinId]} 
                    currentPrice={selectedSkin.price} 
                    isPositive={selectedSkin.change >= 0}
                  />
                </div>
              </div>

              {/* Trade Execution Panel or Real Steam Position details */}
              {selectedSkinId.startsWith('real-') ? (
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
              )}
            </div>

            <aside className="layout-side">
              {/* Skins Watchlist */}
              <div className="section-header">
                <h3 className="section-title">{lang === 'de' ? 'Beobachtungsliste' : 'Watchlist'}</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {lang === 'de' ? 'Preise ticken live' : 'Prices tick live'}
                </span>
              </div>
              <div className="watchlist">
                {skins.length === 0 ? (
                  <div className="empty-state">
                    {lang === 'de' 
                      ? 'Deine Beobachtungsliste ist leer. Tippe im Depot auf ein Item und füge es hinzu.' 
                      : 'Your watchlist is empty. Tap an item in the Depot to add it here.'}
                  </div>
                ) : (
                  skins.map((skin) => (
                    <div 
                      key={skin.id} 
                      className={`skin-row ${selectedSkinId === skin.id ? 'skin-row--selected' : ''} ${flashStates[skin.id] === 'up' ? 'flash-up' : flashStates[skin.id] === 'down' ? 'flash-down' : ''}`}
                      onClick={() => {
                        setSelectedSkinId(skin.id)
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
                  </div>

                  {/* Selected Skin Chart (Desktop Only) */}
                  {selectedSkinId && (
                    <div className="chart-card desktop-portfolio-chart">
                      <div className="chart-header-tr">
                        <h3 className="chart-title-tr">{selectedSkin.name} ({lang === 'de' ? 'Live Chart' : 'Live Chart'})</h3>
                        <div className="chart-price-tr">€{selectedSkin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className={`chart-change-tr ${selectedSkin.change >= 0 ? 'price-up' : 'price-down'}`}>
                          {selectedSkin.change >= 0 ? '+' : ''}{selectedSkin.change.toFixed(2)}% {lang === 'de' ? 'Heute' : 'Today'}
                        </div>
                      </div>
                      <div className="chart-body-container">
                        <SkinChart 
                          data={historicalDataMap[selectedSkinId] || []} 
                          currentPrice={selectedSkin.price} 
                          isPositive={selectedSkin.change >= 0}
                        />
                      </div>
                    </div>
                  )}

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
                  <div className="portfolio-list">
                    {realInventoryItems.map((item) => {
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
                            setSelectedSkinId(item.id)
                            if (window.matchMedia('(max-width: 767px)').matches) {
                              setActiveTab('market')
                            }
                          }}
                        >
                          <div className="skin-info-left">
                            <div className="skin-icon-container">
                              <img src={item.img} alt={item.name} className="skin-img" />
                            </div>
                            <div className="skin-meta">
                              <span className="skin-name">{item.name}</span>
                              <span className="qty-label">{item.qty}x • {item.wear}</span>
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
              href={`https://steamcommunity.com/inventory/${resolveSteamId(steamIdInput) || '76561198000000000'}/730/2?l=german`} 
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
