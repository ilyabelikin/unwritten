import { Grid } from "honeycomb-grid";
import { HexTile } from "./HexTile";
import { Settlement, BuildingType } from "./Building";
import { isWater, VegetationType } from "./Terrain";
import { findPath, IPathfindingMap } from "../pathfinding/Pathfinding";

/**
 * Generates roads connecting settlements using A* pathfinding.
 * Roads follow optimal paths that consider terrain costs (avoiding mountains, etc.).
 */
export class RoadGenerator {
  private seed: string;

  constructor(seed: string) {
    this.seed = seed;
  }

  /**
   * Generate roads connecting all settlements.
   * Prioritizes connecting cities to each other, then villages to nearby cities.
   */
  generateRoads(grid: Grid<HexTile>, settlements: Settlement[], map: IPathfindingMap): void {
    const cities = settlements.filter((s) => s.type === "city");
    const villages = settlements.filter((s) => s.type === "village");

    console.log(`[RoadGenerator] Connecting ${cities.length} cities and ${villages.length} villages`);

    // Connect all cities to each other
    let cityRoads = 0;
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        this.createPathfindingRoad(grid, cities[i], cities[j], map);
        cityRoads++;
      }
    }
    console.log(`[RoadGenerator] Created ${cityRoads} city-to-city roads`);

    // Connect each village to the nearest city
    let villageRoads = 0;
    for (const village of villages) {
      const nearestCity = this.findNearestSettlement(village, cities);
      if (nearestCity) {
        this.createPathfindingRoad(grid, village, nearestCity, map);
        villageRoads++;
      }
    }
    console.log(`[RoadGenerator] Created ${villageRoads} village-to-city roads`);
  }

  /**
   * Create a road between two settlements using A* pathfinding.
   * This ensures roads follow optimal paths that avoid expensive terrain.
   */
  private createPathfindingRoad(
    grid: Grid<HexTile>,
    settlement1: Settlement,
    settlement2: Settlement,
    map: IPathfindingMap
  ): void {
    // Get the center tiles for both settlements
    const startTile = grid.getHex({ col: settlement1.center.col, row: settlement1.center.row });
    const endTile = grid.getHex({ col: settlement2.center.col, row: settlement2.center.row });

    if (!startTile || !endTile) {
      console.warn(`[RoadGenerator] Could not find tiles for settlements`);
      return;
    }

    // Calculate distance
    const dx = settlement2.center.col - settlement1.center.col;
    const dy = settlement2.center.row - settlement1.center.row;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Skip if settlements are too close (roads within settlements look weird)
    if (distance < 8) return;

    // Use A* pathfinding to find the optimal path (considering terrain costs)
    // Pass false for onlyExplored since we're generating roads during world generation
    const pathResult = findPath(startTile, endTile, map, false);

    if (!pathResult.found || pathResult.path.length === 0) {
      console.warn(`[RoadGenerator] No path found between settlements`);
      return;
    }

    // Mark all tiles along the path as roads
    this.processRoadTiles(pathResult.path);
  }

  /**
   * Process all tiles along the road, handling water crossings.
   */
  private processRoadTiles(tiles: HexTile[]): void {
    let tilesMarked = 0;
    let waterSequence: HexTile[] = [];
    let hasLandBefore = false;

    for (let i = 0; i < tiles.length; i++) {
      const hex = tiles[i];
      const hexIsWater = isWater(hex.terrain);

      if (hexIsWater) {
        // Add to current water sequence
        waterSequence.push(hex);
      } else {
        // End of water sequence - process it
        if (waterSequence.length > 0) {
          // Only place pier if we have land before AND after the water
          const hasLandAfter = true; // We just found a land tile
          this.processWaterSequence(waterSequence, hasLandBefore && hasLandAfter);
          waterSequence = [];
        }

        // Mark land tile as road
        hex.hasRoad = true;
        hex.isRough = false;
        hex.vegetation = VegetationType.None;
        hex.treeDensity = 0;
        tilesMarked++;
        hasLandBefore = true;
      }
    }

    // Don't process remaining water sequence at the end - no land after means no pier
  }


  /**
   * Process a sequence of consecutive water tiles.
   * Place piers on both sides if this is a true crossing (land before and after).
   */
  private processWaterSequence(waterTiles: HexTile[], isTrueCrossing: boolean): void {
    if (waterTiles.length === 0 || !isTrueCrossing) return;

    // Place pier at the entry point (first water tile)
    const firstTile = waterTiles[0];
    if (firstTile.building === BuildingType.None) {
      firstTile.building = BuildingType.Pier;
    }

    // Also place pier at the exit point (last water tile) if there's more than one water tile
    if (waterTiles.length > 1) {
      const lastTile = waterTiles[waterTiles.length - 1];
      if (lastTile.building === BuildingType.None) {
        lastTile.building = BuildingType.Pier;
      }
    }
  }

  /**
   * Find the nearest settlement to a given settlement.
   */
  private findNearestSettlement(
    from: Settlement,
    candidates: Settlement[]
  ): Settlement | null {
    let nearest: Settlement | null = null;
    let minDist = Infinity;

    for (const candidate of candidates) {
      const dx = candidate.center.col - from.center.col;
      const dy = candidate.center.row - from.center.row;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        nearest = candidate;
      }
    }

    return nearest;
  }
}
