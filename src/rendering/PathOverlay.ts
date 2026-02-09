import { Container, Graphics } from "pixi.js";
import { HexTile } from "../world/HexTile";
import { Palette } from "./Palette";
import { hexIsoCenter } from "./Isometric";

/**
 * Renders a path overlay showing the movement path on hex tiles.
 */
export class PathOverlay {
  readonly container: Container;

  private pathGraphics: Graphics[] = [];
  private pathLine: Graphics | null = null;

  constructor() {
    this.container = new Container({ label: "path-overlay" });
  }

  /**
   * Show a path as a gentle line connecting tiles.
   * @param path The path tiles (excluding start)
   * @param startTile The starting tile
   * @param isValid Whether the path can be executed (enough AP, etc.)
   */
  showPath(path: HexTile[], startTile: HexTile, isValid: boolean): void {
    this.clearPath();

    if (path.length === 0) return;

    const color = isValid ? Palette.uiAccent : 0xff6666;

    // Only draw connecting line (no tile highlights)
    this.pathLine = this.createPathLine([startTile, ...path], color, isValid);
    this.container.addChild(this.pathLine);
  }

  clearPath(): void {
    // Remove tile highlights
    for (const gfx of this.pathGraphics) {
      this.container.removeChild(gfx);
      gfx.destroy();
    }
    this.pathGraphics = [];

    // Remove path line
    if (this.pathLine) {
      this.container.removeChild(this.pathLine);
      this.pathLine.destroy();
      this.pathLine = null;
    }
  }

  private createPathLine(
    tiles: HexTile[],
    color: number,
    isValid: boolean,
  ): Graphics {
    const gfx = new Graphics();

    if (tiles.length < 2) return gfx;

    // Get centers of all tiles
    const centers = tiles.map((tile) => hexIsoCenter(tile));

    // Draw the path as a gentle dotted/dashed line
    const alpha = isValid ? 0.5 : 0.35;

    // Draw line segments with small gaps for a gentle look
    for (let i = 1; i < centers.length; i++) {
      const from = centers[i - 1];
      const to = centers[i];

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len === 0) continue;

      const dirX = dx / len;
      const dirY = dy / len;

      // Draw dashed line
      const dashLength = 8;
      const gapLength = 4;
      let distance = 0;

      while (distance < len) {
        const startX = from.x + dirX * distance;
        const startY = from.y + dirY * distance;
        const endDist = Math.min(distance + dashLength, len);
        const endX = from.x + dirX * endDist;
        const endY = from.y + dirY * endDist;

        gfx.moveTo(startX, startY);
        gfx.lineTo(endX, endY);

        distance += dashLength + gapLength;
      }
    }

    gfx.stroke({ color, width: 2, alpha });

    // Add a small circle at the destination
    const lastCenter = centers[centers.length - 1];
    gfx.circle(lastCenter.x, lastCenter.y, 4);
    gfx.fill({ color, alpha: alpha * 1.5 });
    gfx.circle(lastCenter.x, lastCenter.y, 4);
    gfx.stroke({ color: 0xffffff, width: 1, alpha: alpha * 2 });

    return gfx;
  }
}
