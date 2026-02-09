import { Graphics } from "pixi.js";
import { BuildingType, BUILDING_CONFIG } from "../../world/Building";
import { darkenColor } from "../Isometric";

/**
 * Renders commercial buildings (trading post, warehouse)
 */
export class CommercialRenderer {
  /**
   * Draw a trading post
   */
  drawTradingPost(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.TradingPost];
    const w = 14;
    const h = 12;

    // Shadow (flat, underneath)
    gfx.ellipse(cx, cy + 1, w * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.22 });

    // Main building body (flat rectangle)
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Flat awning/overhang on left side (flat rectangle extending out)
    gfx.rect(cx - w / 2 - 4, cy - h / 2 + 2, 5, 6);
    gfx.fill({ color: config.accentColor });
    gfx.rect(cx - w / 2 - 4, cy - h / 2 + 2, 5, 6);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.7), width: 0.5 });

    // Flat roof on top
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Sign on awning (flat hanging sign)
    gfx.rect(cx - w / 2 - 3, cy - h / 2, 4, 3);
    gfx.fill({ color: 0xf5deb3 });
    gfx.rect(cx - w / 2 - 3, cy - h / 2, 4, 3);
    gfx.stroke({ color: 0x8b4513, width: 0.5 });

    // Windows
    gfx.rect(cx - 2, cy - 2, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Door
    gfx.rect(cx - 2, cy + h / 2 - 3, 4, 3);
    gfx.fill({ color: config.accentColor });

    // Goods displayed outside (crates as simple squares)
    gfx.rect(cx + w / 2 - 3, cy + h / 2 - 2, 3, 3);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(cx + w / 2, cy + h / 2 - 1, 3, 3);
    gfx.fill({ color: 0xa0826d });
  }

  /**
   * Draw a warehouse
   */
  drawWarehouse(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Warehouse];
    const w = 16;
    const h = 12;

    // Shadow (flat, underneath)
    gfx.ellipse(cx, cy + 1, w * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Large rectangular building (bigger than normal)
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

    // Large double doors (centered at bottom)
    gfx.rect(cx - 4, cy + h / 2 - 5, 8, 5);
    gfx.fill({ color: config.accentColor });
    gfx.rect(cx - 4, cy + h / 2 - 5, 8, 5);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.7), width: 1 });
    
    // Door split line
    gfx.moveTo(cx, cy + h / 2 - 5);
    gfx.lineTo(cx, cy + h / 2);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.5), width: 1 });

    // Small window
    gfx.rect(cx - 2, cy - 3, 3, 2);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Stacked crates outside (simple squares)
    gfx.rect(cx + w / 2 - 2, cy + h / 2 - 3, 3, 3);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(cx + w / 2 - 1, cy + h / 2 - 6, 3, 3);
    gfx.fill({ color: 0xa0826d });
  }
}
