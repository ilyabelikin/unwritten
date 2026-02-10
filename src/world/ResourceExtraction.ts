import { ResourceType, ResourceDeposit } from "./Resource";
import { BuildingType } from "./Building";
import { HexTile } from "./HexTile";
import { Grid } from "honeycomb-grid";
import { getHexNeighbors } from "./HexMapUtils";

/**
 * Base extraction rates for buildings (units per tick)
 */
export const BASE_EXTRACTION_RATES: Record<BuildingType, number> = {
  // Food extraction
  [BuildingType.HuntingLodge]: 8,
  [BuildingType.FishingHut]: 0, // Housing only, not extraction
  [BuildingType.FishingBoat]: 12,
  [BuildingType.Pasture]: 7,
  [BuildingType.Field]: 10,
  
  // Material extraction
  [BuildingType.LumberCamp]: 12,
  [BuildingType.Sawmill]: 10, // Also processes, so slightly lower raw extraction
  [BuildingType.ClayPit]: 8,
  [BuildingType.Quarry]: 10,
  [BuildingType.SaltWorks]: 6,
  
  // Mineral extraction
  [BuildingType.CopperMine]: 8,
  [BuildingType.IronMine]: 7,
  [BuildingType.SilverMine]: 5,
  [BuildingType.GoldMine]: 4,
  [BuildingType.GemMine]: 3,
  [BuildingType.Mine]: 6, // Generic mine
  
  // Default for other buildings
  [BuildingType.None]: 0,
  [BuildingType.House]: 0,
  [BuildingType.CityHouse]: 0,
  [BuildingType.Dock]: 0, // Shipbuilding only, not fishing
  [BuildingType.Monastery]: 0,
  [BuildingType.Chapel]: 0,
  [BuildingType.TradingPost]: 0,
  [BuildingType.Warehouse]: 0,
  [BuildingType.Windmill]: 0,
  [BuildingType.GrainSilo]: 0,
  [BuildingType.Barracks]: 0,
  [BuildingType.Watchtower]: 0,
  [BuildingType.Church]: 0,
  [BuildingType.Tower]: 0,
  [BuildingType.Castle]: 0,
  [BuildingType.Pier]: 0,
  [BuildingType.Bridge]: 0,
  [BuildingType.Bakery]: 0,
  [BuildingType.Butcher]: 0,
  [BuildingType.Smelter]: 0,
  [BuildingType.Smithy]: 0,
  [BuildingType.CharcoalBurner]: 0,
  [BuildingType.Kiln]: 0,
  [BuildingType.Tannery]: 0,
};

/**
 * Maps resources to the buildings that can extract them
 */
export const RESOURCE_EXTRACTION_BUILDINGS: Record<ResourceType, BuildingType[]> = {
  [ResourceType.None]: [],
  
  // Food resources
  [ResourceType.WildGame]: [BuildingType.HuntingLodge],
  [ResourceType.Fish]: [BuildingType.FishingBoat], // Only boats extract fish
  [ResourceType.Livestock]: [BuildingType.Pasture],
  [ResourceType.Wheat]: [BuildingType.Field],
  [ResourceType.Vegetables]: [BuildingType.Field], // Gardens/fields produce vegetables
  
  // Material resources
  [ResourceType.Timber]: [BuildingType.LumberCamp, BuildingType.Sawmill],
  [ResourceType.Clay]: [BuildingType.ClayPit],
  [ResourceType.Stone]: [BuildingType.Quarry],
  [ResourceType.Salt]: [BuildingType.SaltWorks],
  
  // Mineral resources
  [ResourceType.Copper]: [BuildingType.CopperMine],
  [ResourceType.Iron]: [BuildingType.IronMine],
  [ResourceType.Silver]: [BuildingType.SilverMine],
  [ResourceType.Gold]: [BuildingType.GoldMine],
  [ResourceType.Gems]: [BuildingType.GemMine],
};

/**
 * Get the primary extraction building for a resource type
 */
export function getPrimaryExtractionBuilding(resourceType: ResourceType): BuildingType | null {
  const buildings = RESOURCE_EXTRACTION_BUILDINGS[resourceType];
  return buildings && buildings.length > 0 ? buildings[0] : null;
}

/**
 * Check if a building can extract a specific resource
 */
export function canBuildingExtractResource(building: BuildingType, resource: ResourceType): boolean {
  const buildings = RESOURCE_EXTRACTION_BUILDINGS[resource];
  return buildings ? buildings.includes(building) : false;
}

/**
 * Get all resources that a building can extract
 */
export function getResourcesForBuilding(building: BuildingType): ResourceType[] {
  const resources: ResourceType[] = [];
  for (const [resourceType, buildings] of Object.entries(RESOURCE_EXTRACTION_BUILDINGS)) {
    if (buildings.includes(building)) {
      resources.push(resourceType as ResourceType);
    }
  }
  return resources;
}

/**
 * Check if a resource deposit is being exploited by a nearby building
 */
export interface ResourceExploitationInfo {
  isExploited: boolean;
  buildingType?: BuildingType;
  distance?: number;
}

/**
 * Building placement recommendation based on resource
 */
export interface BuildingPlacementRecommendation {
  buildingType: BuildingType;
  reason: string;
  priority: "high" | "medium" | "low";
}

/**
 * Get recommended building for a resource
 */
export function getRecommendedBuilding(resourceType: ResourceType): BuildingPlacementRecommendation | null {
  const primaryBuilding = getPrimaryExtractionBuilding(resourceType);
  if (!primaryBuilding) return null;

  const priorities: Record<string, "high" | "medium" | "low"> = {
    food: "high",
    mineral: "high",
    material: "medium",
    luxury: "low",
  };

  // You could extend this with more sophisticated logic
  return {
    buildingType: primaryBuilding,
    reason: `Extract ${resourceType}`,
    priority: priorities["medium"] || "medium",
  };
}

/**
 * Find resource deposits near a building tile
 */
export function findNearbyResources(
  grid: Grid<HexTile>,
  buildingTile: HexTile,
  resourceType: ResourceType
): ResourceDeposit[] {
  const deposits: ResourceDeposit[] = [];
  
  // Check the building tile itself
  if (buildingTile.resource && buildingTile.resource.type === resourceType) {
    deposits.push(buildingTile.resource);
  }
  
  // Check adjacent tiles
  const neighbors = getHexNeighbors(grid, buildingTile);
  for (const neighbor of neighbors) {
    if (neighbor.resource && neighbor.resource.type === resourceType) {
      deposits.push(neighbor.resource);
    }
  }
  
  return deposits;
}

/**
 * Extract resources from deposits near a building
 * Returns the amount extracted
 * 
 * @param workerProductivity - Total productivity of workers (0 = no workers, 1+ = scaled by skill/health)
 */
export function extractResources(
  grid: Grid<HexTile>,
  buildingTile: HexTile,
  buildingType: BuildingType,
  workerProductivity: number = 1.0
): { resourceType: ResourceType; amount: number } | null {
  const baseRate = BASE_EXTRACTION_RATES[buildingType] || 0;
  if (baseRate === 0) {
    return null; // This building doesn't extract resources
  }
  
  // No workers = no extraction
  if (workerProductivity === 0) {
    return null;
  }
  
  // Scale base rate by worker productivity
  const effectiveRate = baseRate * workerProductivity;
  
  // Get all resources this building can extract
  const extractableResources = getResourcesForBuilding(buildingType);
  
  // SPECIAL CASE: Fields and Pastures GENERATE resources (don't need deposits)
  // They're renewable agriculture, not extraction!
  if (buildingType === BuildingType.Field) {
    // Fields always produce wheat (as long as there are workers)
    const amount = Math.floor(effectiveRate);
    return { resourceType: ResourceType.Wheat, amount };
  }
  
  if (buildingType === BuildingType.Pasture) {
    // Pastures always produce livestock (as long as there are workers)
    const amount = Math.floor(effectiveRate);
    return { resourceType: ResourceType.Livestock, amount };
  }
  
  // For other buildings, find nearby deposits of any extractable resource
  for (const resourceType of extractableResources) {
    const deposits = findNearbyResources(grid, buildingTile, resourceType);
    
    if (deposits.length > 0) {
      // Calculate extraction amount based on quality and quantity
      let totalExtracted = 0;
      
      for (const deposit of deposits) {
        // Extract based on effective rate and quality
        const extractionAmount = Math.floor(effectiveRate * deposit.quality);
        const actualExtraction = Math.min(extractionAmount, deposit.quantity);
        
        // Deplete non-renewable resources
        if (actualExtraction > 0) {
          deposit.quantity = Math.max(0, deposit.quantity - actualExtraction);
          totalExtracted += actualExtraction;
        }
        
        // If deposit is depleted, we could mark it for removal
        // For now, we just leave it at 0 quantity
      }
      
      if (totalExtracted > 0) {
        return { resourceType, amount: totalExtracted };
      }
    }
  }
  
  return null; // No resources found to extract
}

/**
 * Get the extraction rate for a building
 */
export function getExtractionRate(buildingType: BuildingType): number {
  return BASE_EXTRACTION_RATES[buildingType] || 0;
}

/**
 * Check if a building is an extraction building
 */
export function isExtractionBuilding(buildingType: BuildingType): boolean {
  return getExtractionRate(buildingType) > 0;
}
