import { Palette } from "../rendering/Palette";
import { BuildingType } from "./Building";
import { HexTile } from "./HexTile";

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

/** Tree density levels for forest rendering (0.0 = none, 1.0 = dense forest) */
export type TreeDensity = number; // 0.0 to 1.0

export interface TerrainConfig {
  name: string;
  baseColor: number;
  accentColor: number;
  /** Minimum elevation threshold (0-1 noise range) */
  minElevation: number;
  /** Is this rough terrain that costs +1 AP? */
  isRough: boolean;
}

/** Config-driven terrain definitions — add biomes by extending this map */
export const TERRAIN_CONFIG: Record<TerrainType, TerrainConfig> = {
  [TerrainType.DeepWater]: {
    name: "Deep Water",
    baseColor: Palette.waterDeep,
    accentColor: Palette.waterHighlight,
    minElevation: -Infinity,
    isRough: false,
  },
  [TerrainType.ShallowWater]: {
    name: "Shallow Water",
    baseColor: Palette.waterShallow,
    accentColor: Palette.waterHighlight,
    minElevation: 0.3,
    isRough: false,
  },
  [TerrainType.Shore]: {
    name: "Shore",
    baseColor: Palette.shore,
    accentColor: Palette.shoreWet,
    minElevation: 0.38, // Only used for metadata - actual shore assignment is done by applyShores()
    isRough: false,
  },
  [TerrainType.Plains]: {
    name: "Plains",
    baseColor: Palette.plainsLight,
    accentColor: Palette.plainsDark,
    minElevation: 0.38, // Lowered to include what used to be shore elevation
    isRough: false,
  },
  [TerrainType.Hills]: {
    name: "Hills",
    baseColor: Palette.hillsLight,
    accentColor: Palette.hillsDark,
    minElevation: 0.6,
    isRough: false,
  },
  [TerrainType.Mountains]: {
    name: "Mountains",
    baseColor: Palette.mountainStone,
    accentColor: Palette.mountainPeak,
    minElevation: 0.75,
    isRough: true, // Mountains are rough terrain
  },
};

/**
 * Calculate the AP cost to move to a tile.
 * Roads = 1 AP, Normal terrain = 2 AP, Rough terrain = 3 AP, Dense forest = +1 AP
 * Embarking on water or disembarking from water = +2 AP
 * When embarked, water movement = 1 AP (like roads)
 */
export function getAPCost(
  hasRoad: boolean,
  isRoughTerrain: boolean,
  treeDensity: number = 0,
  fromTerrain?: TerrainType,
  toTerrain?: TerrainType,
  isEmbarked: boolean = false,
): number {
  // Special case: embarked water movement costs 1 AP (like roads)
  if (isEmbarked && toTerrain && isWater(toTerrain)) {
    return 1;
  }

  // Base cost depends on terrain type
  let cost = hasRoad ? 1 : isRoughTerrain ? 3 : 2;

  // +1 AP if moving through dense forest (density >= 0.6)
  if (treeDensity >= 0.6) {
    cost += 1;
  }

  // +2 AP for embarking on water or disembarking from water
  if (fromTerrain && toTerrain) {
    const fromIsWater = isWater(fromTerrain);
    const toIsWater = isWater(toTerrain);

    // Transitioning between water and land (in either direction)
    if (fromIsWater !== toIsWater) {
      cost += 2;
    }
  }

  return cost;
}

/** Get the terrain type for a given elevation value (0–1) */
export function terrainFromElevation(elevation: number): TerrainType {
  if (elevation >= TERRAIN_CONFIG[TerrainType.Mountains].minElevation)
    return TerrainType.Mountains;
  if (elevation >= TERRAIN_CONFIG[TerrainType.Hills].minElevation)
    return TerrainType.Hills;
  if (elevation >= TERRAIN_CONFIG[TerrainType.Plains].minElevation)
    return TerrainType.Plains;
  // Shore is NOT assigned by elevation - it's assigned by applyShores() based on water adjacency
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

/** Is this tile a pier or dock (where characters can embark/disembark)? */
export function isPierOrDock(tile: HexTile): boolean {
  return tile.building === BuildingType.Pier || tile.building === BuildingType.Dock;
}
