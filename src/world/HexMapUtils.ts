import { Direction, Grid } from "honeycomb-grid";
import { HexTile } from "./HexTile";

/**
 * Shared utilities for hex map operations.
 * Used by both WorldMap and WorldGenerator to avoid code duplication.
 */

/** Pointy-top hex neighbor directions (skip N and S which are vertices). */
export const HEX_NEIGHBOR_DIRS: Direction[] = [
  Direction.NE,
  Direction.E,
  Direction.SE,
  Direction.SW,
  Direction.W,
  Direction.NW,
];

/** Get all 6 neighbors of a hex (filters out undefined for edge tiles). */
export function getHexNeighbors(grid: Grid<HexTile>, hex: HexTile): HexTile[] {
  const neighbors: HexTile[] = [];
  for (const dir of HEX_NEIGHBOR_DIRS) {
    const neighbor = grid.neighborOf(hex, dir, { allowOutside: false });
    if (neighbor) {
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}

/** Calculate hex distance between two tiles using the grid's built-in method. */
export function getHexDistance(grid: Grid<HexTile>, a: HexTile, b: HexTile): number {
  return grid.distance(a, b, { allowOutside: true });
}
