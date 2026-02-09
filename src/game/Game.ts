import { Application, Container, Ticker } from "pixi.js";
import { WorldMap } from "../world/WorldMap";
import { HexTile } from "../world/HexTile";
import { getAPCost } from "../world/Terrain";
import { TileRenderer } from "../rendering/TileRenderer";
import { CharacterRenderer } from "../rendering/CharacterRenderer";
import { HighlightOverlay } from "../rendering/HighlightOverlay";
import { FogOfWarOverlay } from "../rendering/FogOfWarOverlay";
import { HUD } from "../rendering/HUD";
import { hexIsoCenter, isoToFlat } from "../rendering/Isometric";
import { Character } from "../entity/Character";
import { Camera } from "./Camera";
import { InputManager } from "./InputManager";

/**
 * Main Game class — orchestrates world generation, rendering, input, and game loop.
 */
export class Game {
  private app: Application;
  private worldMap: WorldMap;
  private tileRenderer: TileRenderer;
  private characterRenderer: CharacterRenderer;
  private highlightOverlay: HighlightOverlay;
  private fogOverlay: FogOfWarOverlay;
  private hud: HUD;
  private character: Character;
  private camera: Camera;
  private input: InputManager;

  /** Root container for the world (camera transforms this). */
  private worldContainer: Container;

  constructor(app: Application) {
    this.app = app;

    // Create the world container
    this.worldContainer = new Container({ label: "world" });
    this.app.stage.addChild(this.worldContainer);

    // Generate the world
    this.worldMap = new WorldMap({
      width: 120,
      height: 120,
      seed: "unwritten-" + Math.floor(Math.random() * 10000),
    });

    // Set up rendering (order matters for z-index)
    this.tileRenderer = new TileRenderer();
    this.worldContainer.addChild(this.tileRenderer.container);

    this.fogOverlay = new FogOfWarOverlay();
    this.worldContainer.addChild(this.fogOverlay.container);

    this.highlightOverlay = new HighlightOverlay();
    this.worldContainer.addChild(this.highlightOverlay.container);

    this.characterRenderer = new CharacterRenderer();
    this.worldContainer.addChild(this.characterRenderer.container);

    // Find a start tile and create the character
    const startTile = this.worldMap.findStartTile();
    if (!startTile) throw new Error("Could not find a valid start tile!");
    this.character = new Character(startTile);

    // Set up camera
    this.camera = new Camera(
      this.worldContainer,
      this.app.screen.width,
      this.app.screen.height
    );

    // Set up HUD (added to stage, not world — stays fixed on screen)
    this.hud = new HUD(this.app.screen.width, this.app.screen.height);
    this.app.stage.addChild(this.hud.container);

    // Set up input
    this.input = new InputManager(this.app, this.camera);
  }

  start(): void {
    console.log(
      `[Unwritten] Game started — canvas ${this.app.screen.width}x${this.app.screen.height}`
    );
    console.log(
      `[Unwritten] World: ${this.worldMap.width}x${this.worldMap.height} hexes`
    );

    // Build tile graphics
    this.tileRenderer.buildTiles(this.worldMap.grid);

    // Draw vegetation on all tiles that have it
    this.worldMap.grid.forEach((hex) => {
      this.tileRenderer.drawVegetation(hex);
    });

    // Position character
    const startPos = this.character.getWorldPosition();
    this.characterRenderer.snapToPosition(startPos.x, startPos.y);

    // Center camera on character
    this.camera.setTarget(startPos.x, startPos.y);
    this.camera.snapToTarget();

    // Apply initial fog of war and highlights
    this.updateFogOfWar();
    this.updateNeighborHighlights();

    // Wire up input
    this.setupInput();

    // Wire up character callbacks
    this.character.onMove = () => {
      const pos = this.character.getWorldPosition();
      this.characterRenderer.setPosition(pos.x, pos.y);
      this.camera.setTarget(pos.x, pos.y);
      this.updateFogOfWar();
      this.updateNeighborHighlights();
      // Clear selection on move
      this.selectedTile = null;
      this.hud.hideTooltip();
      this.highlightOverlay.clearHover();
    };

    this.character.onAPChange = (ap) => {
      this.hud.setAP(ap);
    };

    this.character.onNewTurn = (turn) => {
      this.hud.setTurn(turn);
      this.hud.setAP(this.character.ap);
      this.updateNeighborHighlights();
    };

    // HUD: End Turn button
    this.hud.onEndTurn = () => {
      this.character.endTurn();
    };

    // Start game loop
    this.app.ticker.add(this.gameLoop, this);

    // Handle resize
    window.addEventListener("resize", () => {
      this.camera.resize(this.app.screen.width, this.app.screen.height);
      this.hud.resize(this.app.screen.width, this.app.screen.height);
    });

    console.log(
      `[Unwritten] Character placed at col=${this.character.currentTile.col}, row=${this.character.currentTile.row}`
    );
  }

  private gameLoop(ticker: Ticker): void {
    const dt = ticker.deltaTime / 60; // normalize to seconds-like value
    this.camera.update(dt);
    this.characterRenderer.update(dt);
  }

  private setupInput(): void {
    // Left click (no drag): select tile for info
    this.input.onSelect((worldX, worldY) => {
      this.handleSelectClick(worldX, worldY);
    });

    // Right click: command movement
    this.input.onMove((worldX, worldY) => {
      this.handleMoveClick(worldX, worldY);
    });

    // Hover: show terrain tooltip
    this.input.onHover((worldX, worldY, screenX, screenY) => {
      this.handleHover(worldX, worldY, screenX, screenY);
    });

    // Keyboard
    this.input.onKey((key) => {
      if (key === " " || key === "Enter") {
        this.character.endTurn();
      }
      if (key === "c" || key === "C") {
        this.camera.centerOnTarget();
      }
    });

    // Mouse wheel zoom
    this.input.onWheel((delta, screenX, screenY) => {
      this.camera.zoom(delta, screenX, screenY);
    });
  }

  /** Currently selected tile (shown with info tooltip). */
  private selectedTile: HexTile | null = null;

  private handleSelectClick(worldX: number, worldY: number): void {
    const hex = this.findHexAtPoint(worldX, worldY);
    if (!hex || !hex.explored) {
      // Deselect
      this.selectedTile = null;
      this.hud.hideTooltip();
      this.highlightOverlay.clearHover();
      return;
    }

    this.selectedTile = hex;
    this.highlightOverlay.showHover(hex);

    const isoCenter = hexIsoCenter(hex);
    const screenX = isoCenter.x + this.worldContainer.x;
    const screenY = isoCenter.y + this.worldContainer.y;
    this.hud.showTooltip(hex.terrain, screenX, screenY);
  }

  private handleMoveClick(worldX: number, worldY: number): void {
    const clickedHex = this.findHexAtPoint(worldX, worldY);
    if (!clickedHex) return;
    const moved = this.character.tryMove(clickedHex, this.worldMap);
    if (!moved) {
      this.hud.setAP(this.character.ap);
    }
  }

  /** Track last hovered tile to avoid redundant tooltip updates. */
  private lastHoveredKey: string = "";

  private handleHover(
    worldX: number,
    worldY: number,
    screenX: number,
    screenY: number
  ): void {
    const hex = this.findHexAtPoint(worldX, worldY);
    if (!hex) {
      // If nothing selected, hide tooltip on empty hover
      if (!this.selectedTile) this.hud.hideTooltip();
      this.lastHoveredKey = "";
      return;
    }

    const key = `${hex.col},${hex.row}`;
    if (key === this.lastHoveredKey) return;
    this.lastHoveredKey = key;

    // Show hover highlight (but don't override selection highlight)
    if ((hex.explored || hex.visible) && hex !== this.selectedTile) {
      this.highlightOverlay.showHover(hex);
    }

    // Show tooltip on hover for explored tiles (unless a tile is selected)
    if (!this.selectedTile && hex.explored) {
      this.hud.showTooltip(hex.terrain, screenX, screenY);
    }
  }

  /** Update the highlight overlay showing reachable/unreachable neighbors. */
  private updateNeighborHighlights(): void {
    const neighbors = this.worldMap.getNeighbors(this.character.currentTile);
    const reachable: HexTile[] = [];
    const unreachable: HexTile[] = [];

    for (const n of neighbors) {
      if (!n.explored && !n.visible) continue; // Don't highlight hidden tiles
      const cost = getAPCost(n.terrain);
      if (cost <= this.character.ap) {
        reachable.push(n);
      } else {
        unreachable.push(n);
      }
    }

    this.highlightOverlay.showReachableNeighbors(reachable, unreachable);
  }

  /**
   * Find the hex tile at an isometric world coordinate.
   * Reverses the iso transform, then uses honeycomb-grid's pointToHex.
   */
  private findHexAtPoint(isoX: number, isoY: number): HexTile | undefined {
    const flat = isoToFlat(isoX, isoY);
    return this.worldMap.grid.pointToHex(
      { x: flat.x, y: flat.y },
      { allowOutside: false }
    );
  }

  /** Update fog of war based on character's vision radius. */
  private updateFogOfWar(): void {
    const visionRadius = 8;
    const charTile = this.character.currentTile;

    const visibleTiles = new Set<string>();
    const exploredTiles = new Set<string>();

    this.worldMap.grid.forEach((hex) => {
      const dist = this.worldMap.hexDistance(charTile, hex);
      const key = `${hex.col},${hex.row}`;

      if (dist <= visionRadius) {
        hex.visible = true;
        hex.explored = true;
        visibleTiles.add(key);
        exploredTiles.add(key);
      } else if (hex.explored) {
        hex.visible = false;
        exploredTiles.add(key);
      } else {
        hex.visible = false;
      }
    });

    // Update the unified fog overlay
    this.fogOverlay.update(visibleTiles, exploredTiles, [...this.worldMap.grid]);
  }
}
