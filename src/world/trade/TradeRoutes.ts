import { HexTile } from "../HexTile";
import { Grid } from "honeycomb-grid";
import { findPath } from "../../pathfinding/Pathfinding";
import { Settlement } from "../Building";

/**
 * A cached trade route between two settlements
 */
export interface TradeRoute {
  id: string;
  from: number; // Settlement index
  to: number;
  path: HexTile[]; // Cached path
  distance: number; // In tiles
  onRoad: boolean; // Does it mostly use roads?
  danger: number; // 0-1, for future bandit system
}

/**
 * Manages trade routes between settlements
 */
export class TradeRouteManager {
  private routes: Map<string, TradeRoute>;
  private grid: Grid<HexTile>;
  private settlements: Settlement[];
  
  constructor(grid: Grid<HexTile>, settlements: Settlement[]) {
    this.routes = new Map();
    this.grid = grid;
    this.settlements = settlements;
  }
  
  /**
   * Get or create a trade route between settlements
   */
  getRoute(from: number, to: number): TradeRoute | null {
    const routeId = this.getRouteId(from, to);
    
    // Return cached route if exists
    if (this.routes.has(routeId)) {
      return this.routes.get(routeId)!;
    }
    
    // Create new route
    const route = this.createRoute(from, to);
    if (route) {
      this.routes.set(routeId, route);
    }
    
    return route;
  }
  
  /**
   * Create a new trade route
   */
  private createRoute(from: number, to: number): TradeRoute | null {
    const fromSettlement = this.settlements[from];
    const toSettlement = this.settlements[to];
    
    if (!fromSettlement || !toSettlement) return null;
    
    // Get start and end tiles
    const startTile = this.grid.getHex(fromSettlement.center);
    const endTile = this.grid.getHex(toSettlement.center);
    
    if (!startTile || !endTile) return null;
    
    // Find path using pathfinding
    // Note: findPath signature is (start, goal, map, onlyExplored, isEmbarked)
    const pathResult = findPath(
      startTile,
      endTile,
      { 
        getNeighbors: (hex) => {
          const neighbors: HexTile[] = [];
          const directions = [
            { dcol: 1, drow: 0 },
            { dcol: -1, drow: 0 },
            { dcol: 0, drow: 1 },
            { dcol: 0, drow: -1 },
            { dcol: 1, drow: -1 },
            { dcol: -1, drow: 1 },
          ];
          for (const dir of directions) {
            const neighbor = this.grid.getHex({ col: hex.col + dir.dcol, row: hex.row + dir.drow });
            if (neighbor) neighbors.push(neighbor);
          }
          return neighbors;
        },
        hexDistance: (a, b) => {
          const dc = Math.abs(a.col - b.col);
          const dr = Math.abs(a.row - b.row);
          return Math.max(dc, dr, Math.abs(dc - dr));
        }
      },
      false, // Don't require explored (traders can go anywhere)
      false // Not embarked
    );
    
    if (!pathResult.found || pathResult.path.length === 0) {
      return null;
    }
    
    // Check how much of the path is on roads
    const roadTiles = pathResult.path.filter(tile => tile.hasRoad).length;
    const onRoad = roadTiles > pathResult.path.length * 0.5; // >50% on roads
    
    return {
      id: this.getRouteId(from, to),
      from,
      to,
      path: pathResult.path,
      distance: pathResult.path.length,
      onRoad,
      danger: 0, // Future: calculate based on terrain, distance from settlements
    };
  }
  
  /**
   * Generate unique route ID
   */
  private getRouteId(from: number, to: number): string {
    return `${from}_to_${to}`;
  }
  
  /**
   * Clear all cached routes (call when world changes)
   */
  clearCache(): void {
    this.routes.clear();
  }
  
  /**
   * Get distance between two settlements
   */
  getDistance(from: number, to: number): number {
    const route = this.getRoute(from, to);
    return route ? route.distance : Infinity;
  }
}
