import { Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { TerrainType } from "../Terrain";
import { ResourceType, ResourceDeposit, RESOURCE_CONFIG } from "../Resource";
import { LayeredNoise } from "../../utils/noise";
import { BuildingType } from "../Building";

/**
 * Generates natural resource deposits across the map based on terrain,
 * elevation, and other environmental factors.
 */
export class ResourceGenerator {
  private resourceNoise: LayeredNoise;
  private qualityNoise: LayeredNoise;
  private seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.resourceNoise = new LayeredNoise(seed + "_resource");
    this.qualityNoise = new LayeredNoise(seed + "_quality");
  }

  /**
   * Generate and place resources across the entire map.
   * This should be called after terrain and vegetation generation.
   */
  generateResources(grid: Grid<HexTile>): void {
    const resourceCounts: Record<ResourceType, number> = {} as any;
    Object.values(ResourceType).forEach((type) => {
      resourceCounts[type] = 0;
    });

    grid.forEach((hex) => {
      // Skip tiles with settlements - resources are cleared for building
      if (hex.building !== BuildingType.None || hex.settlementId !== undefined) {
        return;
      }

      const resource = this.placeResource(hex, grid);
      if (resource && resource.type !== ResourceType.None) {
        hex.resource = resource;
        resourceCounts[resource.type]++;
      }
    });

    // Log resource distribution for debugging
    console.log("[ResourceGenerator] Resource distribution:");
    Object.entries(resourceCounts).forEach(([type, count]) => {
      if (count > 0 && type !== ResourceType.None) {
        console.log(`  ${type}: ${count} deposits`);
      }
    });
  }

  /**
   * Determine what resource (if any) should spawn on a given tile
   */
  private placeResource(hex: HexTile, grid: Grid<HexTile>): ResourceDeposit | undefined {
    const terrain = hex.terrain;
    const elevation = hex.elevation;
    const treeDensity = hex.treeDensity;

    // Get noise value for this tile (for randomization)
    const noiseValue = this.resourceNoise.sample(hex.col, hex.row, {
      scale: 0.1,
      octaves: 3,
      persistence: 0.5,
    });

    // Get quality noise (affects richness of deposit)
    const qualityValue = this.qualityNoise.sample(hex.col, hex.row, {
      scale: 0.15,
      octaves: 2,
    });

    // Determine which resources can spawn here
    const candidates = this.getCandidateResources(terrain, elevation, treeDensity, hex);

    // If no candidates, no resource
    if (candidates.length === 0) {
      return undefined;
    }

    // Use noise to select resource type
    // Weight by spawn chance
    const totalWeight = candidates.reduce((sum, r) => sum + r.weight, 0);
    let roll = noiseValue * totalWeight;

    let selectedType = candidates[0].type;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) {
        selectedType = candidate.type;
        break;
      }
    }

    // Determine if resource actually spawns (based on spawn chance)
    const spawnChance = RESOURCE_CONFIG[selectedType].baseSpawnChance;
    const spawnRoll = this.seededRandom(hex.col * 1000 + hex.row);
    
    if (spawnRoll > spawnChance) {
      return undefined; // Resource doesn't spawn
    }

    // Create resource deposit
    const quality = 0.3 + qualityValue * 0.7; // Quality between 0.3 and 1.0
    const baseQuantity = RESOURCE_CONFIG[selectedType].renewable ? 1000 : 500;
    const quantity = Math.floor(baseQuantity * quality);

    return {
      type: selectedType,
      quantity,
      quality,
    };
  }

  /**
   * Get list of resources that could spawn on this tile with their weights
   */
  private getCandidateResources(
    terrain: TerrainType,
    elevation: number,
    treeDensity: number,
    hex: HexTile
  ): Array<{ type: ResourceType; weight: number }> {
    const candidates: Array<{ type: ResourceType; weight: number }> = [];

    switch (terrain) {
      case TerrainType.DeepWater:
        // Deep water - fish (sparse)
        candidates.push({ type: ResourceType.Fish, weight: 1 });
        break;

      case TerrainType.ShallowWater:
        // Shallow water - fish (more abundant than deep water)
        candidates.push({ type: ResourceType.Fish, weight: 2 });
        break;

      case TerrainType.Shore:
        // Shores - salt only (fish are in the water, not on shore)
        candidates.push({ type: ResourceType.Salt, weight: 1 });
        break;

      case TerrainType.Plains:
        // Plains - livestock, clay
        candidates.push({ type: ResourceType.Livestock, weight: 3 });
        candidates.push({ type: ResourceType.Clay, weight: 2 });
        
        // If plains has trees, can have timber or game
        if (treeDensity > 0.3) {
          candidates.push({ type: ResourceType.Timber, weight: 2 });
          if (treeDensity > 0.6) {
            candidates.push({ type: ResourceType.WildGame, weight: 2 });
          }
        }
        break;

      case TerrainType.Hills:
        // Hills - copper, iron (less common), livestock (if not too forested)
        candidates.push({ type: ResourceType.Copper, weight: 3 });
        candidates.push({ type: ResourceType.Iron, weight: 2 });
        
        if (treeDensity < 0.4) {
          candidates.push({ type: ResourceType.Livestock, weight: 2 });
        }
        
        // Dense forests in hills - timber and game
        if (treeDensity > 0.5) {
          candidates.push({ type: ResourceType.Timber, weight: 3 });
          candidates.push({ type: ResourceType.WildGame, weight: 3 });
        }
        
        // Rare precious metals in hills
        candidates.push({ type: ResourceType.Gold, weight: 0.2 });
        break;

      case TerrainType.Mountains:
        // Mountains - stone (common), iron, silver, gems, gold
        candidates.push({ type: ResourceType.Stone, weight: 5 });
        candidates.push({ type: ResourceType.Iron, weight: 3 });
        candidates.push({ type: ResourceType.Silver, weight: 1 });
        candidates.push({ type: ResourceType.Gems, weight: 0.5 });
        candidates.push({ type: ResourceType.Gold, weight: 0.3 });
        
        // High elevation mountains more likely to have precious materials
        if (elevation > 0.85) {
          candidates.push({ type: ResourceType.Silver, weight: 1 });
          candidates.push({ type: ResourceType.Gems, weight: 0.8 });
        }
        break;
    }

    return candidates;
  }

  /**
   * Seeded random number generator (0-1)
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
}
