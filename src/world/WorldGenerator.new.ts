import { Grid, rectangle } from "honeycomb-grid";
import { HexTile } from "./HexTile";
import { BuildingType, Settlement } from "./Building";
import { RoadGenerator } from "./RoadGenerator";
import { IPathfindingMap } from "../pathfinding/Pathfinding";
import { getHexNeighbors, getHexDistance } from "./HexMapUtils";
import { TerrainGenerator } from "./generators/TerrainGenerator";
import { VegetationGenerator } from "./generators/VegetationGenerator";
import { SettlementGenerator } from "./generators/SettlementGenerator";

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
  /** Controls rough terrain patches */
  roughScale: number;
  /** Threshold (0–1) above which rough terrain appears */
  roughThreshold: number;
  /** Number of cities to generate */
  numCities: number;
  /** Number of villages to generate */
  numVillages: number;
  /** Number of hamlets to generate (very small, 1-2 tile settlements) */
  numHamlets: number;
}

const DEFAULT_CONFIG: WorldGenConfig = {
  width: 120,
  height: 120,
  seed: "unwritten",
  terrainScale: 0.035,
  vegetationScale: 0.06,
  vegetationThreshold: 0.4,
  roughScale: 0.15,
  roughThreshold: 0.75,
  numCities: 3,
  numVillages: 12,
  numHamlets: 20,
};

/**
 * Main world generation coordinator.
 * Orchestrates terrain, vegetation, and settlement generation.
 */
export class WorldGenerator implements IPathfindingMap {
  private config: WorldGenConfig;
  private settlements: Settlement[] = [];
  private grid!: Grid<HexTile>; // Set during generation

  // Specialized generators
  private terrainGenerator: TerrainGenerator;
  private vegetationGenerator: VegetationGenerator;
  private settlementGenerator: SettlementGenerator;

  constructor(config: Partial<WorldGenConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize generators
    this.terrainGenerator = new TerrainGenerator(this.config, this.config.seed);
    this.vegetationGenerator = new VegetationGenerator(
      this.config,
      this.config.seed,
    );
    this.settlementGenerator = new SettlementGenerator(
      this.config,
      this.seededRandom.bind(this),
      this.hexDistance.bind(this),
    );
  }

  getSettlements(): Settlement[] {
    return this.settlements;
  }

  /** Get all 6 neighbors of a hex (filters out undefined for edge tiles). */
  getNeighbors(hex: HexTile): HexTile[] {
    return getHexNeighbors(this.grid, hex);
  }

  /** Calculate hex distance between two tiles using the grid's built-in method. */
  hexDistance(a: HexTile, b: HexTile): number {
    return getHexDistance(this.grid, a, b);
  }

  /**
   * Generate a complete world
   */
  generate(): Grid<HexTile> {
    this.grid = new Grid(
      HexTile,
      rectangle({ width: this.config.width, height: this.config.height }),
    );

    console.log("[WorldGenerator] Starting world generation...");

    // Pass 1: Generate elevation and base terrain
    console.log("[WorldGenerator] Pass 1: Terrain generation");
    this.terrainGenerator.generateTerrain(this.grid);

    // Pass 2: Convert land tiles adjacent to water into shores
    console.log("[WorldGenerator] Pass 2: Shore generation");
    this.terrainGenerator.applyShores(this.grid);

    // Pass 3: Scatter vegetation on eligible tiles
    console.log("[WorldGenerator] Pass 3: Vegetation");
    this.vegetationGenerator.applyVegetation(this.grid);

    // Pass 4: Mark rough terrain patches
    console.log("[WorldGenerator] Pass 4: Rough terrain");
    this.vegetationGenerator.applyRoughTerrain(this.grid);

    // Pass 5: Generate settlements (cities and villages)
    console.log("[WorldGenerator] Pass 5: Settlements");
    this.settlements = this.settlementGenerator.generateSettlements(this.grid);

    // Pass 6: Generate roads connecting settlements
    console.log("[WorldGenerator] Pass 6: Roads");
    this.generateRoads(this.grid);

    console.log("[WorldGenerator] World generation complete!");

    return this.grid;
  }

  /**
   * Generate roads connecting settlements
   */
  private generateRoads(grid: Grid<HexTile>): void {
    const roadGenerator = new RoadGenerator(this.config.seed);
    roadGenerator.generateRoads(grid, this.settlements, this);

    // Count how many tiles have roads
    let roadTileCount = 0;
    grid.forEach((hex) => {
      if (hex.hasRoad) roadTileCount++;
    });

    console.log(
      `Generated roads connecting ${this.settlements.length} settlements`,
    );
    console.log(`Total road tiles: ${roadTileCount}`);
  }

  /**
   * Seeded random number generator (0-1)
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}
