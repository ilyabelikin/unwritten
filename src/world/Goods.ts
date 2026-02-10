import { Palette } from "../rendering/Palette";

/**
 * Produced goods that are created through production buildings.
 * These are distinct from natural resources and represent manufactured items.
 */
export enum GoodType {
  None = "none",
  
  // Fuel
  Coal = "coal",                     // Fuel for production
  Charcoal = "charcoal",             // Alternative fuel from timber
  
  // Food ingredients (intermediate products)
  Flour = "flour",                   // Ground wheat for baking
  
  // Metal ingots
  CopperIngot = "copper_ingot",      // Smelted copper
  IronIngot = "iron_ingot",          // Smelted iron
  SilverIngot = "silver_ingot",      // Smelted silver
  GoldIngot = "gold_ingot",          // Smelted gold
  
  // Construction materials
  Planks = "planks",                 // Processed lumber
  Bricks = "bricks",                 // Fired clay bricks
  
  // Weapons
  CopperSword = "copper_sword",      // Basic copper weapon
  IronSword = "iron_sword",          // Standard iron weapon
  SteelSword = "steel_sword",        // High-quality weapon
  
  // Tools
  CopperTools = "copper_tools",      // Basic tools
  IronTools = "iron_tools",          // Standard tools
  
  // Armor
  LeatherArmor = "leather_armor",    // Light armor
  IronArmor = "iron_armor",          // Heavy armor
  
  // Processed goods
  Leather = "leather",               // Tanned leather from livestock
  Cloth = "cloth",                   // Woven fabric
  
  // Food goods
  Bread = "bread",                   // Baked from wheat
  Meat = "meat",                     // Butchered from livestock/game
  PreparedFish = "prepared_fish",    // Processed fish
  CookedVegetables = "cooked_vegetables",  // Prepared vegetables
  
  // Luxury goods
  Jewelry = "jewelry",               // Crafted from precious metals/gems
  Pottery = "pottery",               // Fired clay goods
}

/**
 * Configuration for each good type
 */
export interface GoodConfig {
  name: string;
  description: string;
  color: number;         // Primary color for the icon
  accentColor: number;   // Secondary color for highlights
  /** Category for organizing goods */
  category: GoodCategory;
  /** Base trade value (relative) */
  value: number;
  /** Weight per unit (for future transport mechanics) */
  weight: number;
}

/**
 * Categories for produced goods
 */
export type GoodCategory = "fuel" | "material" | "weapon" | "tool" | "armor" | "luxury" | "processed" | "food";

/**
 * Represents a stack of goods in storage
 */
export interface GoodStack {
  type: GoodType;
  quantity: number;
}

/**
 * Good configuration database
 */
export const GOOD_CONFIG: Record<GoodType, GoodConfig> = {
  [GoodType.None]: {
    name: "None",
    description: "No good",
    color: 0x000000,
    accentColor: 0x000000,
    category: "material",
    value: 0,
    weight: 0,
  },
  
  // === FUEL ===
  [GoodType.Coal]: {
    name: "Coal",
    description: "Essential fuel for smelting and forging",
    color: 0x2C2C2C, // Dark gray/black
    accentColor: 0x4A4A4A, // Lighter gray
    category: "fuel",
    value: 2,
    weight: 1,
  },
  
  [GoodType.Charcoal]: {
    name: "Charcoal",
    description: "Charcoal made from timber, burns hot",
    color: 0x1C1C1C, // Very dark gray
    accentColor: 0x3C3C3C,
    category: "fuel",
    value: 1.5,
    weight: 0.5,
  },
  
  // === FOOD INGREDIENTS ===
  [GoodType.Flour]: {
    name: "Flour",
    description: "Ground wheat flour ready for baking",
    color: 0xFFF8DC, // Cornsilk (off-white)
    accentColor: 0xF5DEB3, // Wheat
    category: "food",
    value: 1.5,
    weight: 0.5,
  },
  
  // === METAL INGOTS ===
  [GoodType.CopperIngot]: {
    name: "Copper Ingot",
    description: "Smelted copper ready for crafting",
    color: 0xB87333, // Copper
    accentColor: 0xCD7F32, // Bronze
    category: "material",
    value: 5,
    weight: 2,
  },
  
  [GoodType.IronIngot]: {
    name: "Iron Ingot",
    description: "Smelted iron for weapons and tools",
    color: 0x708090, // Slate gray
    accentColor: 0x778899, // Light slate
    category: "material",
    value: 8,
    weight: 3,
  },
  
  [GoodType.SilverIngot]: {
    name: "Silver Ingot",
    description: "Refined silver for luxury goods",
    color: 0xC0C0C0, // Silver
    accentColor: 0xE8E8E8, // Light silver
    category: "material",
    value: 20,
    weight: 2,
  },
  
  [GoodType.GoldIngot]: {
    name: "Gold Ingot",
    description: "Pure gold for currency and jewelry",
    color: 0xFFD700, // Gold
    accentColor: 0xFFA500, // Orange-gold
    category: "material",
    value: 50,
    weight: 3,
  },
  
  // === CONSTRUCTION MATERIALS ===
  [GoodType.Planks]: {
    name: "Planks",
    description: "Processed lumber ready for construction",
    color: 0xD2691E, // Chestnut
    accentColor: 0xCD853F, // Peru
    category: "material",
    value: 2,
    weight: 1,
  },
  
  [GoodType.Bricks]: {
    name: "Bricks",
    description: "Fired clay bricks for durable buildings",
    color: 0xB22222, // Brick red
    accentColor: 0xDC143C, // Crimson
    category: "material",
    value: 3,
    weight: 2,
  },
  
  // === WEAPONS ===
  [GoodType.CopperSword]: {
    name: "Copper Sword",
    description: "Basic copper weapon",
    color: 0xB87333,
    accentColor: 0x8B4513, // Saddle brown
    category: "weapon",
    value: 15,
    weight: 2,
  },
  
  [GoodType.IronSword]: {
    name: "Iron Sword",
    description: "Sturdy iron weapon",
    color: 0x708090,
    accentColor: 0x2F4F4F, // Dark slate gray
    category: "weapon",
    value: 30,
    weight: 3,
  },
  
  [GoodType.SteelSword]: {
    name: "Steel Sword",
    description: "High-quality steel weapon",
    color: 0x4682B4, // Steel blue
    accentColor: 0x5F9EA0, // Cadet blue
    category: "weapon",
    value: 60,
    weight: 3,
  },
  
  // === TOOLS ===
  [GoodType.CopperTools]: {
    name: "Copper Tools",
    description: "Basic copper tools for work",
    color: 0xB87333,
    accentColor: 0xCD853F,
    category: "tool",
    value: 12,
    weight: 1.5,
  },
  
  [GoodType.IronTools]: {
    name: "Iron Tools",
    description: "Durable iron tools",
    color: 0x708090,
    accentColor: 0x556B2F, // Dark olive green
    category: "tool",
    value: 25,
    weight: 2,
  },
  
  // === ARMOR ===
  [GoodType.LeatherArmor]: {
    name: "Leather Armor",
    description: "Light protective leather armor",
    color: 0x8B4513, // Saddle brown
    accentColor: 0xA0522D, // Sienna
    category: "armor",
    value: 20,
    weight: 2,
  },
  
  [GoodType.IronArmor]: {
    name: "Iron Armor",
    description: "Heavy protective iron armor",
    color: 0x708090,
    accentColor: 0x696969, // Dim gray
    category: "armor",
    value: 45,
    weight: 5,
  },
  
  // === PROCESSED GOODS ===
  [GoodType.Leather]: {
    name: "Leather",
    description: "Tanned leather from livestock",
    color: 0x8B4513, // Saddle brown
    accentColor: 0xD2691E, // Chocolate
    category: "processed",
    value: 5,
    weight: 1,
  },
  
  [GoodType.Cloth]: {
    name: "Cloth",
    description: "Woven fabric for clothing",
    color: 0xF5F5DC, // Beige
    accentColor: 0xFFFACD, // Lemon chiffon
    category: "processed",
    value: 4,
    weight: 0.5,
  },
  
  // === FOOD GOODS ===
  [GoodType.Bread]: {
    name: "Bread",
    description: "Baked bread from wheat",
    color: 0xDEB887, // Burlywood
    accentColor: 0xF5DEB3, // Wheat
    category: "food",
    value: 3,
    weight: 0.5,
  },
  
  [GoodType.Meat]: {
    name: "Meat",
    description: "Butchered meat from livestock or game",
    color: 0xA0522D, // Sienna
    accentColor: 0xCD5C5C, // Indian red
    category: "food",
    value: 4,
    weight: 1,
  },
  
  [GoodType.PreparedFish]: {
    name: "Prepared Fish",
    description: "Cleaned and prepared fish",
    color: 0xB0C4DE, // Light steel blue
    accentColor: 0x87CEEB, // Sky blue
    category: "food",
    value: 3,
    weight: 0.8,
  },
  
  [GoodType.CookedVegetables]: {
    name: "Cooked Vegetables",
    description: "Prepared and seasoned vegetables",
    color: 0x32CD32, // Lime green
    accentColor: 0x90EE90, // Light green
    category: "food",
    value: 2,
    weight: 0.4,
  },
  
  // === LUXURY GOODS ===
  [GoodType.Jewelry]: {
    name: "Jewelry",
    description: "Precious jewelry from gold, silver, and gems",
    color: 0xFFD700, // Gold
    accentColor: 0x9370DB, // Medium purple (gems)
    category: "luxury",
    value: 100,
    weight: 0.5,
  },
  
  [GoodType.Pottery]: {
    name: "Pottery",
    description: "Fired clay vessels and goods",
    color: 0xB87333, // Clay brown
    accentColor: 0xCD853F, // Peru
    category: "luxury",
    value: 8,
    weight: 1,
  },
};

/**
 * Helper function to get good configuration
 */
export function getGoodConfig(type: GoodType): GoodConfig {
  return GOOD_CONFIG[type];
}

/**
 * Helper function to get goods by category
 */
export function getGoodsByCategory(category: GoodCategory): GoodType[] {
  return Object.entries(GOOD_CONFIG)
    .filter(([_, config]) => config.category === category)
    .map(([type, _]) => type as GoodType);
}
