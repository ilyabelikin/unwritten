import { Graphics } from "pixi.js";
import { HexTile } from "../../world/HexTile";
import { BuildingType, BUILDING_CONFIG } from "../../world/Building";
import { darkenColor } from "../Isometric";

/**
 * Renders house buildings (village houses and city houses)
 */
export class HouseRenderer {
  /**
   * Draw a village house (single or cluster)
   */
  drawHouse(gfx: Graphics, cx: number, cy: number, hex?: HexTile): void {
    const config = BUILDING_CONFIG[BuildingType.House];
    
    // Use tile position as seed for variation
    const seed = hex ? (hex.col * 1000 + hex.row) : Math.random() * 10000;
    const random = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };
    
    // 60% single house, 40% cluster of houses
    const houseType = random(1.5);
    
    if (houseType < 0.6) {
      // Single house
      this.drawSingleHouse(gfx, cx, cy, config);
    } else {
      // Cluster of 2-3 houses
      const clusterSize = random(2.3) < 0.5 ? 2 : 3;
      this.drawHouseCluster(gfx, cx, cy, config, clusterSize, random);
    }
  }

  private drawSingleHouse(gfx: Graphics, cx: number, cy: number, config: any): void {
    // Flat pixel art house - top-down style
    const houseW = 8;
    const houseH = 8;
    
    // Shadow
    gfx.ellipse(cx + 1, cy + 1, houseW * 0.8, 2);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Main house body (square, flat)
    gfx.rect(cx - houseW / 2, cy - houseH / 2, houseW, houseH);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - houseW / 2, cy - houseH / 2, houseW, houseH);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Roof (flat, darker rectangle on top)
    gfx.rect(cx - houseW / 2 - 1, cy - houseH / 2 - 3, houseW + 2, 4);
    gfx.fill({ color: config.roofColor });
    
    // Roof outline
    gfx.rect(cx - houseW / 2 - 1, cy - houseH / 2 - 3, houseW + 2, 4);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Door (centered at bottom)
    gfx.rect(cx - 1, cy + houseH / 2 - 3, 3, 3);
    gfx.fill({ color: config.accentColor });
    
    // Door outline
    gfx.rect(cx - 1, cy + houseH / 2 - 3, 3, 3);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.7), width: 0.5 });

    // Windows (two on top half)
    gfx.rect(cx - 4, cy - 1, 2, 2);
    gfx.fill({ color: 0x87ceeb, alpha: 0.8 });
    gfx.rect(cx + 2, cy - 1, 2, 2);
    gfx.fill({ color: 0x87ceeb, alpha: 0.8 });
    
    // Window frames
    gfx.rect(cx - 4, cy - 1, 2, 2);
    gfx.stroke({ color: 0x000000, width: 0.5, alpha: 0.3 });
    gfx.rect(cx + 2, cy - 1, 2, 2);
    gfx.stroke({ color: 0x000000, width: 0.5, alpha: 0.3 });

    // Chimney (small pixel stack on roof)
    gfx.rect(cx + 2, cy - houseH / 2 - 5, 2, 3);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(cx + 1, cy - houseH / 2 - 6, 4, 1);
    gfx.fill({ color: darkenColor(0x8b4513, 0.7) });
  }

  private drawHouseCluster(gfx: Graphics, cx: number, cy: number, config: any, count: number, random: (offset: number) => number): void {
    // Draw a cluster of small houses grouped together
    const houseW = 6;
    const houseH = 6;
    
    if (count === 2) {
      // Two houses side by side
      const positions = [
        { x: cx - 5, y: cy },
        { x: cx + 5, y: cy },
      ];
      
      for (const pos of positions) {
        this.drawSmallHouse(gfx, pos.x, pos.y, config, houseW, houseH);
      }
    } else {
      // Three houses in a triangle formation
      const positions = [
        { x: cx, y: cy - 5 },     // Top
        { x: cx - 5, y: cy + 3 },  // Bottom left
        { x: cx + 5, y: cy + 3 },  // Bottom right
      ];
      
      for (const pos of positions) {
        this.drawSmallHouse(gfx, pos.x, pos.y, config, houseW, houseH);
      }
    }
  }

  private drawSmallHouse(gfx: Graphics, cx: number, cy: number, config: any, houseW: number, houseH: number): void {
    // Shadow
    gfx.ellipse(cx, cy + 1, houseW * 0.7, 1.5);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Main house body
    gfx.rect(cx - houseW / 2, cy - houseH / 2, houseW, houseH);
    gfx.fill({ color: config.baseColor });
    
    // Outline
    gfx.rect(cx - houseW / 2, cy - houseH / 2, houseW, houseH);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 0.5 });

    // Roof
    gfx.rect(cx - houseW / 2 - 1, cy - houseH / 2 - 2, houseW + 2, 3);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - houseW / 2 - 1, cy - houseH / 2 - 2, houseW + 2, 3);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 0.5 });

    // Door
    gfx.rect(cx - 1, cy + houseH / 2 - 2, 2, 2);
    gfx.fill({ color: config.accentColor });

    // Window
    gfx.rect(cx - 1, cy - 1, 2, 1);
    gfx.fill({ color: 0x87ceeb, alpha: 0.8 });
    
    // Chimney
    gfx.rect(cx + 1, cy - houseH / 2 - 3, 1, 2);
    gfx.fill({ color: 0x8b4513 });
  }

  /**
   * Draw a city house (single or cluster)
   */
  drawCityHouse(gfx: Graphics, cx: number, cy: number, hex?: HexTile): void {
    const config = BUILDING_CONFIG[BuildingType.CityHouse];
    
    // Use tile position as seed for variation
    const seed = hex ? (hex.col * 1000 + hex.row) : Math.random() * 10000;
    const random = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };
    
    // 50% single house, 50% cluster of 2 houses
    const houseType = random(1.7);
    
    if (houseType < 0.5) {
      // Single larger city house
      this.drawSingleCityHouse(gfx, cx, cy, config);
    } else {
      // Two houses next to each other (townhouse style)
      this.drawCityHouseCluster(gfx, cx, cy, config);
    }
  }

  private drawSingleCityHouse(gfx: Graphics, cx: number, cy: number, config: any): void {
    // Flat pixel art city house - slightly taller
    const houseW = 10;
    const houseH = 10;
    
    // Shadow
    gfx.ellipse(cx + 1, cy + 1, houseW * 0.8, 2.5);
    gfx.fill({ color: 0x000000, alpha: 0.22 });

    // Main house body (square stone building)
    gfx.rect(cx - houseW / 2, cy - houseH / 2, houseW, houseH);
    gfx.fill({ color: config.baseColor });
    
    // Stone texture (horizontal lines)
    gfx.rect(cx - houseW / 2, cy - houseH / 2 + 3, houseW, 1);
    gfx.fill({ color: darkenColor(config.baseColor, 0.9), alpha: 0.3 });
    gfx.rect(cx - houseW / 2, cy - houseH / 2 + 6, houseW, 1);
    gfx.fill({ color: darkenColor(config.baseColor, 0.9), alpha: 0.3 });

    // Outline
    gfx.rect(cx - houseW / 2, cy - houseH / 2, houseW, houseH);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.7), width: 1 });

    // Flat roof
    gfx.rect(cx - houseW / 2 - 1, cy - houseH / 2 - 3, houseW + 2, 4);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - houseW / 2 - 1, cy - houseH / 2 - 3, houseW + 2, 4);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.6), width: 1 });

    // Timber beams (cross pattern)
    gfx.rect(cx - 3, cy - houseH / 2 + 1, 1, houseH - 4);
    gfx.fill({ color: config.accentColor, alpha: 0.6 });
    gfx.rect(cx + 2, cy - houseH / 2 + 1, 1, houseH - 4);
    gfx.fill({ color: config.accentColor, alpha: 0.6 });
    gfx.rect(cx - houseW / 2 + 1, cy, houseW - 2, 1);
    gfx.fill({ color: config.accentColor, alpha: 0.6 });

    // Door
    gfx.rect(cx - 1, cy + houseH / 2 - 4, 3, 4);
    gfx.fill({ color: config.accentColor });
    gfx.rect(cx - 1, cy + houseH / 2 - 4, 3, 4);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.6), width: 0.5 });

    // Windows (upper section)
    gfx.rect(cx - 4, cy - 2, 2, 2);
    gfx.fill({ color: 0x87ceeb, alpha: 0.8 });
    gfx.rect(cx + 2, cy - 2, 2, 2);
    gfx.fill({ color: 0x87ceeb, alpha: 0.8 });
    
    // Window frames
    gfx.rect(cx - 4, cy - 2, 2, 2);
    gfx.stroke({ color: 0x000000, width: 0.5, alpha: 0.4 });
    gfx.rect(cx + 2, cy - 2, 2, 2);
    gfx.stroke({ color: 0x000000, width: 0.5, alpha: 0.4 });
  }

  private drawCityHouseCluster(gfx: Graphics, cx: number, cy: number, config: any): void {
    // Two townhouses side by side
    const houseW = 7;
    const houseH = 9;
    
    const positions = [
      { x: cx - 4, y: cy },
      { x: cx + 4, y: cy },
    ];
    
    for (const pos of positions) {
      // Shadow
      gfx.ellipse(pos.x, pos.y + 1, houseW * 0.7, 2);
      gfx.fill({ color: 0x000000, alpha: 0.22 });

      // House body
      gfx.rect(pos.x - houseW / 2, pos.y - houseH / 2, houseW, houseH);
      gfx.fill({ color: config.baseColor });
      
      // Outline
      gfx.rect(pos.x - houseW / 2, pos.y - houseH / 2, houseW, houseH);
      gfx.stroke({ color: darkenColor(config.baseColor, 0.7), width: 0.5 });

      // Roof
      gfx.rect(pos.x - houseW / 2 - 1, pos.y - houseH / 2 - 3, houseW + 2, 3);
      gfx.fill({ color: config.roofColor });
      gfx.rect(pos.x - houseW / 2 - 1, pos.y - houseH / 2 - 3, houseW + 2, 3);
      gfx.stroke({ color: darkenColor(config.roofColor, 0.6), width: 0.5 });

      // Timber beams (vertical)
      gfx.rect(pos.x - 2, pos.y - houseH / 2 + 1, 1, houseH - 3);
      gfx.fill({ color: config.accentColor, alpha: 0.5 });
      gfx.rect(pos.x + 1, pos.y - houseH / 2 + 1, 1, houseH - 3);
      gfx.fill({ color: config.accentColor, alpha: 0.5 });

      // Door
      gfx.rect(pos.x - 1, pos.y + houseH / 2 - 3, 2, 3);
      gfx.fill({ color: config.accentColor });

      // Window
      gfx.rect(pos.x - 1, pos.y - 2, 2, 2);
      gfx.fill({ color: 0x87ceeb, alpha: 0.8 });
    }
  }
}
