import { HexTile } from "../world/HexTile";
import { getAPCost, isWater, isPierOrDock } from "../world/Terrain";

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
 * Respects water movement restrictions based on embarked state.
 */
export function findPath(
  start: HexTile,
  goal: HexTile,
  map: IPathfindingMap,
  onlyExplored: boolean = true,
  isEmbarked: boolean = false,
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

      // Water movement validation
      const currentIsWater = isWater(current.tile.terrain);
      const neighborIsWater = isWater(neighbor.terrain);
      const currentIsPierOrDock = isPierOrDock(current.tile);
      const neighborIsPierOrDock = isPierOrDock(neighbor);
      
      // Track if we would be embarked when reaching this neighbor
      let embarkedAtNeighbor = isEmbarked;
      
      // If moving to water from land
      if (!currentIsWater && neighborIsWater) {
        // Exception: piers/docks are always accessible from land
        if (!neighborIsPierOrDock && !currentIsPierOrDock && !isEmbarked) {
          // Can't move to water unless:
          // 1. Neighbor is a pier/dock (always accessible), OR
          // 2. Currently on pier/dock (can embark), OR
          // 3. Already embarked
          continue;
        }
        // Will be embarked after this move (unless going to a pier/dock)
        if (!neighborIsPierOrDock) {
          embarkedAtNeighbor = true;
        }
      }
      
      // If moving from water to land
      if (currentIsWater && !neighborIsWater) {
        if (!neighborIsPierOrDock && embarkedAtNeighbor) {
          // Can't disembark on regular land
          continue;
        }
        // Will be disembarked after this move (if landing on pier/dock)
        if (neighborIsPierOrDock) {
          embarkedAtNeighbor = false;
        }
      }

      // Calculate movement cost to this neighbor (including water transition costs)
      const moveCost = getAPCost(
        neighbor.hasRoad,
        neighbor.isRough,
        neighbor.treeDensity,
        current.tile.terrain,
        neighbor.terrain,
        embarkedAtNeighbor && neighborIsWater, // Use embarked state for water movement
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
 * Respects water movement restrictions based on embarked state.
 */
export function isPathValid(
  path: HexTile[],
  startTile: HexTile,
  availableAP: number,
  map: IPathfindingMap,
  isEmbarked: boolean = false,
): boolean {
  if (path.length === 0) return true;

  let currentTile = startTile;
  let apCost = 0;
  let embarked = isEmbarked;

  for (const tile of path) {
    if (!tile.explored) return false;

    // Water movement validation
    const currentIsWater = isWater(currentTile.terrain);
    const tileIsWater = isWater(tile.terrain);
    const tileIsPierOrDock = isPierOrDock(tile);
    
    // Check if we can make this move
    // Exception: piers/docks are always accessible from land
    if (!currentIsWater && tileIsWater && !tileIsPierOrDock && !isPierOrDock(currentTile) && !embarked) {
      return false; // Can't move to water without pier/dock
    }
    if (currentIsWater && !tileIsWater && !tileIsPierOrDock && embarked) {
      return false; // Can't disembark on regular land
    }
    
    // Update embarked state
    if (!currentIsWater && tileIsWater && !tileIsPierOrDock && isPierOrDock(currentTile)) {
      embarked = true;
    } else if (currentIsWater && !tileIsWater && tileIsPierOrDock) {
      embarked = false;
    }

    const cost = getAPCost(
      tile.hasRoad,
      tile.isRough,
      tile.treeDensity,
      currentTile.terrain,
      tile.terrain,
      embarked && tileIsWater,
    );
    apCost += cost;

    if (apCost > availableAP) return false;

    currentTile = tile;
  }

  return true;
}
