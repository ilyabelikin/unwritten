import { Application, Container, Ticker } from "pixi.js";
import { WorldMap } from "../world/WorldMap";
import { HexTile } from "../world/HexTile";
import { getAPCost, isWater, isPierOrDock } from "../world/Terrain";
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
import { EconomyManager } from "../world/SettlementEconomy";
import { extractResources, isExtractionBuilding } from "../world/ResourceExtraction";
import { getRecipesForBuilding, getRecipeById } from "../world/ProductionRecipe";
import { BuildingType, Settlement, calculateHousingCapacity } from "../world/Building";
import { HousingUpgradeSystem } from "../world/HousingUpgrade";
import { RESOURCE_CONFIG, ResourceType } from "../world/Resource";
import { GOOD_CONFIG, GoodType } from "../world/Goods";
import { GlobalPopulationManager } from "../world/population/PopulationManager";
import { WorkerAssignmentSystem, BuildingInfo } from "../world/population/WorkerAssignment";
import { createPerson } from "../world/population/LifeSimulation";
import { JobType } from "../world/population/Person";
import { getJobForBuilding, requiresWorkers } from "../world/population/JobMapping";
import { TradeManager } from "../world/trade/TradeManager";
import { TraderRenderer } from "../rendering/TraderRenderer";
import { SettlementNameRenderer } from "../rendering/SettlementNameRenderer";

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
  private economyManager: EconomyManager;
  private populationManager: GlobalPopulationManager;
  private workerAssignmentSystem: WorkerAssignmentSystem;
  private tradeManager: TradeManager;
  private housingUpgradeSystem: HousingUpgradeSystem;
  private traderRenderer: TraderRenderer;
  private settlementNameRenderer: SettlementNameRenderer;

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

    // 4. Character layer (player character)
    this.characterRenderer = new CharacterRenderer();
    this.worldContainer.addChild(this.characterRenderer.container);
    
    // 5. Traders layer (NPCs moving on map)
    this.traderRenderer = new TraderRenderer();
    this.worldContainer.addChild(this.traderRenderer.container);

    // 6. Fog overlay (covers everything below - terrain, decorations, characters, traders)
    this.fogOverlay = new FogOfWarOverlay();
    this.worldContainer.addChild(this.fogOverlay.container);

    // 7. Path overlay (shows movement path, on top of fog)
    this.pathOverlay = new PathOverlay();
    this.worldContainer.addChild(this.pathOverlay.container);

    // 8. Highlight overlay (shows tile highlights, on top of fog)
    this.highlightOverlay = new HighlightOverlay();
    this.worldContainer.addChild(this.highlightOverlay.container);
    
    // 9. Settlement names layer (always visible, even through fog)
    this.settlementNameRenderer = new SettlementNameRenderer();
    this.worldContainer.addChild(this.settlementNameRenderer.container);

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
    
    // Initialize economy manager
    this.economyManager = new EconomyManager();
    
    // Initialize population manager
    this.populationManager = new GlobalPopulationManager();
    this.workerAssignmentSystem = new WorkerAssignmentSystem();
    
    // Initialize housing upgrade system
    this.housingUpgradeSystem = new HousingUpgradeSystem();
    
    // Initialize trade manager
    this.tradeManager = new TradeManager(this.worldMap.grid, this.worldMap.settlements);
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
    
    // Render settlement names
    this.settlementNameRenderer.update(this.worldMap.settlements, this.worldMap.grid);
    
    // Initialize economies for all settlements
    this.initializeEconomies();
    this.initializePopulations();
    this.initializeTreasuries(); // Initialize settlement money based on population
    
    // Run initial economy tick for turn 1
    console.log(`[Game] Initial economy processing for turn 1`);
    this.economyTick();

    // Wire up input
    this.setupInput();

    // Wire up character callbacks
    this.character.onNewTurn = (turn: number) => {
      console.log(`[Game] Turn ${turn} started - processing economy`);
      // Update HUD
      this.hud.setTurn(turn);
      this.hud.setAP(this.character.ap);
      // Process economy
      this.economyTick();
      // Refresh tooltip if a tile is selected
      this.refreshSelectedTileTooltip();
    };
    
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

    this.character.onEmbark = () => {
      this.hud.setEmbarked(true);
      this.characterRenderer.setEmbarked(true);
    };

    this.character.onDisembark = () => {
      this.hud.setEmbarked(false);
      this.characterRenderer.setEmbarked(false);
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
      const settlementIndex = settlement ? this.worldMap.settlements.indexOf(settlement) : -1;
      const economyData = settlement ? this.getSettlementEconomyData(settlement) : undefined;
      const populationData = settlementIndex >= 0 ? this.getSettlementPopulationData(settlementIndex) : undefined;
      const tradeData = settlementIndex >= 0 ? this.getSettlementTradeData(settlementIndex) : undefined;
      const tradersAtTile = this.getTradersAtTile(tile);
      
      this.hud.showTooltip(
        tile.terrain, 
        tile.isRough, 
        movementCost, 
        this.character.ap, 
        tile.building,
        settlement,
        tile.vegetation,
        tile.treeDensity,
        tile.resource,
        economyData,
        populationData,
        tradeData,
        tradersAtTile
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
    
    // Update traders
    const allTraders = this.tradeManager.getAllTraders();
    this.traderRenderer.update(allTraders);
    
    // Process movement queue
    this.processMovementQueue();
    
    // Economy ticks on turn changes (via character.onNewTurn callback)
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
    const settlementIndex = settlement ? this.worldMap.settlements.indexOf(settlement) : -1;
    const economyData = settlement ? this.getSettlementEconomyData(settlement) : undefined;
    const populationData = settlementIndex >= 0 ? this.getSettlementPopulationData(settlementIndex) : undefined;
    const tradeData = settlementIndex >= 0 ? this.getSettlementTradeData(settlementIndex) : undefined;
    const tradersAtTile = this.getTradersAtTile(hex);
    
    this.hud.showTooltip(
      hex.terrain, 
      hex.isRough, 
      movementCost, 
      this.character.ap, 
      hex.building,
      settlement,
      hex.vegetation,
      hex.treeDensity,
      hex.resource,
      economyData,
      populationData,
      tradeData,
      tradersAtTile
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
      true, // Only use explored tiles
      this.character.embarked // Pass embarked state
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
        true,
        this.character.embarked
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
      
      // Check water movement restrictions
      const toWater = isWater(n.terrain);
      const fromPierOrDock = isPierOrDock(this.character.currentTile);
      const toPierOrDock = isPierOrDock(n);
      
      // Can't move to water unless embarked or on a pier/dock
      // Exception: piers/docks are always accessible from land
      if (toWater && !toPierOrDock && !this.character.embarked && !fromPierOrDock) {
        unreachable.push(n);
        continue;
      }
      
      // Can't disembark on regular land
      if (this.character.embarked && !toWater && !toPierOrDock) {
        unreachable.push(n);
        continue;
      }
      
      // Will be embarked if: already embarked, or embarking from pier to water (but not to another pier)
      const willBeEmbarked = this.character.embarked || (fromPierOrDock && toWater && !toPierOrDock);
      const cost = getAPCost(
        n.hasRoad,
        n.isRough,
        n.treeDensity,
        this.character.currentTile.terrain,
        n.terrain,
        willBeEmbarked && toWater,
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
      // Determine if we would be embarked when moving to this tile
      const toWater = isWater(tile.terrain);
      const fromPierOrDock = isPierOrDock(this.character.currentTile);
      const toPierOrDock = isPierOrDock(tile);
      // Will be embarked if: already embarked, or embarking from pier to water (but not to another pier)
      const willBeEmbarked = this.character.embarked || (fromPierOrDock && toWater && !toPierOrDock);
      
      return getAPCost(
        tile.hasRoad,
        tile.isRough,
        tile.treeDensity,
        this.character.currentTile.terrain,
        tile.terrain,
        willBeEmbarked && toWater,
      );
    }
    
    // Not a neighbor - use pathfinding to get total cost
    const pathResult = findPath(
      this.character.currentTile,
      tile,
      this.worldMap,
      true, // Only use explored tiles
      this.character.embarked // Pass embarked state
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
    
    // Determine if we'll be embarked when moving to this tile
    const toWater = isWater(nextTile.terrain);
    const fromPierOrDock = isPierOrDock(this.character.currentTile);
    const toPierOrDock = isPierOrDock(nextTile);
    // Will be embarked if: already embarked, or embarking from pier to water (but not to another pier)
    const willBeEmbarked = this.character.embarked || (fromPierOrDock && toWater && !toPierOrDock);
    
    const cost = getAPCost(
      nextTile.hasRoad,
      nextTile.isRough,
      nextTile.treeDensity,
      this.character.currentTile.terrain,
      nextTile.terrain,
      willBeEmbarked && toWater,
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
          true,
          this.character.embarked
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
      const settlementIndex = settlement ? this.worldMap.settlements.indexOf(settlement) : -1;
      const economyData = settlement ? this.getSettlementEconomyData(settlement) : undefined;
      const populationData = settlementIndex >= 0 ? this.getSettlementPopulationData(settlementIndex) : undefined;
      this.hud.showTooltip(
        this.selectedTile.terrain, 
        this.selectedTile.isRough, 
        movementCost, 
        this.character.ap, 
        this.selectedTile.building,
        settlement,
        this.selectedTile.vegetation,
        this.selectedTile.treeDensity,
        this.selectedTile.resource,
        economyData,
        populationData
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
    
    // Update settlement names to reflect fog of war state (blurred for unexplored)
    this.settlementNameRenderer.update(this.worldMap.settlements, this.worldMap.grid);
  }

  /**
   * Get economy data for a settlement to display in HUD
   */
  private getSettlementEconomyData(settlement: Settlement): { resources: Array<{ name: string; amount: number }>; goods: Array<{ name: string; amount: number }> } | undefined {
    // Find the settlement index
    const settlementIndex = this.worldMap.settlements.indexOf(settlement);
    if (settlementIndex === -1) return undefined;
    
    const economy = this.economyManager.getEconomy(settlementIndex);
    if (!economy) return undefined;
    
    // Get resources
    const resources = economy.getAllResources()
      .map(r => ({
        name: RESOURCE_CONFIG[r.type].name,
        amount: r.amount
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Get goods
    const goods = economy.getAllGoods()
      .map(g => ({
        name: GOOD_CONFIG[g.type].name,
        amount: g.amount
      }))
      .sort((a, b) => b.amount - a.amount);
    
    return { resources, goods };
  }

  /**
   * Get population data for a settlement (for HUD display)
   */
  private getSettlementPopulationData(settlementIndex: number) {
    const population = this.populationManager.getPopulation(settlementIndex);
    if (!population) return undefined;
    
    const settlement = this.worldMap.settlements[settlementIndex];
    const housingCapacity = calculateHousingCapacity(
      settlement.tiles,
      (col, row) => {
        const tile = this.worldMap.getTile({ col, row });
        return tile ? { building: tile.building, housingDensity: tile.housingDensity } : undefined;
      }
    );
    
    // Get job counts
    const jobCountsMap = population.getPopulationByJob();
    const jobCounts = Array.from(jobCountsMap.entries())
      .filter(([job, count]) => count > 0 && job !== JobType.None)
      .map(([job, count]) => ({
        job: job.charAt(0).toUpperCase() + job.slice(1) + "s",
        count
      }))
      .sort((a, b) => b.count - a.count);
    
    // Count housing tiles and calculate average density
    const housingTiles = settlement.tiles.filter(tilePos => {
      const tile = this.worldMap.getTile({ col: tilePos.col, row: tilePos.row });
      return tile && (tile.building === BuildingType.House || 
                      tile.building === BuildingType.CityHouse || 
                      tile.building === BuildingType.FishingHut);
    });
    
    const avgDensity = housingTiles.length > 0
      ? housingTiles.reduce((sum, tilePos) => {
          const tile = this.worldMap.getTile({ col: tilePos.col, row: tilePos.row });
          return sum + (tile?.housingDensity || 1);
        }, 0) / housingTiles.length
      : 0;
    
    return {
      totalPopulation: population.getTotalPopulation(),
      workingPopulation: population.getWorkingPopulation(),
      housing: housingCapacity,
      housingTiles: housingTiles.length,
      avgDensity: Math.round(avgDensity * 10) / 10, // Round to 1 decimal
      avgHealth: population.getAverageHealth(),
      avgHunger: population.getAverageHunger(),
      jobCounts,
    };
  }

  /**
   * Get trade data for a settlement (for HUD display)
   */
  private getSettlementTradeData(settlementIndex: number) {
    const market = this.tradeManager.getGlobalMarket().getMarket(settlementIndex);
    if (!market) return undefined;
    
    const traders = this.tradeManager.getAllTraders()
      .filter(t => t.homeSettlement === settlementIndex);
    
    const buyOffers = market.getBuyOffers().slice(0, 3).map(offer => ({
      material: String(offer.material).charAt(0).toUpperCase() + String(offer.material).slice(1).replace(/_/g, ' '),
      quantity: offer.quantity,
      price: Math.round(offer.pricePerUnit)
    }));
    
    const sellOffers = market.getSellOffers().slice(0, 3).map(offer => ({
      material: String(offer.material).charAt(0).toUpperCase() + String(offer.material).slice(1).replace(/_/g, ' '),
      quantity: offer.quantity,
      price: Math.round(offer.pricePerUnit)
    }));
    
    return {
      activeTraders: traders.length,
      buyOffers,
      sellOffers,
    };
  }

  /**
   * Get trader data for a specific tile (for HUD display)
   */
  private getTradersAtTile(tile: HexTile) {
    const traders = this.tradeManager.getAllTraders()
      .filter(t => t.currentTile.col === tile.col && t.currentTile.row === tile.row);
    
    if (traders.length === 0) return undefined;
    
    return traders.map(trader => {
      const fromSettlement = this.worldMap.settlements[trader.homeSettlement];
      let destination = "Unknown";
      let cargo = "Empty";
      
      if (trader.currentContract) {
        const toSettlement = this.worldMap.settlements[trader.currentContract.toSettlement];
        destination = toSettlement ? toSettlement.name : "Unknown";
        
        const material = String(trader.currentContract.material)
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        cargo = `${trader.currentContract.quantity} ${material}`;
      }
      
      return {
        name: trader.name,
        home: fromSettlement ? fromSettlement.name : "Unknown",
        state: this.formatTraderState(trader.state),
        destination,
        cargo,
        money: trader.money,
      };
    });
  }

  /**
   * Format trader state for display
   */
  private formatTraderState(state: string): string {
    switch (state) {
      case "idle": return "Idle";
      case "traveling_to_buy": return "Traveling to Buy";
      case "buying": return "Buying";
      case "traveling_to_sell": return "Traveling to Sell";
      case "selling": return "Selling";
      case "returning_home": return "Returning Home";
      default: return state;
    }
  }

  /**
   * Refresh the tooltip for the currently selected tile
   */
  private refreshSelectedTileTooltip(): void {
    if (!this.selectedTile) return;
    
    const movementCost = this.getMovementCostForTile(this.selectedTile);
    const settlement = this.worldMap.getSettlementForTile(this.selectedTile);
    const settlementIndex = settlement ? this.worldMap.settlements.indexOf(settlement) : -1;
    const economyData = settlement ? this.getSettlementEconomyData(settlement) : undefined;
    const populationData = settlementIndex >= 0 ? this.getSettlementPopulationData(settlementIndex) : undefined;
    const tradeData = settlementIndex >= 0 ? this.getSettlementTradeData(settlementIndex) : undefined;
    const tradersAtTile = this.getTradersAtTile(this.selectedTile);
    
    this.hud.showTooltip(
      this.selectedTile.terrain,
      this.selectedTile.isRough,
      movementCost,
      this.character.ap,
      this.selectedTile.building,
      settlement,
      this.selectedTile.vegetation,
      this.selectedTile.treeDensity,
      this.selectedTile.resource,
      economyData,
      populationData,
      tradeData,
      tradersAtTile
    );
  }

  /**
   * Initialize economies for all settlements
   */
  private initializeEconomies(): void {
    // Settlements don't have IDs, so we'll need to assign them indices
    this.worldMap.settlements.forEach((settlement, index) => {
      const economy = this.economyManager.getOrCreateEconomy(index);
      
      // Base stockpiles for all settlements (universal needs)
      const baseMultiplier = settlement.type === "city" ? 1.0 : settlement.type === "village" ? 0.5 : 0.2;
      
      // Universal food stockpiles (scaled by settlement size)
      economy.addGood(GoodType.Bread, Math.floor(30 * baseMultiplier));
      economy.addGood(GoodType.Meat, Math.floor(15 * baseMultiplier));
      
      // Scan settlement buildings and add appropriate stockpiles
      const buildingCounts = new Map<BuildingType, number>();
      for (const tile of settlement.tiles) {
        const hexTile = this.worldMap.getTile({ col: tile.col, row: tile.row });
        if (!hexTile || hexTile.building === BuildingType.None) continue;
        
        buildingCounts.set(hexTile.building, (buildingCounts.get(hexTile.building) || 0) + 1);
      }
      
      // For each building type, add relevant resources/goods
      buildingCounts.forEach((count, buildingType) => {
        const amount = count * 10; // Base amount per building
        
        // Extraction buildings -> add resources
        switch (buildingType) {
          case BuildingType.LumberCamp:
          case BuildingType.Sawmill:
            economy.addResource(ResourceType.Timber, amount);
            economy.addGood(GoodType.Planks, amount / 2);
            break;
          case BuildingType.Quarry:
            economy.addResource(ResourceType.Stone, amount);
            break;
          case BuildingType.ClayPit:
            economy.addResource(ResourceType.Clay, amount);
            break;
          case BuildingType.IronMine:
            economy.addResource(ResourceType.Iron, amount);
            break;
          case BuildingType.CopperMine:
            economy.addResource(ResourceType.Copper, amount);
            break;
          case BuildingType.SilverMine:
            economy.addResource(ResourceType.Silver, amount / 2);
            break;
          case BuildingType.GoldMine:
            economy.addResource(ResourceType.Gold, amount / 2);
            break;
          case BuildingType.GemMine:
            economy.addResource(ResourceType.Gems, amount / 2);
            break;
          case BuildingType.SaltWorks:
            economy.addResource(ResourceType.Salt, amount);
            break;
          case BuildingType.Pasture:
            economy.addResource(ResourceType.Livestock, amount);
            economy.addGood(GoodType.Meat, amount / 2);
            break;
          case BuildingType.Field:
            economy.addResource(ResourceType.Wheat, amount);
            economy.addGood(GoodType.Bread, amount);
            break;
          case BuildingType.FishingHut:
          case BuildingType.FishingBoat:
            economy.addResource(ResourceType.Fish, amount);
            economy.addGood(GoodType.PreparedFish, amount / 2);
            break;
          case BuildingType.HuntingLodge:
            economy.addResource(ResourceType.WildGame, amount);
            economy.addGood(GoodType.Meat, amount / 3);
            break;
            
          // Production buildings -> add goods
          case BuildingType.CharcoalBurner:
            economy.addGood(GoodType.Coal, amount * 2); // Critical resource
            break;
          case BuildingType.Smelter:
            economy.addGood(GoodType.Coal, amount);
            economy.addGood(GoodType.CopperIngot, amount / 2);
            economy.addGood(GoodType.IronIngot, amount / 2);
            break;
          case BuildingType.Smithy:
            economy.addGood(GoodType.IronSword, count * 2);
            economy.addGood(GoodType.IronTools, count * 3);
            economy.addGood(GoodType.CopperTools, count * 2);
            economy.addGood(GoodType.IronArmor, count);
            break;
          case BuildingType.Kiln:
            economy.addGood(GoodType.Bricks, amount);
            economy.addGood(GoodType.Pottery, amount / 2);
            break;
          case BuildingType.Tannery:
            economy.addGood(GoodType.Leather, amount);
            economy.addGood(GoodType.LeatherArmor, count);
            break;
          case BuildingType.Windmill:
          case BuildingType.GrainSilo:
            economy.addResource(ResourceType.Wheat, amount);
            economy.addGood(GoodType.Bread, amount);
            break;
        }
      });
      
      console.log(`[Economy] Initialized economy for settlement ${index} (${settlement.type}) with ${buildingCounts.size} building types`);
    });
  }

  /**
   * Initialize populations for all settlements
   */
  private initializePopulations(): void {
    this.worldMap.settlements.forEach((settlement, index) => {
      const population = this.populationManager.getOrCreatePopulation(index);
      
      // Calculate initial population based on settlement size
      let targetPop = 0;
      if (settlement.type === "city") {
        targetPop = 40 + Math.floor(Math.random() * 30); // 40-70
      } else if (settlement.type === "village") {
        targetPop = 15 + Math.floor(Math.random() * 15); // 15-30
      } else {
        targetPop = 3 + Math.floor(Math.random() * 5); // 3-8
      }
      
      // Count buildings to determine initial skills distribution
      const buildingCounts = new Map<BuildingType, number>();
      for (const tile of settlement.tiles) {
        const hexTile = this.worldMap.getTile({ col: tile.col, row: tile.row });
        if (!hexTile || hexTile.building === BuildingType.None) continue;
        buildingCounts.set(hexTile.building, (buildingCounts.get(hexTile.building) || 0) + 1);
      }
      
      // Create people with appropriate skills
      for (let i = 0; i < targetPop; i++) {
        // Age distribution: 20% children, 65% adults, 15% elders
        let age: number;
        const ageRoll = Math.random();
        if (ageRoll < 0.2) {
          age = Math.floor(Math.random() * 14); // 0-13
        } else if (ageRoll < 0.85) {
          age = 14 + Math.floor(Math.random() * 46); // 14-60
        } else {
          age = 60 + Math.floor(Math.random() * 20); // 60-80
        }
        
        // Give some people starting skills based on settlement buildings
        const skills: Partial<Record<JobType, number>> = {};
        
        // Randomly assign 1-2 skills based on available buildings
        if (buildingCounts.size > 0) {
          const buildingTypes = Array.from(buildingCounts.keys());
          const randomBuilding = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
          const jobType = getJobForBuilding(randomBuilding);
          
          if (jobType !== JobType.None && Math.random() < 0.3) { // 30% chance to have skill
            skills[jobType] = 10 + Math.floor(Math.random() * 40); // 10-50 skill
          }
        }
        
        // Everyone has some farming skill (universal)
        if (Math.random() < 0.5) {
          skills[JobType.Farmer] = 5 + Math.floor(Math.random() * 25); // 5-30 skill
        }
        
        const person = createPerson(index, age, skills);
        population.addPerson(person);
      }
      
      console.log(`[Population] Initialized settlement ${index} (${settlement.type}) with ${targetPop} people`);
    });
  }

  /**
   * Initialize settlement treasuries based on population
   */
  private initializeTreasuries(): void {
    this.worldMap.settlements.forEach((settlement, index) => {
      const economy = this.economyManager.getEconomy(index);
      const population = this.populationManager.getPopulation(index);
      
      if (!economy || !population) return;
      
      const popSize = population.getTotalPopulation();
      
      // Calculate starting treasury based on settlement size and type
      // Formula: 10 gold per person + settlement type bonus
      let treasuryAmount = popSize * 10;
      
      // Type bonuses
      if (settlement.type === "city") {
        treasuryAmount += 500; // Cities start with more capital
      } else if (settlement.type === "village") {
        treasuryAmount += 200; // Villages have modest reserves
      } else {
        treasuryAmount += 50; // Hamlets have minimal reserves
      }
      
      economy.setTreasury(treasuryAmount);
      
      console.log(`[Economy] Initialized treasury for settlement ${index} (${settlement.type}, ${popSize} people): ${treasuryAmount}g`);
    });
  }

  /**
   * Process one economy tick - extraction and production
   */
  private economyTick(): void {
    this.worldMap.settlements.forEach((settlement, settlementIndex) => {
      const economy = this.economyManager.getEconomy(settlementIndex);
      const population = this.populationManager.getPopulation(settlementIndex);
      if (!economy || !population) {
        console.log(`[Economy] Settlement ${settlementIndex} missing economy or population`);
        return;
      }

      console.log(`[Economy] Processing settlement ${settlementIndex} (${settlement.type})`);
      console.log(`  - Population: ${population.getTotalPopulation()} people`);

      // Phase 1: Calculate housing capacity (uses density system: 1-5 people per housing tile)
      const housingCapacity = calculateHousingCapacity(
        settlement.tiles,
        (col, row) => {
          const tile = this.worldMap.getTile({ col, row });
          return tile ? { building: tile.building, housingDensity: tile.housingDensity } : undefined;
        }
      );
      
      // Phase 2: Worker assignment (before production)
      const buildings = this.getSettlementBuildings(settlement);
      console.log(`  - Buildings requiring workers: ${buildings.length}`);
      const assignments = this.workerAssignmentSystem.assignWorkersToBuildings(
        population,
        buildings,
        economy
      );
      console.log(`  - Workers assigned: ${assignments.length}`);
      
      // Phase 3: Extract resources (with workers)
      this.executeExtraction(settlement, settlementIndex, economy, assignments);

      // Phase 4: Execute production recipes (with workers)
      this.executeProduction(settlement, settlementIndex, economy, assignments);
      
      // Phase 5: Experience gain for workers
      for (const assignment of assignments) {
        population.recordExperience(assignment.person.id, assignment.jobType, 8);
      }

      // Phase 6: Population dynamics (last - after work is done)
      const unemployedCount = population.getUnemployed().length;
      console.log(`  - Unemployed: ${unemployedCount}`);
      population.processTurn(economy, settlement, housingCapacity, unemployedCount);
      
      // Phase 7: Housing upgrades (after population changes)
      const newPopulation = population.getTotalPopulation();
      const newCapacity = calculateHousingCapacity(
        settlement.tiles,
        (col, row) => {
          const tile = this.worldMap.getTile({ col, row });
          return tile ? { building: tile.building, housingDensity: tile.housingDensity } : undefined;
        }
      );
      const upgradedTiles = this.housingUpgradeSystem.upgradeHousingIfNeeded(
        this.worldMap.grid,
        settlement,
        newPopulation,
        newCapacity,
        economy
      );
      if (upgradedTiles > 0) {
        console.log(`  - Upgraded ${upgradedTiles} housing tiles to accommodate growth`);
      }
      
      // Phase 8: City evolution (after housing upgrades)
      const evolved = this.housingUpgradeSystem.tryEvolveToCity(
        this.worldMap.grid,
        settlement,
        newPopulation,
        economy
      );
      if (evolved) {
        console.log(`  - Settlement evolved to CITY!`);
      }
      
      console.log(`  - After turn: Population ${newPopulation}, Avg Health ${population.getAverageHealth()}%, Avg Hunger ${population.getAverageHunger()}%`);
    });
    
    // Phase 7: Process trade (after all settlements have produced)
    console.log(`[Trade] Processing trade system`);
    this.tradeManager.processTurn(this.economyManager, this.populationManager);
  }

  /**
   * Get building info for a settlement
   */
  private getSettlementBuildings(settlement: Settlement): BuildingInfo[] {
    const buildings: BuildingInfo[] = [];
    
    for (const tile of settlement.tiles) {
      const hexTile = this.worldMap.getTile({ col: tile.col, row: tile.row });
      if (!hexTile || hexTile.building === BuildingType.None) continue;
      
      if (requiresWorkers(hexTile.building)) {
        buildings.push({
          type: hexTile.building,
          location: { col: tile.col, row: tile.row },
        });
      }
    }
    
    return buildings;
  }

  /**
   * Execute resource extraction for a settlement
   */
  private executeExtraction(
    settlement: any,
    settlementIndex: number,
    economy: any,
    assignments: any[]
  ): void {
    // Find all extraction buildings in this settlement
    for (const tile of settlement.tiles) {
      const hexTile = this.worldMap.getTile({ col: tile.col, row: tile.row });
      if (!hexTile) continue;

      const building = hexTile.building;
      if (building === BuildingType.None) continue;

      // Check if this is an extraction building
      if (isExtractionBuilding(building)) {
        // Find workers assigned to this building
        const buildingWorkers = assignments.filter(
          a => a.building.col === tile.col && a.building.row === tile.row
        );
        
        // Calculate total productivity
        const totalProductivity = buildingWorkers.reduce(
          (sum, w) => sum + w.productivity,
          0
        );
        
        // Extract resources (scaled by worker productivity)
        const result = extractResources(
          this.worldMap.grid,
          hexTile,
          building,
          totalProductivity
        );
        
        if (result) {
          economy.addResource(result.resourceType, result.amount);
          console.log(`[Economy] Settlement ${settlementIndex} extracted ${result.amount} ${result.resourceType} (${buildingWorkers.length} workers, ${totalProductivity.toFixed(2)} productivity)`);
        } else if (buildingWorkers.length > 0) {
          console.log(`[Economy] Settlement ${settlementIndex} building ${building} has ${buildingWorkers.length} workers but extracted nothing (no nearby resources?)`);
        }
      }
    }
  }

  /**
   * Execute production for a settlement
   */
  private executeProduction(
    settlement: any,
    settlementIndex: number,
    economy: any,
    assignments: any[]
  ): void {
    // Process ongoing production jobs
    for (const tile of settlement.tiles) {
      const hexTile = this.worldMap.getTile({ col: tile.col, row: tile.row });
      if (!hexTile) continue;

      const building = hexTile.building;
      if (building === BuildingType.None) continue;

      // Check if this building is currently producing
      const activeJob = economy.getProductionForBuilding(tile.col, tile.row);
      if (activeJob) {
        const recipe = getRecipeById(activeJob.recipeId);
        if (recipe) {
          economy.tickProduction(recipe);
        }
        continue; // Building is busy
      }

      // Try to start new production if building is idle
      const recipes = getRecipesForBuilding(building);
      for (const recipe of recipes) {
        if (economy.canProduce(recipe)) {
          // Find workers assigned to this building
          const buildingWorkers = assignments.filter(
            a => a.building.col === tile.col && a.building.row === tile.row
          );
          
          // Calculate total productivity
          const totalProductivity = buildingWorkers.reduce(
            (sum, w) => sum + w.productivity,
            0
          );
          
          // For buildings with no worker requirement (houses), use 1.0 productivity
          // For other buildings, they need workers to produce
          const effectiveProductivity = totalProductivity > 0 ? totalProductivity : 1.0;
          
          // Start production with worker productivity
          const started = economy.startProduction(
            recipe,
            { col: tile.col, row: tile.row },
            effectiveProductivity
          );
          
          if (started) {
            console.log(`[Economy] Settlement ${settlementIndex} started ${recipe.name} (${buildingWorkers.length} workers, ${effectiveProductivity.toFixed(2)} productivity)`);
            break; // Only start one recipe per building per tick
          }
        }
      }
    }
  }
}
