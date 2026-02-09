import { Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { TerrainType } from "../Terrain";
import { BuildingType, Settlement } from "../Building";
import { ResourceType } from "../Resource";
import { HEX_NEIGHBOR_DIRS } from "../HexMapUtils";
import { SettlementPlacer } from "./SettlementPlacer";

/**
 * Analyzes resources near a potential settlement location
 */
export interface ResourceAnalysis {
  /** Total number of resource deposits found nearby */
  totalResources: number;
  /** Resource counts by type */
  resourceCounts: Map<ResourceType, number>;
  /** Dominant resource (most common) */
  dominantResource: ResourceType | null;
  /** Resource score (higher = better for settlement) */
  score: number;
  /** List of tiles with resources and their distances */
  resourceTiles: Array<{ tile: HexTile; resource: ResourceType; distance: number; quality: number }>;
  /** Average quality of resources (0.3-1.0) */
  averageQuality: number;
  /** Best quality resource found */
  bestQuality: number;
}

/**
 * Extended settlement placer that considers resources when placing settlements
 */
export class ResourceAwareSettlementPlacer extends SettlementPlacer {
  /**
   * Find a suitable location for a settlement, biased toward resource-rich areas
   */
  findResourceAwareLocation(
    grid: Grid<HexTile>,
    type: "city" | "village" | "hamlet",
    settlements: Settlement[],
    config: { width: number; height: number },
    seededRandom: (seed: number) => number,
    preferredResources?: ResourceType[]
  ): { tile: HexTile; analysis: ResourceAnalysis } | null {
    const minDistance = type === "city" ? 20 : type === "village" ? 12 : 5;
    const maxAttempts = type === "hamlet" ? 150 : 120; // More attempts to find good spots

    let bestLocation: { tile: HexTile; analysis: ResourceAnalysis } | null = null;
    let bestScore = -1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Sample a random location (with some bias toward center for cities)
      let col: number, row: number;
      
      if (type === "city" && attempt < 20) {
        // Cities slightly prefer central locations
        const centerBias = 0.3;
        col = Math.floor(
          (seededRandom(attempt * 17.3) * (1 - centerBias) + centerBias * 0.5) * config.width
        );
        row = Math.floor(
          (seededRandom(attempt * 23.7) * (1 - centerBias) + centerBias * 0.5) * config.height
        );
      } else {
        col = Math.floor(seededRandom(attempt * 17.3) * config.width);
        row = Math.floor(seededRandom(attempt * 23.7) * config.height);
      }

      const hex = grid.getHex({ col, row });
      if (!hex) continue;

      // Check if suitable for settlement
      if (!this.isSuitableForBuilding(hex)) continue;

      // Check distance from other settlements
      let tooClose = false;
      for (const settlement of settlements) {
        const dx = settlement.center.col - col;
        const dy = settlement.center.row - row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (tooClose) continue;

      // Analyze nearby resources
      const searchRange = type === "city" ? 5 : type === "village" ? 4 : 3;
      const analysis = this.analyzeNearbyResources(grid, hex, searchRange, preferredResources);

      // Calculate location score
      let score = analysis.score;

      // Bonus for preferred resources
      if (preferredResources && preferredResources.length > 0) {
        for (const preferred of preferredResources) {
          const count = analysis.resourceCounts.get(preferred) || 0;
          score += count * 3; // Strong bonus for preferred resources
        }
      }

      // Cities prefer multiple different resources (diversity)
      if (type === "city") {
        score += analysis.resourceCounts.size * 2;
      }

      // Villages and hamlets prefer concentrated resources (specialization)
      if (type === "village" || type === "hamlet") {
        if (analysis.dominantResource) {
          const dominantCount = analysis.resourceCounts.get(analysis.dominantResource) || 0;
          score += dominantCount * 1.5;
        }
      }

      // Track best location found
      if (score > bestScore) {
        bestScore = score;
        bestLocation = { tile: hex, analysis };
      }
    }

    // Accept best location found (even if score is 0 - not all settlements need resources)
    // The scoring system will still prefer resource-rich locations when available
    return bestLocation;
  }

  /**
   * Analyze resources within range of a hex
   */
  analyzeNearbyResources(
    grid: Grid<HexTile>,
    center: HexTile,
    range: number,
    preferredResources?: ResourceType[]
  ): ResourceAnalysis {
    const resourceCounts = new Map<ResourceType, number>();
    const resourceTiles: Array<{ tile: HexTile; resource: ResourceType; distance: number; quality: number }> = [];
    let totalResources = 0;
    let totalQuality = 0;
    let bestQuality = 0;

    // BFS to find resources within range
    const visited = new Set<string>();
    const queue: Array<{ hex: HexTile; dist: number }> = [{ hex: center, dist: 0 }];
    visited.add(`${center.col},${center.row}`);

    while (queue.length > 0) {
      const { hex, dist } = queue.shift()!;

      // Check if this tile has a resource
      if (hex.resource && hex.resource.type !== ResourceType.None) {
        const resourceType = hex.resource.type;
        const quality = hex.resource.quality;
        
        resourceCounts.set(resourceType, (resourceCounts.get(resourceType) || 0) + 1);
        resourceTiles.push({ tile: hex, resource: resourceType, distance: dist, quality });
        totalResources++;
        totalQuality += quality;
        bestQuality = Math.max(bestQuality, quality);
      }

      // Continue BFS
      if (dist < range) {
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

    // Find dominant resource
    let dominantResource: ResourceType | null = null;
    let maxCount = 0;
    for (const [resourceType, count] of resourceCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantResource = resourceType;
      }
    }

    // Calculate score (considers quantity, proximity, quality, and resource value)
    let score = 0;
    for (const { resource, distance, quality } of resourceTiles) {
      // Closer resources are more valuable
      const proximityBonus = (range - distance + 1) / range;
      
      // Different resource categories have different values
      const valueMultiplier = this.getResourceValue(resource);
      
      // Preferred resources get extra weight
      const preferredBonus = preferredResources?.includes(resource) ? 2 : 1;
      
      // Quality matters! Excellent resources (0.8+) are much more attractive
      // Poor: 0.3-0.4 → 0.7x, Fair: 0.4-0.6 → 0.85x, Good: 0.6-0.8 → 1.0x, Excellent: 0.8-1.0 → 1.3x
      const qualityMultiplier = quality < 0.4 ? 0.7 : quality < 0.6 ? 0.85 : quality < 0.8 ? 1.0 : 1.3;
      
      score += proximityBonus * valueMultiplier * preferredBonus * qualityMultiplier;
    }

    const averageQuality = totalResources > 0 ? totalQuality / totalResources : 0;

    return {
      totalResources,
      resourceCounts,
      dominantResource,
      score,
      resourceTiles,
      averageQuality,
      bestQuality,
    };
  }

  /**
   * Get relative value of a resource for settlement placement
   */
  private getResourceValue(resource: ResourceType): number {
    switch (resource) {
      // High value: Precious metals and rare resources
      case ResourceType.Gold:
      case ResourceType.Silver:
      case ResourceType.Gems:
        return 3.0;

      // Medium-high value: Industrial metals
      case ResourceType.Iron:
      case ResourceType.Copper:
        return 2.5;

      // Medium value: Building materials and salt
      case ResourceType.Stone:
      case ResourceType.Timber:
      case ResourceType.Salt:
        return 2.0;

      // Medium-low value: Food sources
      case ResourceType.Fish:
      case ResourceType.WildGame:
      case ResourceType.Livestock:
        return 1.5;

      // Lower value: Clay
      case ResourceType.Clay:
        return 1.2;

      default:
        return 1.0;
    }
  }

  /**
   * Find the best tile to place an extraction building ON a resource
   */
  findExtractionBuildingLocation(
    grid: Grid<HexTile>,
    resourceTile: HexTile,
    settlementId: number
  ): HexTile | null {
    // FIRST: Try to place directly ON the resource tile itself!
    // Use expanded terrain check that includes shore for salt, mountains for mines, etc.
    if (
      this.isSuitableForExtractionBuilding(resourceTile) &&
      resourceTile.building === BuildingType.None &&
      resourceTile.settlementId === undefined
    ) {
      return resourceTile;
    }

    // FALLBACK: If resource tile is unsuitable (e.g., water for fish), place adjacent
    const neighbors = this.getNeighborsInRange(grid, resourceTile, 1);
    
    for (const neighbor of neighbors) {
      // Must be suitable for building and not already part of settlement
      if (
        this.isSuitableForExtractionBuilding(neighbor) &&
        neighbor.building === BuildingType.None &&
        neighbor.settlementId === undefined
      ) {
        return neighbor;
      }
    }

    // Last resort: Try one more ring out
    const extendedNeighbors = this.getNeighborsInRange(grid, resourceTile, 2);
    for (const neighbor of extendedNeighbors) {
      if (
        this.isSuitableForExtractionBuilding(neighbor) &&
        neighbor.building === BuildingType.None &&
        neighbor.settlementId === undefined
      ) {
        return neighbor;
      }
    }

    return null;
  }

  /**
   * Check if a tile is suitable for extraction buildings (more permissive than regular buildings)
   */
  private isSuitableForExtractionBuilding(hex: HexTile): boolean {
    // Extraction buildings can be placed on plains, hills, shore, and mountains
    // (Shore for salt works, mountains for mines, etc.)
    return (
      hex.terrain === TerrainType.Plains ||
      hex.terrain === TerrainType.Hills ||
      hex.terrain === TerrainType.Shore ||
      hex.terrain === TerrainType.Mountains
    );
  }

  /**
   * Check if a terrain is suitable for a specific resource extraction building
   */
  canPlaceExtractionBuilding(
    tile: HexTile,
    buildingType: BuildingType,
    resourceType: ResourceType
  ): boolean {
    // Special cases for fishing buildings - fish are IN water, so building goes on adjacent shore/land
    if (
      (buildingType === BuildingType.FishingHut || buildingType === BuildingType.Dock) &&
      resourceType === ResourceType.Fish
    ) {
      return (
        tile.terrain === TerrainType.Shore ||
        tile.terrain === TerrainType.Plains ||
        tile.terrain === TerrainType.Hills
      );
    }

    // Salt works can be on shore or adjacent plains
    if (buildingType === BuildingType.SaltWorks && resourceType === ResourceType.Salt) {
      return tile.terrain === TerrainType.Shore || tile.terrain === TerrainType.Plains;
    }

    // Mines can be on hills or mountains (where minerals are found)
    if (
      [
        BuildingType.CopperMine,
        BuildingType.IronMine,
        BuildingType.SilverMine,
        BuildingType.GoldMine,
        BuildingType.GemMine,
      ].includes(buildingType)
    ) {
      return tile.terrain === TerrainType.Hills || tile.terrain === TerrainType.Mountains;
    }

    // Quarries need rocky terrain
    if (buildingType === BuildingType.Quarry) {
      return tile.terrain === TerrainType.Mountains || tile.terrain === TerrainType.Hills;
    }

    // Most other buildings need plains or hills
    return tile.terrain === TerrainType.Plains || tile.terrain === TerrainType.Hills;
  }
}
