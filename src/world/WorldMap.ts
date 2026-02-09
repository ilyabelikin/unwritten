import { Grid, type HexCoordinates } from "honeycomb-grid";
import { HexTile } from "./HexTile";
import { WorldGenConfig, WorldGenerator } from "./WorldGenerator";
import { Settlement } from "./Building";
import { IPathfindingMap } from "../pathfinding/Pathfinding";
import { getHexNeighbors, getHexDistance } from "./HexMapUtils";

/**
 * WorldMap wraps the honeycomb Grid and provides gameplay-level queries.
 */
export class WorldMap implements IPathfindingMap {
  readonly grid: Grid<HexTile>;
  readonly width: number;
  readonly height: number;
  readonly settlements: Settlement[];

  constructor(config: Partial<WorldGenConfig> = {}) {
    const generator = new WorldGenerator(config);
    this.grid = generator.generate();
    this.settlements = generator.getSettlements();
    this.width = config.width ?? 120;
    this.height = config.height ?? 120;
  }

  /** Get a tile by axial/offset coordinates. Returns undefined if out of bounds. */
  getTile(coords: HexCoordinates): HexTile | undefined {
    return this.grid.getHex(coords);
  }

  /** Get all 6 neighbors of a hex (filters out undefined for edge tiles). */
  getNeighbors(hex: HexTile): HexTile[] {
    return getHexNeighbors(this.grid, hex);
  }

  /** Calculate hex distance between two tiles using the grid's built-in method. */
  hexDistance(a: HexTile, b: HexTile): number {
    return getHexDistance(this.grid, a, b);
  }

  /** Find a good starting tile for the character (plains, near center). */
  findStartTile(): HexTile | undefined {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);

    // Spiral outward from center to find a plains tile
    const center = this.getTile({ col: cx, row: cy });
    if (center && center.terrain === "plains") return center;

    for (let radius = 1; radius < 20; radius++) {
      for (let dcol = -radius; dcol <= radius; dcol++) {
        for (let drow = -radius; drow <= radius; drow++) {
          const tile = this.getTile({ col: cx + dcol, row: cy + drow });
          if (tile && tile.terrain === "plains") return tile;
        }
      }
    }

    // Fallback: any non-water tile
    let fallback: HexTile | undefined;
    this.grid.forEach((hex) => {
      if (
        !fallback &&
        hex.terrain !== "deep_water" &&
        hex.terrain !== "shallow_water"
      ) {
        fallback = hex;
      }
    });
    return fallback;
  }

  /** Get settlement information for a tile (if it belongs to a settlement). */
  getSettlementForTile(tile: HexTile): Settlement | undefined {
    if (tile.settlementId === undefined) return undefined;
    return this.settlements.find((s) => {
      return s.tiles.some((t) => t.col === tile.col && t.row === tile.row);
    });
  }
}
