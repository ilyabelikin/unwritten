import { Grid, rectangle } from "honeycomb-grid";
import { HexTile } from "./HexTile";
import { BuildingType, Settlement } from "./Building";
import { HousingUpgradeSystem } from "./HousingUpgrade";
import { RoadGenerator } from "./RoadGenerator";
import { IPathfindingMap } from "../pathfinding/Pathfinding";
import { getHexNeighbors, getHexDistance, HEX_NEIGHBOR_DIRS } from "./HexMapUtils";
import { TerrainGenerator } from "./generators/TerrainGenerator";
import { VegetationGenerator } from "./generators/VegetationGenerator";
import { SettlementGenerator } from "./generators/SettlementGenerator";
import { ResourceGenerator } from "./generators/ResourceGenerator";
import { RoadsideResourcePlacer } from "./generators/RoadsideResourcePlacer";
import { isWater } from "./Terrain";

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
  private resourceGenerator: ResourceGenerator;
  private roadsideResourcePlacer: RoadsideResourcePlacer;
  private housingUpgradeSystem: HousingUpgradeSystem;

  constructor(config: Partial<WorldGenConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize generators
    this.terrainGenerator = new TerrainGenerator(this.config, this.config.seed);
    this.vegetationGenerator = new VegetationGenerator(this.config, this.config.seed);
    this.settlementGenerator = new SettlementGenerator(
      this.config,
      this.seededRandom.bind(this),
      this.hexDistance.bind(this)
    );
    this.resourceGenerator = new ResourceGenerator(this.config.seed);
    this.roadsideResourcePlacer = new RoadsideResourcePlacer();
    this.housingUpgradeSystem = new HousingUpgradeSystem();
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

    console.log('[WorldGenerator] Starting world generation...');

    // Pass 1: Generate elevation and base terrain
    console.log('[WorldGenerator] Pass 1: Terrain generation');
    this.terrainGenerator.generateTerrain(this.grid);

    // Pass 2: Convert land tiles adjacent to water into shores
    console.log('[WorldGenerator] Pass 2: Shore generation');
    this.terrainGenerator.applyShores(this.grid);

    // Pass 3: Scatter vegetation on eligible tiles
    console.log('[WorldGenerator] Pass 3: Vegetation');
    this.vegetationGenerator.applyVegetation(this.grid);

    // Pass 4: Mark rough terrain patches
    console.log('[WorldGenerator] Pass 4: Rough terrain');
    this.vegetationGenerator.applyRoughTerrain(this.grid);

    // Pass 5: Generate natural resources (BEFORE settlements so they can be resource-aware)
    console.log('[WorldGenerator] Pass 5: Resources');
    this.resourceGenerator.generateResources(this.grid);

    // Pass 6: Generate settlements (cities and villages) - now resource-aware!
    console.log('[WorldGenerator] Pass 6: Settlements');
    this.settlements = this.settlementGenerator.generateSettlements(this.grid);

    // Pass 6.5: Set initial housing densities (cities=3, villages=2, hamlets=1)
    console.log('[WorldGenerator] Pass 6.5: Housing densities');
    for (const settlement of this.settlements) {
      this.housingUpgradeSystem.setInitialDensity(this.grid, settlement);
    }

    // Pass 7: Generate roads connecting settlements
    console.log('[WorldGenerator] Pass 7: Roads');
    this.generateRoads(this.grid);

    // Pass 8: Place roadside hamlets on unexploited resources near roads
    console.log('[WorldGenerator] Pass 8: Roadside resource hamlets');
    const roadsideHamlets = this.roadsideResourcePlacer.placeRoadsideHamlets(
      this.grid,
      this.settlements,
      this.settlementGenerator.getNameGenerator(),
      this.seededRandom.bind(this)
    );
    // Add new hamlets to settlements list
    this.settlements.push(...roadsideHamlets);
    
    // Set initial densities for roadside hamlets too
    for (const hamlet of roadsideHamlets) {
      this.housingUpgradeSystem.setInitialDensity(this.grid, hamlet);
    }

    // Pass 9: Connect any hamlets near roads
    console.log('[WorldGenerator] Pass 9: Connect hamlets to nearby roads');
    this.connectHamletsToRoads(this.grid, this.settlements);

    console.log('[WorldGenerator] World generation complete!');
    console.log(`[WorldGenerator] Final settlement count: ${this.settlements.length} total`);

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
   * Connect hamlets to nearby roads (Pass 9)
   */
  private connectHamletsToRoads(grid: Grid<HexTile>, settlements: Settlement[]): void {
    let connectionsCreated = 0;
    let hamletsChecked = 0;
    let alreadyOnRoad = 0;
    let noPathFound = 0;

    // Only connect hamlets (not villages or cities)
    const hamlets = settlements.filter(s => s.type === 'hamlet');

    for (const hamlet of hamlets) {
      hamletsChecked++;
      const centerTile = grid.getHex(hamlet.center);
      if (!centerTile) continue;

      // Skip if hamlet is already on a road
      if (centerTile.hasRoad) {
        alreadyOnRoad++;
        continue;
      }

      // BFS to find nearest road (within 3 tiles)
      const path = this.findPathToRoad(grid, centerTile, 3);
      if (path) {
        let tilesMarked = 0;
        
        // For path length 2 (hamlet adjacent to road), mark the hamlet tile itself
        if (path.length === 2) {
          if (!centerTile.hasRoad) {
            centerTile.hasRoad = true;
            tilesMarked++;
          }
        } else {
          // For longer paths, mark intermediate tiles (skip first hamlet and last road tile)
          for (let i = 1; i < path.length - 1; i++) {
            const tile = path[i];
            if (!tile.hasRoad && tile.building === BuildingType.None) {
              tile.hasRoad = true;
              tilesMarked++;
            }
          }
          // Also mark the hamlet tile itself
          if (!centerTile.hasRoad) {
            centerTile.hasRoad = true;
            tilesMarked++;
          }
        }
        
        connectionsCreated++;
        console.log(`[WorldGenerator] Connected hamlet at (${centerTile.col},${centerTile.row}), path length: ${path.length}, tiles marked: ${tilesMarked}`);
      } else {
        noPathFound++;
      }
    }

    console.log(`[WorldGenerator] Hamlet road connections: ${connectionsCreated} connected, ${alreadyOnRoad} already on road, ${noPathFound} no path found (total: ${hamletsChecked})`);
  }

  /**
   * Find shortest path from tile to nearest road using BFS
   */
  private findPathToRoad(
    grid: Grid<HexTile>,
    start: HexTile,
    maxDistance: number
  ): HexTile[] | null {
    const visited = new Set<string>();
    const queue: Array<{ hex: HexTile; path: HexTile[] }> = [
      { hex: start, path: [start] },
    ];
    visited.add(`${start.col},${start.row}`);

    while (queue.length > 0) {
      const { hex, path } = queue.shift()!;

      // Found a road!
      if (hex.hasRoad && hex !== start) {
        return path;
      }

      // Continue searching (within max distance)
      if (path.length <= maxDistance) {
        for (const dir of HEX_NEIGHBOR_DIRS) {
          const neighbor = grid.neighborOf(hex, dir, { allowOutside: false });
          if (neighbor) {
            const key = `${neighbor.col},${neighbor.row}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push({ hex: neighbor, path: [...path, neighbor] });
            }
          }
        }
      }
    }

    return null; // No road found within range
  }

  /**
   * Seeded random number generator (0-1)
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}
