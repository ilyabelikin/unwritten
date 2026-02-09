import { Container, Graphics } from "pixi.js";
import { HexTile } from "../world/HexTile";
import { Palette } from "./Palette";
import { hexIsoPosition, isoCorners } from "./Isometric";

/**
 * Renders highlight overlays on hex tiles using isometric shapes.
 */
export class HighlightOverlay {
  readonly container: Container;

  private highlights: Map<string, Graphics> = new Map();
  private hoverHighlight: Graphics | null = null;

  constructor() {
    this.container = new Container({ label: "highlights" });
  }

  clear(): void {
    this.container.removeChildren();
    this.highlights.clear();
    this.hoverHighlight = null;
  }

  showHover(hex: HexTile): void {
    this.clearHover();

    const gfx = new Graphics();
    const corners = isoCorners(hex);
    const pos = hexIsoPosition(hex);

    gfx.position.set(pos.x, pos.y);
    gfx.poly(corners);
    gfx.fill({ color: 0xffffff, alpha: 0.12 });
    gfx.poly(corners);
    gfx.stroke({ color: 0xffffff, width: 2, alpha: 0.4 });

    this.container.addChild(gfx);
    this.hoverHighlight = gfx;
  }

  clearHover(): void {
    if (this.hoverHighlight) {
      this.container.removeChild(this.hoverHighlight);
      this.hoverHighlight.destroy();
      this.hoverHighlight = null;
    }
  }

  showReachableNeighbors(
    reachable: HexTile[],
    unreachable: HexTile[]
  ): void {
    this.clearNeighborHighlights();

    for (const hex of reachable) {
      const gfx = this.createNeighborHighlight(hex, "reachable");
      this.highlights.set(`${hex.col},${hex.row}`, gfx);
      this.container.addChild(gfx);
    }

    for (const hex of unreachable) {
      const gfx = this.createNeighborHighlight(hex, "unreachable");
      this.highlights.set(`${hex.col},${hex.row}`, gfx);
      this.container.addChild(gfx);
    }
  }

  clearNeighborHighlights(): void {
    for (const [, gfx] of this.highlights) {
      this.container.removeChild(gfx);
      gfx.destroy();
    }
    this.highlights.clear();
  }

  private createNeighborHighlight(
    hex: HexTile,
    type: "reachable" | "unreachable"
  ): Graphics {
    const gfx = new Graphics();
    const corners = isoCorners(hex);
    const pos = hexIsoPosition(hex);

    gfx.position.set(pos.x, pos.y);

    const color = type === "reachable" ? Palette.uiAccent : 0xff4444;
    const alpha = type === "reachable" ? 0.2 : 0.12;

    gfx.poly(corners);
    gfx.fill({ color, alpha });
    gfx.poly(corners);
    gfx.stroke({ color, width: 1.5, alpha: alpha * 2 });

    return gfx;
  }
}
