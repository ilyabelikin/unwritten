import { Person, JobType, isWorkingAge } from "./Person";
import { BuildingType } from "../Building";
import { PopulationManager } from "./PopulationManager";
import { SettlementEconomy } from "../SettlementEconomy";
import { getJobForBuilding, getWorkerCapacity } from "./JobMapping";
import { getProductivity } from "./SkillSystem";

/**
 * Represents a worker assigned to a building
 */
export interface WorkerAssignment {
  person: Person;
  building: { col: number; row: number };
  buildingType: BuildingType;
  jobType: JobType;
  productivity: number; // 0.5-2.0 based on skill, health, happiness
}

/**
 * Building info for worker assignment
 */
export interface BuildingInfo {
  type: BuildingType;
  location: { col: number; row: number };
  priority?: number; // Optional priority for assignment (higher = assign first)
}

/**
 * Priority levels for different building categories
 */
const BUILDING_PRIORITY: Record<string, number> = {
  // Critical: Food production (highest priority)
  food: 100,
  
  // Important: Fuel and basic materials
  fuel: 80,
  extraction: 70,
  
  // Standard: Production buildings
  production: 50,
  
  // Low: Luxury and trade
  luxury: 30,
};

/**
 * Get priority for a building type
 */
function getBuildingPriority(buildingType: BuildingType): number {
  // Food production (critical)
  if ([
    BuildingType.Field,
    BuildingType.Pasture,
    BuildingType.FishingHut,
    BuildingType.FishingBoat,
    BuildingType.HuntingLodge,
  ].includes(buildingType)) {
    return BUILDING_PRIORITY.food;
  }
  
  // Fuel production (important)
  if ([BuildingType.CharcoalBurner].includes(buildingType)) {
    return BUILDING_PRIORITY.fuel;
  }
  
  // Resource extraction (important)
  if ([
    BuildingType.LumberCamp,
    BuildingType.Sawmill,
    BuildingType.IronMine,
    BuildingType.CopperMine,
    BuildingType.Quarry,
    BuildingType.ClayPit,
    BuildingType.Mine,
  ].includes(buildingType)) {
    return BUILDING_PRIORITY.extraction;
  }
  
  // Production buildings (standard)
  if ([
    BuildingType.Smelter,
    BuildingType.Smithy,
    BuildingType.Kiln,
    BuildingType.Tannery,
  ].includes(buildingType)) {
    return BUILDING_PRIORITY.production;
  }
  
  // Trade and luxury (low)
  return BUILDING_PRIORITY.luxury;
}

/**
 * Automatic worker assignment system
 */
export class WorkerAssignmentSystem {
  /**
   * Assign workers to buildings automatically
   * Priority order:
   * 1. Food production (farms, fishing, hunting)
   * 2. Fuel production (charcoal burners)
   * 3. Material extraction (mines, quarries, lumber)
   * 4. Production buildings (smithies, smelters)
   * 
   * Workers prefer jobs they have experience in
   */
  assignWorkersToBuildings(
    population: PopulationManager,
    buildings: BuildingInfo[],
    economy: SettlementEconomy
  ): WorkerAssignment[] {
    const assignments: WorkerAssignment[] = [];
    
    // Clear all current assignments
    for (const person of population.getPeople()) {
      person.currentJob = JobType.None;
      person.assignedBuilding = undefined;
    }
    
    // Get all available workers (working age, not assigned)
    const availableWorkers = population.getAvailableWorkers();
    
    // Sort buildings by priority (highest first)
    const sortedBuildings = [...buildings].sort((a, b) => {
      const priorityA = a.priority ?? getBuildingPriority(a.type);
      const priorityB = b.priority ?? getBuildingPriority(b.type);
      return priorityB - priorityA;
    });
    
    // Assign workers to buildings in priority order
    for (const building of sortedBuildings) {
      const jobType = getJobForBuilding(building.type);
      if (jobType === JobType.None) continue;
      
      const capacity = getWorkerCapacity(building.type);
      if (capacity === 0) continue;
      
      // Find best workers for this job
      const buildingWorkers = this.findBestWorkers(
        availableWorkers,
        jobType,
        capacity
      );
      
      // Assign workers
      for (const worker of buildingWorkers) {
        worker.currentJob = jobType;
        worker.assignedBuilding = building.location;
        
        const productivity = getProductivity(worker, jobType);
        
        assignments.push({
          person: worker,
          building: building.location,
          buildingType: building.type,
          jobType,
          productivity,
        });
        
        // Remove from available pool
        const index = availableWorkers.indexOf(worker);
        if (index > -1) {
          availableWorkers.splice(index, 1);
        }
      }
    }
    
    // Assign remaining workers to farming (default job)
    for (const worker of availableWorkers) {
      worker.currentJob = JobType.Farmer;
      // Not assigned to a specific building, just general labor
    }
    
    return assignments;
  }
  
  /**
   * Find the best workers for a job type
   * Prefers workers with experience, then by health/happiness
   */
  private findBestWorkers(
    availableWorkers: Person[],
    jobType: JobType,
    count: number
  ): Person[] {
    // Score each worker for this job
    const scoredWorkers = availableWorkers.map((worker) => ({
      worker,
      score: this.scoreWorkerForJob(worker, jobType),
    }));
    
    // Sort by score (descending)
    scoredWorkers.sort((a, b) => b.score - a.score);
    
    // Take top N workers
    return scoredWorkers.slice(0, count).map((sw) => sw.worker);
  }
  
  /**
   * Score a worker for a job (higher is better)
   */
  private scoreWorkerForJob(worker: Person, jobType: JobType): number {
    let score = 0;
    
    // Skill is most important (0-100)
    score += worker.skills[jobType] * 2;
    
    // Health matters (0-100)
    score += worker.health;
    
    // Happiness matters (0-100)
    score += worker.happiness * 0.5;
    
    // Age penalty for very young and old
    if (worker.age < 18) score *= 0.5;
    if (worker.age > 60) score *= 0.8;
    
    return score;
  }
  
  /**
   * Get workers assigned to a specific building
   */
  getWorkersForBuilding(
    population: PopulationManager,
    location: { col: number; row: number }
  ): WorkerAssignment[] {
    const assignments: WorkerAssignment[] = [];
    
    for (const person of population.getPeople()) {
      if (
        person.assignedBuilding &&
        person.assignedBuilding.col === location.col &&
        person.assignedBuilding.row === location.row
      ) {
        // Need to find the building type (would come from the actual building)
        // For now, we can't easily get it without the full building info
        // This would be called with the building type known
        assignments.push({
          person,
          building: location,
          buildingType: BuildingType.None, // Would need to be passed in
          jobType: person.currentJob,
          productivity: getProductivity(person, person.currentJob),
        });
      }
    }
    
    return assignments;
  }
  
  /**
   * Calculate total productivity for a building
   */
  getTotalProductivity(assignments: WorkerAssignment[]): number {
    return assignments.reduce((sum, a) => sum + a.productivity, 0);
  }
  
  /**
   * Calculate average productivity for a building
   */
  getAverageProductivity(assignments: WorkerAssignment[]): number {
    if (assignments.length === 0) return 0;
    return this.getTotalProductivity(assignments) / assignments.length;
  }
}
