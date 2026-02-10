import { HexTile } from "../world/HexTile";
import { getAPCost, isWater, isPierOrDock } from "../world/Terrain";
import { WorldMap } from "../world/WorldMap";
import { hexIsoCenter } from "../rendering/Isometric";
import { Inventory } from "./Item";

export const MAX_AP = 4;

/**
 * The player character that moves on the hex grid using action points.
 */
export class Character {
  /** Current tile the character occupies. */
  currentTile: HexTile;

  /** Action points remaining this turn. */
  ap: number = MAX_AP;

  /** Total turns elapsed. */
  turn: number = 1;

  /** Is the character currently embarked on a boat? */
  embarked: boolean = false;

  /** Character's inventory and equipment. */
  readonly inventory: Inventory;

  /** Callback fired when a new turn starts. */
  onNewTurn?: (turn: number) => void;

  /** Callback fired when AP changes. */
  onAPChange?: (ap: number) => void;

  /** Callback fired when the character moves. */
  onMove?: (tile: HexTile) => void;

  /** Callback fired when the character embarks on a boat. */
  onEmbark?: () => void;

  /** Callback fired when the character disembarks from a boat. */
  onDisembark?: () => void;

  constructor(startTile: HexTile) {
    this.currentTile = startTile;
    this.inventory = new Inventory();
  }

  /**
   * Attempt to move to an adjacent tile. Returns true if successful.
   * Handles automatic embarking/disembarking when moving between piers and water.
   * @param target - The tile to move to
   * @param worldMap - The world map
   * @param precalculatedCost - Optional pre-calculated AP cost (avoids recalculation)
   */
  tryMove(target: HexTile, worldMap: WorldMap, precalculatedCost?: number): boolean {
    // Must be a neighbor
    const neighbors = worldMap.getNeighbors(this.currentTile);
    const isNeighbor = neighbors.some(
      (n) => n.col === target.col && n.row === target.row,
    );
    if (!isNeighbor) return false;

    const fromWater = isWater(this.currentTile.terrain);
    const toWater = isWater(target.terrain);
    const fromPierOrDock = isPierOrDock(this.currentTile);
    const toPierOrDock = isPierOrDock(target);

    // Water movement restrictions
    // Exception: piers/docks are always accessible from land (even though they're on water terrain)
    if (toWater && !toPierOrDock && !this.embarked && !fromPierOrDock) {
      // Cannot move to water unless:
      // 1. Destination is a pier/dock (always accessible), OR
      // 2. Already embarked (on water), OR
      // 3. Currently on a pier/dock (will embark)
      console.log("Cannot walk on water! Must embark from a pier or dock.");
      return false;
    }

    // Cannot disembark on regular land (only on piers/docks)
    if (this.embarked && !toWater && !toPierOrDock) {
      console.log("Cannot disembark here! Must disembark at a pier or dock.");
      return false;
    }

    // Use precalculated cost if provided, otherwise calculate it
    // This avoids duplicate calculations when cost is already known
    const cost = precalculatedCost ?? getAPCost(
      target.hasRoad,
      target.isRough,
      target.treeDensity,
      this.currentTile.terrain,
      target.terrain,
      this.embarked, // Pass embarked state for water movement cost
    );
    if (cost > this.ap) return false;

    // Handle embarking/disembarking
    if (!this.embarked && fromPierOrDock && toWater && !toPierOrDock) {
      // Embark: stepping from pier/dock to water (but not to another pier/dock)
      this.embarked = true;
      this.onEmbark?.();
      console.log("⛵ Embarked on a boat!");
    } else if (this.embarked && fromWater && toPierOrDock) {
      // Disembark: stepping from water to pier/dock
      this.embarked = false;
      this.onDisembark?.();
      console.log("🏖️ Disembarked from boat!");
    }

    // Move!
    this.ap -= cost;
    this.currentTile = target;
    this.onMove?.(target);
    this.onAPChange?.(this.ap);

    // Don't auto-end turn - let the game handle turn advancement
    // This allows multi-turn journeys to work properly

    return true;
  }

  /** Manually end the current turn (e.g. spacebar). */
  endTurn(): void {
    console.log(`[Character] endTurn() called - turn ${this.turn} -> ${this.turn + 1}`);
    this.turn++;
    this.ap = MAX_AP;
    this.onAPChange?.(this.ap);
    console.log(`[Character] Calling onNewTurn callback (exists: ${!!this.onNewTurn})`);
    this.onNewTurn?.(this.turn);
  }

  /** Get the isometric pixel position of the character (center of current tile). */
  getWorldPosition(): { x: number; y: number } {
    return hexIsoCenter(this.currentTile);
  }
}
