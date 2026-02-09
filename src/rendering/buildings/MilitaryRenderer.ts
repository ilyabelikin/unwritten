import { Graphics } from "pixi.js";
import { BuildingType, BUILDING_CONFIG } from "../../world/Building";
import { darkenColor, lightenColor } from "../Isometric";

/**
 * Renders military buildings (barracks, watchtower)
 */
export class MilitaryRenderer {
  /**
   * Draw a barracks
   */
  drawBarracks(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Barracks];
    const w = 14;
    const h = 12;

    // Shadow (flat, underneath)
    gfx.ellipse(cx, cy + 1, w * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Main building body (flat rectangle, top-down view)
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Flat roof on top (simple overhang)
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Multiple small windows in a row (barracks style)
    const windowY = cy - 2;
    for (let i = 0; i < 3; i++) {
      const winX = cx - w / 2 + 3 + i * 4;
      gfx.rect(winX, windowY, 2, 3);
      gfx.fill({ color: 0x000000, alpha: 0.6 });
    }

    // Door (centered at bottom)
    gfx.rect(cx - 2, cy + h / 2 - 4, 4, 4);
    gfx.fill({ color: config.accentColor });
    gfx.rect(cx - 2, cy + h / 2 - 4, 4, 4);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.7), width: 0.5 });

    // Small shields on either side of door (flat, decorative)
    // Left shield
    gfx.circle(cx - 5, cy + h / 2 - 1, 2);
    gfx.fill({ color: 0x8b0000 });
    gfx.circle(cx - 5, cy + h / 2 - 1, 2);
    gfx.stroke({ color: 0xffd700, width: 0.5 });

    // Right shield
    gfx.circle(cx + 5, cy + h / 2 - 1, 2);
    gfx.fill({ color: 0x8b0000 });
    gfx.circle(cx + 5, cy + h / 2 - 1, 2);
    gfx.stroke({ color: 0xffd700, width: 0.5 });

    // Flag on top (cute detail)
    gfx.rect(cx, cy - h / 2 - 7, 1, 5);
    gfx.fill({ color: 0x8b4513 });
    gfx.poly([
      { x: cx + 1, y: cy - h / 2 - 6 },
      { x: cx + 4, y: cy - h / 2 - 4 },
      { x: cx + 1, y: cy - h / 2 - 2 },
    ]);
    gfx.fill({ color: 0x8b0000 });
  }

  /**
   * Draw a watchtower
   */
  drawWatchtower(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Watchtower];
    const w = 6;
    const h = 22;

    // Shadow
    gfx.ellipse(cx + 1, cy + h / 2 + 2, w * 1.5, 4);
    gfx.fill({ color: 0x000000, alpha: 0.22 });

    // Tall narrow tower
    gfx.rect(cx - w, cy - h, w, h);
    gfx.fill({ color: config.baseColor });
    gfx.rect(cx, cy - h / 2, w, h);
    gfx.fill({ color: darkenColor(config.baseColor, 0.8) });

    // Stone texture (horizontal lines)
    for (let i = 1; i < 5; i++) {
      gfx.rect(cx - w, cy - h + i * 5, w, 1);
      gfx.fill({ color: config.accentColor, alpha: 0.3 });
    }

    // Battlements on top
    const crenellations = [
      { x: cx - w, y: cy - h, w: 2, h: 3 },
      { x: cx - w + 4, y: cy - h, w: 2, h: 3 },
      { x: cx + 2, y: cy - h / 2, w: 2, h: 3 },
      { x: cx + 6, y: cy - h / 2, w: 2, h: 3 },
    ];
    for (const cren of crenellations) {
      gfx.rect(cren.x, cren.y, cren.w, cren.h);
      gfx.fill({ color: lightenColor(config.baseColor, 0.05) });
    }

    // Windows (arrow slits)
    gfx.rect(cx - 2, cy - h + 8, 1, 4);
    gfx.fill({ color: 0x000000, alpha: 0.7 });
    gfx.rect(cx + 2, cy - h / 2 + 6, 1, 4);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Flag on top
    gfx.rect(cx, cy - h - 8, 1, 10);
    gfx.fill({ color: 0x8b4513 });
    gfx.poly([
      { x: cx + 1, y: cy - h - 7 },
      { x: cx + 6, y: cy - h - 5 },
      { x: cx + 1, y: cy - h - 3 },
    ]);
    gfx.fill({ color: 0x8b0000 });
  }
}
