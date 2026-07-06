export const rarityColors = {
  'Consumer Grade': '#B0C3D9',
  'Industrial Grade': '#5E98D9',
  'Mil-Spec Grade': '#4B69FF',
  'Restricted': '#8847FF',
  'Classified': '#D32CE6',
  'Covert': '#EB4B4B',
  'Contraband': '#E4AE39'
};

export const nextRarityMap = {
  'Consumer Grade': 'Industrial Grade',
  'Industrial Grade': 'Mil-Spec Grade',
  'Mil-Spec Grade': 'Restricted',
  'Restricted': 'Classified',
  'Classified': 'Covert',
  'Covert': null,
  'Contraband': null
};

export const collections = [
  {
    name: "The Anubis Collection",
    itemsByRarity: {
      "Consumer Grade": ["R8 Revolver | Inlay", "M249 | Submerged", "XM1014 | Hieroglyph", "MP7 | Sunbaked", "Five-SeveN | Crimson Blossom"],
      "Industrial Grade": ["SSG 08 | Azure Glyph", "USP-S | Desert Tactical", "MAC-10 | Echoing Motherboard", "Tec-9 | Mummy's Rot"],
      "Mil-Spec Grade": ["AK-47 | Steel Delta", "AWP | Black Nile", "P250 | Apep's Curse", "Nova | Sobek's Bite"],
      "Restricted": ["Glock-18 | Ramese's Lisp", "P90 | Sacred Scorpions", "MAG-7 | Copper Coated"],
      "Classified": ["FAMAS | Waters of Nephthys", "P90 | Run and Hide"],
      "Covert": ["M4A4 | Eye of Horus"]
    }
  },
  {
    name: "The Revolution Collection",
    itemsByRarity: {
      "Mil-Spec Grade": ["MP9 | Featherweight", "MAG-7 | Insomnia", "SCAR-20 | Fragments", "P250 | Re.Tr.O", "SG 553 | Cyberforce", "Tec-9 | Rebel"],
      "Restricted": ["M4A1-S | Emphorosaur-S", "Glock-18 | Umbral Rabbit", "MAC-10 | Sakkaku", "R8 Revolver | Banana", "P90 | Neoqueen"],
      "Classified": ["AWP | Duality", "UMP-45 | Wild Child", "P2000 | Wicked Sick"],
      "Covert": ["AK-47 | Head Shot", "M4A4 | Temukau"]
    }
  },
  {
    name: "The Recoil Collection",
    itemsByRarity: {
      "Mil-Spec Grade": ["FAMAS | Meow 36", "Galil AR | Destroyer", "M4A4 | Poly Mag", "MAC-10 | Monkeyflage", "Negev | Drop Me", "UMP-45 | Roadblock", "Glock-18 | Winterized"],
      "Restricted": ["P250 | Visions", "Dual Berettas | Flora Carnivora", "SG 553 | Dragon Tech", "M249 | Baby Karambit", "R8 Revolver | Crazy 8"],
      "Classified": ["AWP | Chromatic Aberration", "Sawed-Off | Kiss♥Love", "P90 | Vent Rush"],
      "Covert": ["USP-S | Printstream", "AK-47 | Ice Coaled"]
    }
  },
  {
    name: "The Dreams & Nightmares Collection",
    itemsByRarity: {
      "Mil-Spec Grade": ["MAC-10 | Ensnared", "Five-SeveN | Scrawl", "MAG-7 | Foresight", "MP5-SD | Necro Jr.", "P2000 | Lifted Spirits", "SCAR-20 | Poultrygeist", "XM1014 | Zombie offensive"],
      "Restricted": ["M4A1-S | Night Terror", "USP-S | Ticket to Hell", "Glock-18 | Winterized", "Glock-18 | Pink DDPAT", "PP-Bizon | Space Cat"],
      "Classified": ["MP9 | Starlight Protector", "Dual Berettas | Melondrama", "FAMAS | Rapid Eye Movement"],
      "Covert": ["AK-47 | Nightwish", "MP9 | Starlight Protector"]
    }
  },
  {
    name: "The Snakebite Collection",
    itemsByRarity: {
      "Mil-Spec Grade": ["SG 553 | Heavy Metal", "Glock-18 | Clear Polymer", "MAC-10 | Button Masher", "M249 | O.S.I.P.R.", "Nova | Windblown", "P250 | Cyber Shell", "UMP-45 | Oscillator"],
      "Restricted": ["AK-47 | Slate", "Desert Eagle | Trigger Discipline", "P2000 | Space Race", "CZ75-Auto | Red Astor"],
      "Classified": ["XM1014 | XOXO", "USP-S | The Traius", "Galil AR | Chromatic Aberration"],
      "Covert": ["M4A4 | In Living Color", "USP-S | The Traius"]
    }
  }
];

export function getFloatLimits(skinName) {
  const nameLower = skinName.toLowerCase();
  if (nameLower.includes('redline')) {
    return { min: 0.08, max: 0.80 };
  } else if (nameLower.includes('asiimov')) {
    return { min: 0.18, max: 1.00 };
  } else if (nameLower.includes('vulcan')) {
    return { min: 0.00, max: 0.90 };
  }
  return { min: 0.0, max: 1.0 };
}

// Find which collection a skin belongs to based on its name
export function findCollectionForSkin(skinName) {
  // Strip wear details if any
  const cleanName = skinName.split(' (')[0];
  for (const col of collections) {
    for (const rarity in col.itemsByRarity) {
      if (col.itemsByRarity[rarity].includes(cleanName)) {
        return col.name;
      }
    }
  }
  return null;
}

// Get the rarity level of a skin based on its name or default list
export function getSkinRarity(skinName) {
  const cleanName = skinName.split(' (')[0];
  for (const col of collections) {
    for (const rarity in col.itemsByRarity) {
      if (col.itemsByRarity[rarity].includes(cleanName)) {
        return rarity;
      }
    }
  }
  // Fallback check by matching substrings or baseline prices
  return 'Mil-Spec Grade'; // Default fallback
}
