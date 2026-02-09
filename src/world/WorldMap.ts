import { Direction, Grid, type HexCoordinates } from "honeycomb-grid";
import { HexTile } from "./HexTile";
import { WorldGenConfig, WorldGenerator } from "./WorldGenerator";

/**
 * WorldMap wraps the honeycomb Grid and provides gameplay-level queries.
 */
export class WorldMap {
  readonly grid: Grid<HexTile>;
  readonly width: number;
  readonly height: number;

  constructor(config: Partial<WorldGenConfig> = {}) {
    const generator = new WorldGenerator(config);
    this.grid = generator.generate();
    this.width = config.width ?? 120;
    this.height = config.height ?? 120;
  }

  /** Get a tile by axial/offset coordinates. Returns undefined if out of bounds. */
  getTile(coords: HexCoordinates): HexTile | undefined {
    return this.grid.getHex(coords);
  }

  /** Pointy-top hex neighbor directions (skip N and S which are vertices). */
  static readonly NEIGHBOR_DIRS: Direction[] = [
    Direction.NE, Direction.E, Direction.SE,
    Direction.SW, Direction.W, Direction.NW,
  ];

  /** Get all 6 neighbors of a hex (filters out undefined for edge tiles). */
  getNeighbors(hex: HexTile): HexTile[] {
    const neighbors: HexTile[] = [];
    for (const dir of WorldMap.NEIGHBOR_DIRS) {
      const neighbor = this.grid.neighborOf(hex, dir, { allowOutside: false });
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  /** Calculate hex distance between two tiles using the grid's built-in method. */
  hexDistance(a: HexTile, b: HexTile): number {
    return this.grid.distance(a, b, { allowOutside: true });
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
      if (!fallback && hex.terrain !== "deep_water" && hex.terrain !== "shallow_water") {
        fallback = hex;
      }
    });
    return fallback;
  }
}
