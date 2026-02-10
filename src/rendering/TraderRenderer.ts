import { Container, Graphics, Text } from "pixi.js";
import { Palette } from "./Palette";
import { hexIsoCenter } from "./Isometric";
import { Trader } from "../world/trade/Trader";

/**
 * Renders all traders on the map
 */
export class TraderRenderer {
  readonly container: Container;
  private traderGraphics: Map<string, Graphics>;
  private traderContainers: Map<string, Container>;
  
  constructor() {
    this.container = new Container({ label: "traders" });
    this.traderGraphics = new Map();
    this.traderContainers = new Map();
  }
  
  /**
   * Update renderer with current traders
   */
  update(traders: Trader[]): void {
    // Remove traders that no longer exist
    const currentIds = new Set(traders.map(t => t.id));
    for (const [id, container] of this.traderContainers) {
      if (!currentIds.has(id)) {
        this.container.removeChild(container);
        this.traderGraphics.delete(id);
        this.traderContainers.delete(id);
      }
    }
    
    // Update or create trader graphics
    for (const trader of traders) {
      this.updateTrader(trader);
    }
  }
  
  /**
   * Update a single trader's position and appearance
   */
  private updateTrader(trader: Trader): void {
    let container = this.traderContainers.get(trader.id);
    let graphic = this.traderGraphics.get(trader.id);
    
    // Create if doesn't exist
    if (!container || !graphic) {
      container = new Container({ label: `trader_${trader.id}` });
      graphic = new Graphics();
      
      this.drawTrader(graphic, trader);
      container.addChild(graphic);
      
      // Make container non-interactive so clicks pass through to tiles below
      // Trader info is shown via tooltip when hovering over the tile
      container.eventMode = "none";
      
      this.container.addChild(container);
      this.traderGraphics.set(trader.id, graphic);
      this.traderContainers.set(trader.id, container);
    }
    
    // Update position
    const pos = hexIsoCenter(trader.currentTile);
    container.position.set(pos.x, pos.y);
    
    // Update appearance based on state
    graphic.clear();
    this.drawTrader(graphic, trader);
  }
  
  /**
   * Draw a trader sprite
   */
  private drawTrader(g: Graphics, trader: Trader): void {
    // Shadow
    g.ellipse(0, 6, 8, 3);
    g.fill({ color: 0x000000, alpha: 0.3 });
    
    // Body (smaller than player character)
    // Backpack/cargo (brown rectangle)
    g.roundRect(-4, -8, 8, 10, 1);
    g.fill(0x8b4513); // Brown for cargo
    
    // Tunic (merchant colors)
    g.roundRect(-3, -6, 6, 8, 1);
    g.fill(trader.state === "idle" ? 0x4169E1 : 0x2E8B57); // Blue idle, green traveling
    
    // Head
    g.circle(0, -11, 3);
    g.fill(0xFFDBAC); // Skin tone
    
    // Hat (merchant hat)
    g.moveTo(-4, -11);
    g.lineTo(0, -16);
    g.lineTo(4, -11);
    g.fill(0x8b4513); // Brown hat
    
    // Staff/walking stick
    g.moveTo(5, -6);
    g.lineTo(5, 2);
    g.stroke({ color: 0x654321, width: 1 });
    
    // If carrying cargo, show indicator
    if (trader.getCurrentLoad() > 0) {
      g.circle(6, -4, 2);
      g.fill(0xFFD700); // Gold dot for cargo
    }
    
    // State indicator (small dot)
    let stateColor = 0xCCCCCC;
    switch (trader.state) {
      case "idle": stateColor = 0x4169E1; break;
      case "traveling_to_buy": stateColor = 0x32CD32; break;
      case "buying": stateColor = 0xFFD700; break;
      case "traveling_to_sell": stateColor = 0xFF8C00; break;
      case "selling": stateColor = 0x90EE90; break;
      case "returning_home": stateColor = 0x9370DB; break;
    }
    
    g.circle(-6, -10, 2);
    g.fill(stateColor);
  }
  
  /**
   * Clear all traders
   */
  clear(): void {
    for (const container of this.traderContainers.values()) {
      this.container.removeChild(container);
    }
    this.traderGraphics.clear();
    this.traderContainers.clear();
  }
}
