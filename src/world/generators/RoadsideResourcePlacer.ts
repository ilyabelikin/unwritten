import { Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { BuildingType, Settlement } from "../Building";
import { ResourceType } from "../Resource";
import { TerrainType, VegetationType, isWater } from "../Terrain";
import { getPrimaryExtractionBuilding } from "../ResourceExtraction";
import { ResourceAwareSettlementPlacer } from "./ResourceAwareSettlementPlacer";
import { SettlementNameGenerator } from "./SettlementNameGenerator";

/**
 * Places additional hamlets to exploit high-quality resources near roads
 * after the main road network has been established.
 * 
 * Buildings are placed DIRECTLY ON resource tiles (mine ON ore, not adjacent).
 * Resource icons are hidden once exploited.
 */
export class RoadsideResourcePlacer {
  private placer: ResourceAwareSettlementPlacer;

  constructor() {
    this.placer = new ResourceAwareSettlementPlacer();
  }

  /**
   * Place hamlets on unexploited resources near roads.
   * Buildings placed DIRECTLY ON resources (mine ON ore deposit).
   * Resource icons hidden once exploited.
   */
  placeRoadsideHamlets(
    grid: Grid<HexTile>,
    settlements: Settlement[],
    nameGenerator: SettlementNameGenerator,
    seededRandom: (seed: number) => number
  ): Settlement[] {
    const newHamlets: Settlement[] = [];
    let hamletId = settlements.length; // Continue ID sequence

    // Find all unexploited resources near roads
    const candidates = this.findRoadsideResourceCandidates(grid);

    console.log(`[RoadsideResourcePlacer] Found ${candidates.length} roadside resource candidates`);

    // Sort by quality (best first) and value
    candidates.sort((a, b) => {
      const qualityDiff = b.quality - a.quality;
      if (Math.abs(qualityDiff) > 0.1) return qualityDiff;
      
      // Tie-breaker: resource value
      const aValue = this.getResourceValue(a.resource);
      const bValue = this.getResourceValue(b.resource);
      return bValue - aValue;
    });

    // Place hamlets on top candidates
    let placed = 0;
    const maxRoadsideHamlets = Math.min(10, Math.ceil(candidates.length * 0.3)); // Up to 30% of candidates

    for (const candidate of candidates) {
      if (placed >= maxRoadsideHamlets) break;

      // Skip if not high enough quality (unless it's a precious resource)
      const isPrecious = [ResourceType.Gold, ResourceType.Silver, ResourceType.Gems].includes(
        candidate.resource
      );
      if (candidate.quality < 0.6 && !isPrecious) continue;

      // Try to place hamlet
      const hamlet = this.tryPlaceRoadsideHamlet(
        grid,
        candidate,
        hamletId,
        settlements,
        nameGenerator,
        seededRandom
      );

      if (hamlet) {
        newHamlets.push(hamlet);
        settlements.push(hamlet);
        hamletId++;
        placed++;
      }
    }

    if (newHamlets.length > 0) {
      console.log(`[RoadsideResourcePlacer] Placed ${newHamlets.length} roadside hamlets`);
      
      // Log what was placed
      const resourceCounts: Record<string, number> = {};
      for (const hamlet of newHamlets) {
        const building = grid.getHex(hamlet.center)?.building;
        if (building) {
          resourceCounts[building] = (resourceCounts[building] || 0) + 1;
        }
      }
      Object.entries(resourceCounts).forEach(([building, count]) => {
        console.log(`  - ${count} ${building} hamlet(s)`);
      });
    }

    return newHamlets;
  }

  /**
   * Find unexploited resources near roads
   */
  private findRoadsideResourceCandidates(grid: Grid<HexTile>): Array<{
    tile: HexTile;
    resource: ResourceType;
    quality: number;
    roadDistance: number;
  }> {
    const candidates: Array<{
      tile: HexTile;
      resource: ResourceType;
      quality: number;
      roadDistance: number;
    }> = [];

    grid.forEach((hex) => {
      // Must have a resource
      if (!hex.resource || hex.resource.type === ResourceType.None) return;

      // Must not already have a building
      if (hex.building !== BuildingType.None) return;

      // Must not be part of a settlement
      if (hex.settlementId !== undefined) return;

      // Must be near a road (within 2 tiles)
      const roadDistance = this.getDistanceToNearestRoad(grid, hex);
      if (roadDistance > 2) return;

      candidates.push({
        tile: hex,
        resource: hex.resource.type,
        quality: hex.resource.quality,
        roadDistance,
      });
    });

    return candidates;
  }

  /**
   * Calculate distance to nearest road
   */
  private getDistanceToNearestRoad(grid: Grid<HexTile>, center: HexTile): number {
    // BFS to find nearest road
    const visited = new Set<string>();
    const queue: Array<{ hex: HexTile; dist: number }> = [{ hex: center, dist: 0 }];
    visited.add(`${center.col},${center.row}`);

    while (queue.length > 0) {
      const { hex, dist } = queue.shift()!;

      if (hex.hasRoad && dist > 0) {
        return dist;
      }

      if (dist < 3) {
        // Only search up to 3 tiles
        for (const neighbor of this.placer.getNeighborsInRange(grid, hex, 1)) {
          const key = `${neighbor.col},${neighbor.row}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ hex: neighbor, dist: dist + 1 });
          }
        }
      }
    }

    return 999; // No road found
  }

  /**
   * Try to place a roadside hamlet at a resource location
   */
  private tryPlaceRoadsideHamlet(
    grid: Grid<HexTile>,
    candidate: { tile: HexTile; resource: ResourceType; quality: number },
    settlementId: number,
    settlements: Settlement[],
    nameGenerator: SettlementNameGenerator,
    seededRandom: (seed: number) => number
  ): Settlement | null {
    const resourceTile = candidate.tile;
    const extractionBuilding = getPrimaryExtractionBuilding(candidate.resource);
    if (!extractionBuilding) return null;

    // Find suitable location for extraction building (ON resource, or adjacent if unsuitable)
    const buildingTile = this.placer.findExtractionBuildingLocation(
      grid,
      resourceTile,
      settlementId
    );

    if (!buildingTile) return null;

    // Check minimum distance from other settlements (at least 3 tiles for roadside hamlets)
    for (const settlement of settlements) {
      const dx = settlement.center.col - buildingTile.col;
      const dy = settlement.center.row - buildingTile.row;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        return null; // Too close to another settlement
      }
    }

    // Place the extraction building
    buildingTile.building = extractionBuilding;
    buildingTile.vegetation = VegetationType.None;
    buildingTile.isRough = false;
    buildingTile.settlementId = settlementId;

    const tiles: Array<{ col: number; row: number }> = [
      { col: buildingTile.col, row: buildingTile.row },
    ];

    // Special case: For fish, ALSO place a fishing boat ON the fish itself (in water)
    if (candidate.resource === ResourceType.Fish) {
      // Place boat ON the fish tile (in water) to show exploitation visually
      // IMPORTANT: Only place boat if tile is actually in water!
      if (resourceTile.building === BuildingType.None && isWater(resourceTile.terrain)) {
        resourceTile.building = BuildingType.FishingBoat;
        resourceTile.settlementId = settlementId;
        tiles.push({ col: resourceTile.col, row: resourceTile.row });
      }
    }

    // CRITICAL: Always add a house (workers need somewhere to live!)
    // Try to place house adjacent to extraction building
    const neighbors = this.placer.getNeighborsInRange(grid, buildingTile, 1);
    let housePlaced = false;
    
    for (const neighbor of neighbors) {
      if (
        this.placer.isSuitableForBuilding(neighbor) &&
        neighbor.building === BuildingType.None &&
        neighbor.settlementId === undefined
      ) {
        neighbor.building = BuildingType.House;
        neighbor.vegetation = VegetationType.None;
        neighbor.isRough = false;
        neighbor.settlementId = settlementId;
        tiles.push({ col: neighbor.col, row: neighbor.row });
        housePlaced = true;
        break;
      }
    }
    
    // If we couldn't place a house adjacent, place extraction building as house instead
    // (Better to have housing than pure extraction with no population)
    if (!housePlaced) {
      console.warn(`[RoadsideHamlet] Could not place house for hamlet at (${buildingTile.col}, ${buildingTile.row}), converting extraction building to house`);
      buildingTile.building = BuildingType.House;
    }

    // Connect hamlet to the road with a path
    this.connectToRoad(grid, buildingTile);

    // Add dock if this is a coastal hamlet (fish resources are often coastal)
    if (candidate.resource === ResourceType.Fish) {
      const dockTile = this.tryPlaceCoastalDock(grid, buildingTile, settlementId);
      if (dockTile) {
        tiles.push(dockTile);
      }
    }

    // Determine specialization based on resource
    const specialization = this.getSpecializationForResource(candidate.resource);
    
    // Generate proper unique name using the name generator
    const name = nameGenerator.generateName("hamlet", specialization);

    return {
      name,
      type: "hamlet",
      specialization,
      center: { col: buildingTile.col, row: buildingTile.row },
      tiles,
    };
  }

  /**
   * Get specialization based on resource type
   */
  private getSpecializationForResource(resource: ResourceType): any {
    // Import would be circular, so we use string values
    switch (resource) {
      case ResourceType.Fish:
        return "fishing";
      case ResourceType.Timber:
      case ResourceType.WildGame:
        return "lumber";
      case ResourceType.Copper:
      case ResourceType.Iron:
      case ResourceType.Silver:
      case ResourceType.Gold:
      case ResourceType.Gems:
      case ResourceType.Stone:
        return "mining";
      case ResourceType.Salt:
        return "trading";
      default:
        return "generic";
    }
  }

  /**
   * Get resource value for prioritization
   */
  private getResourceValue(resource: ResourceType): number {
    switch (resource) {
      case ResourceType.Gold:
      case ResourceType.Silver:
      case ResourceType.Gems:
        return 3.0;
      case ResourceType.Iron:
      case ResourceType.Copper:
        return 2.5;
      case ResourceType.Stone:
      case ResourceType.Timber:
      case ResourceType.Salt:
        return 2.0;
      case ResourceType.Fish:
      case ResourceType.WildGame:
      case ResourceType.Livestock:
        return 1.5;
      case ResourceType.Clay:
        return 1.2;
      default:
        return 1.0;
    }
  }

  /**
   * Connect hamlet to the nearest road with a path
   */
  private connectToRoad(grid: Grid<HexTile>, hamletTile: HexTile): void {
    // BFS to find path to nearest road
    const visited = new Set<string>();
    const queue: Array<{ hex: HexTile; path: HexTile[] }> = [
      { hex: hamletTile, path: [hamletTile] },
    ];
    visited.add(`${hamletTile.col},${hamletTile.row}`);

    while (queue.length > 0) {
      const { hex, path } = queue.shift()!;

      // Found a road! Connect to it
      if (hex.hasRoad && hex !== hamletTile) {
        // Mark all tiles in path (except hamlet and road end) as roads
        for (let i = 1; i < path.length - 1; i++) {
          const tile = path[i];
          if (!tile.hasRoad && tile.building === BuildingType.None) {
            tile.hasRoad = true;
          }
        }
        return;
      }

      // Continue searching (max 3 tiles away)
      if (path.length < 4) {
        for (const neighbor of this.placer.getNeighborsInRange(grid, hex, 1)) {
          const key = `${neighbor.col},${neighbor.row}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ hex: neighbor, path: [...path, neighbor] });
          }
        }
      }
    }
  }

  /**
   * Try to place a dock/pier for a coastal hamlet
   */
  private tryPlaceCoastalDock(
    grid: Grid<HexTile>,
    centerTile: HexTile,
    settlementId: number
  ): { col: number; row: number } | null {
    // Check if hamlet is near water (within 2 tiles)
    const nearbyTiles = this.placer.getNeighborsInRange(grid, centerTile, 2);
    
    // Find shore tiles adjacent to water
    for (const tile of nearbyTiles) {
      // Must be shore terrain (perfect for docks)
      if (tile.terrain !== TerrainType.Shore) continue;
      
      // Must not have a building
      if (tile.building !== BuildingType.None) continue;
      
      // Must not be part of settlement yet
      if (tile.settlementId !== undefined) continue;
      
      // Check if adjacent to water
      const neighbors = this.placer.getNeighborsInRange(grid, tile, 1);
      const hasWater = neighbors.some(n => isWater(n.terrain));
      
      if (hasWater) {
        // Found perfect dock location!
        tile.building = BuildingType.Dock;
        tile.vegetation = VegetationType.None;
        tile.isRough = false;
        tile.settlementId = settlementId;
        return { col: tile.col, row: tile.row };
      }
    }
    
    return null;
  }
}
