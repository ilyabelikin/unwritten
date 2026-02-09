import { Direction, Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { TerrainType, terrainFromElevation, isWater } from "../Terrain";
import { LayeredNoise } from "../../utils/noise";
import { WorldGenConfig } from "../WorldGenerator";

/**
 * Handles terrain elevation and shore generation
 */
export class TerrainGenerator {
  private elevationNoise: LayeredNoise;
  private detailNoise: LayeredNoise;
  private config: WorldGenConfig;

  constructor(config: WorldGenConfig, seed: string) {
    this.config = config;
    this.elevationNoise = new LayeredNoise(seed + "_elev");
    this.detailNoise = new LayeredNoise(seed + "_detail");
  }

  /**
   * Generate elevation and assign base terrain types
   */
  generateTerrain(grid: Grid<HexTile>): void {
    grid.forEach((hex) => {
      const elevation = this.sampleElevation(hex.col, hex.row);
      hex.elevation = elevation;
      hex.terrain = terrainFromElevation(elevation);
    });
  }

  /**
   * Convert land tiles adjacent to water into shores
   */
  applyShores(grid: Grid<HexTile>): void {
    // Collect tiles that need conversion to shore
    const toShore: HexTile[] = [];

    grid.forEach((hex) => {
      if (hex.terrain !== TerrainType.Plains) return;

      // Check if any neighbor is water
      let hasWaterNeighbor = false;

      // Pointy-top hex neighbors: skip N(0) and S(4) — those are vertices, not edges
      const directions = [
        Direction.NE,
        Direction.E,
        Direction.SE,
        Direction.SW,
        Direction.W,
        Direction.NW,
      ];
      for (const dir of directions) {
        const neighbor = grid.neighborOf(hex, dir, { allowOutside: false });
        if (neighbor && isWater(neighbor.terrain)) {
          hasWaterNeighbor = true;
          break;
        }
      }

      if (hasWaterNeighbor) {
        toShore.push(hex);
      }
    });

    for (const hex of toShore) {
      hex.terrain = TerrainType.Shore;
    }
  }

  /**
   * Sample elevation for a specific hex coordinate
   */
  private sampleElevation(col: number, row: number): number {
    const { terrainScale, width, height } = this.config;

    let elevation = this.elevationNoise.sample(col, row, {
      scale: terrainScale,
      octaves: 5,
      persistence: 0.5,
      lacunarity: 2.0,
    });

    // Add subtle detail noise for variation
    const detail = this.detailNoise.sample(col, row, {
      scale: terrainScale * 3,
      octaves: 2,
      persistence: 0.3,
    });
    elevation = elevation * 0.85 + detail * 0.15;

    // Fade edges toward water to create island-like feel
    const cx = width / 2;
    const cy = height / 2;
    const dx = (col - cx) / cx;
    const dy = (row - cy) / cy;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const edgeFade = 1 - Math.pow(Math.min(distFromCenter / 0.9, 1), 2);
    elevation *= edgeFade;

    return Math.max(0, Math.min(1, elevation));
  }
}
