import { Container, Graphics } from "pixi.js";
import { HexTile, HEX_SIZE } from "../world/HexTile";
import { TerrainType, TERRAIN_CONFIG, VegetationType } from "../world/Terrain";
import { Palette } from "./Palette";
import {
  hexIsoPosition,
  isoCorners,
  getTileSideHeight,
  darkenColor,
  lightenColor,
  getTerrainElevation,
} from "./Isometric";

type Pt = { x: number; y: number };

/**
 * Renders hex tiles as isometric shapes with a visible top face
 * and side walls that show terrain elevation depth.
 */
export class TileRenderer {
  readonly container: Container;

  /** Map from "col,row" to the tile's Graphics object for fast lookup */
  private tileGraphics: Map<string, Graphics> = new Map();

  constructor() {
    this.container = new Container({ label: "world-tiles" });
  }

  /** Create graphics for all tiles in the grid (sorted back-to-front for painter's algo). */
  buildTiles(tiles: Iterable<HexTile>): void {
    this.clear();

    // Collect and sort: row ascending (far→near), then col ascending (left→right)
    const sorted = [...tiles].sort((a, b) =>
      a.row !== b.row ? a.row - b.row : a.col - b.col
    );

    for (const hex of sorted) {
      const gfx = this.createTileGraphic(hex);
      const key = `${hex.col},${hex.row}`;
      this.tileGraphics.set(key, gfx);
      this.container.addChild(gfx);
    }
  }

  getTileGraphic(col: number, row: number): Graphics | undefined {
    return this.tileGraphics.get(`${col},${row}`);
  }

  clear(): void {
    this.container.removeChildren();
    this.tileGraphics.clear();
  }

  // ─── Tile Creation ────────────────────────────────────────────

  private createTileGraphic(hex: HexTile): Graphics {
    const gfx = new Graphics();

    // Isometric corners (relative to hex position, squished y)
    const corners = isoCorners(hex);
    const pos = hexIsoPosition(hex);

    gfx.position.set(pos.x, pos.y);

    const config = TERRAIN_CONFIG[hex.terrain];
    const sideH = getTileSideHeight(hex.terrain);

    // Slightly expand the polygon to prevent subpixel seams between tiles
    const expandedCorners = this.expandPoly(corners, 0.5);

    // 1) Side faces (drawn first so top face covers the joint)
    this.drawSideFaces(gfx, hex, expandedCorners, sideH, config.baseColor);

    // 2) Top face fill with elevation-based lighting
    // Higher tiles are lighter (more sunlight), lower tiles darker (more shadow)
    const elevation = getTerrainElevation(hex.terrain);
    const lightFactor = Math.max(0, Math.min(0.25, elevation * 0.015));
    const shadowFactor = Math.max(0, Math.min(0.35, -elevation * 0.04));
    let topColor = config.baseColor;
    if (lightFactor > 0) {
      topColor = lightenColor(config.baseColor, lightFactor);
    } else if (shadowFactor > 0) {
      topColor = darkenColor(config.baseColor, 1 - shadowFactor);
    }
    
    gfx.poly(expandedCorners);
    gfx.fill({ color: topColor });

    // 3) Terrain detail on top face (use original corners for positioning)
    this.drawTerrainDetail(gfx, hex, corners);

    return gfx;
  }

  /** Expand a polygon outward from its center by `amount` pixels to cover subpixel seams. */
  private expandPoly(corners: Pt[], amount: number): Pt[] {
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;
    return corners.map((c) => {
      const dx = c.x - cx;
      const dy = c.y - cy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return c;
      return {
        x: c.x + (dx / len) * amount,
        y: c.y + (dy / len) * amount,
      };
    });
  }

  // ─── Side Faces ───────────────────────────────────────────────

  /**
   * Draw the isometric side walls.
   * Finds edges whose midpoint is in the bottom half of the hex,
   * then extends them downward by sideH pixels.
   */
  private drawSideFaces(
    gfx: Graphics,
    _hex: HexTile,
    corners: Pt[],
    sideH: number,
    baseColor: number
  ): void {
    const n = corners.length;
    const centerY = corners.reduce((s, c) => s + c.y, 0) / n;
    const centerX = corners.reduce((s, c) => s + c.x, 0) / n;

    for (let i = 0; i < n; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % n];
      const midY = (a.y + b.y) / 2;

      // Only draw side faces for edges in the bottom half (facing the viewer)
      if (midY < centerY - 0.5) continue;

      // Shade: left-facing edges darker, right-facing lighter
      const midX = (a.x + b.x) / 2;
      const shade = midX < centerX ? 0.5 : 0.65;
      // The very bottom edge gets a middle shade
      const isBottom =
        Math.abs(midY - Math.max(...corners.map((c) => c.y))) < 2;
      const finalShade = isBottom ? 0.55 : shade;

      const color = darkenColor(baseColor, finalShade);

      gfx.poly([
        a,
        b,
        { x: b.x, y: b.y + sideH },
        { x: a.x, y: a.y + sideH },
      ]);
      gfx.fill({ color });

      // Subtle edge line between side faces
      gfx.moveTo(a.x, a.y);
      gfx.lineTo(a.x, a.y + sideH);
      gfx.stroke({ color: darkenColor(baseColor, 0.35), width: 0.5, alpha: 0.4 });
    }

    // Bottom outline of side walls
    const bottomCorners = corners
      .filter((c) => c.y >= centerY - 0.5)
      .sort((a, b) => a.x - b.x);

    if (bottomCorners.length >= 2) {
      const leftMost = bottomCorners[0];
      const rightMost = bottomCorners[bottomCorners.length - 1];
      gfx.moveTo(leftMost.x, leftMost.y + sideH);
      // Draw along the bottom edge of side walls
      for (let i = 0; i < n; i++) {
        const c = corners[i];
        const next = corners[(i + 1) % n];
        const midY = (c.y + next.y) / 2;
        if (midY >= centerY - 0.5) {
          gfx.lineTo(next.x, next.y + sideH);
        }
      }
      gfx.stroke({
        color: darkenColor(baseColor, 0.3),
        width: 1,
        alpha: 0.3,
      });
    }
  }

  // ─── Terrain Details ──────────────────────────────────────────

  private drawTerrainDetail(gfx: Graphics, hex: HexTile, corners: Pt[]): void {
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;

    switch (hex.terrain) {
      case TerrainType.DeepWater:
      case TerrainType.ShallowWater:
        this.drawWaterDetail(gfx, hex, cx, cy);
        break;
      case TerrainType.Shore:
        this.drawShoreDetail(gfx, cx, cy);
        break;
      case TerrainType.Mountains:
        this.drawMountainDetail(gfx, cx, cy);
        break;
      case TerrainType.Hills:
        this.drawHillDetail(gfx, cx, cy);
        break;
    }
  }

  private drawWaterDetail(
    gfx: Graphics,
    hex: HexTile,
    cx: number,
    cy: number
  ): void {
    const s = HEX_SIZE * 0.25;
    const color =
      hex.terrain === TerrainType.DeepWater
        ? Palette.waterShallow
        : Palette.waterHighlight;

    // Isometric wave lines (horizontal, slightly curved)
    gfx.moveTo(cx - s, cy - 1);
    gfx.bezierCurveTo(cx - s / 2, cy - 3, cx + s / 2, cy + 1, cx + s, cy - 1);
    gfx.stroke({ color, width: 1.5, alpha: 0.45 });

    gfx.moveTo(cx - s * 0.5, cy + 3);
    gfx.bezierCurveTo(
      cx - s / 4,
      cy + 1,
      cx + s / 4,
      cy + 5,
      cx + s * 0.5,
      cy + 3
    );
    gfx.stroke({ color, width: 1, alpha: 0.3 });
  }

  private drawShoreDetail(gfx: Graphics, cx: number, cy: number): void {
    const r = HEX_SIZE * 0.2;
    const dots = [
      { x: cx - r * 0.5, y: cy - r * 0.2 },
      { x: cx + r * 0.6, y: cy + r * 0.15 },
      { x: cx - r * 0.1, y: cy + r * 0.4 },
      { x: cx + r * 0.3, y: cy - r * 0.3 },
    ];
    for (const d of dots) {
      gfx.circle(d.x, d.y, 1);
      gfx.fill({ color: Palette.shoreWet, alpha: 0.5 });
    }
  }

  private drawMountainDetail(gfx: Graphics, cx: number, cy: number): void {
    const s = HEX_SIZE * 0.25;
    // Peak triangle (squished for isometric)
    gfx.poly([
      { x: cx, y: cy - s * 1.3 },
      { x: cx - s * 0.7, y: cy + s * 0.2 },
      { x: cx + s * 0.7, y: cy + s * 0.2 },
    ]);
    gfx.fill({ color: Palette.mountainPeak });
    gfx.stroke({ color: Palette.mountainStone, width: 1, alpha: 0.6 });

    // Snow cap
    gfx.poly([
      { x: cx, y: cy - s * 1.3 },
      { x: cx - s * 0.25, y: cy - s * 0.5 },
      { x: cx + s * 0.25, y: cy - s * 0.5 },
    ]);
    gfx.fill({ color: Palette.mountainSnow, alpha: 0.85 });
  }

  private drawHillDetail(gfx: Graphics, cx: number, cy: number): void {
    const s = HEX_SIZE * 0.16;
    // Isometric bumps (ellipses squished in y)
    gfx.ellipse(cx - s * 0.5, cy, s * 0.9, s * 0.4);
    gfx.fill({ color: Palette.hillsDark, alpha: 0.35 });

    gfx.ellipse(cx + s * 0.6, cy - s * 0.2, s * 0.7, s * 0.3);
    gfx.fill({ color: Palette.hillsDark, alpha: 0.25 });
  }

  // ─── Vegetation ───────────────────────────────────────────────

  drawVegetation(hex: HexTile): void {
    const key = `${hex.col},${hex.row}`;
    const gfx = this.tileGraphics.get(key);
    if (!gfx || hex.vegetation === VegetationType.None) return;

    const corners = isoCorners(hex);
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;

    if (hex.vegetation === VegetationType.Tree) {
      this.drawTree(gfx, cx, cy);
    } else {
      this.drawBush(gfx, cx, cy);
    }
  }

  private drawTree(gfx: Graphics, cx: number, cy: number): void {
    const s = HEX_SIZE * 0.2;

    // Shadow on ground (isometric ellipse)
    gfx.ellipse(cx + 1.5, cy + s * 0.3, s * 0.7, s * 0.25);
    gfx.fill({ color: 0x000000, alpha: 0.12 });

    // Trunk
    gfx.rect(cx - 1.5, cy - s * 0.2, 3, s * 1.0);
    gfx.fill({ color: Palette.treeTrunk });

    // Canopy (isometric diamond-ish shape)
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

  private drawBush(gfx: Graphics, cx: number, cy: number): void {
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
}
