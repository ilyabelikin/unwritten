import { Container, Graphics } from "pixi.js";
import { HexTile, HEX_SIZE } from "../world/HexTile";
import { TERRAIN_CONFIG, VegetationType } from "../world/Terrain";
import { BuildingType, Settlement } from "../world/Building";
import { WorldMap } from "../world/WorldMap";
import {
  hexIsoPosition,
  isoCorners,
  getTileSideHeight,
  darkenColor,
  lightenColor,
  getTerrainElevation,
} from "./Isometric";
import { TerrainRenderer } from "./renderers/TerrainRenderer";
import { VegetationRenderer } from "./renderers/VegetationRenderer";
import { RoadRenderer } from "./renderers/RoadRenderer";
import { SettlementRenderer } from "./renderers/SettlementRenderer";
import { BuildingRenderer } from "./buildings/BuildingRenderer";
import { ResourceRenderer } from "./renderers/ResourceRenderer";

type Pt = { x: number; y: number };

/**
 * Renders hex tiles as isometric shapes with a visible top face
 * and side walls that show terrain elevation depth.
 */
export class TileRenderer {
  readonly container: Container;
  readonly roadContainer: Container;
  readonly decorationContainer: Container;

  /** Map from "col,row" to the tile's Graphics object for fast lookup */
  private tileGraphics: Map<string, Graphics> = new Map();
  private roadGraphics: Graphics;
  
  /** Map from "col,row" to decoration Graphics (buildings, vegetation, etc) */
  private decorationGraphics: Map<string, Graphics> = new Map();

  // Specialized renderers
  private terrainRenderer = new TerrainRenderer();
  private vegetationRenderer = new VegetationRenderer();
  private roadRenderer = new RoadRenderer();
  private settlementRenderer = new SettlementRenderer();
  private buildingRenderer = new BuildingRenderer();
  private resourceRenderer = new ResourceRenderer();

  constructor() {
    this.container = new Container({ label: "world-tiles" });
    this.roadContainer = new Container({ label: "roads" });
    this.roadGraphics = new Graphics();
    this.roadContainer.addChild(this.roadGraphics);
    this.decorationContainer = new Container({ label: "decorations" });
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

    // Round position to whole pixels to prevent subpixel gaps
    gfx.position.set(Math.round(pos.x), Math.round(pos.y));

    const config = TERRAIN_CONFIG[hex.terrain];
    const sideH = getTileSideHeight(hex.terrain);

    // Expand the polygon slightly to prevent subpixel seams between tiles
    const expandedCorners = this.expandPoly(corners, 0.5);

    // 1) Side faces (drawn first so top face covers the joint)
    this.terrainRenderer.drawSideFaces(gfx, hex, expandedCorners, sideH, config.baseColor);

    // 2) Top face fill with elevation-based lighting
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
    // Use a very thin, semi-transparent stroke to fill seams without creating visible borders
    gfx.stroke({ color: topColor, width: 0.5, alpha: 0.5 });

    // 3) Terrain detail on top face
    this.terrainRenderer.drawTerrainDetail(gfx, hex, corners);

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

  // ─── Roads ────────────────────────────────────────────────────

  /** Draw roads using pathfinding between settlement centers */
  drawRoadsFromSettlements(
    grid: Iterable<HexTile>,
    settlements: Settlement[],
    worldMap: WorldMap
  ): void {
    this.roadRenderer.drawRoadsFromSettlements(this.roadGraphics, grid, settlements, worldMap);
  }

  // ─── Vegetation & Decorations ─────────────────────────────────

  drawVegetation(hex: HexTile): void {
    if (hex.vegetation === VegetationType.None) return;
    
    const key = `${hex.col},${hex.row}`;
    let gfx = this.decorationGraphics.get(key);
    
    if (!gfx) {
      gfx = new Graphics();
      const pos = hexIsoPosition(hex);
      gfx.position.set(Math.round(pos.x), Math.round(pos.y));
      this.decorationGraphics.set(key, gfx);
      this.decorationContainer.addChild(gfx);
    }

    const corners = isoCorners(hex);
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;

    if (hex.vegetation === VegetationType.Tree) {
      this.vegetationRenderer.drawForest(gfx, hex, cx, cy);
    } else {
      this.vegetationRenderer.drawBush(gfx, cx, cy);
    }
  }

  /** Draw rocks on rough terrain tiles */
  drawRocks(hex: HexTile): void {
    if (!hex.isRough || hex.building !== BuildingType.None) return;
    
    const key = `${hex.col},${hex.row}`;
    let gfx = this.decorationGraphics.get(key);
    
    if (!gfx) {
      gfx = new Graphics();
      const pos = hexIsoPosition(hex);
      gfx.position.set(Math.round(pos.x), Math.round(pos.y));
      this.decorationGraphics.set(key, gfx);
      this.decorationContainer.addChild(gfx);
    }

    const corners = isoCorners(hex);
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;

    this.vegetationRenderer.drawRocks(gfx, hex, cx, cy);
  }

  /** Draw building on a tile */
  drawBuilding(hex: HexTile, allTiles: Iterable<HexTile>): void {
    const key = `${hex.col},${hex.row}`;
    let gfx = this.decorationGraphics.get(key);
    
    if (!gfx) {
      gfx = new Graphics();
      const pos = hexIsoPosition(hex);
      gfx.position.set(Math.round(pos.x), Math.round(pos.y));
      this.decorationGraphics.set(key, gfx);
      this.decorationContainer.addChild(gfx);
    }

    const corners = isoCorners(hex);
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;

    // Draw settlement connections first (paths, roads)
    if (hex.settlementId !== undefined) {
      this.settlementRenderer.drawSettlementConnections(gfx, hex, allTiles, corners);
    }

    // Then draw the building on top
    if (hex.building === BuildingType.None) return;

    // Special handling for roads/bridges/piers
    if (hex.building === BuildingType.Pier) {
      this.roadRenderer.drawPier(gfx, cx, cy);
    } else if (hex.building === BuildingType.Bridge) {
      this.roadRenderer.drawBridge(gfx, cx, cy);
    } else if (hex.building === BuildingType.Dock) {
      this.roadRenderer.drawDock(gfx, cx, cy);
    } else {
      this.buildingRenderer.drawBuilding(gfx, hex.building, cx, cy, hex);
    }
  }

  /** Draw perimeter walls/fences for settlements */
  drawSettlementPerimeter(hex: HexTile, allTiles: Iterable<HexTile>): void {
    if (hex.settlementId === undefined) return;

    const key = `${hex.col},${hex.row}`;
    let gfx = this.decorationGraphics.get(key);
    
    if (!gfx) {
      gfx = new Graphics();
      const pos = hexIsoPosition(hex);
      gfx.position.set(Math.round(pos.x), Math.round(pos.y));
      this.decorationGraphics.set(key, gfx);
      this.decorationContainer.addChild(gfx);
    }

    const corners = isoCorners(hex);
    this.settlementRenderer.drawSettlementPerimeter(gfx, hex, allTiles, corners);
  }

  /** Draw resource icon on a tile */
  drawResource(hex: HexTile): void {
    if (!hex.resource || hex.resource.type === "none") return;
    
    // Don't draw resources on tiles with buildings - the building shows it's being exploited!
    if (hex.building !== BuildingType.None) return;

    const key = `${hex.col},${hex.row}`;
    let gfx = this.decorationGraphics.get(key);
    
    if (!gfx) {
      gfx = new Graphics();
      const pos = hexIsoPosition(hex);
      gfx.position.set(Math.round(pos.x), Math.round(pos.y));
      this.decorationGraphics.set(key, gfx);
      this.decorationContainer.addChild(gfx);
    }

    const corners = isoCorners(hex);
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;

    this.resourceRenderer.drawResource(gfx, hex.resource.type, cx, cy);
  }
}
