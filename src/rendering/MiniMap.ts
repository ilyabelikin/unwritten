import { Container, Graphics, FederatedPointerEvent } from "pixi.js";
import { WorldMap } from "../world/WorldMap";
import { HexTile } from "../world/HexTile";
import { Palette } from "./Palette";
import { TerrainType } from "../world/Terrain";
import { hexIsoCenter } from "./Isometric";

/**
 * MiniMap — displays a miniature view of the entire world in the top-right corner.
 * Clicking on it moves the camera to that location.
 */
export class MiniMap {
  readonly container: Container;
  private background: Graphics;
  private worldGraphics: Graphics;
  private playerMarker: Graphics;
  private borderGraphics: Graphics;

  private worldMap: WorldMap;
  private screenWidth: number;
  private screenHeight: number;

  private miniMapWidth: number = 200;
  private miniMapHeight: number = 200;
  private padding: number = 20;

  /** Callback when user clicks on the mini-map. */
  onClickLocation?: (worldX: number, worldY: number) => void;

  constructor(worldMap: WorldMap, screenWidth: number, screenHeight: number) {
    this.worldMap = worldMap;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.container = new Container({ label: "minimap" });
    this.container.eventMode = "static";

    // Background
    this.background = new Graphics();
    this.container.addChild(this.background);

    // World tiles
    this.worldGraphics = new Graphics();
    this.container.addChild(this.worldGraphics);

    // Player marker
    this.playerMarker = new Graphics();
    this.container.addChild(this.playerMarker);

    // Border
    this.borderGraphics = new Graphics();
    this.container.addChild(this.borderGraphics);

    this.calculateMiniMapSize();
    this.layout();
    this.renderWorld();
    this.drawBorder();
    this.setupInteraction();
  }

  /** Calculate minimap dimensions based on world aspect ratio. */
  private calculateMiniMapSize(): void {
    // Calculate world bounds in isometric space
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.worldMap.grid.forEach((hex) => {
      const center = hexIsoCenter(hex);
      minX = Math.min(minX, center.x);
      maxX = Math.max(maxX, center.x);
      minY = Math.min(minY, center.y);
      maxY = Math.max(maxY, center.y);
    });

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    const aspectRatio = worldWidth / worldHeight;

    // Set a max size for the minimap
    const maxSize = 200;

    if (aspectRatio > 1) {
      // World is wider than tall
      this.miniMapWidth = maxSize;
      this.miniMapHeight = maxSize / aspectRatio;
    } else {
      // World is taller than wide
      this.miniMapHeight = maxSize;
      this.miniMapWidth = maxSize * aspectRatio;
    }
  }

  /** Position the mini-map in the top-right corner. */
  private layout(): void {
    this.container.position.set(
      this.screenWidth - this.miniMapWidth - this.padding,
      this.padding,
    );
  }

  /** Draw the border around the mini-map. */
  private drawBorder(): void {
    this.borderGraphics.clear();
    this.borderGraphics.rect(0, 0, this.miniMapWidth, this.miniMapHeight);
    this.borderGraphics.stroke({ color: Palette.uiAccent, width: 2 });
  }

  /** Render a simplified view of the entire world. */
  private renderWorld(): void {
    this.background.clear();
    this.background.rect(0, 0, this.miniMapWidth, this.miniMapHeight);
    this.background.fill({ color: 0x000000, alpha: 0.7 });

    this.worldGraphics.clear();

    // Calculate world bounds in isometric space
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.worldMap.grid.forEach((hex) => {
      const center = hexIsoCenter(hex);
      minX = Math.min(minX, center.x);
      maxX = Math.max(maxX, center.x);
      minY = Math.min(minY, center.y);
      maxY = Math.max(maxY, center.y);
    });

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    // Calculate scale to fit world in mini-map with some padding
    const mapPadding = 10;
    const scaleX = (this.miniMapWidth - mapPadding * 2) / worldWidth;
    const scaleY = (this.miniMapHeight - mapPadding * 2) / worldHeight;
    const scale = Math.min(scaleX, scaleY);

    // Draw each hex as a small rectangle (simplified)
    this.worldMap.grid.forEach((hex) => {
      if (!hex.explored) return; // Only show explored tiles

      const center = hexIsoCenter(hex);
      const x = (center.x - minX) * scale + mapPadding;
      const y = (center.y - minY) * scale + mapPadding;

      const color = this.getTerrainColor(hex);
      const size = 2; // Small pixels for each tile

      this.worldGraphics.rect(x - size / 2, y - size / 2, size, size);
      this.worldGraphics.fill({ color, alpha: hex.visible ? 1.0 : 0.5 });
    });
  }

  /** Update the mini-map (called when fog of war changes). */
  update(): void {
    this.renderWorld();
  }

  /** Update the player marker position. */
  updatePlayerPosition(hex: HexTile): void {
    this.playerMarker.clear();

    // Calculate world bounds (same as in renderWorld)
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.worldMap.grid.forEach((h) => {
      const center = hexIsoCenter(h);
      minX = Math.min(minX, center.x);
      maxX = Math.max(maxX, center.x);
      minY = Math.min(minY, center.y);
      maxY = Math.max(maxY, center.y);
    });

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    const mapPadding = 10;
    const scaleX = (this.miniMapWidth - mapPadding * 2) / worldWidth;
    const scaleY = (this.miniMapHeight - mapPadding * 2) / worldHeight;
    const scale = Math.min(scaleX, scaleY);

    const center = hexIsoCenter(hex);
    const x = (center.x - minX) * scale + mapPadding;
    const y = (center.y - minY) * scale + mapPadding;

    // Draw player as a bright circle
    this.playerMarker.circle(x, y, 3);
    this.playerMarker.fill({ color: 0xffff00 });
    this.playerMarker.circle(x, y, 3);
    this.playerMarker.stroke({ color: 0xffffff, width: 1 });
  }

  /** Handle clicks on the mini-map. */
  private setupInteraction(): void {
    this.container.on("pointerdown", (event: FederatedPointerEvent) => {
      const localPos = event.getLocalPosition(this.container);

      // Calculate world bounds
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      this.worldMap.grid.forEach((hex) => {
        const center = hexIsoCenter(hex);
        minX = Math.min(minX, center.x);
        maxX = Math.max(maxX, center.x);
        minY = Math.min(minY, center.y);
        maxY = Math.max(maxY, center.y);
      });

      const worldWidth = maxX - minX;
      const worldHeight = maxY - minY;

      const mapPadding = 10;
      const scaleX = (this.miniMapWidth - mapPadding * 2) / worldWidth;
      const scaleY = (this.miniMapHeight - mapPadding * 2) / worldHeight;
      const scale = Math.min(scaleX, scaleY);

      // Convert click position to world coordinates
      const worldX = (localPos.x - mapPadding) / scale + minX;
      const worldY = (localPos.y - mapPadding) / scale + minY;

      this.onClickLocation?.(worldX, worldY);
    });
  }

  /** Get a simplified color for a terrain type. */
  private getTerrainColor(hex: HexTile): number {
    switch (hex.terrain) {
      case TerrainType.DeepWater:
        return 0x1a4a7a;
      case TerrainType.ShallowWater:
        return 0x2d6ba8;
      case TerrainType.Shore:
        return 0xc9b896;
      case TerrainType.Plains:
        return 0x6b8e4e;
      case TerrainType.Hills:
        return 0x8a9a7a;
      case TerrainType.Mountains:
        return 0x7a7a7a;
      default:
        return 0x808080;
    }
  }

  /** Handle screen resize. */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.layout();
  }
}
