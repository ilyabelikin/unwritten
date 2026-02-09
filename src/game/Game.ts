import { Application, Container, Ticker } from "pixi.js";
import { WorldMap } from "../world/WorldMap";
import { HexTile } from "../world/HexTile";
import { getAPCost } from "../world/Terrain";
import { TileRenderer } from "../rendering/TileRenderer";
import { CharacterRenderer } from "../rendering/CharacterRenderer";
import { HighlightOverlay } from "../rendering/HighlightOverlay";
import { FogOfWarOverlay } from "../rendering/FogOfWarOverlay";
import { HUD } from "../rendering/HUD";
import { MiniMap } from "../rendering/MiniMap";
import { PathOverlay } from "../rendering/PathOverlay";
import { CharacterSheet } from "../rendering/CharacterSheet";
import { hexIsoCenter, isoToFlat } from "../rendering/Isometric";
import { Character } from "../entity/Character";
import { Camera } from "./Camera";
import { InputManager } from "./InputManager";
import { findPath, isPathValid } from "../pathfinding/Pathfinding";

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
  private pathOverlay: PathOverlay;
  private hud: HUD;
  private miniMap: MiniMap;
  private characterSheet: CharacterSheet;
  private character: Character;
  private camera: Camera;
  private input: InputManager;

  /** Root container for the world (camera transforms this). */
  private worldContainer: Container;

  constructor(app: Application) {
    this.app = app;

    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    
    // Check for debug mode in URL
    this.debugMode = params.has('debug_mode');
    if (this.debugMode) {
      console.log('[Debug Mode] Enabled - Press R to toggle roads');
    }

    // Get or generate seed
    let seed = params.get('seed');
    if (!seed) {
      // Generate random seed if none provided
      seed = "unwritten-" + Math.floor(Math.random() * 10000);
    }
    
    // Update URL with seed parameter (as first parameter)
    this.updateURLWithSeed(seed);
    
    console.log(`[Unwritten] World Seed: ${seed}`);

    // Create the world container
    this.worldContainer = new Container({ label: "world" });
    this.app.stage.addChild(this.worldContainer);

    // Generate the world
    this.worldMap = new WorldMap({
      width: 120,
      height: 120,
      seed: seed,
    });

    // Set up rendering (order matters for z-index)
    // 1. Tiles (terrain base layer)
    this.tileRenderer = new TileRenderer();
    this.worldContainer.addChild(this.tileRenderer.container);

    // 2. Roads layer (sits between terrain and buildings/vegetation)
    this.worldContainer.addChild(this.tileRenderer.roadContainer);

    // 3. Decorations layer (buildings, vegetation, fences - on top of roads)
    this.worldContainer.addChild(this.tileRenderer.decorationContainer);

    // 4. Fog overlay
    this.fogOverlay = new FogOfWarOverlay();
    this.worldContainer.addChild(this.fogOverlay.container);

    this.pathOverlay = new PathOverlay();
    this.worldContainer.addChild(this.pathOverlay.container);

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
      this.app.screen.height,
    );

    // Set up HUD (added to stage, not world — stays fixed on screen)
    this.hud = new HUD(this.app.screen.width, this.app.screen.height);
    this.app.stage.addChild(this.hud.container);

    // Set up mini-map (added to stage, not world — stays fixed on screen)
    this.miniMap = new MiniMap(
      this.worldMap,
      this.app.screen.width,
      this.app.screen.height,
    );
    this.app.stage.addChild(this.miniMap.container);

    // Set up character sheet (added to stage, not world — modal overlay)
    this.characterSheet = new CharacterSheet(
      this.character,
      this.app.screen.width,
      this.app.screen.height,
    );
    this.app.stage.addChild(this.characterSheet.container);

    // Set up input
    this.input = new InputManager(this.app, this.camera);
  }

  start(): void {
    console.log(
      `[Unwritten] Game started — canvas ${this.app.screen.width}x${this.app.screen.height}`,
    );
    console.log(
      `[Unwritten] World: ${this.worldMap.width}x${this.worldMap.height} hexes`,
    );

    // Build tile graphics (base terrain layer)
    this.tileRenderer.buildTiles(this.worldMap.grid);

    // Draw roads connecting settlements (BEFORE vegetation and buildings)
    this.tileRenderer.drawRoadsFromSettlements(this.worldMap.grid, this.worldMap.settlements, this.worldMap);

    // Store original road state for debug mode
    if (this.debugMode) {
      this.worldMap.grid.forEach((hex) => {
        const key = `${hex.col},${hex.row}`;
        this.originalRoadState.set(key, hex.hasRoad);
      });
    }

    // Draw vegetation, rocks, resources, and buildings on tiles (these go on top of roads)
    this.worldMap.grid.forEach((hex) => {
      this.tileRenderer.drawVegetation(hex);
      this.tileRenderer.drawRocks(hex);
      this.tileRenderer.drawResource(hex);
      this.tileRenderer.drawBuilding(hex, this.worldMap.grid);
    });

    // Draw settlement perimeters (walls/fences) after all buildings
    this.worldMap.grid.forEach((hex) => {
      this.tileRenderer.drawSettlementPerimeter(hex, this.worldMap.grid);
    });

    // Position character
    const startPos = this.character.getWorldPosition();
    this.characterRenderer.snapToPosition(startPos.x, startPos.y);

    // Center camera on character
    this.camera.setTarget(startPos.x, startPos.y);
    this.camera.snapToTarget();

    // Apply initial fog of war and highlights
    this.updateFogOfWar();
    // this.updateNeighborHighlights(); // Removed: AP cost neighbor highlights

    // Update mini-map with initial position
    this.miniMap.updatePlayerPosition(this.character.currentTile);

    // Wire up input
    this.setupInput();

    // Wire up character callbacks
    this.character.onMove = () => {
      const pos = this.character.getWorldPosition();
      const isOnRoad = this.character.currentTile.hasRoad;
      this.characterRenderer.setPosition(pos.x, pos.y, isOnRoad);
      this.camera.setTarget(pos.x, pos.y);
      this.updateFogOfWar();
      // this.updateNeighborHighlights(); // Removed: AP cost neighbor highlights
      this.miniMap.updatePlayerPosition(this.character.currentTile);
      // Clear selection on move
      this.selectedTile = null;
      this.hud.hideTooltip();
      this.highlightOverlay.clearHover();
      this.pathOverlay.clearPath();
    };

    this.character.onAPChange = (ap) => {
      this.hud.setAP(ap);
    };

    this.character.onNewTurn = (turn) => {
      this.hud.setTurn(turn);
      this.hud.setAP(this.character.ap);
      // Don't clear movement queue - continue moving across turns
      // Movement queue will only be cleared if player is attacked or clicks elsewhere
      // this.updateNeighborHighlights(); // Removed: AP cost neighbor highlights
    };

    // HUD: End Turn button
    this.hud.onEndTurn = () => {
      this.character.endTurn();
    };

    // Mini-map: Click to move camera
    this.miniMap.onClickLocation = (worldX, worldY) => {
      this.camera.setTarget(worldX, worldY);
      this.camera.snapToTarget();
    };

    // Character: Left click to open character sheet
    this.characterRenderer.onLeftClick = () => {
      this.characterSheet.show();
      this.input.setEnabled(false); // Disable map input
    };
    
    // Character: Right click to show location tooltip
    this.characterRenderer.onRightClick = () => {
      const tile = this.character.currentTile;
      this.selectedTile = tile;
      this.highlightOverlay.showHover(tile);
      
      const movementCost = this.getMovementCostForTile(tile);
      const settlement = this.worldMap.getSettlementForTile(tile);
      
      this.hud.showTooltip(
        tile.terrain, 
        tile.isRough, 
        movementCost, 
        this.character.ap, 
        tile.building,
        settlement,
        tile.vegetation,
        tile.treeDensity,
        tile.resource
      );
    };

    // Character Sheet: Re-enable input when closed
    this.characterSheet.onClose = () => {
      this.input.setEnabled(true);
    };

    // Start game loop
    this.app.ticker.add(this.gameLoop, this);

    // Handle resize
    window.addEventListener("resize", () => {
      this.camera.resize(this.app.screen.width, this.app.screen.height);
      this.hud.resize(this.app.screen.width, this.app.screen.height);
      this.miniMap.resize(this.app.screen.width, this.app.screen.height);
      this.characterSheet.resize(this.app.screen.width, this.app.screen.height);
    });

    console.log(
      `[Unwritten] Character placed at col=${this.character.currentTile.col}, row=${this.character.currentTile.row}`,
    );
  }

  private gameLoop(ticker: Ticker): void {
    const dt = ticker.deltaTime / 60; // normalize to seconds-like value
    this.camera.update(dt);
    this.characterRenderer.update(dt);
    this.hud.update(dt);
    
    // Process movement queue
    this.processMovementQueue();
  }

  private setupInput(): void {
    // Left click (no drag): command movement with pathfinding
    this.input.onSelect((worldX, worldY) => {
      this.handleMoveClick(worldX, worldY);
    });

    // Right click: select tile for info
    this.input.onMove((worldX, worldY) => {
      this.handleSelectClick(worldX, worldY);
    });

    // Hover: show path preview and terrain tooltip
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
      if (key === "i" || key === "I") {
        // Toggle character sheet
        if (this.characterSheet.container.visible) {
          this.characterSheet.hide();
        } else {
          this.characterSheet.show();
          this.input.setEnabled(false);
        }
      }
      if ((key === "r" || key === "R") && this.debugMode) {
        this.toggleRoads();
      }
    });

    // Mouse wheel zoom
    this.input.onWheel((delta, screenX, screenY) => {
      this.camera.zoom(delta, screenX, screenY);
    });
  }

  /** Currently selected tile (shown with info tooltip). */
  private selectedTile: HexTile | null = null;

  /** Queue of tiles to move through (for pathfinding movement). */
  private movementQueue: HexTile[] = [];

  /** Is the character currently animating a move? */
  private isMoving: boolean = false;

  /** Debug mode flag (enabled via ?debug_mode URL parameter) */
  private debugMode: boolean = false;

  /** Store original road state for debug toggle */
  private originalRoadState: Map<string, boolean> = new Map();

  /** Are roads currently hidden in debug mode? */
  private roadsHidden: boolean = false;

  /**
   * Update the browser URL with the seed parameter (as first parameter).
   * Preserves other parameters like debug_mode.
   */
  private updateURLWithSeed(seed: string): void {
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    
    // Add seed as the first parameter
    newParams.set('seed', seed);
    
    // Add all other existing parameters (except seed if it already exists)
    currentParams.forEach((value, key) => {
      if (key !== 'seed') {
        newParams.set(key, value);
      }
    });
    
    // Update URL without reloading the page
    const newURL = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newURL);
  }

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
    
    // Calculate movement cost if it's a neighbor
    const movementCost = this.getMovementCostForTile(hex);
    
    // Get settlement information if tile belongs to a settlement
    const settlement = this.worldMap.getSettlementForTile(hex);
    
    this.hud.showTooltip(
      hex.terrain, 
      hex.isRough, 
      movementCost, 
      this.character.ap, 
      hex.building,
      settlement,
      hex.vegetation,
      hex.treeDensity,
      hex.resource
    );
  }

  private handleMoveClick(worldX: number, worldY: number): void {
    const clickedHex = this.findHexAtPoint(worldX, worldY);
    if (!clickedHex || !clickedHex.explored) return;
    
    // Same tile as current destination - do nothing
    if (clickedHex.col === this.character.currentTile.col && 
        clickedHex.row === this.character.currentTile.row) {
      return;
    }
    
    // Find path to clicked tile
    const pathResult = findPath(
      this.character.currentTile,
      clickedHex,
      this.worldMap,
      true // Only use explored tiles
    );
    
    if (!pathResult.found || pathResult.path.length === 0) {
      console.log("No path found to target");
      return;
    }
    
    // Clear any existing movement and start new path
    this.movementQueue = [];
    this.isMoving = false;
    
    // Try to follow the path
    this.followPath(pathResult.path);
  }

  /** Track last hovered tile to avoid redundant tooltip updates. */
  private lastHoveredKey: string = "";

  private handleHover(
    worldX: number,
    worldY: number,
    screenX: number,
    screenY: number,
  ): void {
    // Don't show path preview if character is moving
    if (this.isMoving || this.movementQueue.length > 0) {
      return;
    }
    
    const hex = this.findHexAtPoint(worldX, worldY);
    if (!hex) {
      // Clear path on empty hover (tooltip only cleared when nothing is selected)
      this.pathOverlay.clearPath();
      this.lastHoveredKey = "";
      return;
    }

    const key = `${hex.col},${hex.row}`;
    if (key === this.lastHoveredKey) return;
    this.lastHoveredKey = key;

    // Don't show hover highlight, only show path preview

    // Show path preview if hovering over a different tile (no tooltip on hover)
    if (hex !== this.character.currentTile && hex.explored) {
      const pathResult = findPath(
        this.character.currentTile,
        hex,
        this.worldMap,
        true
      );
      
      if (pathResult.found && pathResult.path.length > 0) {
        const isValid = pathResult.totalCost <= this.character.ap;
        this.pathOverlay.showPath(pathResult.path, this.character.currentTile, isValid);
      } else {
        this.pathOverlay.clearPath();
      }
    } else {
      this.pathOverlay.clearPath();
    }
  }

  /** Update the highlight overlay showing reachable/unreachable neighbors. */
  private updateNeighborHighlights(): void {
    const neighbors = this.worldMap.getNeighbors(this.character.currentTile);
    const reachable: HexTile[] = [];
    const unreachable: HexTile[] = [];

    for (const n of neighbors) {
      if (!n.explored && !n.visible) continue; // Don't highlight hidden tiles
      const cost = getAPCost(
        n.hasRoad,
        n.isRough,
        n.treeDensity,
        this.character.currentTile.terrain,
        n.terrain,
      );
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
      { allowOutside: false },
    );
  }

  /**
   * Get the movement cost to reach a tile.
   * Returns direct cost for neighbors, or pathfinding cost for distant tiles.
   */
  private getMovementCostForTile(tile: HexTile): number | null {
    // Same tile as current position
    if (tile.col === this.character.currentTile.col && 
        tile.row === this.character.currentTile.row) {
      return null;
    }
    
    // Check if it's a neighbor for direct cost calculation
    const neighbors = this.worldMap.getNeighbors(this.character.currentTile);
    const isNeighbor = neighbors.some(
      (n) => n.col === tile.col && n.row === tile.row
    );
    
    if (isNeighbor) {
      // Direct neighbor - calculate immediate cost
      return getAPCost(
        tile.hasRoad,
        tile.isRough,
        tile.treeDensity,
        this.character.currentTile.terrain,
        tile.terrain,
      );
    }
    
    // Not a neighbor - use pathfinding to get total cost
    const pathResult = findPath(
      this.character.currentTile,
      tile,
      this.worldMap,
      true // Only use explored tiles
    );
    
    if (!pathResult.found) return null;
    
    return pathResult.totalCost;
  }

  /**
   * Follow a path, moving the character step by step until destination is reached.
   * This queues the movement, which will be processed one tile at a time by the game loop.
   * Movement continues across turns until the destination is reached or player is attacked.
   */
  private followPath(path: HexTile[]): void {
    if (path.length === 0) return;

    // Queue all tiles in the path
    // The movement will continue across turns automatically
    this.movementQueue = [...path];
    
    console.log(`Queued path of ${path.length} tiles`);
  }

  /**
   * Process the movement queue, moving one tile at a time.
   * Called every frame from the game loop.
   * Continues across turns until destination is reached.
   */
  private processMovementQueue(): void {
    // Don't start a new move if we're already moving
    if (this.isMoving) {
      // Check if the character has reached their target
      if (this.isCharacterAtTarget()) {
        this.isMoving = false;
      } else {
        return; // Still animating
      }
    }

    // If no more tiles in queue, we're done
    if (this.movementQueue.length === 0) return;

    // Calculate AP cost for the next move (reuse this in tryMove to avoid duplication)
    const nextTile = this.movementQueue[0];
    const cost = getAPCost(
      nextTile.hasRoad,
      nextTile.isRough,
      nextTile.treeDensity,
      this.character.currentTile.terrain,
      nextTile.terrain,
    );

    // If we don't have enough AP, end the turn automatically and continue
    if (cost > this.character.ap) {
      console.log(`Ending turn to continue journey (need ${cost} AP, have ${this.character.ap})`);
      this.character.endTurn();
      // After turn ends, we'll have fresh AP and can continue
      return;
    }

    // Try to move, passing the pre-calculated cost to avoid redundant calculation
    const moved = this.character.tryMove(nextTile, this.worldMap, cost);
    if (moved) {
      // Remove the tile from the queue
      this.movementQueue.shift();
      this.isMoving = true;
      
      // Log progress
      if (this.movementQueue.length > 0) {
        console.log(`Moving... ${this.movementQueue.length} tiles remaining`);
      } else {
        console.log("Destination reached!");
      }
    } else {
      // Movement failed (should not happen with pathfinding), clear the queue
      console.log("Failed to move along path - clearing queue");
      this.movementQueue = [];
    }
  }

  /**
   * Stop the current movement (e.g., when player is attacked).
   * This can be called from combat or other systems.
   */
  stopMovement(): void {
    this.movementQueue = [];
    this.isMoving = false;
    console.log("Movement interrupted!");
  }

  /**
   * Check if the character has reached their target position (animation complete).
   */
  private isCharacterAtTarget(): boolean {
    const targetPos = this.character.getWorldPosition();
    const renderPos = this.characterRenderer.container.position;
    
    const dx = targetPos.x - renderPos.x;
    const dy = targetPos.y - renderPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Consider "reached" if within 2 pixels
    return distance < 2;
  }

  /**
   * Toggle roads visibility and effects (debug mode only).
   * Press R to hide roads, press R again to restore them.
   */
  private toggleRoads(): void {
    if (!this.debugMode) return;

    this.roadsHidden = !this.roadsHidden;

    if (this.roadsHidden) {
      // Hide roads: set all hasRoad to false and hide the road container
      console.log('[Debug Mode] Hiding roads...');
      this.worldMap.grid.forEach((hex) => {
        hex.hasRoad = false;
      });
      this.tileRenderer.roadContainer.visible = false;
    } else {
      // Restore roads: restore hasRoad from original state and show the road container
      console.log('[Debug Mode] Restoring roads...');
      this.worldMap.grid.forEach((hex) => {
        const key = `${hex.col},${hex.row}`;
        hex.hasRoad = this.originalRoadState.get(key) || false;
      });
      this.tileRenderer.roadContainer.visible = true;
    }

    // Update path preview if hovering
    if (this.lastHoveredKey) {
      const [col, row] = this.lastHoveredKey.split(',').map(Number);
      const hoveredHex = this.worldMap.grid.getHex({ col, row });
      if (hoveredHex && hoveredHex.explored) {
        const pathResult = findPath(
          this.character.currentTile,
          hoveredHex,
          this.worldMap,
          true
        );
        if (pathResult.found && pathResult.path.length > 0) {
          const isValid = pathResult.totalCost <= this.character.ap;
          this.pathOverlay.showPath(pathResult.path, this.character.currentTile, isValid);
        }
      }
    }

    // Update tooltip if a tile is selected
    if (this.selectedTile) {
      const movementCost = this.getMovementCostForTile(this.selectedTile);
      const settlement = this.worldMap.getSettlementForTile(this.selectedTile);
      this.hud.showTooltip(
        this.selectedTile.terrain, 
        this.selectedTile.isRough, 
        movementCost, 
        this.character.ap, 
        this.selectedTile.building,
        settlement,
        this.selectedTile.vegetation,
        this.selectedTile.treeDensity,
        this.selectedTile.resource
      );
    }
  }

  /** Update fog of war based on character's vision radius. */
  private updateFogOfWar(): void {
    const visionRadius = 5.33;
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
    this.fogOverlay.update(visibleTiles, exploredTiles, [
      ...this.worldMap.grid,
    ]);

    // Update mini-map to reflect new explored areas
    this.miniMap.update();
  }
}
