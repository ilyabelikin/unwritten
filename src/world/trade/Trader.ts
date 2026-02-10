import { HexTile } from "../HexTile";
import { ResourceType } from "../Resource";
import { GoodType } from "../Goods";

/**
 * Material type can be either a Resource or a Good
 */
export type MaterialType = ResourceType | GoodType;

/**
 * Trader's cargo inventory
 */
export interface TraderInventory {
  goods: Map<GoodType, number>;
  resources: Map<ResourceType, number>;
  capacity: number; // Max carrying capacity
}

/**
 * Trade contract that a trader is fulfilling
 */
export interface TradeContract {
  id: string;
  fromSettlement: number; // Settlement index to buy from
  toSettlement: number; // Settlement index to sell to
  material: MaterialType; // What to trade
  quantity: number; // How much
  buyPrice: number; // Price paid at origin
  sellPrice: number; // Price expected at destination
  profit: number; // Expected profit
  priority: number; // Higher = more urgent (0-100)
}

/**
 * Trader state machine
 */
export type TraderState = 
  | "idle" 
  | "traveling_to_buy" 
  | "buying" 
  | "traveling_to_sell" 
  | "selling"
  | "returning_home";

/**
 * A trader that moves goods between settlements
 */
export class Trader {
  id: string;
  name: string;
  homeSettlement: number; // Settlement they belong to
  
  // Position
  currentTile: HexTile;
  currentSettlement: number | null; // null if traveling
  
  // Movement (AP-based like player character)
  path: HexTile[];
  ap: number; // Action points (4 per turn, like player)
  maxAP: number; // Maximum AP (4)
  
  // Trade
  inventory: TraderInventory;
  currentContract: TradeContract | null;
  money: number; // Gold for buying goods
  totalProfitEarned: number; // Lifetime profit
  
  // State
  state: TraderState;
  
  // Population link
  personId: string; // Links to Person entity
  
  // Skills
  tradingSkill: number; // 0-100, affects profit margins and capacity
  
  constructor(
    id: string,
    name: string,
    homeSettlement: number,
    startTile: HexTile,
    personId: string,
    tradingSkill: number = 0,
    startingCapital: number = 100 // Money provided by settlement treasury
  ) {
    this.id = id;
    this.name = name;
    this.homeSettlement = homeSettlement;
    this.currentTile = startTile;
    this.currentSettlement = homeSettlement;
    this.path = [];
    this.maxAP = 4; // Same as player character
    this.ap = this.maxAP;
    this.inventory = {
      goods: new Map(),
      resources: new Map(),
      capacity: this.calculateCapacity(tradingSkill),
    };
    this.currentContract = null;
    this.money = startingCapital; // Starting capital from settlement treasury
    this.totalProfitEarned = 0;
    this.state = "idle";
    this.personId = personId;
    this.tradingSkill = tradingSkill;
  }
  
  /**
   * Calculate carrying capacity based on skill
   */
  private calculateCapacity(skill: number): number {
    // Base 150, up to 300 at max skill (100 skill = +150)
    return 150 + Math.floor(skill * 1.5);
  }
  
  /**
   * Get current cargo weight
   */
  getCurrentLoad(): number {
    let total = 0;
    for (const amount of this.inventory.goods.values()) {
      total += amount;
    }
    for (const amount of this.inventory.resources.values()) {
      total += amount;
    }
    return total;
  }
  
  /**
   * Check if can carry more
   */
  canCarry(amount: number): boolean {
    return this.getCurrentLoad() + amount <= this.inventory.capacity;
  }
  
  /**
   * Add material to inventory
   */
  addMaterial(material: MaterialType, amount: number): boolean {
    if (!this.canCarry(amount)) return false;
    
    // Check if it's a Good or Resource
    if (Object.values(GoodType).includes(material as GoodType)) {
      const goodType = material as GoodType;
      const current = this.inventory.goods.get(goodType) || 0;
      this.inventory.goods.set(goodType, current + amount);
    } else {
      const resourceType = material as ResourceType;
      const current = this.inventory.resources.get(resourceType) || 0;
      this.inventory.resources.set(resourceType, current + amount);
    }
    
    return true;
  }
  
  /**
   * Remove material from inventory
   */
  removeMaterial(material: MaterialType, amount: number): boolean {
    if (Object.values(GoodType).includes(material as GoodType)) {
      const goodType = material as GoodType;
      const current = this.inventory.goods.get(goodType) || 0;
      if (current < amount) return false;
      this.inventory.goods.set(goodType, current - amount);
    } else {
      const resourceType = material as ResourceType;
      const current = this.inventory.resources.get(resourceType) || 0;
      if (current < amount) return false;
      this.inventory.resources.set(resourceType, current - amount);
    }
    
    return true;
  }
  
  /**
   * Reset AP at the start of a new turn
   */
  resetAP(): void {
    this.ap = this.maxAP;
  }
  
  /**
   * Deduct AP for movement
   */
  spendAP(amount: number): boolean {
    if (amount > this.ap) return false;
    this.ap -= amount;
    return true;
  }
  
  /**
   * Clear inventory
   */
  clearInventory(): void {
    this.inventory.goods.clear();
    this.inventory.resources.clear();
  }
}

/**
 * Generate a unique trader ID
 */
let traderIdCounter = 0;
export function generateTraderId(): string {
  traderIdCounter++;
  return `trader_${traderIdCounter}_${Date.now()}`;
}
