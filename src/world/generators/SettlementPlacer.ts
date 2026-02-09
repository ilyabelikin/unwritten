import { Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { TerrainType } from "../Terrain";
import { BuildingType, Settlement } from "../Building";
import { HEX_NEIGHBOR_DIRS } from "../HexMapUtils";

/**
 * Handles location finding and validation for settlement placement
 */
export class SettlementPlacer {
  /**
   * Find a suitable location for a settlement
   */
  findSettlementLocation(
    grid: Grid<HexTile>,
    type: "city" | "village",
    settlements: Settlement[],
    config: { width: number; height: number },
    seededRandom: (seed: number) => number
  ): HexTile | null {
    const minDistance = type === "city" ? 20 : 12;
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Sample a random location
      const col = Math.floor(seededRandom(attempt * 17.3) * config.width);
      const row = Math.floor(seededRandom(attempt * 23.7) * config.height);

      const hex = grid.getHex({ col, row });
      if (!hex) continue;

      // Check if suitable for settlement
      if (!this.isSuitableForBuilding(hex)) continue;

      // Check distance from other settlements
      let tooClose = false;
      for (const settlement of settlements) {
        const dx = settlement.center.col - col;
        const dy = settlement.center.row - row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        return hex;
      }
    }

    return null;
  }

  /**
   * Check if a hex is suitable for building
   */
  isSuitableForBuilding(hex: HexTile): boolean {
    // Can only build on plains and hills
    if (
      hex.terrain !== TerrainType.Plains &&
      hex.terrain !== TerrainType.Hills
    ) {
      return false;
    }

    // Don't build on tiles that already have buildings
    if (hex.building !== BuildingType.None) {
      return false;
    }

    return true;
  }

  /**
   * Get all hexes within a certain range from a center hex
   */
  getNeighborsInRange(
    grid: Grid<HexTile>,
    center: HexTile,
    range: number
  ): HexTile[] {
    const neighbors: HexTile[] = [];
    const visited = new Set<string>();

    const queue: Array<{ hex: HexTile; dist: number }> = [
      { hex: center, dist: 0 },
    ];
    visited.add(`${center.col},${center.row}`);

    while (queue.length > 0) {
      const { hex, dist } = queue.shift()!;

      if (dist > 0 && dist <= range) {
        neighbors.push(hex);
      }

      if (dist < range) {
        for (const dir of HEX_NEIGHBOR_DIRS) {
          const neighbor = grid.neighborOf(hex, dir, { allowOutside: false });
          if (neighbor) {
            const key = `${neighbor.col},${neighbor.row}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push({ hex: neighbor, dist: dist + 1 });
            }
          }
        }
      }
    }

    return neighbors;
  }
}
