import { Graphics } from "pixi.js";
import { BuildingType, BUILDING_CONFIG } from "../../world/Building";
import { HEX_SIZE } from "../../world/HexTile";
import { darkenColor } from "../Isometric";

/**
 * Renders industrial buildings (lumber camp, sawmill, mine, quarry, fishing hut)
 */
export class IndustrialRenderer {
  /**
   * Draw a lumber camp
   */
  drawLumberCamp(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.LumberCamp];
    const w = HEX_SIZE * 0.4;
    const h = HEX_SIZE * 0.25;

    // Log pile (stacked rectangles)
    const logHeight = 4;
    const numLogs = 4;
    
    for (let i = 0; i < numLogs; i++) {
      const logY = cy + logHeight * 0.3 - i * logHeight;
      gfx.poly([
        { x: cx - w, y: logY },
        { x: cx + w, y: logY - w * 0.4 },
        { x: cx + w, y: logY - w * 0.4 + logHeight },
        { x: cx - w, y: logY + logHeight },
      ]);
      gfx.fill({ color: i % 2 === 0 ? config.baseColor : config.accentColor });
    }

    // Axe stuck in a stump
    const stumpX = cx + w * 0.5;
    const stumpY = cy + h;
    gfx.ellipse(stumpX, stumpY, w * 0.15, w * 0.08);
    gfx.fill({ color: config.accentColor });
    
    // Axe blade
    gfx.poly([
      { x: stumpX - 3, y: stumpY - 8 },
      { x: stumpX + 3, y: stumpY - 10 },
      { x: stumpX + 3, y: stumpY - 5 },
      { x: stumpX - 3, y: stumpY - 3 },
    ]);
    gfx.fill({ color: 0x708090 });
  }

  /**
   * Draw a sawmill
   */
  drawSawmill(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Sawmill];
    const w = 14;
    const h = 12;

    // Shadow (flat, underneath)
    gfx.ellipse(cx, cy + 1, w * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Main building body (flat rectangle)
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

    // Water wheel (flat, to the side)
    const wheelX = cx + w / 2 + 4;
    const wheelY = cy;
    const wheelRadius = 6;
    gfx.circle(wheelX, wheelY, wheelRadius);
    gfx.fill({ color: 0x654321 });
    gfx.circle(wheelX, wheelY, wheelRadius);
    gfx.stroke({ color: config.accentColor, width: 1 });

    // Wheel spokes (simple cross pattern)
    gfx.moveTo(wheelX - wheelRadius, wheelY);
    gfx.lineTo(wheelX + wheelRadius, wheelY);
    gfx.stroke({ color: config.accentColor, width: 1 });
    gfx.moveTo(wheelX, wheelY - wheelRadius);
    gfx.lineTo(wheelX, wheelY + wheelRadius);
    gfx.stroke({ color: config.accentColor, width: 1 });

    // Windows
    gfx.rect(cx - 3, cy - 2, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.6 });
    gfx.rect(cx + 1, cy - 2, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.6 });

    // Door
    gfx.rect(cx - 2, cy + h / 2 - 3, 4, 3);
    gfx.fill({ color: config.accentColor });

    // Log pile outside (small stack)
    for (let i = 0; i < 2; i++) {
      gfx.rect(cx - w / 2 - 3, cy + h / 2 - 2 + i * 2, 4, 1.5);
      gfx.fill({ color: i % 2 === 0 ? 0x8b4513 : 0x654321 });
    }
  }

  /**
   * Draw a mine
   */
  drawMine(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Mine];
    
    // Pixel art mine entrance
    const w = 10;
    const h = 6;
    
    // Stone structure - left pillar
    gfx.rect(cx - w, cy - h, 4, 12);
    gfx.fill({ color: config.baseColor });

    // Right pillar
    gfx.rect(cx + w - 4, cy - h / 2, 4, 12);
    gfx.fill({ color: darkenColor(config.baseColor, 0.75) });

    // Top beam
    gfx.rect(cx - w + 4, cy - h, w * 2 - 8, 3);
    gfx.fill({ color: darkenColor(config.baseColor, 0.85) });

    // Dark entrance
    gfx.rect(cx - 6, cy - h + 3, 12, 9);
    gfx.fill({ color: 0x000000, alpha: 0.8 });

    // Support beams inside entrance
    gfx.rect(cx - 5, cy - h + 3, 1, 9);
    gfx.fill({ color: 0x654321, alpha: 0.6 });
    gfx.rect(cx + 4, cy - h + 3, 1, 9);
    gfx.fill({ color: 0x654321, alpha: 0.6 });

    // Mine cart (pixel art style)
    const cartX = cx - 8;
    const cartY = cy + 5;
    
    // Cart body
    gfx.rect(cartX - 3, cartY - 3, 6, 4);
    gfx.fill({ color: config.accentColor });
    
    // Cart outline
    gfx.rect(cartX - 3, cartY - 3, 6, 1);
    gfx.fill({ color: darkenColor(config.accentColor, 0.7) });
    
    // Wheels (simple circles)
    gfx.circle(cartX - 2, cartY + 2, 2);
    gfx.fill({ color: 0x000000 });
    gfx.circle(cartX + 2, cartY + 2, 2);
    gfx.fill({ color: 0x000000 });

    // Ore in cart
    gfx.rect(cartX - 1, cartY - 2, 2, 2);
    gfx.fill({ color: 0xc0c0c0 });
  }

  /**
   * Draw a quarry
   */
  drawQuarry(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Quarry];
    const w = 14;
    const h = 10;

    // Shadow
    gfx.ellipse(cx + 1, cy + 6, w * 1.2, 5);
    gfx.fill({ color: 0x000000, alpha: 0.22 });

    // Rock pile (irregular blocks)
    const blocks = [
      { x: cx - w + 2, y: cy + 2, w: 8, h: 6 },
      { x: cx - 4, y: cy - 2, w: 10, h: 7 },
      { x: cx + 4, y: cy + 4, w: 7, h: 5 },
      { x: cx - 6, y: cy - 8, w: 9, h: 6 },
    ];

    for (const block of blocks) {
      gfx.rect(block.x, block.y, block.w, block.h);
      gfx.fill({ color: config.baseColor });
      gfx.rect(block.x, block.y, block.w, block.h);
      gfx.stroke({ color: config.accentColor, width: 1, alpha: 0.6 });
    }

    // Tool (pickaxe) leaning against rocks
    const toolX = cx + w - 4;
    const toolY = cy + 2;
    // Handle
    gfx.rect(toolX, toolY, 1.5, 12);
    gfx.fill({ color: 0x8b4513 });
    // Pickaxe head
    gfx.rect(toolX - 3, toolY - 2, 7, 3);
    gfx.fill({ color: 0x708090 });
  }

  /**
   * Draw a fishing hut
   */
  drawFishingHut(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.FishingHut];
    const w = 10;
    const h = 8;

    // Shadow (flat, underneath)
    gfx.ellipse(cx, cy + 1, w * 0.9, 2.5);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Main hut body (flat rectangle, top-down view)
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    
    // Outline for definition
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Flat thatched roof on top
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 2, w + 2, 3);
    gfx.fill({ color: config.roofColor });
    gfx.rect(cx - w / 2 - 1, cy - h / 2 - 2, w + 2, 3);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });
    
    // Thatch texture (horizontal lines)
    gfx.moveTo(cx - w / 2 - 1, cy - h / 2 - 1);
    gfx.lineTo(cx + w / 2 + 1, cy - h / 2 - 1);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.8), width: 0.5, alpha: 0.5 });

    // Small window
    gfx.rect(cx - 2, cy - 1, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.5 });

    // Door (small opening at bottom)
    gfx.rect(cx - 1, cy + h / 2 - 2, 3, 2);
    gfx.fill({ color: config.accentColor });

    // Fishing rod leaning on side (simple line)
    const rodX = cx + w / 2 + 1;
    const rodY = cy;
    gfx.moveTo(rodX, rodY + 3);
    gfx.lineTo(rodX + 1, rodY - 5);
    gfx.stroke({ color: 0x8b4513, width: 1 });

    // Fishing net on ground (simple grid pattern)
    const netX = cx - w / 2 - 3;
    const netY = cy + h / 2 - 1;
    for (let i = 0; i < 3; i++) {
      gfx.moveTo(netX, netY + i * 1.5);
      gfx.lineTo(netX + 4, netY + i * 1.5);
      gfx.stroke({ color: 0xd4a574, width: 0.5, alpha: 0.5 });
    }
    
    // Bucket next to hut
    gfx.rect(cx + w / 2 - 1, cy + h / 2 - 2, 2, 2);
    gfx.fill({ color: 0x8b4513 });
  }
}
