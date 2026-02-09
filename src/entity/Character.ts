import { HexTile } from "../world/HexTile";
import { getAPCost } from "../world/Terrain";
import { WorldMap } from "../world/WorldMap";
import { hexIsoCenter } from "../rendering/Isometric";

export const MAX_AP = 3;

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

  /** Callback fired when a new turn starts. */
  onNewTurn?: (turn: number) => void;

  /** Callback fired when AP changes. */
  onAPChange?: (ap: number) => void;

  /** Callback fired when the character moves. */
  onMove?: (tile: HexTile) => void;

  constructor(startTile: HexTile) {
    this.currentTile = startTile;
  }

  /**
   * Attempt to move to an adjacent tile. Returns true if successful.
   */
  tryMove(target: HexTile, worldMap: WorldMap): boolean {
    // Must be a neighbor
    const neighbors = worldMap.getNeighbors(this.currentTile);
    const isNeighbor = neighbors.some(
      (n) => n.col === target.col && n.row === target.row
    );
    if (!isNeighbor) return false;

    // Check AP cost
    const cost = getAPCost(target.terrain);
    if (cost > this.ap) return false;

    // Move!
    this.ap -= cost;
    this.currentTile = target;
    this.onMove?.(target);
    this.onAPChange?.(this.ap);

    // Auto-advance turn if AP exhausted
    if (this.ap <= 0) {
      this.endTurn();
    }

    return true;
  }

  /** Manually end the current turn (e.g. spacebar). */
  endTurn(): void {
    this.turn++;
    this.ap = MAX_AP;
    this.onAPChange?.(this.ap);
    this.onNewTurn?.(this.turn);
  }

  /** Get the isometric pixel position of the character (center of current tile). */
  getWorldPosition(): { x: number; y: number } {
    return hexIsoCenter(this.currentTile);
  }
}
