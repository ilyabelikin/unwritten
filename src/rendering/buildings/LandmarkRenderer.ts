import { Graphics } from "pixi.js";
import { HexTile } from "../../world/HexTile";
import { BuildingType, BUILDING_CONFIG } from "../../world/Building";
import { darkenColor, lightenColor } from "../Isometric";

/**
 * Renders landmark buildings (towers, castles, windmills)
 */
export class LandmarkRenderer {
  /**
   * Draw a tower (short or tall variant)
   */
  drawTower(gfx: Graphics, cx: number, cy: number, hex?: HexTile): void {
    // Use hex position as seed for deterministic variation
    const seed = hex ? (hex.col * 1000 + hex.row) : Math.random() * 10000;
    const random = () => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    // 50% chance of each variant
    if (random() < 0.5) {
      this.drawShortTower(gfx, cx, cy);
    } else {
      this.drawTallTower(gfx, cx, cy);
    }
  }

  private drawShortTower(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Tower];
    
    // Flat pixel art tower - cute and approachable
    const w = 10;
    const h = 14;
    
    // Shadow (flat, underneath)
    gfx.ellipse(cx + 1, cy + 2, w * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.25 });

    // Main tower body (single flat rectangle, top-down view)
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Stone brick texture (horizontal lines)
    for (let i = 1; i < 4; i++) {
      gfx.rect(cx - w / 2, cy - h / 2 + i * 4, w, 1);
      gfx.fill({ color: config.accentColor, alpha: 0.3 });
    }

    // Flat roof/battlements on top (simple rectangles)
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 3);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 3);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Cute battlements (small rectangles on top)
    const battlementPositions = [
      cx - w / 2,
      cx - w / 2 + 3,
      cx - w / 2 + 6,
      cx - w / 2 + 9,
    ];
    for (const bx of battlementPositions) {
      gfx.rect(bx, cy - h / 2 - 5, 2, 2);
      gfx.fill({ color: lightenColor(config.baseColor, 0.1) });
    }

    // Windows (simple small rectangles)
    gfx.rect(cx - 3, cy - 5, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    gfx.rect(cx + 1, cy - 5, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    
    gfx.rect(cx - 3, cy, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    gfx.rect(cx + 1, cy, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });

    // Door at bottom (centered)
    gfx.rect(cx - 2, cy + h / 2 - 4, 4, 4);
    gfx.fill({ color: 0x3c2415 });
    gfx.rect(cx - 2, cy + h / 2 - 4, 4, 4);
    gfx.stroke({ color: darkenColor(0x3c2415, 0.7), width: 0.5 });

    // Cute flag on top (small and adorable)
    gfx.rect(cx, cy - h / 2 - 9, 1, 5);
    gfx.fill({ color: 0x8b4513 });
    
    // Flag (simple triangle)
    gfx.poly([
      { x: cx + 1, y: cy - h / 2 - 8 },
      { x: cx + 5, y: cy - h / 2 - 6 },
      { x: cx + 1, y: cy - h / 2 - 4 },
    ]);
    gfx.fill({ color: 0xdc143c });
  }

  private drawTallTower(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Tower];
    
    // Flat pixel art tower - one story taller variant
    const w = 10;
    const h = 20; // Taller by 6 pixels (one story)
    
    // Shadow (flat, underneath, slightly larger)
    gfx.ellipse(cx + 1, cy + 2, w * 0.9, 3.5);
    gfx.fill({ color: 0x000000, alpha: 0.25 });

    // Main tower body (single flat rectangle, top-down view)
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Stone brick texture (horizontal lines) - more lines for taller tower
    for (let i = 1; i < 6; i++) {
      gfx.rect(cx - w / 2, cy - h / 2 + i * 4, w, 1);
      gfx.fill({ color: config.accentColor, alpha: 0.3 });
    }

    // Flat roof/battlements on top (simple rectangles)
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 3);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 3);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Cute battlements (small rectangles on top)
    const battlementPositions = [
      cx - w / 2,
      cx - w / 2 + 3,
      cx - w / 2 + 6,
      cx - w / 2 + 9,
    ];
    for (const bx of battlementPositions) {
      gfx.rect(bx, cy - h / 2 - 5, 2, 2);
      gfx.fill({ color: lightenColor(config.baseColor, 0.1) });
    }

    // Windows (simple small rectangles) - 3 rows for taller tower
    gfx.rect(cx - 3, cy - 8, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    gfx.rect(cx + 1, cy - 8, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    
    gfx.rect(cx - 3, cy - 3, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    gfx.rect(cx + 1, cy - 3, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    
    gfx.rect(cx - 3, cy + 2, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    gfx.rect(cx + 1, cy + 2, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.7 });

    // Door at bottom (centered)
    gfx.rect(cx - 2, cy + h / 2 - 4, 4, 4);
    gfx.fill({ color: 0x3c2415 });
    gfx.rect(cx - 2, cy + h / 2 - 4, 4, 4);
    gfx.stroke({ color: darkenColor(0x3c2415, 0.7), width: 0.5 });

    // Cute flag on top (small and adorable)
    gfx.rect(cx, cy - h / 2 - 9, 1, 5);
    gfx.fill({ color: 0x8b4513 });
    
    // Flag (simple triangle)
    gfx.poly([
      { x: cx + 1, y: cy - h / 2 - 8 },
      { x: cx + 5, y: cy - h / 2 - 6 },
      { x: cx + 1, y: cy - h / 2 - 4 },
    ]);
    gfx.fill({ color: 0xdc143c });
  }

  /**
   * Draw a castle
   */
  drawCastle(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Castle];
    
    // Pixel art castle - grand and imposing
    const keepW = 16;
    const keepH = 12;
    const wallH = 28;
    const towerW = 8;
    const towerH = 32;
    
    // Shadow
    gfx.ellipse(cx + 2, cy + 14, keepW * 1.3, 6);
    gfx.fill({ color: 0x000000, alpha: 0.28 });

    // Left tower
    gfx.rect(cx - keepW - towerW, cy - keepH + 2, towerW, towerH);
    gfx.fill({ color: config.baseColor });
    
    // Left tower battlements
    gfx.rect(cx - keepW - towerW, cy - keepH + towerH + 2, 2, 3);
    gfx.fill({ color: lightenColor(config.baseColor, 0.05) });
    gfx.rect(cx - keepW - towerW + 3, cy - keepH + towerH + 2, 2, 3);
    gfx.fill({ color: lightenColor(config.baseColor, 0.05) });
    gfx.rect(cx - keepW - towerW + 6, cy - keepH + towerH + 2, 2, 3);
    gfx.fill({ color: lightenColor(config.baseColor, 0.05) });

    // Right tower
    gfx.rect(cx + keepW, cy - keepH / 2 + 1, towerW, towerH);
    gfx.fill({ color: darkenColor(config.baseColor, 0.75) });
    
    // Right tower battlements
    gfx.rect(cx + keepW, cy - keepH / 2 + towerH + 1, 2, 3);
    gfx.fill({ color: darkenColor(config.baseColor, 0.7) });
    gfx.rect(cx + keepW + 3, cy - keepH / 2 + towerH + 1, 2, 3);
    gfx.fill({ color: darkenColor(config.baseColor, 0.7) });
    gfx.rect(cx + keepW + 6, cy - keepH / 2 + towerH + 1, 2, 3);
    gfx.fill({ color: darkenColor(config.baseColor, 0.7) });

    // Main keep - left wall
    gfx.rect(cx - keepW, cy - keepH, keepW, wallH);
    gfx.fill({ color: darkenColor(config.baseColor, 0.85) });

    // Main keep - right wall
    gfx.rect(cx, cy - keepH / 2, keepW, wallH);
    gfx.fill({ color: config.baseColor });

    // Stone brick texture (horizontal lines)
    for (let i = 1; i < 7; i++) {
      const y = cy - keepH + i * 5;
      gfx.rect(cx - keepW, y, keepW, 1);
      gfx.fill({ color: config.accentColor, alpha: 0.35 });
      gfx.rect(cx, y, keepW, 1);
      gfx.fill({ color: config.accentColor, alpha: 0.25 });
    }

    // Keep battlements
    const topY = cy - keepH + wallH;
    gfx.rect(cx - keepW, topY, 4, 4);
    gfx.fill({ color: lightenColor(config.baseColor, 0.1) });
    gfx.rect(cx - keepW + 6, topY, 4, 4);
    gfx.fill({ color: lightenColor(config.baseColor, 0.1) });
    gfx.rect(cx - keepW + 12, topY, 4, 4);
    gfx.fill({ color: lightenColor(config.baseColor, 0.1) });
    
    gfx.rect(cx + 3, topY - 6, 4, 4);
    gfx.fill({ color: config.baseColor });
    gfx.rect(cx + 9, topY - 6, 4, 4);
    gfx.fill({ color: config.baseColor });

    // Gate (dark wooden door)
    gfx.rect(cx - 6, cy + wallH - keepH - 12, 8, 12);
    gfx.fill({ color: 0x3c2415 });
    
    // Portcullis bars
    gfx.rect(cx - 5, cy + wallH - keepH - 12, 1, 12);
    gfx.fill({ color: 0x000000, alpha: 0.6 });
    gfx.rect(cx - 2, cy + wallH - keepH - 12, 1, 12);
    gfx.fill({ color: 0x000000, alpha: 0.6 });
    gfx.rect(cx + 1, cy + wallH - keepH - 12, 1, 12);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Windows on keep
    gfx.rect(cx - 10, cy - keepH + 8, 3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    gfx.rect(cx - 10, cy - keepH + 16, 3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.7 });

    gfx.rect(cx + 7, cy - keepH / 2 + 6, 3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.6 });
    gfx.rect(cx + 7, cy - keepH / 2 + 13, 3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Banner on right tower
    gfx.rect(cx + keepW + 3, cy - keepH / 2 + towerH - 4, 1, 8);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(cx + keepW + 4, cy - keepH / 2 + towerH - 3, 5, 4);
    gfx.fill({ color: 0x4169e1 });
  }

  /**
   * Draw a windmill
   */
  drawWindmill(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Windmill];
    const baseW = 8;
    const baseH = 16;

    // Shadow (flat, underneath)
    gfx.ellipse(cx, cy + 2, baseW * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.25 });

    // Flat tower base (tall rectangle)
    gfx.rect(cx - baseW / 2, cy - baseH / 2, baseW, baseH);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - baseW / 2, cy - baseH / 2, baseW, baseH);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Windmill blades (4 simple flat lines in X pattern)
    const bladeLength = 12;
    const centerX = cx;
    const centerY = cy - baseH / 2 - 3;

    // Horizontal blade
    gfx.moveTo(centerX - bladeLength, centerY);
    gfx.lineTo(centerX + bladeLength, centerY);
    gfx.stroke({ color: 0xf5f5dc, width: 4 });
    gfx.moveTo(centerX - bladeLength, centerY);
    gfx.lineTo(centerX + bladeLength, centerY);
    gfx.stroke({ color: 0x8b4513, width: 1 });

    // Vertical blade
    gfx.moveTo(centerX, centerY - bladeLength);
    gfx.lineTo(centerX, centerY + bladeLength);
    gfx.stroke({ color: 0xf5f5dc, width: 4 });
    gfx.moveTo(centerX, centerY - bladeLength);
    gfx.lineTo(centerX, centerY + bladeLength);
    gfx.stroke({ color: 0x8b4513, width: 1 });

    // Diagonal blade 1 (top-left to bottom-right)
    const diagDist = bladeLength * 0.7;
    gfx.moveTo(centerX - diagDist, centerY - diagDist);
    gfx.lineTo(centerX + diagDist, centerY + diagDist);
    gfx.stroke({ color: 0xf5f5dc, width: 3.5, alpha: 0.9 });
    gfx.moveTo(centerX - diagDist, centerY - diagDist);
    gfx.lineTo(centerX + diagDist, centerY + diagDist);
    gfx.stroke({ color: 0x8b4513, width: 0.5 });

    // Diagonal blade 2 (top-right to bottom-left)
    gfx.moveTo(centerX + diagDist, centerY - diagDist);
    gfx.lineTo(centerX - diagDist, centerY + diagDist);
    gfx.stroke({ color: 0xf5f5dc, width: 3.5, alpha: 0.9 });
    gfx.moveTo(centerX + diagDist, centerY - diagDist);
    gfx.lineTo(centerX - diagDist, centerY + diagDist);
    gfx.stroke({ color: 0x8b4513, width: 0.5 });

    // Center hub (flat circle)
    gfx.circle(centerX, centerY, 3);
    gfx.fill({ color: 0x654321 });
    gfx.circle(centerX, centerY, 3);
    gfx.stroke({ color: 0x8b4513, width: 1 });

    // Window (small rectangle)
    gfx.rect(cx - 2, cy - 4, 2, 3);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Door (at bottom)
    gfx.rect(cx - 2, cy + baseH / 2 - 4, 4, 4);
    gfx.fill({ color: 0x654321 });
  }
}
