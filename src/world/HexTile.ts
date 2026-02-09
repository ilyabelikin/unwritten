import { defineHex } from "honeycomb-grid";
import { TerrainType, VegetationType } from "./Terrain";
import { BuildingType } from "./Building";

/**
 * The hex dimensions control tile size on screen.
 * 32px is a good pixel-art-friendly size for pointy-top hexes.
 */
export const HEX_SIZE = 32;

/**
 * Custom hex class that carries gameplay data.
 * Extends honeycomb-grid's Hex with terrain, vegetation, and exploration state.
 */
export class HexTile extends defineHex({
  dimensions: HEX_SIZE,
  origin: "topLeft",
}) {
  terrain: TerrainType = TerrainType.Plains;
  vegetation: VegetationType = VegetationType.None;
  elevation: number = 0;

  /** Has the player ever seen this tile? */
  explored: boolean = false;
  /** Is the tile currently within vision range? */
  visible: boolean = false;

  /** Is this tile rough terrain (costs +1 AP)? */
  isRough: boolean = false;

  /** Building on this tile (if any) */
  building: BuildingType = BuildingType.None;

  /** Settlement ID this tile belongs to (if any) */
  settlementId?: number;

  /** Tree density for forest rendering (0.0 = none, 1.0 = dense forest) */
  treeDensity: number = 0;

  /** Does this tile have a road? */
  hasRoad: boolean = false;
}
