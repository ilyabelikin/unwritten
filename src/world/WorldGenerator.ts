import { Direction, Grid, rectangle } from "honeycomb-grid";
import { HexTile } from "./HexTile";
import {
  TerrainType,
  VegetationType,
  terrainFromElevation,
  isWater,
  supportsVegetation,
} from "./Terrain";
import { LayeredNoise } from "../utils/noise";

export interface WorldGenConfig {
  width: number;
  height: number;
  seed: string;
  /** Controls overall terrain scale — lower = larger land masses */
  terrainScale: number;
  /** Controls vegetation clustering */
  vegetationScale: number;
  /** Threshold (0–1) above which vegetation appears */
  vegetationThreshold: number;
}

const DEFAULT_CONFIG: WorldGenConfig = {
  width: 120,
  height: 120,
  seed: "unwritten",
  terrainScale: 0.035,
  vegetationScale: 0.08,
  vegetationThreshold: 0.55,
};

export class WorldGenerator {
  private config: WorldGenConfig;
  private elevationNoise: LayeredNoise;
  private vegetationNoise: LayeredNoise;
  private detailNoise: LayeredNoise;

  constructor(config: Partial<WorldGenConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.elevationNoise = new LayeredNoise(this.config.seed + "_elev");
    this.vegetationNoise = new LayeredNoise(this.config.seed + "_veg");
    this.detailNoise = new LayeredNoise(this.config.seed + "_detail");
  }

  generate(): Grid<HexTile> {
    const grid = new Grid(
      HexTile,
      rectangle({ width: this.config.width, height: this.config.height })
    );

    // Pass 1: Assign elevation and base terrain
    grid.forEach((hex) => {
      const elevation = this.sampleElevation(hex.col, hex.row);
      hex.elevation = elevation;
      hex.terrain = terrainFromElevation(elevation);
    });

    // Pass 2: Convert land tiles adjacent to water into shores
    this.applyShores(grid);

    // Pass 3: Scatter vegetation on eligible tiles
    this.applyVegetation(grid);

    return grid;
  }

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

  private applyShores(grid: Grid<HexTile>): void {
    // Collect tiles that need conversion to shore
    const toShore: HexTile[] = [];

    grid.forEach((hex) => {
      if (hex.terrain !== TerrainType.Plains) return;

      // Check if any neighbor is water
      let hasWaterNeighbor = false;

      // Pointy-top hex neighbors: skip N(0) and S(4) — those are vertices, not edges
      const directions = [Direction.NE, Direction.E, Direction.SE, Direction.SW, Direction.W, Direction.NW];
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

  private applyVegetation(grid: Grid<HexTile>): void {
    grid.forEach((hex) => {
      if (!supportsVegetation(hex.terrain)) return;

      const vegValue = this.vegetationNoise.sample(hex.col, hex.row, {
        scale: this.config.vegetationScale,
        octaves: 3,
        persistence: 0.6,
      });

      if (vegValue > this.config.vegetationThreshold) {
        // Higher values = trees (denser vegetation), lower = bushes
        const treeThreshold = this.config.vegetationThreshold + 0.15;
        hex.vegetation =
          vegValue > treeThreshold ? VegetationType.Tree : VegetationType.Bush;
      }
    });
  }
}
