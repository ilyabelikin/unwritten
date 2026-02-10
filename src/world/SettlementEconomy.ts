import { ResourceType } from "./Resource";
import { GoodType } from "./Goods";
import { BuildingType } from "./Building";
import { ProductionRecipe, MaterialType, isResource, isGood } from "./ProductionRecipe";
import { Grid } from "honeycomb-grid";
import { HexTile } from "./HexTile";

/**
 * Represents an active production job in a building
 */
export interface ProductionJob {
  recipeId: string;
  buildingTile: { col: number; row: number };
  ticksRemaining: number;
  totalTicks: number;
  productivity: number; // Worker productivity multiplier (affects output)
}

/**
 * Manages the economy for a single settlement
 */
export class SettlementEconomy {
  private settlementId: number;
  private resourceStockpile: Map<ResourceType, number>;
  private goodsStockpile: Map<GoodType, number>;
  private productionQueue: ProductionJob[];
  private storageCapacity: number;
  private treasury: number; // Settlement's money for trade

  constructor(settlementId: number, storageCapacity: number = 10000) {
    this.settlementId = settlementId;
    this.resourceStockpile = new Map();
    this.goodsStockpile = new Map();
    this.productionQueue = [];
    this.storageCapacity = storageCapacity;
    this.treasury = 0; // Will be initialized based on population
    
    // Initialize all stockpiles to 0
    Object.values(ResourceType).forEach(type => {
      this.resourceStockpile.set(type, 0);
    });
    Object.values(GoodType).forEach(type => {
      this.goodsStockpile.set(type, 0);
    });
  }

  /**
   * Get the settlement ID this economy manages
   */
  getSettlementId(): number {
    return this.settlementId;
  }

  /**
   * Get the amount of a resource in storage
   */
  getResourceAmount(type: ResourceType): number {
    return this.resourceStockpile.get(type) || 0;
  }

  /**
   * Get the amount of a good in storage
   */
  getGoodAmount(type: GoodType): number {
    return this.goodsStockpile.get(type) || 0;
  }

  /**
   * Get amount of any material (resource or good)
   */
  getMaterialAmount(type: MaterialType): number {
    if (isResource(type)) {
      return this.getResourceAmount(type);
    } else if (isGood(type)) {
      return this.getGoodAmount(type);
    }
    return 0;
  }

  /**
   * Add resources to the stockpile
   */
  addResource(type: ResourceType, amount: number): boolean {
    const current = this.getResourceAmount(type);
    const newAmount = Math.min(current + amount, this.storageCapacity);
    this.resourceStockpile.set(type, newAmount);
    return newAmount === current + amount; // true if not capped
  }

  /**
   * Add goods to the stockpile
   */
  addGood(type: GoodType, amount: number): boolean {
    const current = this.getGoodAmount(type);
    const newAmount = Math.min(current + amount, this.storageCapacity);
    this.goodsStockpile.set(type, newAmount);
    return newAmount === current + amount; // true if not capped
  }

  /**
   * Remove resources from the stockpile
   */
  removeResource(type: ResourceType, amount: number): boolean {
    const current = this.getResourceAmount(type);
    if (current >= amount) {
      this.resourceStockpile.set(type, current - amount);
      return true;
    }
    return false;
  }

  /**
   * Remove goods from the stockpile
   */
  removeGood(type: GoodType, amount: number): boolean {
    const current = this.getGoodAmount(type);
    if (current >= amount) {
      this.goodsStockpile.set(type, current - amount);
      return true;
    }
    return false;
  }

  /**
   * Remove any material (resource or good) from stockpile
   */
  removeMaterial(type: MaterialType, amount: number): boolean {
    if (isResource(type)) {
      return this.removeResource(type, amount);
    } else if (isGood(type)) {
      return this.removeGood(type, amount);
    }
    return false;
  }

  /**
   * Get the current treasury balance
   */
  getTreasury(): number {
    return this.treasury;
  }

  /**
   * Set the treasury balance (for initialization)
   */
  setTreasury(amount: number): void {
    this.treasury = Math.max(0, amount);
  }

  /**
   * Add money to the treasury
   */
  addMoney(amount: number): void {
    this.treasury += amount;
  }

  /**
   * Remove money from the treasury
   * Returns true if successful, false if insufficient funds
   */
  removeMoney(amount: number): boolean {
    if (this.treasury >= amount) {
      this.treasury -= amount;
      return true;
    }
    return false;
  }

  /**
   * Check if treasury has enough money
   */
  hasMoney(amount: number): boolean {
    return this.treasury >= amount;
  }

  /**
   * Check if the settlement has enough materials to execute a recipe
   */
  canProduce(recipe: ProductionRecipe): boolean {
    for (const input of recipe.inputs) {
      if (this.getMaterialAmount(input.type) < input.quantity) {
        return false;
      }
    }
    return true;
  }

  /**
   * Start production of a recipe if resources are available
   * @param productivity - Worker productivity multiplier (default 1.0)
   */
  startProduction(
    recipe: ProductionRecipe,
    buildingTile: { col: number; row: number },
    productivity: number = 1.0
  ): boolean {
    if (!this.canProduce(recipe)) {
      return false;
    }
    
    // Productivity must be positive (but can be < 1 for low skill workers)
    if (productivity <= 0) {
      return false;
    }

    // Consume inputs
    for (const input of recipe.inputs) {
      if (!this.removeMaterial(input.type, input.quantity)) {
        // This shouldn't happen if canProduce returned true
        console.error(`Failed to consume ${input.type} for recipe ${recipe.id}`);
        return false;
      }
    }

    // Add to production queue
    // Productivity affects production time (higher skill = faster production)
    const adjustedTime = Math.ceil(recipe.productionTime / Math.max(0.5, productivity));
    
    this.productionQueue.push({
      recipeId: recipe.id,
      buildingTile,
      ticksRemaining: adjustedTime,
      totalTicks: adjustedTime,
      productivity,
    });

    return true;
  }

  /**
   * Process one tick of production for all active jobs
   */
  tickProduction(recipe: ProductionRecipe): void {
    const completedJobs: ProductionJob[] = [];

    // Process each job
    for (const job of this.productionQueue) {
      job.ticksRemaining--;
      
      if (job.ticksRemaining <= 0) {
        completedJobs.push(job);
      }
    }

    // Complete finished jobs
    for (const job of completedJobs) {
      this.completeProduction(job, recipe);
    }

    // Remove completed jobs from queue
    this.productionQueue = this.productionQueue.filter(
      job => !completedJobs.includes(job)
    );
  }

  /**
   * Complete a production job and add outputs to stockpile
   * Output quantity is scaled by worker productivity
   */
  private completeProduction(job: ProductionJob, recipe: ProductionRecipe): void {
    // Add outputs to stockpile, scaled by productivity
    for (const output of recipe.outputs) {
      if (isGood(output.type)) {
        // Scale output by productivity (min 50%, max 150%)
        const scaledQuantity = Math.max(1, Math.floor(output.quantity * job.productivity));
        this.addGood(output.type, scaledQuantity);
      }
    }
  }

  /**
   * Get all active production jobs
   */
  getProductionQueue(): ProductionJob[] {
    return [...this.productionQueue];
  }

  /**
   * Get production jobs for a specific building tile
   */
  getProductionForBuilding(col: number, row: number): ProductionJob | undefined {
    return this.productionQueue.find(
      job => job.buildingTile.col === col && job.buildingTile.row === row
    );
  }

  /**
   * Check if a building is currently producing
   */
  isBuildingProducing(col: number, row: number): boolean {
    return this.getProductionForBuilding(col, row) !== undefined;
  }

  /**
   * Get all resources as an array for display
   */
  getAllResources(): Array<{ type: ResourceType; amount: number }> {
    const result: Array<{ type: ResourceType; amount: number }> = [];
    this.resourceStockpile.forEach((amount, type) => {
      if (amount > 0) {
        result.push({ type, amount });
      }
    });
    return result;
  }

  /**
   * Get all goods as an array for display
   */
  getAllGoods(): Array<{ type: GoodType; amount: number }> {
    const result: Array<{ type: GoodType; amount: number }> = [];
    this.goodsStockpile.forEach((amount, type) => {
      if (amount > 0) {
        result.push({ type, amount });
      }
    });
    return result;
  }

  /**
   * Get total storage used
   */
  getTotalStorageUsed(): number {
    let total = 0;
    this.resourceStockpile.forEach(amount => total += amount);
    this.goodsStockpile.forEach(amount => total += amount);
    return total;
  }

  /**
   * Get storage capacity
   */
  getStorageCapacity(): number {
    return this.storageCapacity;
  }

  /**
   * Check if storage is full
   */
  isStorageFull(): boolean {
    return this.getTotalStorageUsed() >= this.storageCapacity;
  }

  /**
   * Get storage usage percentage
   */
  getStorageUsagePercent(): number {
    return (this.getTotalStorageUsed() / this.storageCapacity) * 100;
  }
}

/**
 * Manages all settlement economies in the world
 */
export class EconomyManager {
  private economies: Map<number, SettlementEconomy>;

  constructor() {
    this.economies = new Map();
  }

  /**
   * Create or get an economy for a settlement
   */
  getOrCreateEconomy(settlementId: number): SettlementEconomy {
    let economy = this.economies.get(settlementId);
    if (!economy) {
      economy = new SettlementEconomy(settlementId);
      this.economies.set(settlementId, economy);
    }
    return economy;
  }

  /**
   * Get an economy by settlement ID
   */
  getEconomy(settlementId: number): SettlementEconomy | undefined {
    return this.economies.get(settlementId);
  }

  /**
   * Get all economies
   */
  getAllEconomies(): SettlementEconomy[] {
    return Array.from(this.economies.values());
  }

  /**
   * Remove an economy
   */
  removeEconomy(settlementId: number): void {
    this.economies.delete(settlementId);
  }

  /**
   * Clear all economies
   */
  clear(): void {
    this.economies.clear();
  }
}
