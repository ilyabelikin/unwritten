import { ResourceType } from "./Resource";
import { BuildingType } from "./Building";

/**
 * Maps resources to the buildings that can extract them
 */
export const RESOURCE_EXTRACTION_BUILDINGS: Record<ResourceType, BuildingType[]> = {
  [ResourceType.None]: [],
  
  // Food resources
  [ResourceType.WildGame]: [BuildingType.HuntingLodge],
  [ResourceType.Fish]: [BuildingType.FishingHut, BuildingType.Dock],
  [ResourceType.Livestock]: [BuildingType.Pasture],
  
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
