/**
 * Job types that people can have in the economy
 */
export enum JobType {
  None = "none",
  Farmer = "farmer",           // Fields, pastures
  Lumberjack = "lumberjack",   // Lumber camps, sawmills
  Miner = "miner",             // All mines
  Fisher = "fisher",           // Fishing boats only
  Hunter = "hunter",           // Hunting lodges
  Smelter = "smelter",         // Smelters
  Smith = "smith",             // Smithies
  Builder = "builder",         // Construction (kiln, charcoal burner)
  Artisan = "artisan",         // Tannery, pottery, bakery, butcher
  Quarryman = "quarryman",     // Quarries
  Merchant = "merchant",       // Trading posts
  Shipwright = "shipwright",   // Docks (shipbuilding)
}

/**
 * Skill levels for each job type (0-100)
 */
export type PersonSkills = {
  [key in JobType]: number;
};

/**
 * Represents an individual person in a settlement
 */
export interface Person {
  /** Unique identifier */
  id: string;
  
  /** Procedurally generated name */
  name: string;
  
  /** Age in years */
  age: number;
  
  /** Settlement this person belongs to */
  settlementId: number;
  
  // Work-related
  /** Current job assignment */
  currentJob: JobType;
  
  /** Building where this person works (if employed) */
  assignedBuilding?: { col: number; row: number };
  
  /** Skill levels for all job types (0-100) */
  skills: PersonSkills;
  
  // Life simulation
  /** Health (0-100), affects productivity and death chance */
  health: number;
  
  /** Hunger (0-100), 0 = not hungry/well-fed, 100 = starving */
  hunger: number;
  
  /** Happiness (0-100), affects productivity and migration */
  happiness: number;
  
  // Demographics
  /** Gender */
  gender: "male" | "female";
  
  /** Family ID for tracking relationships */
  familyId?: string;
  
  // Progression tracking
  /** Experience gained this turn for each job type */
  experienceToday: Partial<Record<JobType, number>>;
}

/**
 * Create initial skills object with all jobs at 0
 */
export function createEmptySkills(): PersonSkills {
  return {
    [JobType.None]: 0,
    [JobType.Farmer]: 0,
    [JobType.Lumberjack]: 0,
    [JobType.Miner]: 0,
    [JobType.Fisher]: 0,
    [JobType.Hunter]: 0,
    [JobType.Smelter]: 0,
    [JobType.Smith]: 0,
    [JobType.Builder]: 0,
    [JobType.Artisan]: 0,
    [JobType.Quarryman]: 0,
    [JobType.Merchant]: 0,
    [JobType.Shipwright]: 0,
  };
}

/**
 * Get skill level category for display
 */
export function getSkillLevel(skill: number): string {
  if (skill === 0) return "Untrained";
  if (skill < 20) return "Novice";
  if (skill < 50) return "Learning";
  if (skill < 80) return "Trained";
  return "Expert";
}

/**
 * Get working age range
 */
export function isWorkingAge(age: number): boolean {
  return age >= 14 && age <= 70;
}

/**
 * Get age category
 */
export function getAgeCategory(age: number): "child" | "adult" | "elder" {
  if (age < 14) return "child";
  if (age < 60) return "adult";
  return "elder";
}
