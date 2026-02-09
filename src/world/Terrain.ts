import { Palette } from "../rendering/Palette";

/** Terrain types ordered roughly by elevation */
export enum TerrainType {
  DeepWater = "deep_water",
  ShallowWater = "shallow_water",
  Shore = "shore",
  Plains = "plains",
  Hills = "hills",
  Mountains = "mountains",
}

/** Decorative vegetation types */
export enum VegetationType {
  None = "none",
  Bush = "bush",
  Tree = "tree",
}

export interface TerrainConfig {
  name: string;
  apCost: number;
  baseColor: number;
  accentColor: number;
  /** Minimum elevation threshold (0-1 noise range) */
  minElevation: number;
}

/** Config-driven terrain definitions — add biomes by extending this map */
export const TERRAIN_CONFIG: Record<TerrainType, TerrainConfig> = {
  [TerrainType.DeepWater]: {
    name: "Deep Water",
    apCost: 1,
    baseColor: Palette.waterDeep,
    accentColor: Palette.waterHighlight,
    minElevation: -Infinity,
  },
  [TerrainType.ShallowWater]: {
    name: "Shallow Water",
    apCost: 1,
    baseColor: Palette.waterShallow,
    accentColor: Palette.waterHighlight,
    minElevation: 0.3,
  },
  [TerrainType.Shore]: {
    name: "Shore",
    apCost: 1,
    baseColor: Palette.shore,
    accentColor: Palette.shoreWet,
    minElevation: 0.38,
  },
  [TerrainType.Plains]: {
    name: "Plains",
    apCost: 1,
    baseColor: Palette.plainsLight,
    accentColor: Palette.plainsDark,
    minElevation: 0.42,
  },
  [TerrainType.Hills]: {
    name: "Hills",
    apCost: 2,
    baseColor: Palette.hillsLight,
    accentColor: Palette.hillsDark,
    minElevation: 0.6,
  },
  [TerrainType.Mountains]: {
    name: "Mountains",
    apCost: 3,
    baseColor: Palette.mountainStone,
    accentColor: Palette.mountainPeak,
    minElevation: 0.75,
  },
};

/** Look up the AP cost for a terrain type */
export function getAPCost(terrain: TerrainType): number {
  return TERRAIN_CONFIG[terrain].apCost;
}

/** Get the terrain type for a given elevation value (0–1) */
export function terrainFromElevation(elevation: number): TerrainType {
  if (elevation >= TERRAIN_CONFIG[TerrainType.Mountains].minElevation)
    return TerrainType.Mountains;
  if (elevation >= TERRAIN_CONFIG[TerrainType.Hills].minElevation)
    return TerrainType.Hills;
  if (elevation >= TERRAIN_CONFIG[TerrainType.Plains].minElevation)
    return TerrainType.Plains;
  if (elevation >= TERRAIN_CONFIG[TerrainType.Shore].minElevation)
    return TerrainType.Shore;
  if (elevation >= TERRAIN_CONFIG[TerrainType.ShallowWater].minElevation)
    return TerrainType.ShallowWater;
  return TerrainType.DeepWater;
}

/** Is this terrain walkable water? (character can walk on water for now) */
export function isWater(terrain: TerrainType): boolean {
  return (
    terrain === TerrainType.DeepWater || terrain === TerrainType.ShallowWater
  );
}

/** Can vegetation grow on this terrain? */
export function supportsVegetation(terrain: TerrainType): boolean {
  return terrain === TerrainType.Plains || terrain === TerrainType.Hills;
}
