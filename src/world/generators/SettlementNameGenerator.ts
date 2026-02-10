/**
 * Generate unique names for settlements based on their type
 */

// Name components for different settlement types
const CITY_PREFIXES = [
  "Kings", "Queens", "Lords", "Merchants", "Traders", "Masters",
  "High", "New", "Old", "Grand", "Great", "Royal", "Imperial"
];

const CITY_ROOTS = [
  "haven", "port", "bridge", "cross", "gate", "way", "bury",
  "stead", "ton", "ford", "castle", "hall", "keep", "crown"
];

const VILLAGE_PREFIXES = [
  "Green", "Oak", "Elm", "Pine", "River", "Stone", "Mill",
  "Brook", "Hill", "Dale", "Meadow", "Marsh", "Lake", "Wood"
];

const VILLAGE_SUFFIXES = [
  "vale", "brook", "field", "wood", "glen", "ton", "ham",
  "ford", "bridge", "mill", "hollow", "ridge", "creek", "run"
];

const HAMLET_PREFIXES = [
  "Little", "Upper", "Lower", "East", "West", "North", "South",
  "Sunny", "Rocky", "Misty", "Quiet", "Windy", "Foggy", "Cold"
];

const HAMLET_NAMES = [
  "Thorp", "Dell", "Cove", "Nook", "Rest", "End", "Corner",
  "Bend", "Point", "Gap", "Pass", "Ridge", "Peak", "Vale"
];

// Specialization-themed names
const MINING_WORDS = ["Iron", "Copper", "Silver", "Gold", "Stone", "Coal", "Ore", "Rock"];
const FARMING_WORDS = ["Harvest", "Grain", "Wheat", "Field", "Farm", "Crop", "Seed"];
const FISHING_WORDS = ["Fisher", "Anchor", "Wave", "Bay", "Dock", "Net", "Tide"];
const TRADING_WORDS = ["Market", "Fair", "Trade", "Merchant", "Exchange", "Plaza"];
const LUMBER_WORDS = ["Timber", "Log", "Forest", "Grove", "Lumber", "Cedar", "Pine"];

/**
 * Generate a city name
 */
function generateCityName(usedNames: Set<string>): string {
  let attempts = 0;
  while (attempts < 100) {
    const prefix = CITY_PREFIXES[Math.floor(Math.random() * CITY_PREFIXES.length)];
    const root = CITY_ROOTS[Math.floor(Math.random() * CITY_ROOTS.length)];
    const name = `${prefix}${root}`;
    
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    attempts++;
  }
  
  // Fallback with number
  const baseName = "Kingshaven";
  let i = 1;
  while (usedNames.has(`${baseName}${i}`)) i++;
  usedNames.add(`${baseName}${i}`);
  return `${baseName}${i}`;
}

/**
 * Generate a village name, optionally themed by specialization
 */
function generateVillageName(
  usedNames: Set<string>,
  specialization?: string
): string {
  let attempts = 0;
  while (attempts < 100) {
    let prefix: string;
    
    // Choose prefix based on specialization
    if (specialization && Math.random() < 0.6) {
      switch (specialization) {
        case "mining":
          prefix = MINING_WORDS[Math.floor(Math.random() * MINING_WORDS.length)];
          break;
        case "farming":
          prefix = FARMING_WORDS[Math.floor(Math.random() * FARMING_WORDS.length)];
          break;
        case "fishing":
          prefix = FISHING_WORDS[Math.floor(Math.random() * FISHING_WORDS.length)];
          break;
        case "trading":
          prefix = TRADING_WORDS[Math.floor(Math.random() * TRADING_WORDS.length)];
          break;
        case "lumber":
          prefix = LUMBER_WORDS[Math.floor(Math.random() * LUMBER_WORDS.length)];
          break;
        default:
          prefix = VILLAGE_PREFIXES[Math.floor(Math.random() * VILLAGE_PREFIXES.length)];
      }
    } else {
      prefix = VILLAGE_PREFIXES[Math.floor(Math.random() * VILLAGE_PREFIXES.length)];
    }
    
    const suffix = VILLAGE_SUFFIXES[Math.floor(Math.random() * VILLAGE_SUFFIXES.length)];
    const name = `${prefix}${suffix}`;
    
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    attempts++;
  }
  
  // Fallback
  const baseName = "Greenwood";
  let i = 1;
  while (usedNames.has(`${baseName}${i}`)) i++;
  usedNames.add(`${baseName}${i}`);
  return `${baseName}${i}`;
}

/**
 * Generate a hamlet name, optionally themed by specialization
 */
function generateHamletName(
  usedNames: Set<string>,
  specialization?: string
): string {
  let attempts = 0;
  while (attempts < 100) {
    let descriptor: string;
    
    // Choose descriptor based on specialization
    if (specialization && Math.random() < 0.5) {
      switch (specialization) {
        case "mining":
          descriptor = MINING_WORDS[Math.floor(Math.random() * MINING_WORDS.length)];
          break;
        case "farming":
          descriptor = FARMING_WORDS[Math.floor(Math.random() * FARMING_WORDS.length)];
          break;
        case "fishing":
          descriptor = FISHING_WORDS[Math.floor(Math.random() * FISHING_WORDS.length)];
          break;
        case "lumber":
          descriptor = LUMBER_WORDS[Math.floor(Math.random() * LUMBER_WORDS.length)];
          break;
        default:
          descriptor = HAMLET_PREFIXES[Math.floor(Math.random() * HAMLET_PREFIXES.length)];
      }
    } else {
      descriptor = HAMLET_PREFIXES[Math.floor(Math.random() * HAMLET_PREFIXES.length)];
    }
    
    const base = HAMLET_NAMES[Math.floor(Math.random() * HAMLET_NAMES.length)];
    const name = `${descriptor} ${base}`;
    
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    attempts++;
  }
  
  // Fallback
  const baseName = "Little Thorp";
  let i = 1;
  while (usedNames.has(`${baseName} ${i}`)) i++;
  usedNames.add(`${baseName} ${i}`);
  return `${baseName} ${i}`;
}

/**
 * Settlement name generator that ensures unique names
 */
export class SettlementNameGenerator {
  private usedNames: Set<string>;
  
  constructor() {
    this.usedNames = new Set();
  }
  
  /**
   * Generate a name for a settlement
   */
  generateName(
    type: "city" | "village" | "hamlet",
    specialization?: string
  ): string {
    switch (type) {
      case "city":
        return generateCityName(this.usedNames);
      case "village":
        return generateVillageName(this.usedNames, specialization);
      case "hamlet":
        return generateHamletName(this.usedNames, specialization);
      default:
        return "Unknown";
    }
  }
  
  /**
   * Clear all used names (for new world generation)
   */
  reset(): void {
    this.usedNames.clear();
  }
}
