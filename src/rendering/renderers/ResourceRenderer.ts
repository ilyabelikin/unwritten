import { Graphics } from "pixi.js";
import { ResourceType, RESOURCE_CONFIG } from "../../world/Resource";
import { HexTile } from "../../world/HexTile";

/**
 * Renders resource icons on tiles.
 * Icons are designed to be clear, recognizable, and fit the medieval aesthetic.
 */
export class ResourceRenderer {
  /**
   * Draw a resource icon at the specified position
   */
  drawResource(gfx: Graphics, resource: ResourceType, cx: number, cy: number): void {
    if (resource === ResourceType.None) return;

    const config = RESOURCE_CONFIG[resource];

    switch (resource) {
      case ResourceType.WildGame:
        this.drawWildGameIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Fish:
        this.drawFishIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Timber:
        this.drawTimberIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Livestock:
        this.drawLivestockIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Clay:
        this.drawClayIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Stone:
        this.drawStoneIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Copper:
        this.drawCopperIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Salt:
        this.drawSaltIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Iron:
        this.drawIronIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Silver:
        this.drawSilverIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Gold:
        this.drawGoldIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
      case ResourceType.Gems:
        this.drawGemsIcon(gfx, cx, cy, config.color, config.accentColor);
        break;
    }
  }

  /**
   * Wild Game - Deer antlers silhouette
   */
  private drawWildGameIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 6;
    
    // Deer head silhouette
    gfx.circle(cx, cy, size * 0.6);
    gfx.fill({ color: accent });
    
    // Antlers
    gfx.moveTo(cx - size * 0.5, cy - size * 0.5);
    gfx.lineTo(cx - size * 0.3, cy - size);
    gfx.lineTo(cx - size * 0.1, cy - size * 0.7);
    gfx.moveTo(cx + size * 0.5, cy - size * 0.5);
    gfx.lineTo(cx + size * 0.3, cy - size);
    gfx.lineTo(cx + size * 0.1, cy - size * 0.7);
    gfx.stroke({ color: accent, width: 1.5 });
  }

  /**
   * Fish - Simple fish shape
   */
  private drawFishIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 7;
    
    // Fish body (ellipse)
    gfx.ellipse(cx, cy, size, size * 0.5);
    gfx.fill({ color });
    
    // Tail
    const points = [
      cx + size * 0.8, cy,
      cx + size * 1.3, cy - size * 0.4,
      cx + size * 1.3, cy + size * 0.4,
    ];
    gfx.poly(points);
    gfx.fill({ color });
    
    // Eye
    gfx.circle(cx - size * 0.4, cy - size * 0.2, size * 0.15);
    gfx.fill({ color: 0x000000 });
  }

  /**
   * Timber - Log stack
   */
  private drawTimberIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 6;
    
    // Three logs stacked
    for (let i = 0; i < 3; i++) {
      const y = cy + (i - 1) * size * 0.5;
      gfx.roundRect(cx - size, y - size * 0.2, size * 2, size * 0.4, 2);
      gfx.fill({ color: i === 1 ? accent : color });
      
      // Wood rings on the end
      gfx.circle(cx + size, y, size * 0.15);
      gfx.stroke({ color: accent, width: 1 });
    }
  }

  /**
   * Livestock - Sheep silhouette
   */
  private drawLivestockIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 6;
    
    // Sheep body (fluffy cloud shape)
    gfx.circle(cx, cy, size * 0.6);
    gfx.circle(cx - size * 0.3, cy - size * 0.2, size * 0.4);
    gfx.circle(cx + size * 0.3, cy - size * 0.2, size * 0.4);
    gfx.fill({ color: accent });
    
    // Head
    gfx.circle(cx - size * 0.6, cy + size * 0.2, size * 0.35);
    gfx.fill({ color: 0xF5DEB3 }); // Tan color for head
    
    // Legs (simple lines)
    const legPositions = [-0.3, -0.1, 0.1, 0.3];
    legPositions.forEach(offset => {
      gfx.moveTo(cx + offset * size, cy + size * 0.4);
      gfx.lineTo(cx + offset * size, cy + size * 0.9);
    });
    gfx.stroke({ color: 0x8B4513, width: 1 });
  }

  /**
   * Clay - Clay pot
   */
  private drawClayIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 6;
    
    // Pot body
    const points = [
      cx - size * 0.5, cy + size,
      cx - size * 0.6, cy - size * 0.3,
      cx - size * 0.4, cy - size * 0.7,
      cx + size * 0.4, cy - size * 0.7,
      cx + size * 0.6, cy - size * 0.3,
      cx + size * 0.5, cy + size,
    ];
    gfx.poly(points);
    gfx.fill({ color });
    gfx.stroke({ color: accent, width: 1 });
    
    // Rim
    gfx.rect(cx - size * 0.5, cy - size * 0.8, size, size * 0.2);
    gfx.fill({ color: accent });
  }

  /**
   * Stone - Rock pile
   */
  private drawStoneIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 6;
    
    // Three stones
    // Bottom left
    gfx.poly([
      cx - size * 0.7, cy + size * 0.5,
      cx - size * 0.9, cy,
      cx - size * 0.3, cy - size * 0.2,
      cx - size * 0.1, cy + size * 0.3,
    ]);
    gfx.fill({ color });
    
    // Bottom right
    gfx.poly([
      cx + size * 0.1, cy + size * 0.4,
      cx, cy - size * 0.1,
      cx + size * 0.6, cy + size * 0.1,
      cx + size * 0.8, cy + size * 0.6,
    ]);
    gfx.fill({ color: accent });
    
    // Top center
    gfx.poly([
      cx - size * 0.2, cy - size * 0.3,
      cx - size * 0.4, cy - size * 0.8,
      cx + size * 0.2, cy - size * 0.9,
      cx + size * 0.4, cy - size * 0.4,
    ]);
    gfx.fill({ color });
  }

  /**
   * Copper - Ore nugget with copper color
   */
  private drawCopperIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    this.drawOreIcon(gfx, cx, cy, color, accent, 0.9);
  }

  /**
   * Iron - Ore nugget with gray color
   */
  private drawIronIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    this.drawOreIcon(gfx, cx, cy, color, accent, 0.95);
  }

  /**
   * Silver - Ore nugget with silver color
   */
  private drawSilverIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    this.drawOreIcon(gfx, cx, cy, color, accent, 1.0);
    
    // Add sparkle effect for precious metals
    this.drawSparkle(gfx, cx - 4, cy - 5, accent);
  }

  /**
   * Gold - Ore nugget with gold color
   */
  private drawGoldIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    this.drawOreIcon(gfx, cx, cy, color, accent, 1.0);
    
    // Add sparkle effects for gold
    this.drawSparkle(gfx, cx - 5, cy - 4, accent);
    this.drawSparkle(gfx, cx + 4, cy - 5, accent);
  }

  /**
   * Generic ore nugget shape
   */
  private drawOreIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number, scale: number = 1): void {
    const size = 5 * scale;
    
    // Irregular rock shape
    gfx.poly([
      cx - size * 0.6, cy + size * 0.4,
      cx - size * 0.7, cy - size * 0.2,
      cx - size * 0.3, cy - size * 0.8,
      cx + size * 0.4, cy - size * 0.7,
      cx + size * 0.8, cy - size * 0.1,
      cx + size * 0.6, cy + size * 0.5,
    ]);
    gfx.fill({ color });
    
    // Highlight facets
    gfx.poly([
      cx - size * 0.3, cy - size * 0.5,
      cx, cy - size * 0.7,
      cx + size * 0.3, cy - size * 0.4,
      cx + size * 0.1, cy - size * 0.2,
    ]);
    gfx.fill({ color: accent, alpha: 0.6 });
  }

  /**
   * Salt - Salt crystals
   */
  private drawSaltIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 5;
    
    // Multiple small crystal cubes
    const crystals = [
      { x: cx - size * 0.5, y: cy + size * 0.3, s: 0.8 },
      { x: cx + size * 0.3, y: cy + size * 0.2, s: 0.9 },
      { x: cx, y: cy - size * 0.4, s: 1.0 },
    ];
    
    crystals.forEach(crystal => {
      const s = size * crystal.s * 0.6;
      // Cube shape (isometric)
      gfx.poly([
        crystal.x, crystal.y,
        crystal.x + s, crystal.y - s * 0.5,
        crystal.x + s, crystal.y - s * 1.5,
        crystal.x, crystal.y - s,
      ]);
      gfx.fill({ color });
      gfx.stroke({ color: accent, width: 1 });
    });
  }

  /**
   * Gems - Multiple gemstones
   */
  private drawGemsIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
    const size = 5;
    
    // Three gemstones of different colors
    const gems = [
      { x: cx - size * 0.6, y: cy + size * 0.4, color: 0x9370DB, size: 0.8 },
      { x: cx + size * 0.5, y: cy + size * 0.2, color: 0xFF1493, size: 0.7 },
      { x: cx, y: cy - size * 0.5, color: 0x00CED1, size: 1.0 },
    ];
    
    gems.forEach(gem => {
      this.drawGemstone(gfx, gem.x, gem.y, gem.color, accent, size * gem.size);
    });
  }

  /**
   * Single gemstone shape
   */
  private drawGemstone(gfx: Graphics, cx: number, cy: number, color: number, accent: number, size: number): void {
    // Diamond/gem shape
    gfx.poly([
      cx, cy - size,
      cx + size * 0.6, cy - size * 0.3,
      cx + size * 0.4, cy + size * 0.5,
      cx, cy + size,
      cx - size * 0.4, cy + size * 0.5,
      cx - size * 0.6, cy - size * 0.3,
    ]);
    gfx.fill({ color });
    
    // Facet highlights
    gfx.poly([
      cx, cy - size,
      cx + size * 0.6, cy - size * 0.3,
      cx, cy,
    ]);
    gfx.fill({ color: accent, alpha: 0.5 });
    
    // Sparkle
    this.drawSparkle(gfx, cx - size * 0.3, cy - size * 0.8, 0xFFFFFF);
  }

  /**
   * Small sparkle effect for precious materials
   */
  private drawSparkle(gfx: Graphics, cx: number, cy: number, color: number): void {
    const size = 2;
    
    // Four-pointed star
    gfx.moveTo(cx, cy - size);
    gfx.lineTo(cx, cy + size);
    gfx.moveTo(cx - size, cy);
    gfx.lineTo(cx + size, cy);
    gfx.moveTo(cx - size * 0.7, cy - size * 0.7);
    gfx.lineTo(cx + size * 0.7, cy + size * 0.7);
    gfx.moveTo(cx + size * 0.7, cy - size * 0.7);
    gfx.lineTo(cx - size * 0.7, cy + size * 0.7);
    gfx.stroke({ color, width: 1, alpha: 0.8 });
  }
}
