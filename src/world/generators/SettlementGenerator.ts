import { Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { TerrainType, VegetationType, isWater } from "../Terrain";
import { BuildingType, Settlement, VillageSpecialization } from "../Building";
import { WorldGenConfig } from "../WorldGenerator";
import { SettlementPlacer } from "./SettlementPlacer";

/**
 * Handles settlement generation (cities and villages)
 */
export class SettlementGenerator {
  private config: WorldGenConfig;
  private placer: SettlementPlacer;
  private settlements: Settlement[] = [];
  private seededRandom: (seed: number) => number;
  private hexDistance: (a: HexTile, b: HexTile) => number;

  constructor(
    config: WorldGenConfig,
    seededRandom: (seed: number) => number,
    hexDistance: (a: HexTile, b: HexTile) => number
  ) {
    this.config = config;
    this.seededRandom = seededRandom;
    this.hexDistance = hexDistance;
    this.placer = new SettlementPlacer();
  }

  /**
   * Generate all settlements (cities and villages)
   */
  generateSettlements(grid: Grid<HexTile>): Settlement[] {
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

    return this.settlements;
  }

  /**
   * Attempt to place a city
   */
  private tryPlaceCity(grid: Grid<HexTile>, settlementId: number): Settlement | null {
    // Find a suitable location for a city
    const centerTile = this.placer.findSettlementLocation(
      grid,
      "city",
      this.settlements,
      this.config,
      this.seededRandom
    );
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
    const neighbors = this.placer.getNeighborsInRange(grid, centerTile, 2);

    // Determine city size (more tiles: 8-15 total including center)
    const numTiles = Math.floor(this.seededRandom(settlementId * 2.3) * 8) + 7; // 7-14 additional tiles

    // Place city houses around the landmark
    let placedTiles = 0;
    for (const neighbor of neighbors) {
      if (placedTiles >= numTiles) break;

      // Only place on suitable terrain
      if (!this.placer.isSuitableForBuilding(neighbor)) continue;

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

  /**
   * Attempt to place a village
   */
  private tryPlaceVillage(grid: Grid<HexTile>, settlementId: number): Settlement | null {
    // Find a suitable location for a village
    const centerTile = this.placer.findSettlementLocation(
      grid,
      "village",
      this.settlements,
      this.config,
      this.seededRandom
    );
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
    const neighbors = this.placer.getNeighborsInRange(grid, centerTile, 1);

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
      } else if (!this.placer.isSuitableForBuilding(neighbor)) {
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

  /**
   * Determine village specialization based on nearby terrain
   */
  private determineVillageSpecialization(
    grid: Grid<HexTile>,
    centerTile: HexTile,
    settlementId: number,
  ): VillageSpecialization {
    // Check nearby terrain within 2-3 tiles
    const nearbyTiles = this.placer.getNeighborsInRange(grid, centerTile, 3);

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

  /**
   * Get building types for a village specialization
   */
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
}
