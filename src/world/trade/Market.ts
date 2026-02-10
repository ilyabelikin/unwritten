import { MaterialType } from "./Trader";
import { ResourceType } from "../Resource";
import { GoodType } from "../Goods";
import { SettlementEconomy } from "../SettlementEconomy";
import { PopulationManager } from "../population/PopulationManager";
import { getRecipesForBuilding, PRODUCTION_RECIPES } from "../ProductionRecipe";
import { BuildingType } from "../Building";

/**
 * Base prices for materials (in gold)
 */
export const BASE_PRICES: Record<string, number> = {
  // Food (critical)
  [GoodType.Bread]: 2,
  [GoodType.Meat]: 3,
  [GoodType.PreparedFish]: 3,
  [GoodType.CookedVegetables]: 2,
  
  // Food ingredients
  [GoodType.Flour]: 1.5,
  
  // Raw materials
  [ResourceType.Timber]: 1,
  [ResourceType.Stone]: 1,
  [ResourceType.Clay]: 1,
  [ResourceType.Iron]: 8,
  [ResourceType.Copper]: 5,
  [ResourceType.Silver]: 15,
  [ResourceType.Gold]: 25,
  [ResourceType.Gems]: 30,
  [ResourceType.Salt]: 3,
  [ResourceType.Wheat]: 1,
  [ResourceType.Vegetables]: 1,
  [ResourceType.Livestock]: 5,
  [ResourceType.WildGame]: 4,
  [ResourceType.Fish]: 2,
  
  // Processed goods
  [GoodType.Planks]: 2,
  [GoodType.Bricks]: 2,
  [GoodType.Coal]: 4,
  [GoodType.Charcoal]: 3,
  
  // Metal ingots
  [GoodType.CopperIngot]: 10,
  [GoodType.IronIngot]: 15,
  [GoodType.SilverIngot]: 30,
  [GoodType.GoldIngot]: 50,
  
  // Weapons & tools
  [GoodType.CopperSword]: 25,
  [GoodType.IronSword]: 40,
  [GoodType.SteelSword]: 80,
  [GoodType.CopperTools]: 15,
  [GoodType.IronTools]: 25,
  
  // Armor
  [GoodType.LeatherArmor]: 20,
  [GoodType.IronArmor]: 60,
  
  // Other
  [GoodType.Leather]: 5,
  [GoodType.Cloth]: 3,
  [GoodType.Pottery]: 4,
  [GoodType.Jewelry]: 50,
};

/**
 * Market price for a material
 */
export interface MarketPrice {
  material: MaterialType;
  supply: number; // Available in settlement
  demand: number; // Needed by settlement
  basePrice: number;
  currentPrice: number; // Adjusted by supply/demand
}

/**
 * Trade offer (buy or sell)
 */
export interface TradeOffer {
  settlementId: number;
  material: MaterialType;
  quantity: number;
  pricePerUnit: number;
  offerType: "sell" | "buy";
  priority: number; // 0-100, higher = more urgent
}

/**
 * Market for a single settlement
 */
export class SettlementMarket {
  private settlementId: number;
  private prices: Map<MaterialType, MarketPrice>;
  private sellOffers: TradeOffer[];
  private buyOffers: TradeOffer[];
  
  constructor(settlementId: number) {
    this.settlementId = settlementId;
    this.prices = new Map();
    this.sellOffers = [];
    this.buyOffers = [];
  }
  
  /**
   * Update market based on economy and population
   */
  update(economy: SettlementEconomy, population: PopulationManager, buildings?: BuildingType[]): void {
    this.calculateDemand(economy, population, buildings);
    this.calculateSupply(economy, population);
    this.updatePrices();
  }
  
  /**
   * Calculate what settlement needs (buy orders)
   */
  private calculateDemand(economy: SettlementEconomy, population: PopulationManager, buildings?: BuildingType[]): void {
    this.buyOffers = [];
    const popSize = population.getTotalPopulation();
    
    // PART 1: BUILDING PRODUCTION DEMANDS
    if (buildings && buildings.length > 0) {
      this.calculateBuildingDemands(economy, buildings);
    }
    
    // Calculate IDEAL food needs (what people WANT for healthy balanced diet)
    // Target: 33% grain, 33% protein, 33% vegetables
    const foodNeededPerTurn = popSize * 2;
    const idealGrainNeeded = foodNeededPerTurn / 3;
    const idealProteinNeeded = foodNeededPerTurn / 3;
    const idealVegetablesNeeded = foodNeededPerTurn / 3;
    
    // Calculate what's actually available (processed foods only - ideal choices)
    const breadAvailable = economy.getGoodAmount(GoodType.Bread);
    const meatAvailable = economy.getGoodAmount(GoodType.Meat);
    const fishAvailable = economy.getGoodAmount(GoodType.PreparedFish);
    const vegetablesAvailable = economy.getGoodAmount(GoodType.CookedVegetables);
    
    // Check for raw substitutes (indicates they WANT processed but don't have it)
    const rawWheatAvailable = economy.getResourceAmount(ResourceType.Wheat);
    const rawMeatAvailable = economy.getResourceAmount(ResourceType.Livestock) + 
                             economy.getResourceAmount(ResourceType.WildGame);
    const rawFishAvailable = economy.getResourceAmount(ResourceType.Fish);
    const rawVegetablesAvailable = economy.getResourceAmount(ResourceType.Vegetables);
    
    // GRAIN DEMAND: Want bread, not raw wheat
    const grainDeficit = idealGrainNeeded - breadAvailable;
    if (grainDeficit > 0) {
      // Higher priority if they're eating raw wheat (indicates need for upgrade)
      const isEatingRaw = rawWheatAvailable > 0;
      const basePriority = breadAvailable === 0 ? 85 : 70; // Critical if none at all
      const priority = isEatingRaw ? basePriority + 10 : basePriority; // +10 if eating raw substitutes
      
      this.buyOffers.push({
        settlementId: this.settlementId,
        material: GoodType.Bread,
        quantity: Math.ceil(grainDeficit),
        pricePerUnit: this.getPrice(GoodType.Bread),
        offerType: "buy",
        priority,
      });
    }
    
    // PROTEIN DEMAND: Want meat/fish, not raw livestock
    const totalProteinAvailable = meatAvailable + fishAvailable;
    const proteinDeficit = idealProteinNeeded - totalProteinAvailable;
    if (proteinDeficit > 0) {
      const isEatingRaw = rawMeatAvailable > 0 || rawFishAvailable > 0;
      const basePriority = totalProteinAvailable === 0 ? 85 : 70;
      const priority = isEatingRaw ? basePriority + 10 : basePriority;
      
      // Prefer meat (higher nutrition value)
      const meatQuantity = Math.ceil(proteinDeficit * 0.7);
      const fishQuantity = Math.ceil(proteinDeficit * 0.3);
      
      if (meatQuantity > 0) {
        this.buyOffers.push({
          settlementId: this.settlementId,
          material: GoodType.Meat,
          quantity: meatQuantity,
          pricePerUnit: this.getPrice(GoodType.Meat),
          offerType: "buy",
          priority,
        });
      }
      
      if (fishQuantity > 0) {
        this.buyOffers.push({
          settlementId: this.settlementId,
          material: GoodType.PreparedFish,
          quantity: fishQuantity,
          pricePerUnit: this.getPrice(GoodType.PreparedFish),
          offerType: "buy",
          priority: priority - 5, // Slightly lower than meat
        });
      }
    }
    
    // VEGETABLE DEMAND: Want cooked vegetables, not raw
    const vegetableDeficit = idealVegetablesNeeded - vegetablesAvailable;
    if (vegetableDeficit > 0) {
      const isEatingRaw = rawVegetablesAvailable > 0;
      const basePriority = vegetablesAvailable === 0 ? 80 : 65; // Slightly lower than grain/protein
      const priority = isEatingRaw ? basePriority + 10 : basePriority;
      
      this.buyOffers.push({
        settlementId: this.settlementId,
        material: GoodType.CookedVegetables,
        quantity: Math.ceil(vegetableDeficit),
        pricePerUnit: this.getPrice(GoodType.CookedVegetables),
        offerType: "buy",
        priority,
      });
    }
    
    // CRITICAL STARVATION: If they don't even have substitutes
    const totalRawFood = rawWheatAvailable + rawMeatAvailable + rawFishAvailable + rawVegetablesAvailable;
    const totalProcessedFood = breadAvailable + meatAvailable + fishAvailable + vegetablesAvailable;
    const totalFood = totalProcessedFood + (totalRawFood * 0.8); // Raw food is less efficient
    
    if (totalFood < foodNeededPerTurn * 2) { // Less than 2 turns of food
      // EMERGENCY: Create high-priority orders for ANY food
      const emergency = foodNeededPerTurn * 3; // Want 3 turns worth
      
      this.buyOffers.push({
        settlementId: this.settlementId,
        material: GoodType.Bread,
        quantity: Math.ceil(emergency / 3),
        pricePerUnit: this.getPrice(GoodType.Bread) * 1.5, // Willing to pay more!
        offerType: "buy",
        priority: 100, // CRITICAL
      });
      
      this.buyOffers.push({
        settlementId: this.settlementId,
        material: GoodType.Meat,
        quantity: Math.ceil(emergency / 3),
        pricePerUnit: this.getPrice(GoodType.Meat) * 1.5,
        offerType: "buy",
        priority: 100, // CRITICAL
      });
    }
  }
  
  /**
   * Calculate building production input demands
   * E.g., Windmills need wheat, Bakeries need flour
   */
  private calculateBuildingDemands(economy: SettlementEconomy, buildings: BuildingType[]): void {
    // Count buildings by type
    const buildingCounts = new Map<BuildingType, number>();
    for (const building of buildings) {
      if (building === BuildingType.None) continue;
      buildingCounts.set(building, (buildingCounts.get(building) || 0) + 1);
    }
    
    // Track total demand per material (aggregate across all buildings)
    const materialDemands = new Map<MaterialType, number>();
    
    // For each building type, calculate what inputs it needs
    for (const [buildingType, count] of buildingCounts) {
      const recipes = getRecipesForBuilding(buildingType);
      
      // Use the highest priority recipe for this building
      if (recipes.length === 0) continue;
      const primaryRecipe = recipes[0]; // Already sorted by priority
      
      // Calculate demand based on building count and recipe inputs
      for (const input of primaryRecipe.inputs) {
        const material = input.type;
        
        // Check current stock
        let currentStock = 0;
        if (Object.values(GoodType).includes(material as GoodType)) {
          currentStock = economy.getGoodAmount(material as GoodType);
        } else if (Object.values(ResourceType).includes(material as ResourceType)) {
          currentStock = economy.getResourceAmount(material as ResourceType);
        }
        
        // Calculate desired stock (enough for 3 production cycles per building)
        const desiredStock = input.quantity * count * 3;
        const deficit = Math.max(0, desiredStock - currentStock);
        
        if (deficit > 0) {
          // Add to material demands
          const existingDemand = materialDemands.get(material) || 0;
          materialDemands.set(material, existingDemand + deficit);
        }
      }
    }
    
    // Create buy offers for all material demands
    for (const [material, quantity] of materialDemands) {
      if (quantity <= 0) continue;
      
      // Priority based on material type
      let priority = 60; // Base priority for production inputs
      
      // Food production inputs are higher priority
      if (material === ResourceType.Wheat || 
          material === GoodType.Flour ||
          material === ResourceType.Livestock) {
        priority = 75; // Food production is important
      }
      
      // Critical production inputs (fuel, etc.)
      if (material === GoodType.Coal || material === GoodType.Charcoal) {
        priority = 70;
      }
      
      this.buyOffers.push({
        settlementId: this.settlementId,
        material,
        quantity: Math.ceil(quantity),
        pricePerUnit: this.getPrice(material),
        offerType: "buy",
        priority,
      });
    }
  }
  
  /**
   * Calculate what settlement has excess of (sell orders)
   */
  private calculateSupply(economy: SettlementEconomy, population: PopulationManager): void {
    this.sellOffers = [];
    const popSize = population.getTotalPopulation();
    const foodNeededPerTurn = popSize * 2;
    
    // Calculate ideal food needs for reserve calculation
    const idealGrainReserve = (foodNeededPerTurn / 3) * 3; // 3 turns
    const idealProteinReserve = (foodNeededPerTurn / 3) * 3;
    const idealVegetableReserve = (foodNeededPerTurn / 3) * 3;
    
    // Check all processed goods first
    const goods = economy.getAllGoods();
    
    for (const { type, amount } of goods) {
      // GRAIN: Only sell bread if we have way more than needed
      if (type === GoodType.Bread) {
        if (amount > idealGrainReserve * 2) { // More than 6 turns worth
          const surplus = amount - idealGrainReserve;
          this.sellOffers.push({
            settlementId: this.settlementId,
            material: type,
            quantity: Math.floor(surplus * 0.4), // Sell conservatively
            pricePerUnit: this.getPrice(type),
            offerType: "sell",
            priority: 35,
          });
        }
      }
      // PROTEIN: Only sell meat/fish if we have excess
      else if (type === GoodType.Meat || type === GoodType.PreparedFish) {
        const totalProtein = economy.getGoodAmount(GoodType.Meat) + 
                            economy.getGoodAmount(GoodType.PreparedFish);
        if (totalProtein > idealProteinReserve * 2) {
          const surplus = amount - idealProteinReserve * 0.5; // Keep 1.5 turns per type
          if (surplus > 5) {
            this.sellOffers.push({
              settlementId: this.settlementId,
              material: type,
              quantity: Math.floor(surplus * 0.4),
              pricePerUnit: this.getPrice(type),
              offerType: "sell",
              priority: 35,
            });
          }
        }
      }
      // VEGETABLES: Only sell if we have excess
      else if (type === GoodType.CookedVegetables) {
        if (amount > idealVegetableReserve * 2) {
          const surplus = amount - idealVegetableReserve;
          this.sellOffers.push({
            settlementId: this.settlementId,
            material: type,
            quantity: Math.floor(surplus * 0.4),
            pricePerUnit: this.getPrice(type),
            offerType: "sell",
            priority: 35,
          });
        }
      }
      // Non-food goods: sell if > 20
      else if (!this.isFood(type) && amount > 20) {
        this.sellOffers.push({
          settlementId: this.settlementId,
          material: type,
          quantity: Math.floor(amount * 0.4),
          pricePerUnit: this.getPrice(type),
          offerType: "sell",
          priority: 30,
        });
      }
    }
    
    // Check raw resources
    const resources = economy.getAllResources();
    
    for (const { type, amount } of resources) {
      // RAW FOOD: Don't sell if we're using it as substitute!
      if (type === ResourceType.Wheat) {
        const breadAvailable = economy.getGoodAmount(GoodType.Bread);
        // Only sell wheat if we have plenty of bread already
        if (breadAvailable > idealGrainReserve && amount > 50) {
          const surplus = amount - 20;
          this.sellOffers.push({
            settlementId: this.settlementId,
            material: type,
            quantity: Math.floor(surplus * 0.3),
            pricePerUnit: this.getPrice(type),
            offerType: "sell",
            priority: 25, // Lower priority - prefer to keep/process
          });
        }
      }
      else if (type === ResourceType.Vegetables) {
        const veggiesAvailable = economy.getGoodAmount(GoodType.CookedVegetables);
        if (veggiesAvailable > idealVegetableReserve && amount > 50) {
          const surplus = amount - 20;
          this.sellOffers.push({
            settlementId: this.settlementId,
            material: type,
            quantity: Math.floor(surplus * 0.3),
            pricePerUnit: this.getPrice(type),
            offerType: "sell",
            priority: 25,
          });
        }
      }
      else if (type === ResourceType.Livestock || type === ResourceType.WildGame || type === ResourceType.Fish) {
        const proteinAvailable = economy.getGoodAmount(GoodType.Meat) + 
                                 economy.getGoodAmount(GoodType.PreparedFish);
        if (proteinAvailable > idealProteinReserve && amount > 50) {
          const surplus = amount - 20;
          this.sellOffers.push({
            settlementId: this.settlementId,
            material: type,
            quantity: Math.floor(surplus * 0.3),
            pricePerUnit: this.getPrice(type),
            offerType: "sell",
            priority: 25,
          });
        }
      }
      // Non-food resources: sell surplus
      else if (amount > 50) {
        const surplus = amount - 30; // Keep 30 as buffer
        this.sellOffers.push({
          settlementId: this.settlementId,
          material: type,
          quantity: Math.floor(surplus * 0.5),
          pricePerUnit: this.getPrice(type),
          offerType: "sell",
          priority: 30,
        });
      }
    }
  }
  
  /**
   * Update prices based on supply and demand
   */
  private updatePrices(): void {
    // Update prices for all materials we track
    const allMaterials = new Set<MaterialType>();
    
    for (const offer of this.buyOffers) {
      allMaterials.add(offer.material);
    }
    for (const offer of this.sellOffers) {
      allMaterials.add(offer.material);
    }
    
    for (const material of allMaterials) {
      const supply = this.sellOffers
        .filter(o => o.material === material)
        .reduce((sum, o) => sum + o.quantity, 0);
      
      const demand = this.buyOffers
        .filter(o => o.material === material)
        .reduce((sum, o) => sum + o.quantity, 0);
      
      const basePrice = BASE_PRICES[material] || 1;
      const currentPrice = this.calculatePrice(basePrice, supply, demand);
      
      this.prices.set(material, {
        material,
        supply,
        demand,
        basePrice,
        currentPrice,
      });
    }
  }
  
  /**
   * Calculate price based on supply/demand ratio
   */
  private calculatePrice(basePrice: number, supply: number, demand: number): number {
    if (supply === 0 && demand === 0) return basePrice;
    
    const ratio = demand / Math.max(1, supply);
    
    if (ratio > 3) return basePrice * 2.0; // Very high demand
    if (ratio > 2) return basePrice * 1.5;
    if (ratio > 1) return basePrice * 1.2;
    if (ratio < 0.3) return basePrice * 0.5; // Very low demand
    if (ratio < 0.5) return basePrice * 0.7;
    
    return basePrice;
  }
  
  /**
   * Get current price for a material
   */
  getPrice(material: MaterialType): number {
    const priceInfo = this.prices.get(material);
    return priceInfo ? priceInfo.currentPrice : (BASE_PRICES[material] || 1);
  }
  
  /**
   * Get all buy offers
   */
  getBuyOffers(): TradeOffer[] {
    return [...this.buyOffers];
  }
  
  /**
   * Get all sell offers
   */
  getSellOffers(): TradeOffer[] {
    return [...this.sellOffers];
  }
  
  /**
   * Check if material is food
   */
  private isFood(material: MaterialType): boolean {
    return material === GoodType.Bread || 
           material === GoodType.Meat || 
           material === GoodType.PreparedFish ||
           material === GoodType.CookedVegetables;
  }
}

/**
 * Global market managing all settlements
 */
export class GlobalMarket {
  private markets: Map<number, SettlementMarket>;
  
  constructor() {
    this.markets = new Map();
  }
  
  /**
   * Get or create market for a settlement
   */
  getOrCreateMarket(settlementId: number): SettlementMarket {
    let market = this.markets.get(settlementId);
    if (!market) {
      market = new SettlementMarket(settlementId);
      this.markets.set(settlementId, market);
    }
    return market;
  }
  
  /**
   * Get market for a settlement
   */
  getMarket(settlementId: number): SettlementMarket | undefined {
    return this.markets.get(settlementId);
  }
  
  /**
   * Get all markets
   */
  getAllMarkets(): Map<number, SettlementMarket> {
    return this.markets;
  }
}
