import { Palette } from "../rendering/Palette";

/**
 * Natural resources that can be found and exploited across the map.
 * Each resource type has specific terrain preferences and rarity.
 */
export enum ResourceType {
  None = "none",
  
  // Renewable resources (from nature)
  WildGame = "wild_game",         // Hunting in dense forests
  Fish = "fish",                   // Fishing in waters and shores
  Timber = "timber",               // Lumber from forests
  
  // Agricultural/Pastoral resources
  Livestock = "livestock",         // Sheep, cattle on plains/hills
  Wheat = "wheat",                 // Grain from fields
  Vegetables = "vegetables",       // Fresh vegetables from gardens/fields
  Clay = "clay",                   // Pottery, bricks - plains
  
  // Common minerals
  Stone = "stone",                 // Building material - mountains
  Copper = "copper",               // Tools, early metalwork - hills
  Salt = "salt",                   // Preservation, trade - shores
  
  // Valuable minerals
  Iron = "iron",                   // Weapons, tools - mountains/hills
  Silver = "silver",               // Currency, jewelry - rare in mountains
  Gold = "gold",                   // Currency, luxury - very rare
  Gems = "gems",                   // Luxury, trade - very rare in mountains
}

/**
 * Configuration for each resource type
 */
export interface ResourceConfig {
  name: string;
  description: string;
  color: number;         // Primary color for the icon
  accentColor: number;   // Secondary color for highlights
  /** Base spawn chance (0-1) when conditions are met */
  baseSpawnChance: number;
  /** Can this resource be depleted? */
  renewable: boolean;
  /** Resource category for game mechanics */
  category: "food" | "material" | "mineral" | "luxury";
}

/**
 * Resource configuration database
 */
export const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
  [ResourceType.None]: {
    name: "None",
    description: "No resource",
    color: 0x000000,
    accentColor: 0x000000,
    baseSpawnChance: 0,
    renewable: false,
    category: "material",
  },
  
  // === RENEWABLE RESOURCES ===
  [ResourceType.WildGame]: {
    name: "Wild Game",
    description: "Deer, boar, and other game animals for hunting",
    color: Palette.forestDark,
    accentColor: 0x8B4513, // Brown for animals
    baseSpawnChance: 0.05,
    renewable: true,
    category: "food",
  },
  
  [ResourceType.Fish]: {
    name: "Fish",
    description: "Abundant fishing grounds",
    color: Palette.waterShallow,
    accentColor: 0xC0C0C0, // Silver for fish
    baseSpawnChance: 0.025, // Increased for more coastal fishing villages
    renewable: true,
    category: "food",
  },
  
  [ResourceType.Timber]: {
    name: "Timber",
    description: "Quality lumber for construction",
    color: Palette.forestMedium,
    accentColor: 0xD2691E, // Chestnut brown
    baseSpawnChance: 0.04,
    renewable: true,
    category: "material",
  },
  
  // === AGRICULTURAL/PASTORAL ===
  [ResourceType.Livestock]: {
    name: "Livestock",
    description: "Sheep and cattle grazing lands",
    color: Palette.plainsLight,
    accentColor: 0xF5F5DC, // Beige/wheat color
    baseSpawnChance: 0.03,
    renewable: true,
    category: "food",
  },
  
  [ResourceType.Wheat]: {
    name: "Wheat",
    description: "Grain fields for bread and food",
    color: 0xF0E68C, // Khaki/wheat color
    accentColor: 0xDAA520, // Goldenrod
    baseSpawnChance: 0.035,
    renewable: true,
    category: "food",
  },
  
  [ResourceType.Vegetables]: {
    name: "Vegetables",
    description: "Fresh vegetables from gardens and fields",
    color: 0x32CD32, // Lime green
    accentColor: 0x228B22, // Forest green
    baseSpawnChance: 0.03,
    renewable: true,
    category: "food",
  },
  
  [ResourceType.Clay]: {
    name: "Clay",
    description: "Clay deposits for pottery and bricks",
    color: 0xB87333, // Clay brown
    accentColor: 0xCD853F, // Peru brown
    baseSpawnChance: 0.02,
    renewable: false,
    category: "material",
  },
  
  // === COMMON MINERALS ===
  [ResourceType.Stone]: {
    name: "Stone",
    description: "Quarry-quality building stone",
    color: Palette.mountainStone,
    accentColor: 0xD3D3D3, // Light gray
    baseSpawnChance: 0.08,
    renewable: false,
    category: "material",
  },
  
  [ResourceType.Copper]: {
    name: "Copper",
    description: "Copper ore for tools and trade",
    color: 0xB87333, // Copper color
    accentColor: 0xCD7F32, // Bronze
    baseSpawnChance: 0.03,
    renewable: false,
    category: "mineral",
  },
  
  [ResourceType.Salt]: {
    name: "Salt",
    description: "Salt deposits for preservation and trade",
    color: 0xFFFFFF, // White
    accentColor: 0xF0F0F0, // Off-white
    baseSpawnChance: 0.02,
    renewable: false,
    category: "material",
  },
  
  // === VALUABLE MINERALS ===
  [ResourceType.Iron]: {
    name: "Iron",
    description: "Iron ore for weapons and tools",
    color: 0x708090, // Slate gray
    accentColor: 0x778899, // Light slate gray
    baseSpawnChance: 0.025,
    renewable: false,
    category: "mineral",
  },
  
  [ResourceType.Silver]: {
    name: "Silver",
    description: "Precious silver ore",
    color: 0xC0C0C0, // Silver
    accentColor: 0xE8E8E8, // Light silver
    baseSpawnChance: 0.008,
    renewable: false,
    category: "luxury",
  },
  
  [ResourceType.Gold]: {
    name: "Gold",
    description: "Rare gold deposits",
    color: 0xFFD700, // Gold
    accentColor: 0xFFA500, // Orange-gold
    baseSpawnChance: 0.004,
    renewable: false,
    category: "luxury",
  },
  
  [ResourceType.Gems]: {
    name: "Gems",
    description: "Precious gemstones",
    color: 0x9370DB, // Medium purple
    accentColor: 0x8A2BE2, // Blue violet
    baseSpawnChance: 0.004,
    renewable: false,
    category: "luxury",
  },
};

/**
 * Resource deposit represents a specific quantity of a resource at a location
 */
export interface ResourceDeposit {
  type: ResourceType;
  /** Remaining quantity (for non-renewable resources) */
  quantity: number;
  /** Quality/richness of the deposit (0-1, affects yield) */
  quality: number;
}
