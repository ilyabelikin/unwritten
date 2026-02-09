import { Graphics } from "pixi.js";
import { HexTile } from "../../world/HexTile";
import { BuildingType, BUILDING_CONFIG } from "../../world/Building";
import { darkenColor, lightenColor } from "../Isometric";

/**
 * Renders religious buildings (churches, monasteries, chapels) and their symbols
 */
export class ReligiousRenderer {
  /**
   * Draw a church with random religious symbol
   */
  drawChurch(gfx: Graphics, cx: number, cy: number, hex?: HexTile): void {
    const config = BUILDING_CONFIG[BuildingType.Church];
    
    // Flat pixel art church - moderately tall
    const baseW = 14;
    const baseH = 12;
    const churchH = 30; // Moderately tall
    const towerW = 8;
    const towerH = 12;
    
    // Shadow
    gfx.ellipse(cx + 2, cy + 8, baseW * 1.2, 4);
    gfx.fill({ color: 0x000000, alpha: 0.25 });

    // Main church body (flat rectangle) - draw upward from base
    gfx.rect(cx - baseW / 2, cy - churchH, baseW, churchH);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - baseW / 2, cy - churchH, baseW, churchH);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.7), width: 1 });

    // Stone texture (horizontal lines)
    for (let i = 1; i < 5; i++) {
      gfx.rect(cx - baseW / 2, cy - churchH + i * 6, baseW, 1);
      gfx.fill({ color: darkenColor(config.baseColor, 0.9), alpha: 0.2 });
    }

    // Bell tower on top (centered, flat)
    const towerX = cx - towerW / 2;
    const towerY = cy - churchH - towerH;
    
    gfx.rect(towerX, towerY, towerW, towerH);
    gfx.fill({ color: lightenColor(config.baseColor, 0.05) });
    gfx.rect(towerX, towerY, towerW, towerH);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Bell tower window
    gfx.rect(cx - 2, towerY + 3, 4, 4);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Pointed spire on tower
    const spireTop = towerY - 8;
    gfx.poly([
      { x: cx, y: spireTop },
      { x: towerX - 1, y: towerY },
      { x: towerX + towerW + 1, y: towerY },
    ]);
    gfx.fill({ color: darkenColor(config.roofColor, 0.6) });
    gfx.poly([
      { x: cx, y: spireTop },
      { x: towerX - 1, y: towerY },
      { x: towerX + towerW + 1, y: towerY },
    ]);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.5), width: 1 });

    // Random religious symbol on top
    const crossY = spireTop - 8;
    this.drawReligiousSymbol(gfx, cx, crossY, hex);

    // Flat roof below tower
    gfx.rect(cx - baseW / 2 - 1, cy - churchH - 3, baseW + 2, 3);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - baseW / 2 - 1, cy - churchH - 3, baseW + 2, 3);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Large arched door at bottom
    gfx.rect(cx - 4, cy - 10, 8, 10);
    gfx.fill({ color: config.accentColor });
    // Door arch
    gfx.rect(cx - 3, cy - 11, 6, 1);
    gfx.fill({ color: config.accentColor });
    gfx.rect(cx - 2, cy - 12, 4, 1);
    gfx.fill({ color: config.accentColor });
    
    // Door outline
    gfx.rect(cx - 4, cy - 10, 8, 10);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.7), width: 0.5 });

    // Stained glass windows (arranged vertically on church body)
    for (let i = 0; i < 2; i++) {
      const winY = cy - churchH + 8 + i * 10;
      // Left window
      gfx.rect(cx - baseW / 2 + 2, winY, 3, 5);
      gfx.fill({ color: 0x87ceeb, alpha: 0.7 });
      gfx.rect(cx - baseW / 2 + 2, winY, 3, 5);
      gfx.stroke({ color: config.baseColor, width: 0.5, alpha: 0.5 });
      
      // Right window
      gfx.rect(cx + baseW / 2 - 5, winY, 3, 5);
      gfx.fill({ color: 0x87ceeb, alpha: 0.7 });
      gfx.rect(cx + baseW / 2 - 5, winY, 3, 5);
      gfx.stroke({ color: config.baseColor, width: 0.5, alpha: 0.5 });
    }

    // Rose window (circular, near top of main body)
    gfx.circle(cx, cy - churchH + 5, 3);
    gfx.fill({ color: 0xffb6c1, alpha: 0.6 });
    gfx.circle(cx, cy - churchH + 5, 3);
    gfx.stroke({ color: config.baseColor, width: 0.5, alpha: 0.5 });
  }

  /**
   * Draw a monastery
   */
  drawMonastery(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Monastery];
    const w = 16;
    const h = 14;

    // Shadow (flat, underneath, larger for this building)
    gfx.ellipse(cx, cy + 2, w * 0.9, 4);
    gfx.fill({ color: 0x000000, alpha: 0.25 });

    // Main monastery building (flat rectangle, larger)
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Stone texture (horizontal lines)
    for (let i = 1; i < 4; i++) {
      gfx.moveTo(cx - w / 2, cy - h / 2 + i * 4);
      gfx.lineTo(cx + w / 2, cy - h / 2 + i * 4);
      gfx.stroke({ color: config.accentColor, width: 0.5, alpha: 0.3 });
    }

    // Flat roof on top
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Bell tower on top (small flat rectangle)
    const towerW = 6;
    const towerH = 8;
    gfx.rect(cx - towerW / 2, cy - h / 2 - 3 - towerH, towerW, towerH);
    gfx.fill({ color: lightenColor(config.baseColor, 0.05) });
    gfx.rect(cx - towerW / 2, cy - h / 2 - 3 - towerH, towerW, towerH);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 0.5 });

    // Cross on top of bell tower
    gfx.rect(cx - 0.5, cy - h / 2 - 3 - towerH - 5, 1, 5);
    gfx.fill({ color: 0xffd700 });
    gfx.rect(cx - 2, cy - h / 2 - 3 - towerH - 3, 4, 1);
    gfx.fill({ color: 0xffd700 });

    // Arched windows (simple rectangles)
    gfx.rect(cx - 5, cy - 3, 3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.6 });
    gfx.rect(cx + 2, cy - 3, 3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Door (centered at bottom)
    gfx.rect(cx - 2, cy + h / 2 - 4, 4, 4);
    gfx.fill({ color: 0x654321 });

    // Courtyard garden (small patch to the side)
    gfx.circle(cx - w / 2 - 3, cy + h / 2, 2);
    gfx.fill({ color: 0x228b22, alpha: 0.6 });
    gfx.circle(cx + w / 2 + 3, cy + h / 2, 2);
    gfx.fill({ color: 0x228b22, alpha: 0.6 });
  }

  /**
   * Draw a chapel
   */
  drawChapel(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Chapel];
    const w = 12;
    const h = 10;

    // Shadow (flat, underneath)
    gfx.ellipse(cx, cy + 1, w * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Chapel building (flat rectangle)
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Flat roof on top
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Small cross on roof
    gfx.rect(cx - 0.5, cy - h / 2 - 8, 1, 5);
    gfx.fill({ color: 0xffd700 });
    gfx.rect(cx - 2, cy - h / 2 - 6, 4, 1);
    gfx.fill({ color: 0xffd700 });

    // Arched window (represented as simple rectangle)
    gfx.rect(cx - 2, cy - 2, 3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Door (centered at bottom)
    gfx.rect(cx - 2, cy + h / 2 - 3, 4, 3);
    gfx.fill({ color: 0x654321 });
  }

  /**
   * Draw a random religious symbol
   */
  private drawReligiousSymbol(gfx: Graphics, cx: number, cy: number, hex?: HexTile): void {
    // Use hex position as seed for deterministic but varied symbol selection
    const seed = hex ? (hex.col * 1000 + hex.row) : Math.random() * 10000;
    const random = () => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const symbolChoice = random();
    
    // 25% cross, 20% crescent, 15% star of David, 15% dharma wheel, 
    // 10% om, 10% torii, 5% ankh
    if (symbolChoice < 0.25) {
      this.drawCross(gfx, cx, cy);
    } else if (symbolChoice < 0.45) {
      this.drawCrescent(gfx, cx, cy);
    } else if (symbolChoice < 0.60) {
      this.drawStarOfDavid(gfx, cx, cy);
    } else if (symbolChoice < 0.75) {
      this.drawDharmaWheel(gfx, cx, cy);
    } else if (symbolChoice < 0.85) {
      this.drawOm(gfx, cx, cy);
    } else if (symbolChoice < 0.95) {
      this.drawTorii(gfx, cx, cy);
    } else {
      this.drawAnkh(gfx, cx, cy);
    }
  }

  // Religious symbol implementations
  private drawCross(gfx: Graphics, cx: number, cy: number): void {
    gfx.rect(cx - 1, cy, 2, 8);
    gfx.fill({ color: 0xffd700 });
    gfx.rect(cx - 3, cy + 2, 6, 2);
    gfx.fill({ color: 0xffd700 });
  }

  private drawCrescent(gfx: Graphics, cx: number, cy: number): void {
    const color = 0x00ff00;
    gfx.circle(cx + 1, cy + 4, 4);
    gfx.fill({ color });
    gfx.circle(cx + 2, cy + 4, 3);
    gfx.fill({ color: 0xf5f5dc });
    
    const starSize = 2;
    gfx.poly([
      { x: cx - 2, y: cy + 2 },
      { x: cx - 1, y: cy + 4 },
      { x: cx - 3, y: cy + 5 },
      { x: cx - 1, y: cy + 5 },
      { x: cx - 2, y: cy + 7 },
      { x: cx - 2, y: cy + 5 },
      { x: cx, y: cy + 5 },
      { x: cx - 2, y: cy + 4 },
    ]);
    gfx.fill({ color });
  }

  private drawStarOfDavid(gfx: Graphics, cx: number, cy: number): void {
    const color = 0x0080ff;
    const size = 3;
    
    gfx.poly([
      { x: cx, y: cy + 1 },
      { x: cx - size, y: cy + 5 },
      { x: cx + size, y: cy + 5 },
    ]);
    gfx.fill({ color });
    
    gfx.poly([
      { x: cx, y: cy + 7 },
      { x: cx - size, y: cy + 3 },
      { x: cx + size, y: cy + 3 },
    ]);
    gfx.fill({ color });
  }

  private drawDharmaWheel(gfx: Graphics, cx: number, cy: number): void {
    const color = 0xffa500;
    
    gfx.circle(cx, cy + 4, 4);
    gfx.stroke({ color, width: 1 });
    
    gfx.circle(cx, cy + 4, 1.5);
    gfx.fill({ color });
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = cx + Math.cos(angle) * 1.5;
      const y1 = cy + 4 + Math.sin(angle) * 1.5;
      const x2 = cx + Math.cos(angle) * 3.5;
      const y2 = cy + 4 + Math.sin(angle) * 3.5;
      
      gfx.moveTo(x1, y1);
      gfx.lineTo(x2, y2);
      gfx.stroke({ color, width: 1 });
    }
  }

  private drawOm(gfx: Graphics, cx: number, cy: number): void {
    const color = 0xff6600;
    
    gfx.arc(cx - 1, cy + 3, 2, 0, Math.PI);
    gfx.stroke({ color, width: 1.5 });
    
    gfx.arc(cx + 1, cy + 5, 2.5, Math.PI, Math.PI * 2);
    gfx.stroke({ color, width: 1.5 });
    
    gfx.circle(cx, cy + 1, 1);
    gfx.fill({ color });
    
    gfx.rect(cx - 2, cy + 7, 4, 1);
    gfx.fill({ color });
  }

  private drawTorii(gfx: Graphics, cx: number, cy: number): void {
    const color = 0xff0000;
    
    gfx.rect(cx - 4, cy + 1, 8, 1.5);
    gfx.fill({ color });
    
    gfx.rect(cx - 3, cy + 3, 6, 1);
    gfx.fill({ color });
    
    gfx.rect(cx - 3, cy + 3, 1.5, 5);
    gfx.fill({ color });
    
    gfx.rect(cx + 1.5, cy + 3, 1.5, 5);
    gfx.fill({ color });
  }

  private drawAnkh(gfx: Graphics, cx: number, cy: number): void {
    const color = 0xffd700;
    
    gfx.circle(cx, cy + 2, 2);
    gfx.stroke({ color, width: 1.5 });
    
    gfx.rect(cx - 0.75, cy + 3, 1.5, 5);
    gfx.fill({ color });
    
    gfx.rect(cx - 3, cy + 4, 6, 1.5);
    gfx.fill({ color });
  }
}
