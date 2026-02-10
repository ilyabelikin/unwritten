import { ResourceType } from "./Resource";
import { GoodType } from "./Goods";
import { BuildingType } from "./Building";

/**
 * Represents an input or output material in a recipe
 */
export type MaterialType = ResourceType | GoodType;

/**
 * An ingredient or product in a recipe
 */
export interface RecipeItem {
  type: MaterialType;
  quantity: number;
}

/**
 * A production recipe that transforms inputs into outputs
 */
export interface ProductionRecipe {
  /** Unique identifier for this recipe */
  id: string;
  /** Display name for the recipe */
  name: string;
  /** Description of what this recipe produces */
  description: string;
  /** Input materials required */
  inputs: RecipeItem[];
  /** Output materials produced */
  outputs: RecipeItem[];
  /** Number of game ticks required to complete production */
  productionTime: number;
  /** Building type that can execute this recipe */
  buildingType: BuildingType;
  /** Priority for auto-production (higher = more important) */
  priority: number;
}

/**
 * Database of all production recipes
 */
export const PRODUCTION_RECIPES: Record<string, ProductionRecipe> = {
  // ===== FUEL PRODUCTION =====
  timber_to_coal: {
    id: "timber_to_coal",
    name: "Produce Coal",
    description: "Convert timber into coal for use in smelting and forging",
    inputs: [
      { type: ResourceType.Timber, quantity: 10 },
    ],
    outputs: [
      { type: GoodType.Coal, quantity: 5 },
    ],
    productionTime: 2,
    buildingType: BuildingType.CharcoalBurner,
    priority: 10, // High priority - needed for all production
  },
  
  // Alternative charcoal recipe (for future)
  timber_to_charcoal: {
    id: "timber_to_charcoal",
    name: "Produce Charcoal",
    description: "Convert timber into charcoal",
    inputs: [
      { type: ResourceType.Timber, quantity: 8 },
    ],
    outputs: [
      { type: GoodType.Charcoal, quantity: 6 },
    ],
    productionTime: 2,
    buildingType: BuildingType.CharcoalBurner,
    priority: 9,
  },
  
  // ===== METAL SMELTING =====
  smelt_copper: {
    id: "smelt_copper",
    name: "Smelt Copper",
    description: "Smelt copper ore into ingots",
    inputs: [
      { type: ResourceType.Copper, quantity: 10 },
      { type: GoodType.Coal, quantity: 4 },
    ],
    outputs: [
      { type: GoodType.CopperIngot, quantity: 8 },
    ],
    productionTime: 3,
    buildingType: BuildingType.Smelter,
    priority: 7,
  },
  
  smelt_iron: {
    id: "smelt_iron",
    name: "Smelt Iron",
    description: "Smelt iron ore into ingots",
    inputs: [
      { type: ResourceType.Iron, quantity: 10 },
      { type: GoodType.Coal, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.IronIngot, quantity: 8 },
    ],
    productionTime: 4,
    buildingType: BuildingType.Smelter,
    priority: 8,
  },
  
  smelt_silver: {
    id: "smelt_silver",
    name: "Smelt Silver",
    description: "Smelt silver ore into ingots",
    inputs: [
      { type: ResourceType.Silver, quantity: 10 },
      { type: GoodType.Coal, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.SilverIngot, quantity: 9 },
    ],
    productionTime: 4,
    buildingType: BuildingType.Smelter,
    priority: 5,
  },
  
  smelt_gold: {
    id: "smelt_gold",
    name: "Smelt Gold",
    description: "Smelt gold ore into ingots",
    inputs: [
      { type: ResourceType.Gold, quantity: 10 },
      { type: GoodType.Coal, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.GoldIngot, quantity: 9 },
    ],
    productionTime: 5,
    buildingType: BuildingType.Smelter,
    priority: 4,
  },
  
  // ===== WEAPON CRAFTING =====
  forge_copper_sword: {
    id: "forge_copper_sword",
    name: "Forge Copper Sword",
    description: "Craft a copper sword from ingots",
    inputs: [
      { type: GoodType.CopperIngot, quantity: 2 },
      { type: GoodType.Coal, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.CopperSword, quantity: 1 },
    ],
    productionTime: 3,
    buildingType: BuildingType.Smithy,
    priority: 5,
  },
  
  forge_iron_sword: {
    id: "forge_iron_sword",
    name: "Forge Iron Sword",
    description: "Craft an iron sword from ingots",
    inputs: [
      { type: GoodType.IronIngot, quantity: 3 },
      { type: GoodType.Coal, quantity: 4 },
    ],
    outputs: [
      { type: GoodType.IronSword, quantity: 1 },
    ],
    productionTime: 4,
    buildingType: BuildingType.Smithy,
    priority: 6,
  },
  
  forge_steel_sword: {
    id: "forge_steel_sword",
    name: "Forge Steel Sword",
    description: "Craft a high-quality steel sword",
    inputs: [
      { type: GoodType.IronIngot, quantity: 4 },
      { type: GoodType.Coal, quantity: 6 },
    ],
    outputs: [
      { type: GoodType.SteelSword, quantity: 1 },
    ],
    productionTime: 5,
    buildingType: BuildingType.Smithy,
    priority: 4,
  },
  
  // ===== TOOL CRAFTING =====
  forge_copper_tools: {
    id: "forge_copper_tools",
    name: "Forge Copper Tools",
    description: "Craft copper tools for work",
    inputs: [
      { type: GoodType.CopperIngot, quantity: 2 },
      { type: GoodType.Coal, quantity: 2 },
    ],
    outputs: [
      { type: GoodType.CopperTools, quantity: 1 },
    ],
    productionTime: 2,
    buildingType: BuildingType.Smithy,
    priority: 7,
  },
  
  forge_iron_tools: {
    id: "forge_iron_tools",
    name: "Forge Iron Tools",
    description: "Craft durable iron tools",
    inputs: [
      { type: GoodType.IronIngot, quantity: 2 },
      { type: GoodType.Coal, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.IronTools, quantity: 1 },
    ],
    productionTime: 3,
    buildingType: BuildingType.Smithy,
    priority: 8,
  },
  
  // ===== ARMOR CRAFTING =====
  forge_iron_armor: {
    id: "forge_iron_armor",
    name: "Forge Iron Armor",
    description: "Craft heavy iron armor",
    inputs: [
      { type: GoodType.IronIngot, quantity: 4 },
      { type: GoodType.Coal, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.IronArmor, quantity: 1 },
    ],
    productionTime: 5,
    buildingType: BuildingType.Smithy,
    priority: 5,
  },
  
  craft_leather_armor: {
    id: "craft_leather_armor",
    name: "Craft Leather Armor",
    description: "Craft light leather armor",
    inputs: [
      { type: GoodType.Leather, quantity: 4 },
    ],
    outputs: [
      { type: GoodType.LeatherArmor, quantity: 1 },
    ],
    productionTime: 3,
    buildingType: BuildingType.Tannery,
    priority: 6,
  },
  
  // ===== CONSTRUCTION MATERIALS =====
  process_planks: {
    id: "process_planks",
    name: "Process Planks",
    description: "Cut timber into planks for construction",
    inputs: [
      { type: ResourceType.Timber, quantity: 10 },
    ],
    outputs: [
      { type: GoodType.Planks, quantity: 15 },
    ],
    productionTime: 2,
    buildingType: BuildingType.Sawmill,
    priority: 8,
  },
  
  fire_bricks: {
    id: "fire_bricks",
    name: "Fire Bricks",
    description: "Fire clay into durable bricks",
    inputs: [
      { type: ResourceType.Clay, quantity: 10 },
      { type: GoodType.Coal, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.Bricks, quantity: 12 },
    ],
    productionTime: 3,
    buildingType: BuildingType.Kiln,
    priority: 7,
  },
  
  // ===== PROCESSED GOODS =====
  tan_leather: {
    id: "tan_leather",
    name: "Tan Leather",
    description: "Process livestock into leather",
    inputs: [
      { type: ResourceType.Livestock, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.Leather, quantity: 3 },
    ],
    productionTime: 3,
    buildingType: BuildingType.Tannery,
    priority: 6,
  },
  
  // ===== FOOD INGREDIENTS (WINDMILL) =====
  grind_flour: {
    id: "grind_flour",
    name: "Grind Flour",
    description: "Windmill grinds wheat into flour for baking",
    inputs: [
      { type: ResourceType.Wheat, quantity: 10 },
    ],
    outputs: [
      { type: GoodType.Flour, quantity: 10 },
    ],
    productionTime: 1,
    buildingType: BuildingType.Windmill,
    priority: 10, // Highest priority - essential for baking
  },
  
  // ===== FOOD PRODUCTION (BAKERY) =====
  bakery_bread: {
    id: "bakery_bread",
    name: "Bake Bread",
    description: "Professional bakery produces bread efficiently from flour",
    inputs: [
      { type: GoodType.Flour, quantity: 10 },
    ],
    outputs: [
      { type: GoodType.Bread, quantity: 20 },
    ],
    productionTime: 1,
    buildingType: BuildingType.Bakery,
    priority: 10, // Highest priority - essential food production
  },
  
  // ===== FOOD PRODUCTION (BUTCHER) =====
  butcher_meat: {
    id: "butcher_meat",
    name: "Process Meat",
    description: "Professional butcher processes livestock into quality meat",
    inputs: [
      { type: ResourceType.Livestock, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.Meat, quantity: 12 },
    ],
    productionTime: 1,
    buildingType: BuildingType.Butcher,
    priority: 10, // Highest priority - essential food production
  },
  
  // ===== FOOD PRODUCTION (HOUSES) =====
  bake_bread: {
    id: "bake_bread",
    name: "Bake Bread",
    description: "Bake bread from flour in household ovens",
    inputs: [
      { type: GoodType.Flour, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.Bread, quantity: 8 },
    ],
    productionTime: 1,
    buildingType: BuildingType.House,
    priority: 7, // Lower priority - houses are fallback
  },
  
  bake_bread_city: {
    id: "bake_bread_city",
    name: "Bake Bread",
    description: "Bake bread from flour in household ovens",
    inputs: [
      { type: GoodType.Flour, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.Bread, quantity: 8 },
    ],
    productionTime: 1,
    buildingType: BuildingType.CityHouse,
    priority: 7, // Lower priority - houses are fallback
  },
  
  // Fallback: Houses can grind flour manually (handmill)
  grind_flour_house: {
    id: "grind_flour_house",
    name: "Grind Flour",
    description: "Grind wheat into flour using a handmill",
    inputs: [
      { type: ResourceType.Wheat, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.Flour, quantity: 4 }, // Less efficient than windmill
    ],
    productionTime: 1,
    buildingType: BuildingType.House,
    priority: 6, // Lower than baking
  },
  
  grind_flour_city_house: {
    id: "grind_flour_city_house",
    name: "Grind Flour",
    description: "Grind wheat into flour using a handmill",
    inputs: [
      { type: ResourceType.Wheat, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.Flour, quantity: 4 }, // Less efficient than windmill
    ],
    productionTime: 1,
    buildingType: BuildingType.CityHouse,
    priority: 6, // Lower than baking
  },
  
  butcher_livestock: {
    id: "butcher_livestock",
    name: "Butcher Livestock",
    description: "Process livestock into meat",
    inputs: [
      { type: ResourceType.Livestock, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.Meat, quantity: 5 },
    ],
    productionTime: 1,
    buildingType: BuildingType.House,
    priority: 9, // High priority - basic food
  },
  
  butcher_livestock_city: {
    id: "butcher_livestock_city",
    name: "Butcher Livestock",
    description: "Process livestock into meat",
    inputs: [
      { type: ResourceType.Livestock, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.Meat, quantity: 5 },
    ],
    productionTime: 1,
    buildingType: BuildingType.CityHouse,
    priority: 9,
  },
  
  butcher_game: {
    id: "butcher_game",
    name: "Butcher Game",
    description: "Process wild game into meat",
    inputs: [
      { type: ResourceType.WildGame, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.Meat, quantity: 4 },
    ],
    productionTime: 1,
    buildingType: BuildingType.House,
    priority: 9, // High priority - basic food
  },
  
  butcher_game_city: {
    id: "butcher_game_city",
    name: "Butcher Game",
    description: "Process wild game into meat",
    inputs: [
      { type: ResourceType.WildGame, quantity: 3 },
    ],
    outputs: [
      { type: GoodType.Meat, quantity: 4 },
    ],
    productionTime: 1,
    buildingType: BuildingType.CityHouse,
    priority: 9,
  },
  
  prepare_fish: {
    id: "prepare_fish",
    name: "Prepare Fish",
    description: "Clean and prepare fish for consumption",
    inputs: [
      { type: ResourceType.Fish, quantity: 4 },
    ],
    outputs: [
      { type: GoodType.PreparedFish, quantity: 6 },
    ],
    productionTime: 1,
    buildingType: BuildingType.House,
    priority: 9, // High priority - basic food
  },
  
  prepare_fish_city: {
    id: "prepare_fish_city",
    name: "Prepare Fish",
    description: "Clean and prepare fish for consumption",
    inputs: [
      { type: ResourceType.Fish, quantity: 4 },
    ],
    outputs: [
      { type: GoodType.PreparedFish, quantity: 6 },
    ],
    productionTime: 1,
    buildingType: BuildingType.CityHouse,
    priority: 9,
  },
  
  // ===== VEGETABLE PREPARATION =====
  cook_vegetables: {
    id: "cook_vegetables",
    name: "Cook Vegetables",
    description: "Prepare and season fresh vegetables",
    inputs: [
      { type: ResourceType.Vegetables, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.CookedVegetables, quantity: 7 },
    ],
    productionTime: 1,
    buildingType: BuildingType.House,
    priority: 9, // High priority - healthy food
  },
  
  cook_vegetables_city: {
    id: "cook_vegetables_city",
    name: "Cook Vegetables",
    description: "Prepare and season fresh vegetables",
    inputs: [
      { type: ResourceType.Vegetables, quantity: 5 },
    ],
    outputs: [
      { type: GoodType.CookedVegetables, quantity: 7 },
    ],
    productionTime: 1,
    buildingType: BuildingType.CityHouse,
    priority: 9,
  },
  
  // ===== LUXURY GOODS =====
  craft_jewelry: {
    id: "craft_jewelry",
    name: "Craft Jewelry",
    description: "Create precious jewelry from gold, silver, and gems",
    inputs: [
      { type: GoodType.GoldIngot, quantity: 1 },
      { type: GoodType.SilverIngot, quantity: 1 },
      { type: ResourceType.Gems, quantity: 2 },
    ],
    outputs: [
      { type: GoodType.Jewelry, quantity: 1 },
    ],
    productionTime: 4,
    buildingType: BuildingType.Smithy,
    priority: 3,
  },
  
  craft_pottery: {
    id: "craft_pottery",
    name: "Craft Pottery",
    description: "Fire clay into pottery",
    inputs: [
      { type: ResourceType.Clay, quantity: 5 },
      { type: GoodType.Coal, quantity: 2 },
    ],
    outputs: [
      { type: GoodType.Pottery, quantity: 3 },
    ],
    productionTime: 2,
    buildingType: BuildingType.Kiln,
    priority: 4,
  },
};

/**
 * Get all recipes for a specific building type
 */
export function getRecipesForBuilding(buildingType: BuildingType): ProductionRecipe[] {
  return Object.values(PRODUCTION_RECIPES)
    .filter(recipe => recipe.buildingType === buildingType)
    .sort((a, b) => b.priority - a.priority); // Sort by priority descending
}

/**
 * Get a recipe by its ID
 */
export function getRecipeById(recipeId: string): ProductionRecipe | undefined {
  return PRODUCTION_RECIPES[recipeId];
}

/**
 * Get all recipes that produce a specific good
 */
export function getRecipesProducing(goodType: GoodType): ProductionRecipe[] {
  return Object.values(PRODUCTION_RECIPES)
    .filter(recipe => recipe.outputs.some(output => output.type === goodType));
}

/**
 * Get all recipes that consume a specific material (resource or good)
 */
export function getRecipesConsuming(materialType: MaterialType): ProductionRecipe[] {
  return Object.values(PRODUCTION_RECIPES)
    .filter(recipe => recipe.inputs.some(input => input.type === materialType));
}

/**
 * Check if a material is a resource or a good
 */
export function isResource(material: MaterialType): material is ResourceType {
  return Object.values(ResourceType).includes(material as ResourceType);
}

/**
 * Check if a material is a good
 */
export function isGood(material: MaterialType): material is GoodType {
  return Object.values(GoodType).includes(material as GoodType);
}
