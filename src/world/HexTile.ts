import { defineHex } from "honeycomb-grid";
import { TerrainType, VegetationType } from "./Terrain";

/**
 * The hex dimensions control tile size on screen.
 * 32px is a good pixel-art-friendly size for pointy-top hexes.
 */
export const HEX_SIZE = 32;

/**
 * Custom hex class that carries gameplay data.
 * Extends honeycomb-grid's Hex with terrain, vegetation, and exploration state.
 */
export class HexTile extends defineHex({ dimensions: HEX_SIZE, origin: "topLeft" }) {
  terrain: TerrainType = TerrainType.Plains;
  vegetation: VegetationType = VegetationType.None;
  elevation: number = 0;

  /** Has the player ever seen this tile? */
  explored: boolean = false;
  /** Is the tile currently within vision range? */
  visible: boolean = false;
}
