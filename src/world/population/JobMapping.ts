import { BuildingType } from "../Building";
import { JobType } from "./Person";

/**
 * Maps building types to the job type required to work there
 */
export const BUILDING_JOB_MAPPING: Record<BuildingType, JobType> = {
  // None
  [BuildingType.None]: JobType.None,
  
  // Housing (no workers)
  [BuildingType.House]: JobType.None,
  [BuildingType.CityHouse]: JobType.None,
  [BuildingType.FishingHut]: JobType.None, // Housing for fishing communities
  
  // Food production
  [BuildingType.Field]: JobType.Farmer,
  [BuildingType.Pasture]: JobType.Farmer,
  [BuildingType.FishingBoat]: JobType.Fisher,
  [BuildingType.HuntingLodge]: JobType.Hunter,
  
  // Resource extraction - Materials
  [BuildingType.LumberCamp]: JobType.Lumberjack,
  [BuildingType.Sawmill]: JobType.Lumberjack,
  [BuildingType.ClayPit]: JobType.Miner,
  [BuildingType.Quarry]: JobType.Quarryman,
  [BuildingType.SaltWorks]: JobType.Miner,
  
  // Resource extraction - Minerals
  [BuildingType.CopperMine]: JobType.Miner,
  [BuildingType.IronMine]: JobType.Miner,
  [BuildingType.SilverMine]: JobType.Miner,
  [BuildingType.GoldMine]: JobType.Miner,
  [BuildingType.GemMine]: JobType.Miner,
  [BuildingType.Mine]: JobType.Miner,
  
  // Production buildings - Food
  [BuildingType.Bakery]: JobType.Artisan,
  [BuildingType.Butcher]: JobType.Artisan,
  
  // Production buildings - Materials
  [BuildingType.Smelter]: JobType.Smelter,
  [BuildingType.Smithy]: JobType.Smith,
  [BuildingType.CharcoalBurner]: JobType.Builder,
  [BuildingType.Kiln]: JobType.Builder,
  [BuildingType.Tannery]: JobType.Artisan,
  
  // Other structures
  [BuildingType.Dock]: JobType.Shipwright, // Builds ships, not fishing
  [BuildingType.Monastery]: JobType.None,
  [BuildingType.Chapel]: JobType.None,
  [BuildingType.TradingPost]: JobType.Merchant,
  [BuildingType.Warehouse]: JobType.Merchant,
  [BuildingType.Windmill]: JobType.Farmer,
  [BuildingType.GrainSilo]: JobType.Farmer,
  [BuildingType.Barracks]: JobType.None, // Military (future)
  [BuildingType.Watchtower]: JobType.None, // Military (future)
  
  // City structures
  [BuildingType.Church]: JobType.None,
  [BuildingType.Tower]: JobType.None,
  [BuildingType.Castle]: JobType.None,
  
  // Infrastructure
  [BuildingType.Pier]: JobType.None,
  [BuildingType.Bridge]: JobType.None,
};

/**
 * Worker capacity for each building type
 */
export const BUILDING_WORKER_CAPACITY: Record<BuildingType, number> = {
  // None
  [BuildingType.None]: 0,
  
  // Housing (no workers)
  [BuildingType.House]: 0,
  [BuildingType.CityHouse]: 0,
  [BuildingType.FishingHut]: 0, // Housing only, provides shelter not jobs
  
  // Food production
  [BuildingType.Field]: 3,
  [BuildingType.Pasture]: 2,
  [BuildingType.FishingBoat]: 2,
  [BuildingType.HuntingLodge]: 3,
  
  // Resource extraction - Materials
  [BuildingType.LumberCamp]: 4,
  [BuildingType.Sawmill]: 3,
  [BuildingType.ClayPit]: 3,
  [BuildingType.Quarry]: 4,
  [BuildingType.SaltWorks]: 2,
  
  // Resource extraction - Minerals
  [BuildingType.CopperMine]: 5,
  [BuildingType.IronMine]: 5,
  [BuildingType.SilverMine]: 4,
  [BuildingType.GoldMine]: 4,
  [BuildingType.GemMine]: 3,
  [BuildingType.Mine]: 4,
  
  // Production buildings - Food
  [BuildingType.Bakery]: 3,
  [BuildingType.Butcher]: 2,
  
  // Production buildings - Materials
  [BuildingType.Smelter]: 3,
  [BuildingType.Smithy]: 2,
  [BuildingType.CharcoalBurner]: 2,
  [BuildingType.Kiln]: 2,
  [BuildingType.Tannery]: 2,
  
  // Other structures
  [BuildingType.Dock]: 0, // Shipbuilding not yet implemented
  [BuildingType.Monastery]: 0,
  [BuildingType.Chapel]: 0,
  [BuildingType.TradingPost]: 2,
  [BuildingType.Warehouse]: 2,
  [BuildingType.Windmill]: 2,
  [BuildingType.GrainSilo]: 1,
  [BuildingType.Barracks]: 0,
  [BuildingType.Watchtower]: 0,
  
  // City structures
  [BuildingType.Church]: 0,
  [BuildingType.Tower]: 0,
  [BuildingType.Castle]: 0,
  
  // Infrastructure
  [BuildingType.Pier]: 0,
  [BuildingType.Bridge]: 0,
};

/**
 * Get the job type required for a building
 */
export function getJobForBuilding(buildingType: BuildingType): JobType {
  return BUILDING_JOB_MAPPING[buildingType] || JobType.None;
}

/**
 * Get the worker capacity for a building
 */
export function getWorkerCapacity(buildingType: BuildingType): number {
  return BUILDING_WORKER_CAPACITY[buildingType] || 0;
}

/**
 * Check if a building requires workers
 */
export function requiresWorkers(buildingType: BuildingType): boolean {
  return getWorkerCapacity(buildingType) > 0;
}

/**
 * Get all building types that use a specific job
 */
export function getBuildingsForJob(jobType: JobType): BuildingType[] {
  const buildings: BuildingType[] = [];
  for (const [building, job] of Object.entries(BUILDING_JOB_MAPPING)) {
    if (job === jobType) {
      buildings.push(building as BuildingType);
    }
  }
  return buildings;
}
