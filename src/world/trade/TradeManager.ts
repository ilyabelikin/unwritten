import { Trader, generateTraderId } from "./Trader";
import { GlobalMarket } from "./Market";
import { TradeRouteManager, TradeRoute } from "./TradeRoutes";
import { TradeAI } from "./TradeAI";
import { HexTile } from "../HexTile";
import { Grid } from "honeycomb-grid";
import { Settlement, BuildingType } from "../Building";
import { SettlementEconomy, EconomyManager } from "../SettlementEconomy";
import { GlobalPopulationManager } from "../population/PopulationManager";
import { Person, JobType } from "../population/Person";
import { createPerson } from "../population/LifeSimulation";
import { getAPCost } from "../Terrain";

/**
 * Manages all traders and coordinates trade system
 */
export class TradeManager {
  private traders: Map<string, Trader>;
  private globalMarket: GlobalMarket;
  private routeManager: TradeRouteManager;
  private tradeAI: TradeAI;
  private grid: Grid<HexTile>;
  private settlements: Settlement[];
  
  constructor(grid: Grid<HexTile>, settlements: Settlement[]) {
    this.traders = new Map();
    this.globalMarket = new GlobalMarket();
    this.routeManager = new TradeRouteManager(grid, settlements);
    this.tradeAI = new TradeAI(this.routeManager);
    this.grid = grid;
    this.settlements = settlements;
  }
  
  /**
   * Process all traders for one turn
   */
  processTurn(
    economyManager: EconomyManager,
    populationManager: GlobalPopulationManager
  ): void {
    // 1. Update all markets
    this.updateMarkets(economyManager, populationManager);
    
    // 2. Find trade opportunities
    const opportunities = this.tradeAI.findTradeOpportunities(this.globalMarket);
    
    // 3. Create new traders if needed
    this.spawnTraders(economyManager, populationManager, opportunities.length > 0);
    
    // 4. Process each trader
    for (const trader of this.traders.values()) {
      this.processTrader(trader, economyManager, opportunities);
    }
    
    // 5. Clean up dead/retired traders
    this.cleanupTraders(populationManager, economyManager);
  }
  
  /**
   * Update all settlement markets
   */
  private updateMarkets(
    economyManager: EconomyManager,
    populationManager: GlobalPopulationManager
  ): void {
    for (let i = 0; i < this.settlements.length; i++) {
      const economy = economyManager.getEconomy(i);
      const population = populationManager.getPopulation(i);
      
      if (economy && population) {
        // Get buildings for this settlement
        const settlement = this.settlements[i];
        const buildings: BuildingType[] = [];
        for (const tile of settlement.tiles) {
          const hexTile = this.grid.getHex(tile);
          if (hexTile && hexTile.building !== BuildingType.None) {
            buildings.push(hexTile.building);
          }
        }
        
        const market = this.globalMarket.getOrCreateMarket(i);
        market.update(economy, population, buildings);
      }
    }
  }
  
  /**
   * Spawn new traders if settlements need them
   * Traders spawn from ANY settlement center based on economic need
   */
  private spawnTraders(
    economyManager: EconomyManager,
    populationManager: GlobalPopulationManager,
    opportunitiesExist: boolean
  ): void {
    if (!opportunitiesExist) return; // No point creating traders if no work
    
    for (let i = 0; i < this.settlements.length; i++) {
      const settlement = this.settlements[i];
      const population = populationManager.getPopulation(i);
      const economy = economyManager.getEconomy(i);
      
      if (!population || !economy) continue;
      
      // Count existing traders from this settlement
      const existingTraders = Array.from(this.traders.values())
        .filter(t => t.homeSettlement === i);
      
      // Determine if settlement needs traders based on economic health
      const market = this.globalMarket.getMarket(i);
      const hasUrgentNeeds = market ? this.hasUrgentEconomicNeeds(market, population) : false;
      const hasSurplus = market ? this.hasSurplusToSell(market) : false;
      
      // Base max traders on settlement size
      let maxTraders = settlement.type === "city" ? 3 : 
                       settlement.type === "village" ? 2 : 1;
      
      // Increase trader capacity if settlement is in crisis or has major surplus
      if (hasUrgentNeeds) {
        maxTraders += 2; // Emergency: spawn extra traders to help
      } else if (hasSurplus) {
        maxTraders += 1; // Extra trader to sell surplus
      }
      
      if (existingTraders.length >= maxTraders) continue;
      
      // Try to recruit an unemployed person
      const unemployed = population.getUnemployed();
      if (unemployed.length === 0) continue;
      
      // Pick someone with merchant skill, or random
      const candidates = unemployed.sort((a, b) => 
        (b.skills[JobType.Merchant] || 0) - (a.skills[JobType.Merchant] || 0)
      );
      
      const person = candidates[0];
      const startTile = this.grid.getHex(settlement.center);
      
      if (!startTile) continue;
      
      // Calculate starting capital based on settlement type and urgency
      let startingCapital = 50; // Base amount
      if (settlement.type === "city") startingCapital = 150;
      else if (settlement.type === "village") startingCapital = 100;
      
      // Emergency traders get more money to help faster
      if (hasUrgentNeeds) {
        startingCapital *= 2; // Double money for emergency traders
      }
      
      // Check if settlement treasury has enough money
      if (!economy.hasMoney(startingCapital)) {
        // Not enough money to fund trader
        console.log(`[Trade] Settlement ${i} wants to create trader but treasury insufficient (has ${economy.getTreasury()}g, needs ${startingCapital}g)`);
        continue;
      }
      
      // Withdraw money from settlement treasury
      economy.removeMoney(startingCapital);
      
      // Create trader with money from treasury
      const trader = new Trader(
        generateTraderId(),
        person.name,
        i,
        startTile,
        person.id,
        person.skills[JobType.Merchant] || 0,
        startingCapital // Give trader the money from treasury
      );
      
      // Update person's job
      person.currentJob = JobType.Merchant;
      
      this.traders.set(trader.id, trader);
      
      const reason = hasUrgentNeeds ? "(URGENT NEEDS)" : hasSurplus ? "(SURPLUS)" : "";
      console.log(`[Trade] Created trader ${trader.name} at settlement ${i} ${reason} with ${startingCapital}g from treasury (treasury now: ${economy.getTreasury()}g)`);
    }
  }
  
  /**
   * Check if settlement has urgent economic needs
   */
  private hasUrgentEconomicNeeds(market: any, population: any): boolean {
    const buyOffers = market.getBuyOffers();
    
    // Check for high-priority buy offers (critical needs)
    const criticalOffers = buyOffers.filter((o: any) => o.priority >= 85);
    if (criticalOffers.length > 0) {
      return true;
    }
    
    // Check population health
    const avgHealth = population.getAverageHealth();
    const avgHunger = population.getAverageHunger();
    
    // REVERSED SCALE: 0 = not hungry, 100 = starving
    if (avgHealth < 60 || avgHunger > 40) {
      return true; // Population is struggling
    }
    
    return false;
  }
  
  /**
   * Check if settlement has significant surplus to sell
   */
  private hasSurplusToSell(market: any): boolean {
    const sellOffers = market.getSellOffers();
    
    // Check for large quantities of goods to sell
    const totalSurplus = sellOffers.reduce((sum: number, o: any) => sum + o.quantity, 0);
    
    return totalSurplus > 100; // Has significant surplus
  }
  
  /**
   * Process a single trader's AI
   */
  private processTrader(
    trader: Trader,
    economyManager: EconomyManager,
    opportunities: any[]
  ): void {
    // Reset AP at start of turn (like player character)
    trader.resetAP();
    
    switch (trader.state) {
      case "idle":
        this.handleIdleTrader(trader, opportunities);
        break;
        
      case "traveling_to_buy":
        this.handleTravelingToBuy(trader);
        break;
        
      case "buying":
        this.handleBuying(trader, economyManager);
        break;
        
      case "traveling_to_sell":
        this.handleTravelingToSell(trader);
        break;
        
      case "selling":
        this.handleSelling(trader, economyManager);
        break;
        
      case "returning_home":
        this.handleReturningHome(trader, economyManager);
        break;
    }
  }
  
  /**
   * Handle idle trader - find new contract
   */
  private handleIdleTrader(trader: Trader, opportunities: any[]): void {
    const contract = this.tradeAI.selectBestTrade(trader, opportunities);
    
    if (contract) {
      trader.currentContract = contract;
      trader.state = "traveling_to_buy";
      
      // Get route to source settlement
      const route = this.routeManager.getRoute(trader.homeSettlement, contract.fromSettlement);
      if (route) {
        trader.path = [...route.path];
      }
      
      console.log(`[Trade] ${trader.name} accepted contract: ${contract.quantity} ${contract.material} from ${contract.fromSettlement} to ${contract.toSettlement} (profit: ${contract.profit}g)`);
    }
  }
  
  /**
   * Handle trader traveling to buy goods (AP-based movement)
   */
  private handleTravelingToBuy(trader: Trader): void {
    if (trader.path.length === 0 || !trader.currentContract) {
      trader.state = "buying";
      return;
    }
    
    // Move along path using AP (like player character)
    while (trader.path.length > 0 && trader.ap > 0) {
      const nextTile = trader.path[0];
      
      // Calculate AP cost for this move
      const cost = getAPCost(
        nextTile.hasRoad,
        nextTile.isRough,
        nextTile.treeDensity,
        trader.currentTile.terrain,
        nextTile.terrain,
        false // Traders don't embark on water (yet)
      );
      
      // Check if we have enough AP
      if (cost > trader.ap) {
        break; // Out of AP, continue next turn
      }
      
      // Move to next tile
      trader.spendAP(cost);
      trader.currentTile = trader.path.shift()!;
    }
    
    // Arrived?
    if (trader.path.length === 0) {
      trader.currentSettlement = trader.currentContract.fromSettlement;
      trader.state = "buying";
    }
  }
  
  /**
   * Handle buying goods
   */
  private handleBuying(trader: Trader, economyManager: EconomyManager): void {
    if (!trader.currentContract) {
      trader.state = "idle";
      return;
    }
    
    const economy = economyManager.getEconomy(trader.currentContract.fromSettlement);
    if (!economy) {
      trader.state = "idle";
      trader.currentContract = null;
      return;
    }
    
    // Execute purchase
    const success = this.tradeAI.buyGoods(trader, economy, trader.currentContract);
    
    if (success) {
      trader.state = "traveling_to_sell";
      
      // Get route to destination
      const route = this.routeManager.getRoute(
        trader.currentContract.fromSettlement,
        trader.currentContract.toSettlement
      );
      
      if (route) {
        trader.path = [...route.path];
      }
    } else {
      // Deal fell through
      console.log(`[Trade] ${trader.name} failed to buy goods at settlement ${trader.currentContract.fromSettlement}`);
      trader.state = "returning_home";
      trader.currentContract = null;
    }
  }
  
  /**
   * Handle trader traveling to sell goods (AP-based movement)
   */
  private handleTravelingToSell(trader: Trader): void {
    if (trader.path.length === 0 || !trader.currentContract) {
      trader.state = "selling";
      return;
    }
    
    // Move along path using AP (like player character)
    while (trader.path.length > 0 && trader.ap > 0) {
      const nextTile = trader.path[0];
      
      // Calculate AP cost for this move
      const cost = getAPCost(
        nextTile.hasRoad,
        nextTile.isRough,
        nextTile.treeDensity,
        trader.currentTile.terrain,
        nextTile.terrain,
        false // Traders don't embark on water (yet)
      );
      
      // Check if we have enough AP
      if (cost > trader.ap) {
        break; // Out of AP, continue next turn
      }
      
      // Move to next tile
      trader.spendAP(cost);
      trader.currentTile = trader.path.shift()!;
    }
    
    // Arrived?
    if (trader.path.length === 0) {
      trader.currentSettlement = trader.currentContract.toSettlement;
      trader.state = "selling";
    }
  }
  
  /**
   * Handle selling goods
   */
  private handleSelling(trader: Trader, economyManager: EconomyManager): void {
    if (!trader.currentContract) {
      trader.state = "idle";
      return;
    }
    
    const economy = economyManager.getEconomy(trader.currentContract.toSettlement);
    if (!economy) {
      trader.state = "returning_home";
      trader.currentContract = null;
      return;
    }
    
    // Execute sale
    const success = this.tradeAI.sellGoods(trader, economy, trader.currentContract);
    
    // Contract complete
    trader.currentContract = null;
    
    // If at home settlement, go idle, otherwise return home
    if (trader.currentSettlement === trader.homeSettlement) {
      trader.state = "idle";
    } else {
      trader.state = "returning_home";
      const route = this.routeManager.getRoute(trader.currentSettlement!, trader.homeSettlement);
      if (route) {
        trader.path = [...route.path];
      }
    }
  }
  
  /**
   * Handle trader returning home (AP-based movement)
   */
  private handleReturningHome(trader: Trader, economyManager: EconomyManager): void {
    if (trader.path.length === 0) {
      trader.currentSettlement = trader.homeSettlement;
      trader.state = "idle";
      return;
    }
    
    // Move along path using AP (like player character)
    while (trader.path.length > 0 && trader.ap > 0) {
      const nextTile = trader.path[0];
      
      // Calculate AP cost for this move
      const cost = getAPCost(
        nextTile.hasRoad,
        nextTile.isRough,
        nextTile.treeDensity,
        trader.currentTile.terrain,
        nextTile.terrain,
        false // Traders don't embark on water (yet)
      );
      
      // Check if we have enough AP
      if (cost > trader.ap) {
        break; // Out of AP, continue next turn
      }
      
      // Move to next tile
      trader.spendAP(cost);
      trader.currentTile = trader.path.shift()!;
    }
    
    // Arrived home?
    if (trader.path.length === 0) {
      trader.currentSettlement = trader.homeSettlement;
      trader.state = "idle";
      
      // Return profits to settlement treasury
      // Keep base operating capital, deposit the rest
      const baseCapital = 50; // Minimum working capital
      if (trader.money > baseCapital) {
        const profit = trader.money - baseCapital;
        const economy = economyManager.getEconomy(trader.homeSettlement);
        if (economy) {
          economy.addMoney(profit);
          console.log(`[Trade] ${trader.name} returned home and deposited ${profit}g to settlement ${trader.homeSettlement} treasury (kept ${baseCapital}g for next trade)`);
          trader.money = baseCapital;
        }
      }
    }
  }
  
  /**
   * Clean up traders whose person died or retired
   */
  private cleanupTraders(populationManager: GlobalPopulationManager, economyManager: EconomyManager): void {
    const tradersToRemove: string[] = [];
    
    for (const [id, trader] of this.traders) {
      const population = populationManager.getPopulation(trader.homeSettlement);
      if (!population) {
        tradersToRemove.push(id);
        continue;
      }
      
      const person = population.getPerson(trader.personId);
      if (!person) {
        // Person died - return their money to settlement treasury
        const economy = economyManager.getEconomy(trader.homeSettlement);
        if (economy && trader.money > 0) {
          economy.addMoney(trader.money);
          console.log(`[Trade] Trader ${trader.name} died - ${trader.money}g returned to settlement ${trader.homeSettlement} treasury`);
        } else {
          console.log(`[Trade] Trader ${trader.name} died`);
        }
        tradersToRemove.push(id);
      }
    }
    
    for (const id of tradersToRemove) {
      this.traders.delete(id);
    }
  }
  
  /**
   * Get all traders
   */
  getAllTraders(): Trader[] {
    return Array.from(this.traders.values());
  }
  
  /**
   * Get traders for a settlement
   */
  getTradersForSettlement(settlementId: number): Trader[] {
    return Array.from(this.traders.values())
      .filter(t => t.homeSettlement === settlementId);
  }
  
  /**
   * Get global market
   */
  getGlobalMarket(): GlobalMarket {
    return this.globalMarket;
  }
}
