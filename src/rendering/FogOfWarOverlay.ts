import { Container, Graphics, BlurFilter } from "pixi.js";
import { HexTile } from "../world/HexTile";
import { ISO_Y_SCALE } from "./Isometric";

/**
 * Renders fog of war as unified overlay layers instead of per-tile alpha.
 * Creates smooth, continuous dark regions over unexplored/not-visible areas.
 */
export class FogOfWarOverlay {
  readonly container: Container;

  private exploredFogGraphics: Graphics;
  private hiddenFogGraphics: Graphics;

  constructor() {
    this.container = new Container({ label: "fog-of-war" });

    // Layer 1: Semi-transparent overlay for explored-but-not-visible areas
    this.exploredFogGraphics = new Graphics();
    // Add blur filter for soft, foggy edges
    const exploredBlur = new BlurFilter({ strength: 8, quality: 4 });
    this.exploredFogGraphics.filters = [exploredBlur];
    this.container.addChild(this.exploredFogGraphics);

    // Layer 2: Full black overlay for completely unexplored areas
    this.hiddenFogGraphics = new Graphics();
    // Add blur filter for soft, foggy edges
    const hiddenBlur = new BlurFilter({ strength: 12, quality: 4 });
    this.hiddenFogGraphics.filters = [hiddenBlur];
    this.container.addChild(this.hiddenFogGraphics);
  }

  /**
   * Update fog of war by drawing unified overlays over non-visible tiles.
   */
  update(visibleTiles: Set<string>, exploredTiles: Set<string>, allTiles: HexTile[]): void {
    this.exploredFogGraphics.clear();
    this.hiddenFogGraphics.clear();

    // Collect all polygons for each layer before drawing
    const exploredPolygons: { x: number; y: number }[][] = [];
    const hiddenPolygons: { x: number; y: number }[][] = [];

    for (const hex of allTiles) {
      const key = `${hex.col},${hex.row}`;
      const corners = this.getFogCorners(hex);

      if (!exploredTiles.has(key)) {
        // Completely unexplored: full black overlay
        hiddenPolygons.push(corners);
      } else if (!visibleTiles.has(key)) {
        // Explored but not visible: dark semi-transparent overlay
        exploredPolygons.push(corners);
      }
    }

    // Draw all explored fog polygons in one batch with a single fill
    for (const corners of exploredPolygons) {
      this.exploredFogGraphics.poly(corners);
    }
    if (exploredPolygons.length > 0) {
      this.exploredFogGraphics.fill({ color: 0x000000, alpha: 0.65 });
    }

    // Draw all hidden fog polygons in one batch with a single fill
    for (const corners of hiddenPolygons) {
      this.hiddenFogGraphics.poly(corners);
    }
    if (hiddenPolygons.length > 0) {
      this.hiddenFogGraphics.fill({ color: 0x000000, alpha: 1.0 });
    }
  }

  /**
   * Get the fog overlay corners for a single hex tile.
   * Returns a flat polygon (no elevation, no expansion).
   */
  private getFogCorners(hex: HexTile): { x: number; y: number }[] {
    // Get corners in world space with only isometric Y compression
    // No expansion needed when using batched fill
    return hex.corners.map((c) => ({
      x: c.x,
      y: c.y * ISO_Y_SCALE,
    }));
  }

  clear(): void {
    this.exploredFogGraphics.clear();
    this.hiddenFogGraphics.clear();
  }
}
