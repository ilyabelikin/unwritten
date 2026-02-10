import { Grid } from "honeycomb-grid";
import { HexTile } from "./HexTile";
import { Settlement, isHousingBuilding, BuildingType } from "./Building";
import { SettlementEconomy } from "./SettlementEconomy";
import { GoodType } from "./Goods";
import { ResourceType } from "./Resource";

/**
 * Resource costs for housing density upgrades
 * Higher density levels cost more resources
 * Note: Capacity scales 6, 12, 18, 24, 30 people per density level
 */
export const HOUSING_UPGRADE_COSTS: Record<number, { timber?: number; stone?: number; bricks?: number }> = {
  1: {}, // Density 1 is free (basic family home - 6 people)
  2: { timber: 15, stone: 5 }, // Density 2: Larger house - 12 people
  3: { timber: 25, stone: 10, bricks: 5 }, // Density 3: Small apartment - 18 people
  4: { timber: 40, stone: 20, bricks: 10 }, // Density 4: Multi-story - 24 people
  5: { timber: 60, stone: 30, bricks: 20 }, // Density 5: Dense tenement - 30 people
};

/**
 * Manages automatic housing density upgrades for settlements
 * As population grows, housing tiles can upgrade from density 1 → 5
 * Capacity: 6 → 12 → 18 → 24 → 30 people per tile
 */
export class HousingUpgradeSystem {
  /**
   * Check and upgrade housing density for a settlement if overcrowded
   * 
   * @param economy - Settlement economy (for resource consumption)
   * @returns Number of tiles upgraded
   */
  upgradeHousingIfNeeded(
    grid: Grid<HexTile>,
    settlement: Settlement,
    currentPopulation: number,
    currentCapacity: number,
    economy: SettlementEconomy
  ): number {
    // Calculate overcrowding ratio
    const utilizationRate = currentCapacity > 0 ? currentPopulation / currentCapacity : 1.0;
    
    // Only upgrade if we're at 90%+ capacity (approaching overcrowding)
    if (utilizationRate < 0.9) {
      return 0; // Not overcrowded, no need to upgrade
    }
    
    // Find housing tiles that can be upgraded (density < 5)
    const upgradableTiles: HexTile[] = [];
    
    for (const tilePos of settlement.tiles) {
      const tile = grid.getHex({ col: tilePos.col, row: tilePos.row }) as HexTile | undefined;
      if (!tile) continue;
      
      // Only upgrade housing buildings
      if (!isHousingBuilding(tile.building)) continue;
      
      // Only if not already at max density
      if (tile.housingDensity >= 5) continue;
      
      upgradableTiles.push(tile);
    }
    
    if (upgradableTiles.length === 0) {
      return 0; // No tiles can be upgraded (all at max density)
    }
    
    // Upgrade strategy: Upgrade lowest density tiles first (fair distribution)
    upgradableTiles.sort((a, b) => a.housingDensity - b.housingDensity);
    
    // Calculate how many people we need to accommodate
    // Each upgrade adds 6 people (density 1→2 adds 6, 2→3 adds 6, etc.)
    const shortfall = currentPopulation - currentCapacity;
    const tilesToUpgrade = Math.min(
      upgradableTiles.length,
      Math.ceil(shortfall / 6) // Each upgrade adds 6 people capacity
    );
    
    // Upgrade tiles (try to upgrade as many as we can afford)
    let upgraded = 0;
    for (let i = 0; i < tilesToUpgrade; i++) {
      const tile = upgradableTiles[i];
      const currentDensity = tile.housingDensity;
      const targetDensity = Math.min(5, currentDensity + 1);
      
      // Check resource costs for this upgrade
      const costs = HOUSING_UPGRADE_COSTS[targetDensity];
      
      // Check if we can afford this upgrade
      const canAfford = this.canAffordUpgrade(economy, costs);
      
      if (!canAfford) {
        console.log(`  [Housing] Cannot afford upgrade to density ${targetDensity} (need timber:${costs.timber || 0} stone:${costs.stone || 0} bricks:${costs.bricks || 0})`);
        continue; // Try next tile (might be cheaper)
      }
      
      // Consume resources and upgrade
      this.consumeResources(economy, costs);
      tile.housingDensity = targetDensity;
      upgraded++;
      
      console.log(`  [Housing] Upgraded housing tile to density ${targetDensity} (cost: timber:${costs.timber || 0} stone:${costs.stone || 0} bricks:${costs.bricks || 0})`);
    }
    
    return upgraded;
  }
  
  /**
   * Check if economy has enough resources for an upgrade
   */
  private canAffordUpgrade(
    economy: SettlementEconomy,
    costs: { timber?: number; stone?: number; bricks?: number }
  ): boolean {
    if (costs.timber && economy.getResourceAmount(ResourceType.Timber) < costs.timber) return false;
    if (costs.stone && economy.getResourceAmount(ResourceType.Stone) < costs.stone) return false;
    if (costs.bricks && economy.getGoodAmount(GoodType.Bricks) < costs.bricks) return false;
    return true;
  }
  
  /**
   * Consume resources from economy for an upgrade
   */
  private consumeResources(
    economy: SettlementEconomy,
    costs: { timber?: number; stone?: number; bricks?: number }
  ): void {
    if (costs.timber) economy.removeResource(ResourceType.Timber, costs.timber);
    if (costs.stone) economy.removeResource(ResourceType.Stone, costs.stone);
    if (costs.bricks) economy.removeGood(GoodType.Bricks, costs.bricks);
  }
  
  /**
   * Try to evolve a village into a city if it meets the requirements
   * 
   * @returns true if settlement evolved to city
   */
  tryEvolveToCity(
    grid: Grid<HexTile>,
    settlement: Settlement,
    currentPopulation: number,
    economy: SettlementEconomy
  ): boolean {
    // Only villages can evolve
    if (settlement.type !== "village") return false;
    
    // Requirements for city evolution
    const MIN_POPULATION = 50; // Need significant population
    const MIN_HOUSING_TILES = 10; // Need substantial housing
    const LANDMARK_COST = {
      timber: 100,
      stone: 80,
      bricks: 50,
    };
    
    // Check population requirement
    if (currentPopulation < MIN_POPULATION) return false;
    
    // Count housing tiles
    const housingTiles = settlement.tiles.filter(tilePos => {
      const tile = grid.getHex({ col: tilePos.col, row: tilePos.row }) as HexTile | undefined;
      return tile && isHousingBuilding(tile.building);
    });
    
    if (housingTiles.length < MIN_HOUSING_TILES) return false;
    
    // Check if we can afford landmark construction
    if (!this.canAffordUpgrade(economy, LANDMARK_COST)) {
      console.log(`  [City Evolution] Village has ${currentPopulation} population but lacks resources for landmark (need timber:${LANDMARK_COST.timber} stone:${LANDMARK_COST.stone} bricks:${LANDMARK_COST.bricks})`);
      return false;
    }
    
    // Consume resources and build landmark
    this.consumeResources(economy, LANDMARK_COST);
    
    // Upgrade settlement to city
    settlement.type = "city";
    
    // Choose a landmark based on what the settlement has
    const hasChurch = settlement.tiles.some(tilePos => {
      const tile = grid.getHex({ col: tilePos.col, row: tilePos.row }) as HexTile | undefined;
      return tile?.building === BuildingType.Chapel;
    });
    
    settlement.landmark = hasChurch ? BuildingType.Church : BuildingType.Tower;
    
    // Upgrade existing chapel to church if present
    if (hasChurch) {
      for (const tilePos of settlement.tiles) {
        const tile = grid.getHex({ col: tilePos.col, row: tilePos.row }) as HexTile | undefined;
        if (tile?.building === BuildingType.Chapel) {
          tile.building = BuildingType.Church;
          break; // Only upgrade one
        }
      }
    } else {
      // Place tower on a suitable tile (near center, on a house)
      const centerHouse = settlement.tiles
        .filter(tilePos => {
          const tile = grid.getHex({ col: tilePos.col, row: tilePos.row }) as HexTile | undefined;
          return tile?.building === BuildingType.House;
        })
        .sort((a, b) => {
          const distA = Math.abs(a.col - settlement.center.col) + Math.abs(a.row - settlement.center.row);
          const distB = Math.abs(b.col - settlement.center.col) + Math.abs(b.row - settlement.center.row);
          return distA - distB;
        })[0];
      
      if (centerHouse) {
        const tile = grid.getHex({ col: centerHouse.col, row: centerHouse.row }) as HexTile | undefined;
        if (tile) {
          tile.building = BuildingType.Tower;
        }
      }
    }
    
    console.log(`  [City Evolution] ${settlement.name} evolved from village to city! Built landmark: ${settlement.landmark}`);
    
    return true;
  }
  
  /**
   * Set initial housing density for a settlement based on its type and size
   */
  setInitialDensity(
    grid: Grid<HexTile>,
    settlement: Settlement
  ): void {
    // Determine starting density based on settlement type
    let startingDensity: number;
    
    switch (settlement.type) {
      case "city":
        startingDensity = 3; // Cities start more dense
        break;
      case "village":
        startingDensity = 2; // Villages start moderately dense
        break;
      case "hamlet":
        startingDensity = 1; // Hamlets start sparse
        break;
      default:
        startingDensity = 1;
    }
    
    // Apply starting density to all housing tiles
    for (const tilePos of settlement.tiles) {
      const tile = grid.getHex({ col: tilePos.col, row: tilePos.row }) as HexTile | undefined;
      if (!tile) continue;
      
      if (isHousingBuilding(tile.building)) {
        tile.housingDensity = startingDensity;
      }
    }
  }
}
