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

  /**
   * Draw a hunting lodge
   */
  drawHuntingLodge(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.HuntingLodge];
    const w = 11;
    const h = 9;

    // Shadow
    gfx.ellipse(cx, cy + 1, w * 0.8, 2.5);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Lodge body
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.fill({ color: config.baseColor });
    gfx.rect(cx - w / 2, cy - h / 2, w, h);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

    // Sloped roof
    gfx.poly([
      { x: cx - w / 2 - 1, y: cy - h / 2 },
      { x: cx, y: cy - h / 2 - 4 },
      { x: cx + w / 2 + 1, y: cy - h / 2 },
    ]);
    gfx.fill({ color: config.roofColor });
    gfx.poly([
      { x: cx - w / 2 - 1, y: cy - h / 2 },
      { x: cx, y: cy - h / 2 - 4 },
      { x: cx + w / 2 + 1, y: cy - h / 2 },
    ]);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Door
    gfx.rect(cx - 1.5, cy + h / 2 - 3, 3, 3);
    gfx.fill({ color: config.accentColor });

    // Window
    gfx.rect(cx - 4, cy - 1, 2, 2);
    gfx.fill({ color: 0x000000, alpha: 0.5 });

    // Deer antlers mounted above door
    const antlerY = cy - h / 2 + 2;
    gfx.moveTo(cx - 3, antlerY);
    gfx.lineTo(cx - 2, antlerY - 3);
    gfx.moveTo(cx + 3, antlerY);
    gfx.lineTo(cx + 2, antlerY - 3);
    gfx.stroke({ color: 0x8b7355, width: 1.5 });
  }

  /**
   * Draw a pasture
   */
  drawPasture(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Pasture];
    const w = 14;
    const h = 10;

    // Grass field (lighter green)
    gfx.rect(cx - w, cy - h / 2, w * 2, h);
    gfx.fill({ color: config.baseColor, alpha: 0.6 });

    // Wooden fence around perimeter
    const fenceColor = config.accentColor;
    // Top fence
    gfx.rect(cx - w, cy - h / 2, w * 2, 1);
    gfx.fill({ color: fenceColor });
    // Bottom fence
    gfx.rect(cx - w, cy + h / 2 - 1, w * 2, 1);
    gfx.fill({ color: fenceColor });
    // Left fence
    gfx.rect(cx - w, cy - h / 2, 1, h);
    gfx.fill({ color: fenceColor });
    // Right fence
    gfx.rect(cx + w - 1, cy - h / 2, 1, h);
    gfx.fill({ color: fenceColor });

    // Fence posts (vertical lines)
    for (let i = -1; i <= 1; i++) {
      gfx.rect(cx + i * 6, cy - h / 2, 1, 2);
      gfx.fill({ color: fenceColor });
      gfx.rect(cx + i * 6, cy + h / 2 - 2, 1, 2);
      gfx.fill({ color: fenceColor });
    }

    // Small barn/shelter (back corner)
    const barnX = cx + w - 5;
    const barnY = cy - h / 2 + 3;
    gfx.rect(barnX - 3, barnY, 6, 5);
    gfx.fill({ color: config.roofColor });
    // Barn roof
    gfx.poly([
      { x: barnX - 4, y: barnY },
      { x: barnX, y: barnY - 3 },
      { x: barnX + 4, y: barnY },
    ]);
    gfx.fill({ color: 0x654321 });

    // Sheep (simple white circles)
    gfx.circle(cx - 4, cy, 2);
    gfx.fill({ color: 0xf5f5f5 });
    gfx.circle(cx + 3, cy + 2, 2);
    gfx.fill({ color: 0xf5f5f5 });
  }

  /**
   * Draw a clay pit
   */
  drawClayPit(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.ClayPit];
    const w = 12;
    const h = 8;

    // Excavated pit (darker brown depression)
    gfx.ellipse(cx, cy + 2, w, h);
    gfx.fill({ color: config.accentColor, alpha: 0.7 });
    gfx.ellipse(cx, cy + 2, w, h);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.6), width: 1 });

    // Clay deposits (irregular shapes)
    gfx.circle(cx - 3, cy + 1, 3);
    gfx.fill({ color: config.baseColor });
    gfx.circle(cx + 4, cy + 2, 2.5);
    gfx.fill({ color: config.baseColor });
    gfx.circle(cx - 1, cy + 4, 2);
    gfx.fill({ color: config.baseColor });

    // Small shelter/shed
    const shedX = cx - w + 2;
    const shedY = cy - h + 2;
    gfx.rect(shedX, shedY, 5, 4);
    gfx.fill({ color: 0xa0826d });
    gfx.poly([
      { x: shedX - 1, y: shedY },
      { x: shedX + 2.5, y: shedY - 2 },
      { x: shedX + 6, y: shedY },
    ]);
    gfx.fill({ color: config.roofColor });

    // Shovel
    const shovelX = cx + w - 3;
    const shovelY = cy - h + 4;
    gfx.rect(shovelX, shovelY, 1, 8);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(shovelX - 1.5, shovelY + 7, 4, 3);
    gfx.fill({ color: 0x696969 });

    // Cart with clay
    gfx.rect(cx + 3, cy - 2, 4, 3);
    gfx.fill({ color: 0x654321 });
    gfx.rect(cx + 3.5, cy - 3, 3, 1.5);
    gfx.fill({ color: config.baseColor });
  }

  /**
   * Draw salt works
   */
  drawSaltWorks(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.SaltWorks];
    const w = 14;
    const h = 10;

    // Salt evaporation pans (rectangular pools)
    const panColor = config.baseColor;
    const saltColor = config.accentColor;

    // Three pans
    const pans = [
      { x: cx - 8, y: cy - 3, w: 6, h: 5 },
      { x: cx - 8, y: cy + 3, w: 6, h: 5 },
      { x: cx + 2, y: cy, w: 6, h: 8 },
    ];

    for (const pan of pans) {
      // Pan outline
      gfx.rect(pan.x, pan.y, pan.w, pan.h);
      gfx.fill({ color: 0x8b7355, alpha: 0.5 });
      gfx.rect(pan.x, pan.y, pan.w, pan.h);
      gfx.stroke({ color: 0x654321, width: 1 });

      // Salt crystals inside
      gfx.rect(pan.x + 1, pan.y + 1, pan.w - 2, pan.h - 2);
      gfx.fill({ color: saltColor, alpha: 0.8 });
    }

    // Small work shed
    const shedX = cx + 9;
    const shedY = cy - 5;
    gfx.rect(shedX, shedY, 5, 5);
    gfx.fill({ color: config.roofColor });
    gfx.rect(shedX, shedY, 5, 5);
    gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

    // Roof
    gfx.poly([
      { x: shedX - 1, y: shedY },
      { x: shedX + 2.5, y: shedY - 2 },
      { x: shedX + 6, y: shedY },
    ]);
    gfx.fill({ color: 0x8b4513 });

    // Rake tool
    gfx.rect(cx - 5, cy - 7, 1, 6);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(cx - 7, cy - 2, 5, 1);
    gfx.fill({ color: 0x8b4513 });
  }

  /**
   * Draw a copper mine
   */
  drawCopperMine(gfx: Graphics, cx: number, cy: number): void {
    this.drawMineVariant(gfx, cx, cy, BuildingType.CopperMine, 0xb87333);
  }

  /**
   * Draw an iron mine
   */
  drawIronMine(gfx: Graphics, cx: number, cy: number): void {
    this.drawMineVariant(gfx, cx, cy, BuildingType.IronMine, 0x708090);
  }

  /**
   * Draw a silver mine
   */
  drawSilverMine(gfx: Graphics, cx: number, cy: number): void {
    this.drawMineVariant(gfx, cx, cy, BuildingType.SilverMine, 0xc0c0c0);
  }

  /**
   * Draw a gold mine
   */
  drawGoldMine(gfx: Graphics, cx: number, cy: number): void {
    this.drawMineVariant(gfx, cx, cy, BuildingType.GoldMine, 0xffd700);
  }

  /**
   * Draw a gem mine
   */
  drawGemMine(gfx: Graphics, cx: number, cy: number): void {
    this.drawMineVariant(gfx, cx, cy, BuildingType.GemMine, 0x9370db);
  }

  /**
   * Generic mine variant renderer (shared by all mine types)
   */
  private drawMineVariant(gfx: Graphics, cx: number, cy: number, buildingType: BuildingType, oreColor: number): void {
    const config = BUILDING_CONFIG[buildingType];
    const w = 11;
    const h = 7;

    // Shadow
    gfx.ellipse(cx, cy + 2, w * 1.1, 4);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Stone structure - left pillar
    gfx.rect(cx - w, cy - h, 4, 13);
    gfx.fill({ color: config.baseColor });
    gfx.rect(cx - w, cy - h, 4, 13);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.7), width: 1 });

    // Right pillar
    gfx.rect(cx + w - 4, cy - h / 2, 4, 13);
    gfx.fill({ color: darkenColor(config.baseColor, 0.8) });
    gfx.rect(cx + w - 4, cy - h / 2, 4, 13);
    gfx.stroke({ color: darkenColor(config.baseColor, 0.7), width: 1 });

    // Top beam
    gfx.rect(cx - w + 4, cy - h, w * 2 - 8, 3);
    gfx.fill({ color: darkenColor(config.baseColor, 0.85) });

    // Dark entrance
    gfx.rect(cx - 6, cy - h + 3, 12, 10);
    gfx.fill({ color: 0x000000, alpha: 0.9 });

    // Support beams
    gfx.rect(cx - 5, cy - h + 3, 1, 10);
    gfx.fill({ color: 0x654321, alpha: 0.7 });
    gfx.rect(cx + 4, cy - h + 3, 1, 10);
    gfx.fill({ color: 0x654321, alpha: 0.7 });

    // Mine cart with ore
    const cartX = cx - 9;
    const cartY = cy + 6;

    // Cart body
    gfx.poly([
      { x: cartX - 3, y: cartY },
      { x: cartX - 3, y: cartY - 4 },
      { x: cartX + 3, y: cartY - 4 },
      { x: cartX + 3, y: cartY },
    ]);
    gfx.fill({ color: config.accentColor });
    gfx.poly([
      { x: cartX - 3, y: cartY },
      { x: cartX - 3, y: cartY - 4 },
      { x: cartX + 3, y: cartY - 4 },
      { x: cartX + 3, y: cartY },
    ]);
    gfx.stroke({ color: darkenColor(config.accentColor, 0.7), width: 1 });

    // Wheels
    gfx.circle(cartX - 2, cartY + 2, 1.5);
    gfx.fill({ color: 0x000000 });
    gfx.circle(cartX + 2, cartY + 2, 1.5);
    gfx.fill({ color: 0x000000 });

    // Ore in cart (distinctive color for each mine type)
    gfx.circle(cartX - 1, cartY - 2, 1.5);
    gfx.fill({ color: oreColor });
    gfx.circle(cartX + 1, cartY - 3, 1.5);
    gfx.fill({ color: oreColor });
    gfx.circle(cartX, cartY - 1, 1.5);
    gfx.fill({ color: oreColor });

    // Pickaxe leaning against entrance
    const pickX = cx + 7;
    const pickY = cy + 2;
    gfx.rect(pickX, pickY, 1.5, 10);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(pickX - 3, pickY - 1, 7, 2);
    gfx.fill({ color: 0x696969 });

    // Lantern next to entrance (glowing for atmosphere)
    gfx.circle(cx - 8, cy - 2, 2);
    gfx.fill({ color: 0xffa500, alpha: 0.6 });
  }
}
