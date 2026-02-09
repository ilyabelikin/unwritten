import { Palette } from "../rendering/Palette";

/**
 * Building types that can be placed on tiles.
 */
export enum BuildingType {
  None = "none",
  // Generic village structures
  House = "house",
  Field = "field",
  // Specialized village structures
  LumberCamp = "lumber_camp",
  Sawmill = "sawmill",
  Mine = "mine",
  Quarry = "quarry",
  FishingHut = "fishing_hut",
  Dock = "dock",
  Monastery = "monastery",
  Chapel = "chapel",
  TradingPost = "trading_post",
  Warehouse = "warehouse",
  Windmill = "windmill",
  GrainSilo = "grain_silo",
  Barracks = "barracks",
  Watchtower = "watchtower",
  // City structures
  CityHouse = "city_house",
  Church = "church",
  Tower = "tower",
  Castle = "castle",
  // Infrastructure
  Pier = "pier",
  Bridge = "bridge",
}

export interface BuildingConfig {
  name: string;
  /** Is this a central landmark building? */
  isLandmark: boolean;
  /** Visual size category (small, medium, large) */
  size: "small" | "medium" | "large";
  /** Base color for the building */
  baseColor: number;
  /** Accent color for details */
  accentColor: number;
  /** Roof color */
  roofColor: number;
}

/** Config-driven building definitions */
export const BUILDING_CONFIG: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    name: "None",
    isLandmark: false,
    size: "small",
    baseColor: 0x000000,
    accentColor: 0x000000,
    roofColor: 0x000000,
  },
  [BuildingType.House]: {
    name: "House",
    isLandmark: false,
    size: "small",
    baseColor: 0xd4a574, // Light wood
    accentColor: 0xa67c52, // Dark wood
    roofColor: 0x8b4513, // Brown roof
  },
  [BuildingType.CityHouse]: {
    name: "City House",
    isLandmark: false,
    size: "medium",
    baseColor: 0xe8d4b0, // Stone/plaster
    accentColor: 0xa0826d, // Timber framing
    roofColor: 0x6b4423, // Red-brown tiles
  },
  [BuildingType.Field]: {
    name: "Field",
    isLandmark: false,
    size: "small",
    baseColor: 0xdaa520, // Golden wheat
    accentColor: 0xb8860b, // Dark goldenrod
    roofColor: 0xb8860b,
  },
  [BuildingType.LumberCamp]: {
    name: "Lumber Camp",
    isLandmark: false,
    size: "small",
    baseColor: 0x8b4513, // Saddle brown
    accentColor: 0x654321, // Dark brown
    roofColor: 0x696969, // Dim gray
  },
  [BuildingType.Sawmill]: {
    name: "Sawmill",
    isLandmark: false,
    size: "medium",
    baseColor: 0xa0826d, // Tan wood
    accentColor: 0x8b4513, // Saddle brown
    roofColor: 0x654321, // Dark brown
  },
  [BuildingType.Mine]: {
    name: "Mine",
    isLandmark: false,
    size: "small",
    baseColor: 0x708090, // Slate gray
    accentColor: 0x2f4f4f, // Dark slate gray
    roofColor: 0x696969,
  },
  [BuildingType.Quarry]: {
    name: "Quarry",
    isLandmark: false,
    size: "medium",
    baseColor: 0xa9a9a9, // Dark gray
    accentColor: 0x696969, // Dim gray
    roofColor: 0x778899, // Light slate gray
  },
  [BuildingType.FishingHut]: {
    name: "Fishing Hut",
    isLandmark: false,
    size: "small",
    baseColor: 0xd4a574, // Light wood
    accentColor: 0x8b7355, // Weathered wood
    roofColor: 0x708090, // Slate gray
  },
  [BuildingType.Dock]: {
    name: "Dock",
    isLandmark: false,
    size: "small",
    baseColor: 0x8b7355, // Brown wood
    accentColor: 0x654321, // Darker wood
    roofColor: 0x654321,
  },
  [BuildingType.Monastery]: {
    name: "Monastery",
    isLandmark: true,
    size: "large",
    baseColor: 0xf5f5dc, // Beige stone
    accentColor: 0xd3d3d3, // Light gray
    roofColor: 0x654321, // Brown
  },
  [BuildingType.Chapel]: {
    name: "Chapel",
    isLandmark: false,
    size: "medium",
    baseColor: 0xe8d4b0, // Light stone
    accentColor: 0xd3d3d3, // Light gray
    roofColor: 0x8b4513, // Saddle brown
  },
  [BuildingType.TradingPost]: {
    name: "Trading Post",
    isLandmark: false,
    size: "medium",
    baseColor: 0xdaa520, // Goldenrod
    accentColor: 0xb8860b, // Dark goldenrod
    roofColor: 0x8b4513, // Saddle brown
  },
  [BuildingType.Warehouse]: {
    name: "Warehouse",
    isLandmark: false,
    size: "medium",
    baseColor: 0xa0826d, // Tan
    accentColor: 0x696969, // Dim gray
    roofColor: 0x654321, // Dark brown
  },
  [BuildingType.Windmill]: {
    name: "Windmill",
    isLandmark: true,
    size: "large",
    baseColor: 0xf5f5dc, // Beige
    accentColor: 0xd3d3d3, // Light gray
    roofColor: 0x8b4513, // Brown
  },
  [BuildingType.GrainSilo]: {
    name: "Grain Silo",
    isLandmark: false,
    size: "medium",
    baseColor: 0xdaa520, // Goldenrod
    accentColor: 0xa0826d, // Tan
    roofColor: 0x8b4513, // Saddle brown
  },
  [BuildingType.Barracks]: {
    name: "Barracks",
    isLandmark: false,
    size: "medium",
    baseColor: 0x696969, // Dim gray
    accentColor: 0x2f4f4f, // Dark slate
    roofColor: 0x654321, // Dark brown
  },
  [BuildingType.Watchtower]: {
    name: "Watchtower",
    isLandmark: false,
    size: "medium",
    baseColor: 0x808080, // Gray stone
    accentColor: 0x696969, // Dim gray
    roofColor: 0x2f4f4f, // Dark slate
  },
  [BuildingType.Church]: {
    name: "Church",
    isLandmark: true,
    size: "large",
    baseColor: 0xf5f5dc, // Beige stone
    accentColor: 0xd3d3d3, // Light gray
    roofColor: 0x8b0000, // Dark red
  },
  [BuildingType.Tower]: {
    name: "Tower",
    isLandmark: true,
    size: "large",
    baseColor: 0xa9a9a9, // Dark gray stone
    accentColor: 0x696969, // Dim gray
    roofColor: 0x2f4f4f, // Dark slate
  },
  [BuildingType.Castle]: {
    name: "Castle",
    isLandmark: true,
    size: "large",
    baseColor: 0xbcb8b1, // Light stone
    accentColor: 0x8c8680, // Gray stone
    roofColor: 0x4a4a4a, // Dark gray
  },
  [BuildingType.Pier]: {
    name: "Pier",
    isLandmark: false,
    size: "small",
    baseColor: 0x8b7355, // Brown wood
    accentColor: 0x654321, // Darker wood
    roofColor: 0x654321,
  },
  [BuildingType.Bridge]: {
    name: "Bridge",
    isLandmark: false,
    size: "small",
    baseColor: 0xa0826d, // Light wood
    accentColor: 0x8b4513, // Saddle brown
    roofColor: 0x654321, // Dark brown
  },
};

/**
 * Village specializations that determine building types and placement requirements.
 */
export enum VillageSpecialization {
  Generic = "generic", // Regular farming village
  Fishing = "fishing", // Coastal fishing village
  Lumber = "lumber", // Forestry and lumber processing
  Mining = "mining", // Mining and quarrying
  Religious = "religious", // Monastery or chapel
  Trading = "trading", // Trading post or market
  Farming = "farming", // Grain and windmill focused
  Military = "military", // Fortified outpost
}

/**
 * Represents a settlement (village or city).
 */
export interface Settlement {
  /** Type: 'village' or 'city' */
  type: "village" | "city";
  /** Village specialization (only for villages) */
  specialization?: VillageSpecialization;
  /** Central tile (col, row) */
  center: { col: number; row: number };
  /** All tiles that belong to this settlement */
  tiles: Array<{ col: number; row: number }>;
  /** The landmark building type (for cities or specialized villages) */
  landmark?: BuildingType;
}
