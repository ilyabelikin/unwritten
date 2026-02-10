import { Graphics } from "pixi.js";
import { HexTile, HEX_SIZE } from "../../world/HexTile";
import { BuildingType } from "../../world/Building";
import { isoCorners, darkenColor, lightenColor } from "../Isometric";

type Pt = { x: number; y: number };

/**
 * Handles rendering of settlement infrastructure (fences, walls, paths, ground textures)
 */
export class SettlementRenderer {
  /**
   * Draw paths/roads connecting settlement tiles
   */
  drawSettlementConnections(
    gfx: Graphics,
    hex: HexTile,
    allTiles: Iterable<HexTile>,
    corners: Pt[]
  ): void {
    // Get center point
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;

    // Find all tiles in the same settlement
    const tilesArray = Array.from(allTiles);
    const settlementTiles = tilesArray.filter(
      t => t.settlementId === hex.settlementId
    );

    // Find neighboring settlement tiles (for drawing paths)
    const neighbors = this.getSettlementNeighbors(hex, tilesArray);
    
    // Draw paths to each neighboring settlement tile
    for (const neighbor of neighbors) {
      const neighborCorners = isoCorners(neighbor);
      const ncx = neighborCorners.reduce((s, c) => s + c.x, 0) / neighborCorners.length;
      const ncy = neighborCorners.reduce((s, c) => s + c.y, 0) / neighborCorners.length;

      // Determine path direction
      const dx = neighbor.col - hex.col;
      const dy = neighbor.row - hex.row;

      // Draw path/road connecting tiles
      this.drawPath(gfx, cx, cy, ncx, ncy, dx, dy);
    }

    // Draw settlement ground texture (dirt/cobblestone)
    if (settlementTiles.length > 1) {
      this.drawSettlementGround(gfx, hex, corners);
    }
  }

  /**
   * Get neighboring tiles that are in the same settlement
   */
  private getSettlementNeighbors(hex: HexTile, allTiles: HexTile[]): HexTile[] {
    const neighbors: HexTile[] = [];
    
    // Check 6 hex neighbors
    const neighborOffsets = [
      { col: 1, row: 0 },   // E
      { col: -1, row: 0 },  // W
      { col: 0, row: 1 },   // SE (for even rows) / S
      { col: 0, row: -1 },  // NW (for even rows) / N
      { col: 1, row: 1 },   // SW (for odd rows)
      { col: -1, row: -1 }, // NE (for odd rows)
    ];

    for (const offset of neighborOffsets) {
      const neighborCol = hex.col + offset.col;
      const neighborRow = hex.row + offset.row;
      
      const neighbor = allTiles.find(
        t => t.col === neighborCol && t.row === neighborRow
      );

      if (neighbor && neighbor.settlementId === hex.settlementId) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Draw a path/road between two tiles
   */
  private drawPath(
    gfx: Graphics,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    dx: number,
    dy: number
  ): void {
    // Path color (dirt/cobblestone)
    const pathColor = 0x8b7355; // Brown dirt
    
    // Draw path as a line segment
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    // Path width
    const pathWidth = 8;
    
    // Draw path segment toward neighbor
    gfx.moveTo(fromX, fromY);
    gfx.lineTo(midX, midY);
    gfx.stroke({ color: pathColor, width: pathWidth, alpha: 0.6 });
    
    // Add cobblestone texture (small dots)
    const numStones = 3;
    for (let i = 0; i < numStones; i++) {
      const t = (i + 0.5) / numStones;
      const sx = fromX + (midX - fromX) * t;
      const sy = fromY + (midY - fromY) * t;
      const offset = (i % 2) * 2 - 1;
      
      gfx.circle(sx + offset * 2, sy, 1);
      gfx.fill({ color: darkenColor(pathColor, 0.7), alpha: 0.5 });
    }
  }

  /**
   * Draw settlement ground texture
   */
  private drawSettlementGround(gfx: Graphics, hex: HexTile, corners: Pt[]): void {
    // Subtle ground texture to show this tile is part of a settlement
    const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;
    
    // Light overlay to distinguish settlement tiles
    const groundColor = hex.building !== BuildingType.None ? 0xa0826d : 0x9d8b6f;
    
    // Draw scattered dirt/cobblestone pattern
    const seed = hex.col * 1000 + hex.row;
    const random = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    // Add some small ground details
    for (let i = 0; i < 4; i++) {
      const angle = random(i * 5) * Math.PI * 2;
      const dist = random(i * 7) * HEX_SIZE * 0.4;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist * 0.5;
      
      gfx.circle(px, py, 1.5);
      gfx.fill({ color: groundColor, alpha: 0.3 });
    }
  }

  /**
   * Draw perimeter walls/fences for settlements
   */
  drawSettlementPerimeter(
    gfx: Graphics,
    hex: HexTile,
    allTiles: Iterable<HexTile>,
    corners: Pt[]
  ): void {
    if (hex.settlementId === undefined) return;

    // Don't draw fences around landmark buildings
    if (hex.building === BuildingType.Church || 
        hex.building === BuildingType.Tower || 
        hex.building === BuildingType.Castle) {
      return;
    }

    // Don't draw fences around water-based buildings (fishing boats are IN water)
    if (hex.building === BuildingType.FishingBoat) {
      return;
    }

    const tilesArray = Array.from(allTiles);
    const neighbors = this.getSettlementNeighbors(hex, tilesArray);
    
    // Check if this is a perimeter tile (has fewer than 6 settlement neighbors)
    if (neighbors.length === 6) return; // Interior tile, no perimeter needed

    // Check each hex edge
    const edgeDirections = [
      { col: 1, row: 0, edge: [1, 2] },   // E edge
      { col: -1, row: 0, edge: [4, 5] },  // W edge
      { col: 0, row: 1, edge: [2, 3] },   // SE edge
      { col: 0, row: -1, edge: [5, 0] },  // NW edge
      { col: 1, row: 1, edge: [3, 4] },   // SW edge (odd rows)
      { col: -1, row: -1, edge: [0, 1] }, // NE edge (odd rows)
    ];

    // Determine if it's a city (has landmark) or village
    const isCity = tilesArray.some(t => 
      t.settlementId === hex.settlementId && 
      (t.building === BuildingType.Church || 
       t.building === BuildingType.Tower || 
       t.building === BuildingType.Castle)
    );

    for (const dir of edgeDirections) {
      const neighborCol = hex.col + dir.col;
      const neighborRow = hex.row + dir.row;
      
      const hasNeighbor = neighbors.some(
        n => n.col === neighborCol && n.row === neighborRow
      );

      if (!hasNeighbor) {
        // This edge is on the perimeter - draw fence/wall
        const [i1, i2] = dir.edge;
        const p1 = corners[i1];
        const p2 = corners[(i1 + 1) % 6];
        
        if (isCity) {
          // Stone wall for cities (pixel art)
          this.drawCityWall(gfx, p1.x, p1.y, p2.x, p2.y);
        } else {
          // Wooden fence for villages (pixel art)
          this.drawVillageFence(gfx, p1.x, p1.y, p2.x, p2.y);
        }
      }
    }
  }

  /**
   * Draw city stone wall (pixel art)
   */
  private drawCityWall(gfx: Graphics, x1: number, y1: number, x2: number, y2: number): void {
    const wallColor = 0x8c8680; // Stone gray
    const wallHeight = 6;
    
    // Wall base
    gfx.moveTo(x1, y1);
    gfx.lineTo(x2, y2);
    gfx.stroke({ color: darkenColor(wallColor, 0.7), width: 3, alpha: 0.8 });
    
    // Wall top (lighter)
    gfx.moveTo(x1, y1 - wallHeight);
    gfx.lineTo(x2, y2 - wallHeight);
    gfx.stroke({ color: wallColor, width: 2, alpha: 0.8 });
    
    // Battlements (small rectangles)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const numMerlons = Math.floor(len / 12);
    
    for (let i = 0; i < numMerlons; i++) {
      const t = (i + 0.5) / numMerlons;
      const mx = x1 + dx * t;
      const my = y1 + dy * t - wallHeight;
      
      gfx.rect(mx - 2, my - 2, 4, 2);
      gfx.fill({ color: lightenColor(wallColor, 0.1), alpha: 0.7 });
    }
  }

  /**
   * Draw village wooden fence (pixel art)
   */
  private drawVillageFence(gfx: Graphics, x1: number, y1: number, x2: number, y2: number): void {
    const fenceColor = 0x8b4513; // Wood brown
    const fenceHeight = 4;
    
    // Fence posts
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const numPosts = Math.floor(len / 10) + 1;
    
    for (let i = 0; i <= numPosts; i++) {
      const t = i / numPosts;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      
      // Post (vertical line)
      gfx.rect(px - 1, py - fenceHeight, 2, fenceHeight);
      gfx.fill({ color: fenceColor, alpha: 0.7 });
    }
    
    // Horizontal rails
    gfx.moveTo(x1, y1 - fenceHeight * 0.3);
    gfx.lineTo(x2, y2 - fenceHeight * 0.3);
    gfx.stroke({ color: darkenColor(fenceColor, 0.8), width: 1.5, alpha: 0.6 });
    
    gfx.moveTo(x1, y1 - fenceHeight * 0.7);
    gfx.lineTo(x2, y2 - fenceHeight * 0.7);
    gfx.stroke({ color: darkenColor(fenceColor, 0.8), width: 1.5, alpha: 0.6 });
  }
}
