import { Person, JobType, createEmptySkills } from "./Person";
import { generateName, generatePersonId } from "./NameGenerator";
import { SettlementEconomy } from "../SettlementEconomy";
import { GoodType } from "../Goods";
import { Settlement } from "../Building";

/**
 * Birth, death, aging, and immigration simulation
 */

/**
 * Default population dynamics rates
 * 
 * BALANCED for resilient populations:
 * - Lower base death rate for more stability (0.2% instead of 1%)
 * - Birth and immigration rates unchanged
 */
export const DEFAULT_BIRTH_RATE = 0.02; // 2% per turn per couple
export const DEFAULT_DEATH_RATE = 0.002; // 0.2% base death rate per turn
export const DEFAULT_IMMIGRATION_RATE = 0.05; // 5% per turn

/**
 * Create a new person
 */
export function createPerson(
  settlementId: number,
  age: number,
  skills?: Partial<Record<JobType, number>>
): Person {
  const gender: "male" | "female" = Math.random() > 0.5 ? "male" : "female";
  
  const person: Person = {
    id: generatePersonId(settlementId),
    name: generateName(gender),
    age,
    settlementId,
    currentJob: JobType.None,
    skills: createEmptySkills(),
    health: 80 + Math.floor(Math.random() * 20), // 80-100
    hunger: 0 + Math.floor(Math.random() * 30), // 0-30 (REVERSED: 0 = not hungry, 100 = starving)
    happiness: 60 + Math.floor(Math.random() * 40), // 60-100
    gender,
    experienceToday: {},
  };
  
  // Apply initial skills if provided
  if (skills) {
    for (const [job, level] of Object.entries(skills)) {
      person.skills[job as JobType] = level;
    }
  }
  
  return person;
}

/**
 * Process aging for all people
 * Ages by 1 year every 365 turns
 */
export function processAging(people: Person[], dayCounter: number): void {
  // Every 365 turns = 1 year
  if (dayCounter % 365 === 0) {
    for (const person of people) {
      person.age++;
    }
  }
}

/**
 * Process births for a population
 */
export function processBirths(
  people: Person[],
  economy: SettlementEconomy,
  housingCapacity: number,
  birthRate: number = DEFAULT_BIRTH_RATE
): Person[] {
  const newborns: Person[] = [];
  
  // Check if settlement can support births
  const foodSecure = economy.getGoodAmount(GoodType.Bread) > 50;
  const hasHousing = people.length < housingCapacity;
  
  if (!foodSecure || !hasHousing) return newborns;
  
  // Count adults of childbearing age (18-45)
  const adults = people.filter((p) => p.age >= 18 && p.age <= 45);
  const maleAdults = adults.filter((p) => p.gender === "male");
  const femaleAdults = adults.filter((p) => p.gender === "female");
  
  // Count couples (limited by the smaller gender population)
  const couples = Math.min(maleAdults.length, femaleAdults.length);
  
  // Each couple has birthRate chance per turn
  for (let i = 0; i < couples; i++) {
    if (Math.random() < birthRate) {
      // Get settlement ID from first person (all should have same ID)
      const settlementId = people[0]?.settlementId ?? 0;
      const baby = createPerson(settlementId, 0);
      newborns.push(baby);
    }
  }
  
  return newborns;
}

/**
 * Process deaths for a population
 * 
 * BALANCED for resilient populations:
 * - More gradual age multipliers
 * - Less aggressive health multipliers
 * - Buffer zone for critically ill
 */
export function processDeaths(
  people: Person[],
  deathRate: number = DEFAULT_DEATH_RATE
): Person[] {
  const deceased: Person[] = [];
  
  for (const person of people) {
    let currentDeathChance = deathRate;
    
    // Age affects death rate (more gradual)
    if (person.age > 65) currentDeathChance *= 1.5;  // Reduced from 2x at 60
    if (person.age > 75) currentDeathChance *= 2.5;  // Reduced from 4x
    if (person.age > 85) currentDeathChance *= 5;    // Reduced from 8x
    if (person.age > 95) currentDeathChance *= 10;   // Very old
    
    // Health affects death rate (less aggressive)
    if (person.health < 20) {
      // Critically ill buffer: 2x multiplier
      currentDeathChance *= 2;
    }
    if (person.health < 10) {
      // Critical condition: 5x multiplier (reduced from 20x)
      currentDeathChance *= 2.5; // Total 5x (2 × 2.5)
    }
    if (person.health === 0) {
      // Death's door: very high chance but not guaranteed
      currentDeathChance *= 4; // Total 20x (2 × 2.5 × 4)
    }
    
    // Check for death
    if (Math.random() < currentDeathChance) {
      deceased.push(person);
    }
  }
  
  return deceased;
}

/**
 * Process immigration for a settlement
 */
export function processImmigration(
  people: Person[],
  economy: SettlementEconomy,
  settlement: Settlement,
  housingCapacity: number,
  unemployedCount: number,
  immigrationRate: number = DEFAULT_IMMIGRATION_RATE
): Person[] {
  const immigrants: Person[] = [];
  
  // Calculate settlement attractiveness
  const foodSecure = economy.getGoodAmount(GoodType.Bread) > 100;
  const wealthy = getTotalGoodsValue(economy) > 500;
  const hasJobs = unemployedCount === 0;
  const hasHousing = people.length < housingCapacity;
  
  let attractiveness = 0;
  if (foodSecure) attractiveness += 0.3;
  if (wealthy) attractiveness += 0.2;
  if (hasJobs) attractiveness += 0.3;
  if (hasHousing) attractiveness += 0.2;
  
  // Cities attract more immigrants
  if (settlement.type === "city") {
    attractiveness *= 1.5;
  }
  
  // Roll for immigration
  const immigrationChance = immigrationRate * attractiveness;
  if (Math.random() < immigrationChance) {
    // Create 1-3 immigrants
    const count = 1 + Math.floor(Math.random() * 3);
    const settlementId = people[0]?.settlementId ?? 0;
    
    for (let i = 0; i < count; i++) {
      // Immigrants are working-age adults
      const age = 18 + Math.floor(Math.random() * 30); // 18-48
      
      // Give them random low skills (5-25)
      const randomSkills: Partial<Record<JobType, number>> = {};
      const skillTypes = [JobType.Farmer, JobType.Lumberjack, JobType.Miner, JobType.Smith];
      const primarySkill = skillTypes[Math.floor(Math.random() * skillTypes.length)];
      randomSkills[primarySkill] = 5 + Math.floor(Math.random() * 20);
      
      const immigrant = createPerson(settlementId, age, randomSkills);
      immigrants.push(immigrant);
    }
  }
  
  return immigrants;
}

/**
 * Process emigration (people leaving due to bad conditions)
 */
export function processEmigration(
  people: Person[],
  economy: SettlementEconomy
): Person[] {
  const emigrants: Person[] = [];
  
  // Check for poor conditions
  const foodShortage = economy.getGoodAmount(GoodType.Bread) < 10;
  const unhappy = people.filter((p) => p.happiness < 30).length > people.length / 2;
  
  if (!foodShortage && !unhappy) return emigrants;
  
  // 5-10% of population may leave if conditions are bad
  const emigrationRate = 0.05 + (foodShortage ? 0.03 : 0) + (unhappy ? 0.02 : 0);
  
  for (const person of people) {
    // Young healthy adults are more likely to emigrate
    if (person.age >= 18 && person.age <= 40 && person.health > 50) {
      if (Math.random() < emigrationRate) {
        emigrants.push(person);
      }
    }
  }
  
  return emigrants;
}

/**
 * Helper to calculate total value of all goods in economy
 */
function getTotalGoodsValue(economy: SettlementEconomy): number {
  const goods = economy.getAllGoods();
  return goods.reduce((sum, good) => sum + good.amount, 0);
}
