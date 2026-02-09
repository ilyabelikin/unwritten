import { Graphics } from "pixi.js";
import { HexTile, HEX_SIZE } from "../../world/HexTile";
import { Palette } from "../Palette";
import { darkenColor, lightenColor } from "../Isometric";

type Pt = { x: number; y: number };

/**
 * Handles rendering of vegetation (trees, bushes, forests, rocks)
 */
export class VegetationRenderer {
  /**
   * Draw a single cone-shaped tree
   */
  drawTree(gfx: Graphics, cx: number, cy: number, scale: number = 1.0): void {
    const s = HEX_SIZE * 0.2 * scale;

    // Shadow on ground (isometric ellipse)
    gfx.ellipse(cx + 1.5 * scale, cy + s * 0.3, s * 0.7, s * 0.25);
    gfx.fill({ color: 0x000000, alpha: 0.12 });

    // Trunk
    gfx.rect(cx - 1.5 * scale, cy - s * 0.2, 3 * scale, s * 1.0);
    gfx.fill({ color: Palette.treeTrunk });

    // Canopy (isometric diamond-ish shape - cone like)
    gfx.poly([
      { x: cx, y: cy - s * 1.8 },
      { x: cx + s * 0.9, y: cy - s * 0.4 },
      { x: cx, y: cy + s * 0.1 },
      { x: cx - s * 0.9, y: cy - s * 0.4 },
    ]);
    gfx.fill({ color: Palette.treeCanopy });

    // Highlight
    gfx.poly([
      { x: cx - s * 0.1, y: cy - s * 1.6 },
      { x: cx - s * 0.7, y: cy - s * 0.5 },
      { x: cx - s * 0.1, y: cy - s * 0.3 },
    ]);
    gfx.fill({ color: Palette.treeCanopyLight, alpha: 0.45 });
  }

  /**
   * Draw an oval/round-shaped tree
   */
  drawOvalTree(gfx: Graphics, cx: number, cy: number, scale: number = 1.0): void {
    const s = HEX_SIZE * 0.2 * scale;

    // Shadow on ground (isometric ellipse)
    gfx.ellipse(cx + 1.5 * scale, cy + s * 0.3, s * 0.7, s * 0.25);
    gfx.fill({ color: 0x000000, alpha: 0.12 });

    // Trunk
    gfx.rect(cx - 1.5 * scale, cy - s * 0.2, 3 * scale, s * 1.0);
    gfx.fill({ color: Palette.treeTrunk });

    // Oval canopy (wider and rounder than cone)
    gfx.ellipse(cx, cy - s * 0.8, s * 1.1, s * 0.6);
    gfx.fill({ color: Palette.treeCanopy });
    
    // Top part of oval
    gfx.ellipse(cx, cy - s * 1.2, s * 0.8, s * 0.4);
    gfx.fill({ color: Palette.treeCanopy });

    // Highlight on left side for depth
    gfx.ellipse(cx - s * 0.3, cy - s * 1.0, s * 0.5, s * 0.35);
    gfx.fill({ color: Palette.treeCanopyLight, alpha: 0.45 });
  }

  /**
   * Draw a small bush
   */
  drawBush(gfx: Graphics, cx: number, cy: number): void {
    const s = HEX_SIZE * 0.15;

    // Shadow
    gfx.ellipse(cx + 1, cy + s * 0.3, s * 0.8, s * 0.25);
    gfx.fill({ color: 0x000000, alpha: 0.1 });

    // Bush body (isometric ellipse)
    gfx.ellipse(cx, cy - s * 0.2, s * 0.9, s * 0.5);
    gfx.fill({ color: Palette.bush });

    // Highlight
    gfx.ellipse(cx - s * 0.2, cy - s * 0.4, s * 0.4, s * 0.25);
    gfx.fill({ color: Palette.bushLight, alpha: 0.45 });
  }

  /**
   * Draw forest with varying tree density
   */
  drawForest(gfx: Graphics, hex: HexTile, cx: number, cy: number): void {
    const density = hex.treeDensity;

    // Determine number of trees based on density
    let numTrees: number;
    if (density < 0.2) {
      numTrees = 1; // Sparse: single tree
    } else if (density < 0.4) {
      numTrees = 2; // Light: 2 trees
    } else if (density < 0.6) {
      numTrees = 3; // Light forest: 3 trees
    } else if (density < 0.75) {
      numTrees = 5; // Medium forest: 5 trees
    } else if (density < 0.9) {
      numTrees = 7; // Dense forest: 7 trees
    } else {
      numTrees = 9; // Very dense forest: 9 trees
    }

    // Use hex position as seed for deterministic placement
    const seed = hex.col * 1000 + hex.row;
    const random = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    if (numTrees === 1) {
      // Single tree in center - randomly choose tree type
      const treeType = random(100);
      if (treeType < 0.5) {
        this.drawTree(gfx, cx, cy);
      } else {
        this.drawOvalTree(gfx, cx, cy);
      }
    } else {
      // Multiple trees scattered around the tile
      const positions: Array<{ x: number; y: number; scale: number; isOval: boolean }> = [];
      const radius = HEX_SIZE * 0.35;

      for (let i = 0; i < numTrees; i++) {
        // Distribute trees in a circle around the center
        const angle = (i / numTrees) * Math.PI * 2 + random(i * 5) * 0.5;
        const dist = random(i * 7) * radius * 0.8 + radius * 0.2;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist * 0.5; // Squish for isometric
        
        // Vary tree sizes slightly for visual interest
        const scale = 0.8 + random(i * 11) * 0.4;
        
        // Randomly choose between cone and oval trees (50/50 mix)
        const isOval = random(i * 13) > 0.5;
        
        positions.push({ x, y, scale, isOval });
      }

      // Sort by y position (back to front for proper overlapping)
      positions.sort((a, b) => a.y - b.y);

      // Draw all trees with mixed types
      for (const pos of positions) {
        if (pos.isOval) {
          this.drawOvalTree(gfx, pos.x, pos.y, pos.scale);
        } else {
          this.drawTree(gfx, pos.x, pos.y, pos.scale);
        }
      }
    }
  }

  /**
   * Draw a single rock (irregular polygon)
   */
  drawRock(gfx: Graphics, x: number, y: number, size: number, variation: number): void {
    // Create an irregular rock shape
    const points: Pt[] = [];
    const sides = 5 + Math.floor(variation * 3);
    
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const radiusVar = 0.7 + Math.sin(i * variation * 10) * 0.3;
      const r = size * radiusVar;
      // Squish vertically for isometric projection
      points.push({
        x: x + Math.cos(angle) * r,
        y: y + Math.sin(angle) * r * 0.5,
      });
    }

    // Shadow
    gfx.ellipse(x + 0.5, y + size * 0.3, size * 0.9, size * 0.3);
    gfx.fill({ color: 0x000000, alpha: 0.15 });

    // Rock body
    gfx.poly(points);
    gfx.fill({ color: Palette.mountainStone });

    // Outline for definition
    gfx.poly(points);
    gfx.stroke({ color: darkenColor(Palette.mountainStone, 0.6), width: 0.8, alpha: 0.7 });

    // Highlight on top-left
    const highlightSize = size * 0.4;
    gfx.ellipse(x - size * 0.2, y - size * 0.15, highlightSize * 0.7, highlightSize * 0.3);
    gfx.fill({ color: lightenColor(Palette.mountainStone, 0.2), alpha: 0.4 });
  }

  /**
   * Draw rocks on rough terrain tiles
   */
  drawRocks(gfx: Graphics, hex: HexTile, cx: number, cy: number): void {
    // Use hex position as seed for deterministic but varied rock placement
    const seed = hex.col * 1000 + hex.row;
    const random = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    // Draw 2-4 rocks per rough tile
    const numRocks = Math.floor(random(1) * 3) + 2;
    for (let i = 0; i < numRocks; i++) {
      const angle = random(i * 10) * Math.PI * 2;
      const dist = random(i * 10 + 5) * HEX_SIZE * 0.35;
      const rx = cx + Math.cos(angle) * dist;
      const ry = cy + Math.sin(angle) * dist * 0.5; // Squish for isometric

      const rockSize = (random(i * 10 + 7) * 0.4 + 0.6) * HEX_SIZE * 0.12;
      this.drawRock(gfx, rx, ry, rockSize, random(i * 10 + 3));
    }
  }
}
