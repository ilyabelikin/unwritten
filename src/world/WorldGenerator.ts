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
import { BuildingType, Settlement, VillageSpecialization } from "./Building";
import { RoadGenerator } from "./RoadGenerator";
import { IPathfindingMap } from "../pathfinding/Pathfinding";
import { getHexNeighbors, getHexDistance, HEX_NEIGHBOR_DIRS } from "./HexMapUtils";

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
};

export class WorldGenerator implements IPathfindingMap {
  private config: WorldGenConfig;
  private elevationNoise: LayeredNoise;
  private vegetationNoise: LayeredNoise;
  private detailNoise: LayeredNoise;
  private roughNoise: LayeredNoise;
  private settlementNoise: LayeredNoise;
  private settlements: Settlement[] = [];
  private grid!: Grid<HexTile>; // Set during generation

  constructor(config: Partial<WorldGenConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.elevationNoise = new LayeredNoise(this.config.seed + "_elev");
    this.vegetationNoise = new LayeredNoise(this.config.seed + "_veg");
    this.detailNoise = new LayeredNoise(this.config.seed + "_detail");
    this.roughNoise = new LayeredNoise(this.config.seed + "_rough");
    this.settlementNoise = new LayeredNoise(this.config.seed + "_settlement");
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

  generate(): Grid<HexTile> {
    this.grid = new Grid(
      HexTile,
      rectangle({ width: this.config.width, height: this.config.height }),
    );

    // Pass 1: Assign elevation and base terrain
    this.grid.forEach((hex) => {
      const elevation = this.sampleElevation(hex.col, hex.row);
      hex.elevation = elevation;
      hex.terrain = terrainFromElevation(elevation);
    });

    // Pass 2: Convert land tiles adjacent to water into shores
    this.applyShores(this.grid);

    // Pass 3: Scatter vegetation on eligible tiles
    this.applyVegetation(this.grid);

    // Pass 4: Mark rough terrain patches
    this.applyRoughTerrain(this.grid);

    // Pass 5: Generate settlements (cities and villages)
    this.generateSettlements(this.grid);

    // Pass 6: Generate roads connecting settlements
    this.generateRoads(this.grid);

    return this.grid;
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
        const treeThreshold = this.config.vegetationThreshold + 0.08;

        if (vegValue > treeThreshold) {
          // Trees with varying density based on noise value
          hex.vegetation = VegetationType.Tree;
          // Map vegValue to density: normalize from treeThreshold-1.0 to 0.0-1.0
          // Use power curve to make dense forests more common
          const densityRange = 1.0 - treeThreshold;
          const normalizedValue = (vegValue - treeThreshold) / densityRange;
          // Square root curve makes dense forests appear at lower thresholds
          hex.treeDensity = Math.max(0, Math.min(1, Math.pow(normalizedValue, 0.6)));
        } else {
          hex.vegetation = VegetationType.Bush;
          hex.treeDensity = 0;
        }
      }
    });
  }

  private applyRoughTerrain(grid: Grid<HexTile>): void {
    grid.forEach((hex) => {
      // Only apply rough terrain to land tiles (not water or shore)
      if (isWater(hex.terrain) || hex.terrain === TerrainType.Shore) return;

      // Mountains are always rough (per terrain config)
      if (hex.terrain === TerrainType.Mountains) {
        hex.isRough = true;
        return;
      }

      // Use noise to create patches of rough terrain on hills and plains
      const roughValue = this.roughNoise.sample(hex.col, hex.row, {
        scale: this.config.roughScale,
        octaves: 2,
        persistence: 0.5,
      });

      if (roughValue > this.config.roughThreshold) {
        hex.isRough = true;
      }
    });
  }

  private generateSettlements(grid: Grid<HexTile>): void {
    this.settlements = [];
    let settlementId = 0;

    // Generate cities (larger, 3-9 tiles)
    for (let i = 0; i < this.config.numCities; i++) {
      const city = this.tryPlaceCity(grid, settlementId++);
      if (city) {
        this.settlements.push(city);
      }
    }

    // Generate villages (smaller, 1-5 tiles)
    for (let i = 0; i < this.config.numVillages; i++) {
      const village = this.tryPlaceVillage(grid, settlementId++);
      if (village) {
        this.settlements.push(village);
      }
    }

    const cities = this.settlements.filter((s) => s.type === "city");
    const villages = this.settlements.filter((s) => s.type === "village");

    // Count village specializations
    const specializationCounts: Record<string, number> = {};
    villages.forEach((v) => {
      const spec = v.specialization || VillageSpecialization.Generic;
      specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
    });

    console.log(`Generated ${cities.length} cities and ${villages.length} villages:`);
    Object.entries(specializationCounts).forEach(([spec, count]) => {
      console.log(`  - ${count} ${spec} village(s)`);
    });
  }

  private tryPlaceCity(
    grid: Grid<HexTile>,
    settlementId: number,
  ): Settlement | null {
    // Find a suitable location for a city
    const centerTile = this.findSettlementLocation(grid, "city");
    if (!centerTile) return null;

    // Choose a random landmark type
    const landmarks = [
      BuildingType.Church,
      BuildingType.Tower,
      BuildingType.Castle,
    ];
    const landmark =
      landmarks[
        Math.floor(this.seededRandom(settlementId * 3.7) * landmarks.length)
      ];

    // Place the landmark in the center
    centerTile.building = landmark;
    centerTile.vegetation = VegetationType.None; // Clear vegetation
    centerTile.isRough = false; // Cities are not rough
    centerTile.settlementId = settlementId;

    const tiles: Array<{ col: number; row: number }> = [
      { col: centerTile.col, row: centerTile.row },
    ];

    // Get all neighbors within 2 rings
    const neighbors = this.getNeighborsInRange(grid, centerTile, 2);

    // Determine city size (more tiles: 8-15 total including center)
    const numTiles = Math.floor(this.seededRandom(settlementId * 2.3) * 8) + 7; // 7-14 additional tiles

    // Place city houses around the landmark
    let placedTiles = 0;
    for (const neighbor of neighbors) {
      if (placedTiles >= numTiles) break;

      // Only place on suitable terrain
      if (!this.isSuitableForBuilding(neighbor)) continue;

      // Much higher chance for all tiles (more houses)
      const distance = this.hexDistance(centerTile, neighbor);
      const chance = distance === 1 ? 0.95 : 0.75;

      if (
        this.seededRandom(
          settlementId * 5.1 + neighbor.col * 0.3 + neighbor.row * 0.7,
        ) < chance
      ) {
        neighbor.building = BuildingType.CityHouse;
        neighbor.vegetation = VegetationType.None;
        neighbor.isRough = false;
        neighbor.settlementId = settlementId;
        tiles.push({ col: neighbor.col, row: neighbor.row });
        placedTiles++;
      }
    }

    return {
      type: "city",
      center: { col: centerTile.col, row: centerTile.row },
      tiles,
      landmark,
    };
  }

  private tryPlaceVillage(
    grid: Grid<HexTile>,
    settlementId: number,
  ): Settlement | null {
    // Find a suitable location for a village
    const centerTile = this.findSettlementLocation(grid, "village");
    if (!centerTile) return null;

    // Determine specialization based on nearby terrain
    const specialization = this.determineVillageSpecialization(
      grid,
      centerTile,
      settlementId,
    );

    // Get landmark and primary building for this specialization
    const { landmark, primaryBuilding, secondaryBuilding } =
      this.getBuildingsForSpecialization(specialization);

    // Place the primary building in the center (or landmark if applicable)
    centerTile.building = landmark || primaryBuilding;
    centerTile.vegetation = VegetationType.None;
    centerTile.isRough = false;
    centerTile.settlementId = settlementId;

    const tiles: Array<{ col: number; row: number }> = [
      { col: centerTile.col, row: centerTile.row },
    ];

    // Get neighbors
    const neighbors = this.getNeighborsInRange(grid, centerTile, 1);

    // Determine village size (3-6 additional tiles)
    const numAdditionalTiles =
      Math.floor(this.seededRandom(settlementId * 1.9) * 4) + 3;

    // Place buildings based on specialization
    let placedTiles = 0;
    for (const neighbor of neighbors) {
      if (placedTiles >= numAdditionalTiles) break;

      // Special handling for fishing villages - allow shore tiles
      const isFishingVillage = specialization === VillageSpecialization.Fishing;
      if (isFishingVillage && neighbor.terrain === TerrainType.Shore) {
        // OK for fishing village
      } else if (!this.isSuitableForBuilding(neighbor)) {
        continue;
      }

      // Higher chance for placing buildings (70%)
      if (
        this.seededRandom(
          settlementId * 3.7 + neighbor.col * 0.5 + neighbor.row * 0.8,
        ) > 0.7
      )
        continue;

      // Choose building type based on specialization
      const buildingRoll = this.seededRandom(
        settlementId * 7.3 + neighbor.col + neighbor.row,
      );
      let building: BuildingType;

      if (buildingRoll < 0.5) {
        // 50% houses
        building = BuildingType.House;
      } else if (buildingRoll < 0.8) {
        // 30% primary specialized building
        building = primaryBuilding;
      } else {
        // 20% secondary specialized building (rarer, more advanced)
        building = secondaryBuilding;
      }

      // Special case: fishing villages on shore should use fishing-specific buildings
      if (
        isFishingVillage &&
        neighbor.terrain === TerrainType.Shore &&
        building !== BuildingType.House
      ) {
        building =
          this.seededRandom(settlementId * 13.7 + neighbor.col + neighbor.row) <
          0.6
            ? BuildingType.FishingHut
            : BuildingType.Dock;
      }

      neighbor.building = building;
      neighbor.vegetation = VegetationType.None;
      neighbor.isRough = false;
      neighbor.settlementId = settlementId;
      tiles.push({ col: neighbor.col, row: neighbor.row });
      placedTiles++;
    }

    return {
      type: "village",
      specialization,
      center: { col: centerTile.col, row: centerTile.row },
      tiles,
      landmark,
    };
  }

  private determineVillageSpecialization(
    grid: Grid<HexTile>,
    centerTile: HexTile,
    settlementId: number,
  ): VillageSpecialization {
    // Check nearby terrain within 2-3 tiles
    const nearbyTiles = this.getNeighborsInRange(grid, centerTile, 3);

    // Count terrain types
    let waterCount = 0;
    let mountainCount = 0;
    let forestCount = 0;

    for (const tile of nearbyTiles) {
      if (isWater(tile.terrain) || tile.terrain === TerrainType.Shore) {
        waterCount++;
      }
      if (tile.terrain === TerrainType.Mountains) {
        mountainCount++;
      }
      if (tile.vegetation === VegetationType.Tree) {
        forestCount++;
      }
    }

    // Determine specialization based on terrain
    const roll = this.seededRandom(settlementId * 5.7);

    // Fishing villages near water (30% if near coast)
    if (waterCount > 3 && roll < 0.5) {
      return VillageSpecialization.Fishing;
    }

    // Mining/quarry near mountains (40% if near mountains)
    if (mountainCount > 2 && roll < 0.6) {
      return VillageSpecialization.Mining;
    }

    // Lumber villages near forests (30% if near forest)
    if (forestCount > 8 && roll < 0.5) {
      return VillageSpecialization.Lumber;
    }

    // Otherwise, randomly choose from remaining specializations
    const genericRoll = this.seededRandom(settlementId * 9.3);
    if (genericRoll < 0.15) return VillageSpecialization.Religious;
    if (genericRoll < 0.3) return VillageSpecialization.Trading;
    if (genericRoll < 0.5) return VillageSpecialization.Farming;
    if (genericRoll < 0.65) return VillageSpecialization.Military;

    return VillageSpecialization.Generic;
  }

  private getBuildingsForSpecialization(specialization: VillageSpecialization): {
    landmark: BuildingType | undefined;
    primaryBuilding: BuildingType;
    secondaryBuilding: BuildingType;
  } {
    switch (specialization) {
      case VillageSpecialization.Fishing:
        return {
          landmark: undefined,
          primaryBuilding: BuildingType.FishingHut,
          secondaryBuilding: BuildingType.Dock,
        };
      case VillageSpecialization.Lumber:
        return {
          landmark: undefined,
          primaryBuilding: BuildingType.LumberCamp,
          secondaryBuilding: BuildingType.Sawmill,
        };
      case VillageSpecialization.Mining:
        return {
          landmark: undefined,
          primaryBuilding: BuildingType.Mine,
          secondaryBuilding: BuildingType.Quarry,
        };
      case VillageSpecialization.Religious:
        return {
          landmark: BuildingType.Monastery,
          primaryBuilding: BuildingType.Chapel,
          secondaryBuilding: BuildingType.House,
        };
      case VillageSpecialization.Trading:
        return {
          landmark: undefined,
          primaryBuilding: BuildingType.TradingPost,
          secondaryBuilding: BuildingType.Warehouse,
        };
      case VillageSpecialization.Farming:
        return {
          landmark: BuildingType.Windmill,
          primaryBuilding: BuildingType.Field,
          secondaryBuilding: BuildingType.GrainSilo,
        };
      case VillageSpecialization.Military:
        return {
          landmark: undefined,
          primaryBuilding: BuildingType.Barracks,
          secondaryBuilding: BuildingType.Watchtower,
        };
      case VillageSpecialization.Generic:
      default:
        return {
          landmark: undefined,
          primaryBuilding: BuildingType.Field,
          secondaryBuilding: BuildingType.House,
        };
    }
  }

  private findSettlementLocation(
    grid: Grid<HexTile>,
    type: "city" | "village",
  ): HexTile | null {
    const minDistance = type === "city" ? 20 : 12;
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Sample a random location
      const col = Math.floor(
        this.seededRandom(attempt * 17.3) * this.config.width,
      );
      const row = Math.floor(
        this.seededRandom(attempt * 23.7) * this.config.height,
      );

      const hex = grid.getHex({ col, row });
      if (!hex) continue;

      // Check if suitable for settlement
      if (!this.isSuitableForBuilding(hex)) continue;

      // Check distance from other settlements
      let tooClose = false;
      for (const settlement of this.settlements) {
        const dx = settlement.center.col - col;
        const dy = settlement.center.row - row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        return hex;
      }
    }

    return null;
  }

  private isSuitableForBuilding(hex: HexTile): boolean {
    // Can only build on plains and hills
    if (
      hex.terrain !== TerrainType.Plains &&
      hex.terrain !== TerrainType.Hills
    ) {
      return false;
    }

    // Don't build on tiles that already have buildings
    if (hex.building !== BuildingType.None) {
      return false;
    }

    return true;
  }

  private getNeighborsInRange(
    grid: Grid<HexTile>,
    center: HexTile,
    range: number,
  ): HexTile[] {
    const neighbors: HexTile[] = [];
    const visited = new Set<string>();

    const queue: Array<{ hex: HexTile; dist: number }> = [
      { hex: center, dist: 0 },
    ];
    visited.add(`${center.col},${center.row}`);

    while (queue.length > 0) {
      const { hex, dist } = queue.shift()!;

      if (dist > 0 && dist <= range) {
        neighbors.push(hex);
      }

      if (dist < range) {
        // Use shared neighbor directions constant
        for (const dir of HEX_NEIGHBOR_DIRS) {
          const neighbor = grid.neighborOf(hex, dir, { allowOutside: false });
          if (neighbor) {
            const key = `${neighbor.col},${neighbor.row}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push({ hex: neighbor, dist: dist + 1 });
            }
          }
        }
      }
    }

    return neighbors;
  }

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

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}
