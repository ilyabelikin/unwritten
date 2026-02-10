import { Container, Text, TextStyle, BlurFilter } from "pixi.js";
import { Palette } from "./Palette";
import { hexIsoCenter } from "./Isometric";
import { HexTile } from "../world/HexTile";
import { Settlement } from "../world/Building";
import { Grid } from "honeycomb-grid";

/**
 * Renders settlement names on the map
 */
export class SettlementNameRenderer {
  readonly container: Container;
  private nameTexts: Map<string, Text>;
  
  constructor() {
    this.container = new Container({ label: "settlement_names" });
    this.nameTexts = new Map();
  }
  
  /**
   * Update settlement names
   */
  update(settlements: Settlement[], grid: Grid<HexTile>): void {
    // Clear old names
    for (const text of this.nameTexts.values()) {
      this.container.removeChild(text);
    }
    this.nameTexts.clear();
    
    // Add new names
    for (let i = 0; i < settlements.length; i++) {
      const settlement = settlements[i];
      const centerTile = grid.getHex(settlement.center);
      
      if (!centerTile) continue;
      
      const nameText = this.createNameText(settlement, centerTile);
      const pos = hexIsoCenter(centerTile);
      
      // Position name above the settlement
      const yOffset = settlement.type === "city" ? -40 : 
                     settlement.type === "village" ? -30 : -25;
      nameText.position.set(pos.x, pos.y + yOffset);
      
      // Apply fog of war effect - names show through but are blurred/dimmed
      if (!centerTile.explored) {
        nameText.alpha = 0.4; // Dim for unexplored (heard of it)
        nameText.filters = [new BlurFilter({ strength: 4 })]; // Blur effect
      } else {
        nameText.alpha = 1.0; // Full visibility for explored
        nameText.filters = []; // No blur
      }
      
      this.container.addChild(nameText);
      this.nameTexts.set(`settlement_${i}`, nameText);
    }
  }
  
  /**
   * Create a text element for a settlement name
   */
  private createNameText(settlement: Settlement, centerTile: HexTile): Text {
    const style = new TextStyle({
      fontFamily: "serif",
      fontSize: settlement.type === "city" ? 14 : 
               settlement.type === "village" ? 12 : 10,
      fontWeight: settlement.type === "city" ? "bold" : "normal",
      fill: settlement.type === "city" ? 0xFFD700 : // Gold for cities
            settlement.type === "village" ? 0xFFFFFF : // White for villages
            0xCCCCCC, // Light gray for hamlets
      stroke: { color: 0x000000, width: 3 },
      dropShadow: {
        color: 0x000000,
        alpha: 0.7,
        angle: Math.PI / 4,
        distance: 2,
      },
    });
    
    const text = new Text({ text: settlement.name, style });
    text.anchor.set(0.5, 1); // Center horizontally, bottom vertically
    
    return text;
  }
  
  /**
   * Clear all names
   */
  clear(): void {
    for (const text of this.nameTexts.values()) {
      this.container.removeChild(text);
    }
    this.nameTexts.clear();
  }
}
