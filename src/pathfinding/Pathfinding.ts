import { HexTile } from "../world/HexTile";
import { getAPCost } from "../world/Terrain";

/**
 * A* pathfinding for hex grids.
 * Finds the optimal path considering AP costs, explored tiles, and movement restrictions.
 */

// Interface for pathfinding - can be implemented by WorldMap or WorldGenerator
export interface IPathfindingMap {
  getNeighbors(hex: HexTile): HexTile[];
  hexDistance(a: HexTile, b: HexTile): number;
}

interface PathNode {
  tile: HexTile;
  gCost: number; // Cost from start
  hCost: number; // Heuristic cost to goal
  fCost: number; // Total cost (g + h)
  parent: PathNode | null;
}

export interface PathResult {
  path: HexTile[];
  totalCost: number;
  found: boolean;
}

/**
 * Find the optimal path from start to goal using A*.
 * Returns the path as an array of tiles (excluding the start tile).
 */
export function findPath(
  start: HexTile,
  goal: HexTile,
  map: IPathfindingMap,
  onlyExplored: boolean = true,
): PathResult {
  // Early exit if start and goal are the same
  if (start.col === goal.col && start.row === goal.row) {
    return { path: [], totalCost: 0, found: true };
  }

  // Can't path to unexplored tiles if onlyExplored is true
  if (onlyExplored && !goal.explored) {
    return { path: [], totalCost: 0, found: false };
  }

  const openSet = new Map<string, PathNode>();
  const closedSet = new Set<string>();

  // Helper to get node key
  const getKey = (tile: HexTile): string => `${tile.col},${tile.row}`;

  // Create start node
  const startNode: PathNode = {
    tile: start,
    gCost: 0,
    hCost: map.hexDistance(start, goal),
    fCost: map.hexDistance(start, goal),
    parent: null,
  };

  openSet.set(getKey(start), startNode);

  while (openSet.size > 0) {
    // Find node with lowest fCost
    let current: PathNode | null = null;
    let lowestF = Infinity;
    for (const node of openSet.values()) {
      if (node.fCost < lowestF) {
        lowestF = node.fCost;
        current = node;
      }
    }

    if (!current) break;

    const currentKey = getKey(current.tile);

    // Found the goal!
    if (current.tile.col === goal.col && current.tile.row === goal.row) {
      return reconstructPath(current);
    }

    // Move current from open to closed
    openSet.delete(currentKey);
    closedSet.add(currentKey);

    // Check all neighbors
    const neighbors = map.getNeighbors(current.tile);
    for (const neighbor of neighbors) {
      const neighborKey = getKey(neighbor);

      // Skip if already evaluated
      if (closedSet.has(neighborKey)) continue;

      // Skip if not explored (unless we allow unexplored)
      if (onlyExplored && !neighbor.explored) continue;

      // Calculate movement cost to this neighbor (including water transition costs)
      const moveCost = getAPCost(
        neighbor.hasRoad,
        neighbor.isRough,
        neighbor.treeDensity,
        current.tile.terrain,
        neighbor.terrain,
      );
      const tentativeG = current.gCost + moveCost;

      // Check if this path to neighbor is better
      const existingNode = openSet.get(neighborKey);
      if (!existingNode || tentativeG < existingNode.gCost) {
        const hCost = map.hexDistance(neighbor, goal);
        const newNode: PathNode = {
          tile: neighbor,
          gCost: tentativeG,
          hCost,
          fCost: tentativeG + hCost,
          parent: current,
        };
        openSet.set(neighborKey, newNode);
      }
    }
  }

  // No path found
  return { path: [], totalCost: 0, found: false };
}

/**
 * Reconstruct the path from goal node back to start.
 * Returns path excluding the start tile.
 */
function reconstructPath(goalNode: PathNode): PathResult {
  const path: HexTile[] = [];
  let current: PathNode | null = goalNode;

  while (current && current.parent) {
    path.unshift(current.tile);
    current = current.parent;
  }

  return {
    path,
    totalCost: goalNode.gCost,
    found: true,
  };
}

/**
 * Check if a path is valid (all tiles explored and within AP budget).
 */
export function isPathValid(
  path: HexTile[],
  startTile: HexTile,
  availableAP: number,
  map: IPathfindingMap,
): boolean {
  if (path.length === 0) return true;

  let currentTile = startTile;
  let apCost = 0;

  for (const tile of path) {
    if (!tile.explored) return false;

    const cost = getAPCost(
      tile.hasRoad,
      tile.isRough,
      tile.treeDensity,
      currentTile.terrain,
      tile.terrain,
    );
    apCost += cost;

    if (apCost > availableAP) return false;

    currentTile = tile;
  }

  return true;
}
