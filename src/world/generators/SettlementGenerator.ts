import { Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { TerrainType, VegetationType, isWater } from "../Terrain";
import { BuildingType, Settlement, VillageSpecialization } from "../Building";
import { WorldGenConfig } from "../WorldGenerator";
import { ResourceAwareSettlementPlacer, ResourceAnalysis } from "./ResourceAwareSettlementPlacer";
import { ResourceType } from "../Resource";
import { getPrimaryExtractionBuilding } from "../ResourceExtraction";

/**
 * Handles settlement generation (cities and villages)
 */
export class SettlementGenerator {
  private config: WorldGenConfig;
  private placer: ResourceAwareSettlementPlacer;
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
    this.placer = new ResourceAwareSettlementPlacer();
  }

  /**
   * Generate all settlements (cities, villages, and hamlets)
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

    // Generate hamlets (tiny, 1-2 tiles)
    for (let i = 0; i < this.config.numHamlets; i++) {
      const hamlet = this.tryPlaceHamlet(grid, settlementId++);
      if (hamlet) {
        this.settlements.push(hamlet);
      }
    }

    const cities = this.settlements.filter((s) => s.type === "city");
    const villages = this.settlements.filter((s) => s.type === "village");
    const hamlets = this.settlements.filter((s) => s.type === "hamlet");

    // Count village specializations
    const villageSpecCounts: Record<string, number> = {};
    villages.forEach((v) => {
      const spec = v.specialization || VillageSpecialization.Generic;
      villageSpecCounts[spec] = (villageSpecCounts[spec] || 0) + 1;
    });

    // Count hamlet specializations
    const hamletSpecCounts: Record<string, number> = {};
    hamlets.forEach((h) => {
      const spec = h.specialization || VillageSpecialization.Generic;
      hamletSpecCounts[spec] = (hamletSpecCounts[spec] || 0) + 1;
    });

    console.log(`Generated ${cities.length} cities, ${villages.length} villages, and ${hamlets.length} hamlets`);
    console.log(`Cities: Resource-aware placement (exploit nearby resources)`);
    console.log(`Villages:`);
    Object.entries(villageSpecCounts).forEach(([spec, count]) => {
      console.log(`  - ${count} ${spec} village(s)`);
    });
    console.log(`Hamlets:`);
    Object.entries(hamletSpecCounts).forEach(([spec, count]) => {
      console.log(`  - ${count} ${spec} hamlet(s)`);
    });

    return this.settlements;
  }

  /**
   * Attempt to place a city (resource-aware)
   */
  private tryPlaceCity(grid: Grid<HexTile>, settlementId: number): Settlement | null {
    // Find a suitable location for a city (resource-aware - cities prefer resource-rich areas)
    const location = this.placer.findResourceAwareLocation(
      grid,
      "city",
      this.settlements,
      this.config,
      this.seededRandom
    );
    if (!location) return null;

    const centerTile = location.tile;
    const resourceAnalysis = location.analysis;

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

    // FIRST: Place extraction buildings on nearby resources (shows why city is here!)
    // Cities exploit MORE resources than villages (economic diversity)
    const extractionTiles = this.placeExtractionBuildings(
      grid,
      centerTile,
      resourceAnalysis,
      settlementId,
      VillageSpecialization.Generic, // Cities don't have specialization
      true // isCity flag - exploit more resources
    );
    
    let placedTiles = extractionTiles.length;
    tiles.push(...extractionTiles);

    // THEN: Place city houses and other buildings around the landmark
    for (const neighbor of neighbors) {
      if (placedTiles >= numTiles) break;

      // Skip if already has a building (from extraction placement)
      if (neighbor.building !== BuildingType.None) continue;

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
        // Mix of city houses (80%), warehouses (15%), and trading posts (5%)
        const buildingRoll = this.seededRandom(settlementId * 7.9 + neighbor.col + neighbor.row);
        let building: BuildingType;
        
        if (buildingRoll < 0.8) {
          building = BuildingType.CityHouse;
        } else if (buildingRoll < 0.95) {
          building = BuildingType.Warehouse;
        } else {
          building = BuildingType.TradingPost;
        }

        neighbor.building = building;
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
    // Find a suitable location for a village (resource-aware)
    const location = this.placer.findResourceAwareLocation(
      grid,
      "village",
      this.settlements,
      this.config,
      this.seededRandom
    );
    if (!location) return null;

    const centerTile = location.tile;
    const resourceAnalysis = location.analysis;

    // Determine specialization based on nearby resources AND terrain
    const specialization = this.determineVillageSpecializationFromResources(
      grid,
      centerTile,
      resourceAnalysis,
      settlementId,
    );

    // Get landmark and primary building for this specialization
    const { landmark, primaryBuilding, secondaryBuilding } =
      this.getBuildingsForSpecialization(specialization, resourceAnalysis.dominantResource);

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

    // Place buildings based on specialization AND nearby resources
    let placedTiles = 0;
    
    // First, try to place extraction buildings on resource tiles
    const resourceBuildings = this.placeExtractionBuildings(
      grid,
      centerTile,
      resourceAnalysis,
      settlementId,
      specialization,
      false // isCity = false for villages
    );
    placedTiles += resourceBuildings.length;
    tiles.push(...resourceBuildings);

    // Then place regular village buildings
    for (const neighbor of neighbors) {
      if (placedTiles >= numAdditionalTiles) break;

      // Skip if already has a building
      if (neighbor.building !== BuildingType.None) continue;

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
   * Determine village specialization based on nearby resources (NEW - resource-aware)
   */
  private determineVillageSpecializationFromResources(
    grid: Grid<HexTile>,
    centerTile: HexTile,
    resourceAnalysis: ResourceAnalysis,
    settlementId: number,
  ): VillageSpecialization {
    // If we have a dominant resource, specialize based on it
    if (resourceAnalysis.dominantResource) {
      const dominant = resourceAnalysis.dominantResource;
      const count = resourceAnalysis.resourceCounts.get(dominant) || 0;

      // Need at least 2 resources to justify specialization
      if (count >= 2) {
        // Fish → Fishing village
        if (dominant === ResourceType.Fish) {
          return VillageSpecialization.Fishing;
        }

        // Metals → Mining village
        if (
          [
            ResourceType.Copper,
            ResourceType.Iron,
            ResourceType.Silver,
            ResourceType.Gold,
            ResourceType.Gems,
          ].includes(dominant)
        ) {
          return VillageSpecialization.Mining;
        }

        // Stone → Mining village (quarry)
        if (dominant === ResourceType.Stone) {
          return VillageSpecialization.Mining;
        }

        // Timber → Lumber village
        if (dominant === ResourceType.Timber) {
          return VillageSpecialization.Lumber;
        }

        // Wild Game → Lumber village (hunting/forestry)
        if (dominant === ResourceType.WildGame) {
          return VillageSpecialization.Lumber;
        }

        // Salt → Trading (valuable commodity)
        if (dominant === ResourceType.Salt) {
          return VillageSpecialization.Trading;
        }
      }
    }

    // Fall back to terrain-based specialization
    return this.determineVillageSpecialization(grid, centerTile, settlementId);
  }

  /**
   * Determine village specialization based on nearby terrain (ORIGINAL - terrain-based fallback)
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
   * Get building types for a village specialization (updated to consider resources)
   */
  private getBuildingsForSpecialization(
    specialization: VillageSpecialization,
    dominantResource?: ResourceType | null
  ): {
    landmark: BuildingType | undefined;
    primaryBuilding: BuildingType;
    secondaryBuilding: BuildingType;
  } {
    // For mining villages, use resource-specific mine if available
    if (specialization === VillageSpecialization.Mining && dominantResource) {
      const specificMine = getPrimaryExtractionBuilding(dominantResource);
      if (specificMine && specificMine !== BuildingType.Mine) {
        return {
          landmark: undefined,
          primaryBuilding: specificMine,
          secondaryBuilding: BuildingType.Quarry,
        };
      }
    }

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

  /**
   * Place extraction buildings on tiles with resources nearby
   */
  private placeExtractionBuildings(
    grid: Grid<HexTile>,
    centerTile: HexTile,
    resourceAnalysis: ResourceAnalysis,
    settlementId: number,
    specialization: VillageSpecialization,
    isCity: boolean = false
  ): Array<{ col: number; row: number }> {
    const placedTiles: Array<{ col: number; row: number }> = [];

    // Group resources by type and sort by quality (best first)
    const resourcesByType = new Map<ResourceType, Array<{ tile: HexTile; quality: number }>>();
    for (const { tile, resource, quality } of resourceAnalysis.resourceTiles) {
      if (!resourcesByType.has(resource)) {
        resourcesByType.set(resource, []);
      }
      resourcesByType.get(resource)!.push({ tile, quality });
    }

    // Sort each resource group by quality (excellent first)
    for (const [_, tiles] of resourcesByType.entries()) {
      tiles.sort((a, b) => b.quality - a.quality);
    }

    // For each resource type, try to place extraction buildings
    for (const [resourceType, resourceTiles] of resourcesByType.entries()) {
      const extractionBuilding = getPrimaryExtractionBuilding(resourceType);
      if (!extractionBuilding) continue;

      // Determine how many extraction buildings to place
      const count = resourceTiles.length;
      // Cities place more extraction buildings (they're economic hubs)
      const numBuildings = isCity 
        ? Math.min(count, Math.ceil(count * 0.7)) // Cities: exploit 70% of nearby resources
        : count >= 4 ? 2 : 1; // Villages/hamlets: 1-2 buildings

      // Place extraction buildings (highest quality first)
      let placed = 0;
      for (const { tile: resourceTile, quality } of resourceTiles) {
        if (placed >= numBuildings) break;

        // Find suitable location (ON resource if possible)
        const buildingTile = this.placer.findExtractionBuildingLocation(
          grid,
          resourceTile,
          settlementId
        );

        if (buildingTile) {
          buildingTile.building = extractionBuilding;
          buildingTile.vegetation = VegetationType.None;
          buildingTile.isRough = false;
          buildingTile.settlementId = settlementId;
          placedTiles.push({ col: buildingTile.col, row: buildingTile.row });
          placed++;
        }
      }
    }

    return placedTiles;
  }

  /**
   * Attempt to place a hamlet (very small settlement, 1-2 tiles)
   */
  private tryPlaceHamlet(grid: Grid<HexTile>, settlementId: number): Settlement | null {
    // Find a suitable location for a hamlet (resource-aware)
    const location = this.placer.findResourceAwareLocation(
      grid,
      "hamlet",
      this.settlements,
      this.config,
      this.seededRandom
    );
    if (!location) return null;

    const centerTile = location.tile;
    const resourceAnalysis = location.analysis;

    // Determine specialization based on resources
    const specialization = this.determineVillageSpecializationFromResources(
      grid,
      centerTile,
      resourceAnalysis,
      settlementId,
    );

    // Get buildings for this specialization
    const { primaryBuilding } = this.getBuildingsForSpecialization(
      specialization,
      resourceAnalysis.dominantResource
    );

    // Decide hamlet composition based on resources:
    // If there's a good resource nearby (score > 2), prioritize extraction
    // Otherwise, just a house or mixed
    const compositionRoll = this.seededRandom(settlementId * 11.7);
    const hasGoodResource = resourceAnalysis.score > 2;
    
    let centerBuilding: BuildingType;
    let hasSecondBuilding = false;
    
    if (hasGoodResource) {
      // Resource-focused hamlet
      if (compositionRoll < 0.6) {
        // 60% - just an extraction building (pure resource hamlet)
        const extractionBuilding = resourceAnalysis.dominantResource
          ? getPrimaryExtractionBuilding(resourceAnalysis.dominantResource)
          : null;
        centerBuilding = extractionBuilding || primaryBuilding;
      } else {
        // 40% - house + extraction building
        centerBuilding = BuildingType.House;
        hasSecondBuilding = true;
      }
    } else {
      // Generic hamlet (no good resources)
      if (compositionRoll < 0.5) {
        // 50% - just a house
        centerBuilding = BuildingType.House;
      } else if (compositionRoll < 0.8) {
        // 30% - just a specialized building
        centerBuilding = primaryBuilding;
      } else {
        // 20% - house + specialized building
        centerBuilding = BuildingType.House;
        hasSecondBuilding = true;
      }
    }

    // Place the center building
    centerTile.building = centerBuilding;
    centerTile.vegetation = VegetationType.None;
    centerTile.isRough = false;
    centerTile.settlementId = settlementId;

    const tiles: Array<{ col: number; row: number }> = [
      { col: centerTile.col, row: centerTile.row },
    ];

    // If hamlet has a second building, try to place it adjacent (preferably on a resource)
    if (hasSecondBuilding) {
      // First, try to place an extraction building on a nearby resource
      let placedExtraction = false;
      
      if (resourceAnalysis.totalResources > 0) {
        const extractionTiles = this.placeExtractionBuildings(
          grid,
          centerTile,
          resourceAnalysis,
          settlementId,
          specialization,
          false // isCity = false for hamlets
        );
        
        if (extractionTiles.length > 0) {
          tiles.push(extractionTiles[0]); // Just one extraction building for hamlets
          placedExtraction = true;
        }
      }

      // If we didn't place an extraction building, place a generic specialized building
      if (!placedExtraction) {
        const neighbors = this.placer.getNeighborsInRange(grid, centerTile, 1);
        
        for (const neighbor of neighbors) {
          // Skip if already has a building
          if (neighbor.building !== BuildingType.None) continue;

          // Special handling for fishing hamlets - allow shore tiles
          const isFishingHamlet = specialization === VillageSpecialization.Fishing;
          if (isFishingHamlet && neighbor.terrain === TerrainType.Shore) {
            // OK for fishing hamlet
          } else if (!this.placer.isSuitableForBuilding(neighbor)) {
            continue;
          }

          // Place the specialized building
          let building = primaryBuilding;
          
          // Special case: fishing hamlets on shore should use fishing huts
          if (
            isFishingHamlet &&
            neighbor.terrain === TerrainType.Shore
          ) {
            building = BuildingType.FishingHut;
          }

          neighbor.building = building;
          neighbor.vegetation = VegetationType.None;
          neighbor.isRough = false;
          neighbor.settlementId = settlementId;
          tiles.push({ col: neighbor.col, row: neighbor.row });
          break; // Only add one additional building
        }
      }
    }

    return {
      type: "hamlet",
      specialization,
      center: { col: centerTile.col, row: centerTile.row },
      tiles,
    };
  }
}
