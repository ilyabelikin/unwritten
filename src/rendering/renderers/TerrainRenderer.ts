import { Graphics } from "pixi.js";
import { HexTile, HEX_SIZE } from "../../world/HexTile";
import { TerrainType } from "../../world/Terrain";
import { Palette } from "../Palette";
import { darkenColor } from "../Isometric";

type Pt = { x: number; y: number };

/**
 * Handles rendering of terrain details (water, mountains, hills, shores, etc.)
 */
export class TerrainRenderer {
  /**
   * Draw terrain-specific details on the tile's top face
   */
  drawTerrainDetail(gfx: Graphics, hex: HexTile, corners: Pt[]): void {
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

  /**
   * Draw the isometric side walls of a tile
   */
  drawSideFaces(
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
}
