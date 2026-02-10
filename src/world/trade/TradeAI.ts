import { Trader, TradeContract, generateTraderId } from "./Trader";
import { GlobalMarket, TradeOffer } from "./Market";
import { TradeRouteManager } from "./TradeRoutes";
import { HexTile } from "../HexTile";
import { Grid } from "honeycomb-grid";
import { SettlementEconomy } from "../SettlementEconomy";
import { GoodType } from "../Goods";
import { ResourceType } from "../Resource";

/**
 * Trade opportunity analysis
 */
interface TradeOpportunity {
  buyOffer: TradeOffer;
  sellOffer: TradeOffer;
  distance: number;
  grossProfit: number;
  netProfit: number; // After transport costs
  profitPerTile: number;
  priority: number;
}

/**
 * AI system for trader decision making
 */
export class TradeAI {
  private routeManager: TradeRouteManager;
  
  constructor(routeManager: TradeRouteManager) {
    this.routeManager = routeManager;
  }
  
  /**
   * Find all profitable trade opportunities
   */
  findTradeOpportunities(market: GlobalMarket): TradeOpportunity[] {
    const opportunities: TradeOpportunity[] = [];
    const markets = market.getAllMarkets();
    
    // Get all buy and sell offers
    const allBuyOffers: TradeOffer[] = [];
    const allSellOffers: TradeOffer[] = [];
    
    for (const [_, settlementMarket] of markets) {
      allBuyOffers.push(...settlementMarket.getBuyOffers());
      allSellOffers.push(...settlementMarket.getSellOffers());
    }
    
    // Match buy orders with sell orders
    for (const buyOffer of allBuyOffers) {
      for (const sellOffer of allSellOffers) {
        // Skip if same settlement
        if (buyOffer.settlementId === sellOffer.settlementId) continue;
        
        // Skip if different materials
        if (buyOffer.material !== sellOffer.material) continue;
        
        // Calculate opportunity
        const opportunity = this.analyzeOpportunity(buyOffer, sellOffer);
        if (opportunity) {
          // Accept all opportunities with priority >= 85 (critical needs)
          // Or profitable opportunities (netProfit > 0)
          const isCritical = opportunity.priority >= 85;
          if (isCritical || opportunity.netProfit > 0) {
            opportunities.push(opportunity);
          }
        }
      }
    }
    
    // Sort by priority (critical needs first), then profit per tile
    // CRITICAL trades (priority >= 85) always go first, even if unprofitable
    opportunities.sort((a, b) => {
      const aCritical = a.priority >= 85;
      const bCritical = b.priority >= 85;
      
      if (aCritical && !bCritical) return -1;
      if (!aCritical && bCritical) return 1;
      
      // Both critical or both non-critical: sort by priority first
      if (Math.abs(a.priority - b.priority) > 10) {
        return b.priority - a.priority; // Higher priority first
      }
      
      // Similar priority: sort by efficiency
      return b.profitPerTile - a.profitPerTile;
    });
    
    return opportunities;
  }
  
  /**
   * Analyze a potential trade opportunity
   */
  private analyzeOpportunity(
    buyOffer: TradeOffer,
    sellOffer: TradeOffer
  ): TradeOpportunity | null {
    // Get distance
    const distance = this.routeManager.getDistance(
      sellOffer.settlementId,
      buyOffer.settlementId
    );
    
    if (distance === Infinity) return null;
    
    // Calculate quantity (limited by sell offer and buy demand)
    const quantity = Math.min(sellOffer.quantity, buyOffer.quantity);
    
    // Calculate gross profit
    const revenue = buyOffer.pricePerUnit * quantity;
    const cost = sellOffer.pricePerUnit * quantity;
    const grossProfit = revenue - cost;
    
    // Transport cost: 1 gold per 10 tiles
    const transportCost = Math.ceil(distance / 10);
    const netProfit = grossProfit - transportCost;
    const profitPerTile = netProfit / distance;
    
    // Priority is average of buy and sell priorities
    const priority = (buyOffer.priority + sellOffer.priority) / 2;
    
    return {
      buyOffer,
      sellOffer,
      distance,
      grossProfit,
      netProfit,
      profitPerTile,
      priority,
    };
  }
  
  /**
   * Select best trade for a specific trader
   */
  selectBestTrade(
    trader: Trader,
    opportunities: TradeOpportunity[]
  ): TradeContract | null {
    for (const opp of opportunities) {
      // Check if trader can afford it
      const totalCost = opp.sellOffer.pricePerUnit * opp.sellOffer.quantity;
      if (totalCost > trader.money) continue;
      
      // For CRITICAL trades (priority >= 85), accept even if unprofitable
      // This ensures food gets to starving settlements
      const isCritical = opp.priority >= 85;
      
      // Check if trader can carry it
      if (opp.sellOffer.quantity > trader.inventory.capacity) {
        // Reduce quantity to fit
        const quantity = trader.inventory.capacity;
        const adjustedRevenue = opp.buyOffer.pricePerUnit * quantity;
        const adjustedCost = opp.sellOffer.pricePerUnit * quantity;
        const adjustedProfit = adjustedRevenue - adjustedCost - Math.ceil(opp.distance / 10);
        
        // Accept critical trades even if unprofitable (but not at huge loss)
        if (!isCritical && adjustedProfit <= 0) continue;
        if (isCritical && adjustedProfit < -10) continue; // Small loss acceptable for critical
        
        return {
          id: this.generateContractId(),
          fromSettlement: opp.sellOffer.settlementId,
          toSettlement: opp.buyOffer.settlementId,
          material: opp.buyOffer.material,
          quantity,
          buyPrice: opp.sellOffer.pricePerUnit,
          sellPrice: opp.buyOffer.pricePerUnit,
          profit: adjustedProfit,
          priority: opp.priority,
        };
      }
      
      // Accept critical trades even if slightly unprofitable
      if (!isCritical && opp.netProfit <= 0) continue;
      if (isCritical && opp.netProfit < -10) continue;
      
      // Good trade, create contract
      return {
        id: this.generateContractId(),
        fromSettlement: opp.sellOffer.settlementId,
        toSettlement: opp.buyOffer.settlementId,
        material: opp.buyOffer.material,
        quantity: Math.min(opp.sellOffer.quantity, opp.buyOffer.quantity),
        buyPrice: opp.sellOffer.pricePerUnit,
        sellPrice: opp.buyOffer.pricePerUnit,
        profit: opp.netProfit,
        priority: opp.priority,
      };
    }
    
    return null;
  }
  
  /**
   * Execute buy transaction
   */
  buyGoods(
    trader: Trader,
    economy: SettlementEconomy,
    contract: TradeContract
  ): boolean {
    const totalCost = contract.buyPrice * contract.quantity;
    
    // Check if trader can afford it
    if (trader.money < totalCost) return false;
    
    // Check if settlement has the goods
    const material = contract.material;
    const available = this.getMaterialAmount(economy, material);
    
    if (available < contract.quantity) {
      // Adjust quantity if not enough available
      contract.quantity = available;
      if (contract.quantity === 0) return false;
    }
    
    // Remove from settlement
    if (!this.removeMaterial(economy, material, contract.quantity)) {
      return false;
    }
    
    // Add to trader inventory
    if (!trader.addMaterial(material, contract.quantity)) {
      // Failed to add, refund to settlement
      this.addMaterial(economy, material, contract.quantity);
      return false;
    }
    
    // Pay for goods - money goes from trader to settlement treasury
    trader.money -= totalCost;
    economy.addMoney(totalCost); // Settlement receives payment
    
    console.log(`[Trade] ${trader.name} bought ${contract.quantity} ${material} for ${totalCost}g at settlement ${contract.fromSettlement} (settlement treasury: ${economy.getTreasury()}g)`);
    
    return true;
  }
  
  /**
   * Execute sell transaction
   */
  sellGoods(
    trader: Trader,
    economy: SettlementEconomy,
    contract: TradeContract
  ): boolean {
    const material = contract.material;
    
    // Remove from trader inventory
    if (!trader.removeMaterial(material, contract.quantity)) {
      return false;
    }
    
    // Add to settlement
    this.addMaterial(economy, material, contract.quantity);
    
    // Receive payment from settlement treasury
    const revenue = contract.sellPrice * contract.quantity;
    
    // Check if settlement can afford it
    if (!economy.hasMoney(revenue)) {
      // Settlement can't afford to pay - trader delivers anyway (humanitarian aid)
      console.log(`[Trade] ${trader.name} delivered ${contract.quantity} ${material} to settlement ${contract.toSettlement} (UNPAID - treasury empty, contract value: ${revenue}g)`);
      // Trader still gets paid what they spent at origin (no loss, no profit)
      const breakEven = contract.buyPrice * contract.quantity;
      trader.money += breakEven;
      return true;
    }
    
    // Settlement pays trader from treasury
    economy.removeMoney(revenue);
    trader.money += revenue;
    trader.totalProfitEarned += contract.profit;
    
    console.log(`[Trade] ${trader.name} sold ${contract.quantity} ${material} for ${revenue}g at settlement ${contract.toSettlement} (profit: ${contract.profit}g, settlement treasury: ${economy.getTreasury()}g)`);
    
    return true;
  }
  
  /**
   * Get amount of material in economy
   */
  private getMaterialAmount(economy: SettlementEconomy, material: string): number {
    // Check if it's a Good
    if (Object.values(GoodType).includes(material as GoodType)) {
      return economy.getGoodAmount(material as GoodType);
    }
    // Check if it's a Resource
    if (Object.values(ResourceType).includes(material as ResourceType)) {
      return economy.getResourceAmount(material as ResourceType);
    }
    return 0;
  }
  
  /**
   * Remove material from economy
   */
  private removeMaterial(economy: SettlementEconomy, material: string, amount: number): boolean {
    if (Object.values(GoodType).includes(material as GoodType)) {
      return economy.removeGood(material as GoodType, amount);
    }
    if (Object.values(ResourceType).includes(material as ResourceType)) {
      return economy.removeResource(material as ResourceType, amount);
    }
    return false;
  }
  
  /**
   * Add material to economy
   */
  private addMaterial(economy: SettlementEconomy, material: string, amount: number): boolean {
    if (Object.values(GoodType).includes(material as GoodType)) {
      return economy.addGood(material as GoodType, amount);
    }
    if (Object.values(ResourceType).includes(material as ResourceType)) {
      return economy.addResource(material as ResourceType, amount);
    }
    return false;
  }
  
  /**
   * Generate unique contract ID
   */
  private contractIdCounter = 0;
  private generateContractId(): string {
    this.contractIdCounter++;
    return `contract_${this.contractIdCounter}_${Date.now()}`;
  }
}
