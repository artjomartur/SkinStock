/**
 * Fetch live prices from Skinport API for CS2 items.
 * The API returns a list of all items. We can filter this to match our local inventory.
 * 
 * @param {string} currency - 'EUR' or 'USD'
 * @returns {Promise<Object>} Dictionary of { "Item Name": { min_price, suggested_price, median_price, created_at } }
 */
export async function fetchLivePrices(currency = 'EUR') {
  try {
    // Skinport API endpoint for CS2 items (app_id=730)
    // No auth required for this specific public endpoint, but rate limits apply.
    const url = `https://api.skinport.com/v1/items?app_id=730&currency=${currency}&tradable=0`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Skinport API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform array into a dictionary map for O(1) lookups by market_hash_name
    const priceMap = {};
    for (const item of data) {
      if (item.market_hash_name) {
        priceMap[item.market_hash_name] = {
          min_price: item.min_price,
          suggested_price: item.suggested_price,
          median_price: item.median_price,
          updated_at: item.created_at
        };
      }
    }
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching live prices:', error);
    return null;
  }
}

/**
 * Updates an inventory array with live prices.
 * @param {Array} inventory 
 * @param {Object} priceMap 
 * @returns {Array} Updated inventory array
 */
export function updateInventoryWithLivePrices(inventory, priceMap) {
  if (!priceMap || !inventory) return inventory;

  return inventory.map(item => {
    // Attempt to find the item in the price map. 
    // This requires that item.name matches the Steam market_hash_name exactly.
    // e.g. "AK-47 | Redline (Field-Tested)" -> "AK-47 | Redline (Field-Tested)"
    
    // Some local items might use abbreviations like "(FT)", we need to handle that if necessary.
    let searchName = item.name;
    
    // Helper to replace abbreviations with full wears
    const wearMap = {
      '(FN)': '(Factory New)',
      '(MW)': '(Minimal Wear)',
      '(FT)': '(Field-Tested)',
      '(WW)': '(Well-Worn)',
      '(BS)': '(Battle-Scarred)'
    };

    for (const [abbr, full] of Object.entries(wearMap)) {
      if (searchName.includes(abbr)) {
        searchName = searchName.replace(abbr, full);
        break;
      }
    }

    const liveData = priceMap[searchName];
    
    if (liveData && liveData.suggested_price) {
      const newPrice = liveData.suggested_price;
      // We also update prevPrice so we can calculate the `change`
      const prevPrice = item.price;
      const change = newPrice !== prevPrice ? ((newPrice - prevPrice) / prevPrice) * 100 : item.change;
      
      return {
        ...item,
        price: newPrice,
        prevPrice: prevPrice,
        change: parseFloat(change.toFixed(2))
      };
    }

    // Return unchanged if not found
    return item;
  });
}
