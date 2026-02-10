import { Person, JobType, isWorkingAge } from "./Person";
import { SettlementEconomy } from "../SettlementEconomy";
import { Settlement } from "../Building";
import {
  consumeFood,
  updateHealthFromHunger,
  updateHappinessFromFood,
  FoodConsumptionResult,
} from "./FoodConsumption";
import {
  processAging,
  processBirths,
  processDeaths,
  processImmigration,
  processEmigration,
  DEFAULT_BIRTH_RATE,
  DEFAULT_DEATH_RATE,
  DEFAULT_IMMIGRATION_RATE,
} from "./LifeSimulation";
import { gainExperience, resetDailyExperience } from "./SkillSystem";

/**
 * Manages all people in a settlement
 */
export class PopulationManager {
  private settlementId: number;
  private people: Map<string, Person>;
  private dayCounter: number = 0;
  private lastDietQuality: number = 1.0; // Track diet quality for happiness updates
  
  // Population dynamics rates
  public birthRate: number = DEFAULT_BIRTH_RATE;
  public deathRate: number = DEFAULT_DEATH_RATE;
  public immigrationRate: number = DEFAULT_IMMIGRATION_RATE;
  
  constructor(settlementId: number) {
    this.settlementId = settlementId;
    this.people = new Map();
  }
  
  /**
   * Process a full turn for this population
   */
  processTurn(
    economy: SettlementEconomy,
    settlement: Settlement,
    housingCapacity: number,
    unemployedCount: number
  ): void {
    // Reset daily XP tracking
    for (const person of this.people.values()) {
      resetDailyExperience(person);
    }
    
    // 1. Age everyone (once per year)
    this.processAging();
    
    // 2. Consume food
    const foodResult = this.consumeFood(economy);
    this.lastDietQuality = foodResult.dietQuality;
    
    // 3. Update health and happiness
    this.updateHealth();
    
    // 4. Population dynamics
    this.processBirths(economy, housingCapacity);
    this.processDeaths();
    this.processImmigration(economy, settlement, housingCapacity, unemployedCount);
    this.processEmigration(economy);
  }
  
  /**
   * Age the population (called internally)
   */
  private processAging(): void {
    const peopleArray = Array.from(this.people.values());
    processAging(peopleArray, this.dayCounter);
    this.dayCounter++;
  }
  
  /**
   * Consume food for the population
   */
  consumeFood(economy: SettlementEconomy): FoodConsumptionResult {
    const peopleArray = Array.from(this.people.values());
    const result = consumeFood(peopleArray, economy);
    console.log(`[Population ${this.settlementId}] Food: consumed ${result.consumed}/${result.needed}, shortfall: ${result.shortfall}, starving: ${result.starving.length}`);
    return result;
  }
  
  /**
   * Update health for all people
   */
  private updateHealth(): void {
    for (const person of this.people.values()) {
      updateHealthFromHunger(person);
      updateHappinessFromFood(person, this.lastDietQuality);
    }
  }
  
  /**
   * Process births
   */
  private processBirths(economy: SettlementEconomy, housingCapacity: number): void {
    const peopleArray = Array.from(this.people.values());
    const newborns = processBirths(peopleArray, economy, housingCapacity, this.birthRate);
    
    for (const baby of newborns) {
      this.people.set(baby.id, baby);
    }
  }
  
  /**
   * Process deaths
   */
  private processDeaths(): void {
    const peopleArray = Array.from(this.people.values());
    const deceased = processDeaths(peopleArray, this.deathRate);
    
    for (const person of deceased) {
      this.people.delete(person.id);
    }
  }
  
  /**
   * Process immigration
   */
  private processImmigration(
    economy: SettlementEconomy,
    settlement: Settlement,
    housingCapacity: number,
    unemployedCount: number
  ): void {
    const peopleArray = Array.from(this.people.values());
    const immigrants = processImmigration(
      peopleArray,
      economy,
      settlement,
      housingCapacity,
      unemployedCount,
      this.immigrationRate
    );
    
    for (const immigrant of immigrants) {
      this.people.set(immigrant.id, immigrant);
    }
  }
  
  /**
   * Process emigration
   */
  private processEmigration(economy: SettlementEconomy): void {
    const peopleArray = Array.from(this.people.values());
    const emigrants = processEmigration(peopleArray, economy);
    
    for (const person of emigrants) {
      this.people.delete(person.id);
    }
  }
  
  /**
   * Record experience gain for a person
   */
  recordExperience(personId: string, jobType: JobType, hoursWorked: number = 8): void {
    const person = this.people.get(personId);
    if (person) {
      gainExperience(person, jobType, hoursWorked);
    }
  }
  
  // === Population queries ===
  
  /**
   * Add a person to the population
   */
  addPerson(person: Person): void {
    this.people.set(person.id, person);
  }
  
  /**
   * Remove a person from the population
   */
  removePerson(personId: string): void {
    this.people.delete(personId);
  }
  
  /**
   * Get a person by ID
   */
  getPerson(personId: string): Person | undefined {
    return this.people.get(personId);
  }
  
  /**
   * Get all people
   */
  getPeople(): Person[] {
    return Array.from(this.people.values());
  }
  
  /**
   * Get total population count
   */
  getTotalPopulation(): number {
    return this.people.size;
  }
  
  /**
   * Get working-age population (14-70)
   */
  getWorkingPopulation(): number {
    return Array.from(this.people.values()).filter((p) => isWorkingAge(p.age)).length;
  }
  
  /**
   * Get people by job type
   */
  getPeopleByJob(jobType: JobType): Person[] {
    return Array.from(this.people.values()).filter((p) => p.currentJob === jobType);
  }
  
  /**
   * Get count of people by job
   */
  getPopulationByJob(): Map<JobType, number> {
    const jobCounts = new Map<JobType, number>();
    
    for (const person of this.people.values()) {
      const count = jobCounts.get(person.currentJob) || 0;
      jobCounts.set(person.currentJob, count + 1);
    }
    
    return jobCounts;
  }
  
  /**
   * Get unemployed people (no job or JobType.None)
   */
  getUnemployed(): Person[] {
    return Array.from(this.people.values()).filter(
      (p) => p.currentJob === JobType.None && isWorkingAge(p.age)
    );
  }
  
  /**
   * Get available workers (unemployed working-age people)
   */
  getAvailableWorkers(): Person[] {
    return this.getUnemployed();
  }
  
  /**
   * Get the best worker for a specific job type
   */
  getBestWorkerForJob(jobType: JobType): Person | null {
    const available = this.getAvailableWorkers();
    if (available.length === 0) return null;
    
    // Sort by skill level (descending)
    available.sort((a, b) => b.skills[jobType] - a.skills[jobType]);
    
    return available[0];
  }
  
  /**
   * Get average skill level for a job type
   */
  getAverageSkill(jobType: JobType): number {
    const workers = this.getPeopleByJob(jobType);
    if (workers.length === 0) return 0;
    
    const totalSkill = workers.reduce((sum, p) => sum + p.skills[jobType], 0);
    return totalSkill / workers.length;
  }
  
  /**
   * Get people working at a specific building
   */
  getWorkersForBuilding(col: number, row: number): Person[] {
    return Array.from(this.people.values()).filter(
      (p) => p.assignedBuilding?.col === col && p.assignedBuilding?.row === row
    );
  }
  
  /**
   * Get starving people (hunger > 70 on reversed scale: 0 = not hungry, 100 = starving)
   */
  getStarvingPeople(): Person[] {
    return Array.from(this.people.values()).filter((p) => p.hunger > 70);
  }
  
  /**
   * Get average health
   */
  getAverageHealth(): number {
    if (this.people.size === 0) return 0;
    const total = Array.from(this.people.values()).reduce((sum, p) => sum + p.health, 0);
    return Math.round(total / this.people.size);
  }
  
  /**
   * Get average hunger
   */
  getAverageHunger(): number {
    if (this.people.size === 0) return 0;
    const total = Array.from(this.people.values()).reduce((sum, p) => sum + p.hunger, 0);
    return Math.round(total / this.people.size);
  }
  
  /**
   * Get average happiness
   */
  getAverageHappiness(): number {
    if (this.people.size === 0) return 0;
    const total = Array.from(this.people.values()).reduce((sum, p) => sum + p.happiness, 0);
    return Math.round(total / this.people.size);
  }
}

/**
 * Global manager for all settlement populations
 */
export class GlobalPopulationManager {
  private populations: Map<number, PopulationManager>;
  
  constructor() {
    this.populations = new Map();
  }
  
  /**
   * Get or create a population manager for a settlement
   */
  getOrCreatePopulation(settlementId: number): PopulationManager {
    let population = this.populations.get(settlementId);
    if (!population) {
      population = new PopulationManager(settlementId);
      this.populations.set(settlementId, population);
    }
    return population;
  }
  
  /**
   * Get a population manager (returns undefined if not exists)
   */
  getPopulation(settlementId: number): PopulationManager | undefined {
    return this.populations.get(settlementId);
  }
  
  /**
   * Get all population managers
   */
  getAllPopulations(): Map<number, PopulationManager> {
    return this.populations;
  }
  
  /**
   * Get total population across all settlements
   */
  getTotalWorldPopulation(): number {
    let total = 0;
    for (const population of this.populations.values()) {
      total += population.getTotalPopulation();
    }
    return total;
  }
}
