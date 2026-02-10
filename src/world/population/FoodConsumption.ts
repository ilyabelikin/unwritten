import { Person } from "./Person";
import { GoodType } from "../Goods";
import { ResourceType } from "../Resource";
import { SettlementEconomy } from "../SettlementEconomy";

/**
 * Food required per person per turn
 */
export const FOOD_PER_PERSON_PER_TURN = 2;

/**
 * Food categories for balanced diet
 */
export enum FoodCategory {
  Grain = "grain",         // Bread, Wheat
  Protein = "protein",     // Meat, Fish, Livestock, WildGame
  Vegetables = "vegetables", // CookedVegetables, Vegetables
}

/**
 * Food item with category and nutritional value
 */
interface FoodItem {
  type: GoodType | ResourceType;
  category: FoodCategory;
  nutritionValue: number; // 0.5-1.5 (raw < processed)
  isProcessed: boolean;   // Processed foods are preferred
}

/**
 * All available food sources
 */
const FOOD_SOURCES: FoodItem[] = [
  // Processed foods (preferred)
  { type: GoodType.Bread, category: FoodCategory.Grain, nutritionValue: 1.0, isProcessed: true },
  { type: GoodType.Meat, category: FoodCategory.Protein, nutritionValue: 1.2, isProcessed: true },
  { type: GoodType.PreparedFish, category: FoodCategory.Protein, nutritionValue: 1.0, isProcessed: true },
  { type: GoodType.CookedVegetables, category: FoodCategory.Vegetables, nutritionValue: 1.1, isProcessed: true },
  
  // Raw foods (emergency substitutes)
  { type: ResourceType.Wheat, category: FoodCategory.Grain, nutritionValue: 0.7, isProcessed: false },
  { type: ResourceType.Fish, category: FoodCategory.Protein, nutritionValue: 0.6, isProcessed: false },
  { type: ResourceType.WildGame, category: FoodCategory.Protein, nutritionValue: 0.8, isProcessed: false },
  { type: ResourceType.Livestock, category: FoodCategory.Protein, nutritionValue: 0.9, isProcessed: false },
  { type: ResourceType.Vegetables, category: FoodCategory.Vegetables, nutritionValue: 0.8, isProcessed: false },
];

/**
 * Result of food consumption for a settlement
 */
export interface FoodConsumptionResult {
  consumed: number;
  needed: number;
  shortfall: number;
  starving: Person[];
  dietQuality: number; // 0-1, based on balance and processing
  consumedItems: Map<string, number>; // Track what was eaten
}

/**
 * Consume food for an entire population with balanced diet preferences
 */
export function consumeFood(
  people: Person[],
  economy: SettlementEconomy
): FoodConsumptionResult {
  const totalNeeded = people.length * FOOD_PER_PERSON_PER_TURN;
  
  // Track what we consume
  const consumedItems = new Map<string, number>();
  let totalNutrition = 0; // Accounts for quality
  let grainNutrition = 0;
  let proteinNutrition = 0;
  let vegetableNutrition = 0;
  let processedFoodCount = 0;
  let rawFoodCount = 0;
  
  // Phase 1: Try to get a balanced diet (33% grain, 33% protein, 33% vegetables)
  const grainNeeded = totalNeeded / 3;
  const proteinNeeded = totalNeeded / 3;
  const vegetablesNeeded = totalNeeded / 3;
  
  // Get grain (prefer processed: bread > wheat)
  const grainConsumed = consumeFoodCategory(
    economy,
    FoodCategory.Grain,
    grainNeeded,
    consumedItems
  );
  grainNutrition += grainConsumed.nutrition;
  processedFoodCount += grainConsumed.processed;
  rawFoodCount += grainConsumed.raw;
  
  // Get protein (prefer processed: meat/fish > raw)
  const proteinConsumed = consumeFoodCategory(
    economy,
    FoodCategory.Protein,
    proteinNeeded,
    consumedItems
  );
  proteinNutrition += proteinConsumed.nutrition;
  processedFoodCount += proteinConsumed.processed;
  rawFoodCount += proteinConsumed.raw;
  
  // Get vegetables (prefer processed: cooked > raw)
  const vegetablesConsumed = consumeFoodCategory(
    economy,
    FoodCategory.Vegetables,
    vegetablesNeeded,
    consumedItems
  );
  vegetableNutrition += vegetablesConsumed.nutrition;
  processedFoodCount += vegetablesConsumed.processed;
  rawFoodCount += vegetablesConsumed.raw;
  
  totalNutrition = grainNutrition + proteinNutrition + vegetableNutrition;
  
  // Phase 2: If still hungry, eat whatever is available
  if (totalNutrition < totalNeeded) {
    const stillNeeded = totalNeeded - totalNutrition;
    const extraConsumed = consumeAnyAvailableFood(
      economy,
      stillNeeded,
      consumedItems
    );
    totalNutrition += extraConsumed.nutrition;
    processedFoodCount += extraConsumed.processed;
    rawFoodCount += extraConsumed.raw;
    
    // Update category nutrition for balance calculation
    for (const [itemType, amount] of consumedItems) {
      const foodItem = FOOD_SOURCES.find(f => String(f.type) === itemType);
      if (!foodItem) continue;
      
      const nutrition = amount * foodItem.nutritionValue;
      if (foodItem.category === FoodCategory.Grain) {
        grainNutrition += nutrition;
      } else if (foodItem.category === FoodCategory.Protein) {
        proteinNutrition += nutrition;
      } else {
        vegetableNutrition += nutrition;
      }
    }
  }
  
  const shortfall = totalNeeded - totalNutrition;
  
  // Calculate diet quality (0-1)
  const dietQuality = calculateDietQuality(
    grainNutrition,
    proteinNutrition,
    vegetableNutrition,
    totalNutrition,
    totalNeeded,
    processedFoodCount,
    rawFoodCount
  );
  
  // Update hunger for all people based on nutrition and quality
  updateHungerWithQuality(people, totalNutrition, totalNeeded, dietQuality);
  
  // Find starving people (hunger > 70 on reversed scale)
  const starving = people.filter(p => p.hunger > 70);
  
  console.log(`[Food] Population ${people.length}: needed ${totalNeeded.toFixed(1)}, consumed ${totalNutrition.toFixed(1)} (${processedFoodCount} processed, ${rawFoodCount} raw), quality ${(dietQuality * 100).toFixed(0)}%`);
  
  return {
    consumed: totalNutrition,
    needed: totalNeeded,
    shortfall: Math.max(0, shortfall),
    starving,
    dietQuality,
    consumedItems,
  };
}

/**
 * Consume food from a specific category
 */
function consumeFoodCategory(
  economy: SettlementEconomy,
  category: FoodCategory,
  needed: number,
  consumedItems: Map<string, number>
): { nutrition: number; processed: number; raw: number } {
  let nutrition = 0;
  let processed = 0;
  let raw = 0;
  
  // Get foods in this category, sorted by preference (processed first, then by nutrition value)
  const categoryFoods = FOOD_SOURCES
    .filter(f => f.category === category)
    .sort((a, b) => {
      if (a.isProcessed !== b.isProcessed) {
        return a.isProcessed ? -1 : 1; // Processed first
      }
      return b.nutritionValue - a.nutritionValue; // Higher nutrition first
    });
  
  for (const food of categoryFoods) {
    if (nutrition >= needed) break;
    
    const available = getAvailableAmount(economy, food.type);
    if (available <= 0) continue;
    
    // Calculate how much we need in units (accounting for nutrition value)
    const nutritionStillNeeded = needed - nutrition;
    const unitsNeeded = Math.ceil(nutritionStillNeeded / food.nutritionValue);
    const unitsToConsume = Math.min(available, unitsNeeded);
    
    // Remove from economy
    removeFromEconomy(economy, food.type, unitsToConsume);
    
    // Track consumption
    const key = String(food.type);
    consumedItems.set(key, (consumedItems.get(key) || 0) + unitsToConsume);
    
    // Add nutrition
    const nutritionGained = unitsToConsume * food.nutritionValue;
    nutrition += nutritionGained;
    
    if (food.isProcessed) {
      processed += unitsToConsume;
    } else {
      raw += unitsToConsume;
    }
  }
  
  return { nutrition, processed, raw };
}

/**
 * Consume any available food when desperate
 */
function consumeAnyAvailableFood(
  economy: SettlementEconomy,
  needed: number,
  consumedItems: Map<string, number>
): { nutrition: number; processed: number; raw: number } {
  let nutrition = 0;
  let processed = 0;
  let raw = 0;
  
  // Sort all foods by preference
  const allFoods = [...FOOD_SOURCES].sort((a, b) => {
    if (a.isProcessed !== b.isProcessed) {
      return a.isProcessed ? -1 : 1;
    }
    return b.nutritionValue - a.nutritionValue;
  });
  
  for (const food of allFoods) {
    if (nutrition >= needed) break;
    
    const available = getAvailableAmount(economy, food.type);
    if (available <= 0) continue;
    
    // Skip if we already consumed from this source in balanced phase
    const key = String(food.type);
    const alreadyConsumed = consumedItems.get(key) || 0;
    if (alreadyConsumed >= available) continue;
    
    const remainingAvailable = available - alreadyConsumed;
    const nutritionStillNeeded = needed - nutrition;
    const unitsNeeded = Math.ceil(nutritionStillNeeded / food.nutritionValue);
    const unitsToConsume = Math.min(remainingAvailable, unitsNeeded);
    
    removeFromEconomy(economy, food.type, unitsToConsume);
    consumedItems.set(key, alreadyConsumed + unitsToConsume);
    
    const nutritionGained = unitsToConsume * food.nutritionValue;
    nutrition += nutritionGained;
    
    if (food.isProcessed) {
      processed += unitsToConsume;
    } else {
      raw += unitsToConsume;
    }
  }
  
  return { nutrition, processed, raw };
}

/**
 * Calculate diet quality based on balance and food types
 */
function calculateDietQuality(
  grainNutrition: number,
  proteinNutrition: number,
  vegetableNutrition: number,
  totalNutrition: number,
  totalNeeded: number,
  processedCount: number,
  rawCount: number
): number {
  if (totalNutrition === 0) return 0;
  
  // Factor 1: Sufficiency (0-1)
  const sufficiency = Math.min(1, totalNutrition / totalNeeded);
  
  // Factor 2: Balance (0-1) - prefer 33/33/33 grain/protein/vegetables
  const grainRatio = grainNutrition / Math.max(1, totalNutrition);
  const proteinRatio = proteinNutrition / Math.max(1, totalNutrition);
  const vegetableRatio = vegetableNutrition / Math.max(1, totalNutrition);
  const idealRatio = 1/3; // 33.3%
  
  const grainDeviation = Math.abs(grainRatio - idealRatio);
  const proteinDeviation = Math.abs(proteinRatio - idealRatio);
  const vegetableDeviation = Math.abs(vegetableRatio - idealRatio);
  
  // Average deviation from ideal - lower is better
  const balance = 1 - ((grainDeviation + proteinDeviation + vegetableDeviation) / 3);
  
  // Factor 3: Processing (0-1) - prefer processed food
  const totalFoodCount = processedCount + rawCount;
  const processingRatio = totalFoodCount > 0 ? processedCount / totalFoodCount : 1;
  
  // Factor 4: Vegetable bonus - having vegetables is extra healthy!
  const vegetableBonus = vegetableNutrition > 0 ? 0.1 : 0; // +10% quality for having veggies
  
  // Weighted average: sufficiency most important, then balance, then processing
  let quality = (sufficiency * 0.5) + (balance * 0.3) + (processingRatio * 0.2) + vegetableBonus;
  
  // Cap at 1.0
  quality = Math.min(1.0, quality);
  
  return quality;
}

/**
 * Update hunger levels with diet quality consideration
 * 
 * REVERSED SCALE: 0 = not hungry, 100 = starving
 * 
 * BALANCED for resilient populations:
 * - Hunger increases more slowly during shortage
 * - Better hunger reduction when fed
 */
function updateHungerWithQuality(
  people: Person[],
  consumed: number,
  needed: number,
  dietQuality: number
): void {
  if (people.length === 0) return;
  
  const foodRatio = consumed / needed; // 0-1+ (can be >1 if surplus)
  
  for (const person of people) {
    // Base hunger change from sufficiency
    let hungerChange = 0;
    
    if (foodRatio >= 1.0) {
      // Enough food - DECREASE hunger significantly (well-fed)
      hungerChange = -50;
    } else if (foodRatio >= 0.75) {
      // Mostly fed - good decrease
      hungerChange = -35;
    } else if (foodRatio >= 0.5) {
      // Partial food - moderate decrease
      hungerChange = -20 * foodRatio;
    } else if (foodRatio >= 0.25) {
      // Low food - slight increase (slower starvation)
      hungerChange = 10;
    } else {
      // Severe shortage - INCREASE hunger (starving)
      hungerChange = 15;
    }
    
    // Modify by diet quality (poor quality = less effective)
    // Quality 1.0 = 100% effect, quality 0.5 = 75% effect, quality 0 = 50% effect
    const qualityMultiplier = 0.5 + (dietQuality * 0.5);
    hungerChange *= qualityMultiplier;
    
    // Apply change (cap the increase to prevent rapid starvation)
    if (hungerChange > 0) {
      // Hunger increases slower (maximum gain of +15 per turn)
      hungerChange = Math.min(hungerChange, 15);
    }
    
    person.hunger = Math.max(0, Math.min(100, person.hunger + hungerChange));
  }
}

/**
 * Update hunger levels for all people based on food consumed (legacy)
 */
export function updateHunger(people: Person[], consumed: number, needed: number): void {
  updateHungerWithQuality(people, consumed, needed, 1.0);
}

/**
 * Update health based on hunger levels
 * 
 * REVERSED SCALE: 0 = not hungry, 100 = starving
 * 
 * BALANCED for resilient populations:
 * - Slower health loss from starvation
 * - Faster health recovery when fed
 * - Better recovery for moderately fed people
 */
export function updateHealthFromHunger(person: Person): void {
  if (person.hunger > 80) {
    // Severe starvation - health decreases (reduced from -10 to -5)
    person.health = Math.max(0, person.health - 5);
  } else if (person.hunger > 60) {
    // Malnourished - slight health decrease (new tier)
    person.health = Math.max(0, person.health - 2);
  } else if (person.hunger < 20) {
    // Very well-fed - health increases faster
    person.health = Math.min(100, person.health + 5); // Increased from +2
  } else if (person.hunger < 40) {
    // Well-fed - health increases
    person.health = Math.min(100, person.health + 3); // Increased from +2
  } else {
    // Moderate - health recovers slowly
    // Slight recovery if health is low
    if (person.health < 80) {
      person.health = Math.min(100, person.health + 1);
    }
  }
}

/**
 * Update happiness based on food availability and quality
 * 
 * REVERSED SCALE: 0 = not hungry, 100 = starving
 */
export function updateHappinessFromFood(person: Person, dietQuality: number = 1.0): void {
  if (person.hunger > 70) {
    // Starving - happiness decreases significantly
    person.happiness = Math.max(0, person.happiness - 15);
  } else if (person.hunger < 20) {
    // Very well-fed - happiness increases
    // Bonus happiness from good diet quality
    const qualityBonus = Math.floor((dietQuality - 0.5) * 10); // -5 to +5
    const happinessGain = 5 + qualityBonus;
    person.happiness = Math.min(100, person.happiness + happinessGain);
  } else if (person.hunger < 50 && dietQuality < 0.6) {
    // Fed but poor quality diet (raw food, unbalanced) - slight happiness decrease
    person.happiness = Math.max(0, person.happiness - 2);
  }
}

/**
 * Check if a person is starving
 * REVERSED SCALE: 0 = not hungry, 100 = starving
 */
export function isStarving(person: Person): boolean {
  return person.hunger > 70;
}

/**
 * Check if a person is well-fed
 * REVERSED SCALE: 0 = not hungry, 100 = starving
 */
export function isWellFed(person: Person): boolean {
  return person.hunger < 30;
}

/**
 * Calculate food consumption rate for a population
 */
export function calculateFoodConsumptionRate(populationSize: number): number {
  return populationSize * FOOD_PER_PERSON_PER_TURN;
}

/**
 * Get available amount of a food item from economy
 */
function getAvailableAmount(economy: SettlementEconomy, type: GoodType | ResourceType): number {
  // Check if it's a Good
  if (Object.values(GoodType).includes(type as GoodType)) {
    return economy.getGoodAmount(type as GoodType);
  }
  // Check if it's a Resource
  if (Object.values(ResourceType).includes(type as ResourceType)) {
    return economy.getResourceAmount(type as ResourceType);
  }
  return 0;
}

/**
 * Remove amount of food from economy
 */
function removeFromEconomy(economy: SettlementEconomy, type: GoodType | ResourceType, amount: number): void {
  if (Object.values(GoodType).includes(type as GoodType)) {
    economy.removeGood(type as GoodType, amount);
  } else if (Object.values(ResourceType).includes(type as ResourceType)) {
    economy.removeResource(type as ResourceType, amount);
  }
}
