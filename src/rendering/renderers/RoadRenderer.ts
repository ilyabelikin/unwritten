import { Graphics } from "pixi.js";
import { HexTile } from "../../world/HexTile";
import { BuildingType, BUILDING_CONFIG, Settlement } from "../../world/Building";
import { WorldMap } from "../../world/WorldMap";
import { isWater } from "../../world/Terrain";
import { findPath } from "../../pathfinding/Pathfinding";
import { isoCorners, hexIsoCenter, darkenColor } from "../Isometric";

/**
 * Handles rendering of roads, paths, bridges, and piers
 */
export class RoadRenderer {
  private roadSegments: HexTile[][] = [];

  /**
   * Draw roads using pathfinding between settlement centers
   */
  drawRoadsFromSettlements(
    roadGraphics: Graphics,
    grid: Iterable<HexTile>,
    settlements: Settlement[],
    worldMap: WorldMap
  ): void {
    console.log(`[RoadRenderer] Drawing roads between ${settlements.length} settlements`);

    // Clear previous segments
    this.roadSegments = [];

    const cities = settlements.filter(s => s.type === 'city');
    const villages = settlements.filter(s => s.type === 'village');

    // Connect all cities to each other
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        this.collectRoadPath(cities[i], cities[j], worldMap);
      }
    }

    // Connect each village to nearest city
    for (const village of villages) {
      const nearestCity = this.findNearestSettlement(village, cities);
      if (nearestCity) {
        this.collectRoadPath(village, nearestCity, worldMap);
      }
    }

    // Now draw all collected road segments in two passes
    this.drawAllRoads(roadGraphics);

    // ALSO draw any other tiles marked with hasRoad (e.g., hamlet connections from Pass 9)
    this.drawAdditionalRoadTiles(roadGraphics, grid);

    console.log('[RoadRenderer] Roads drawn successfully');
  }

  /**
   * Draw all collected road segments with proper layering (outlines first, then surfaces)
   */
  private drawAllRoads(roadGraphics: Graphics): void {
    const roadColor = 0xa89968;
    const roadDark = 0x8b7e5a;
    const roadWidth = 6;

    // First pass: draw all outlines
    for (const segment of this.roadSegments) {
      this.drawSegmentLayer(roadGraphics, segment, roadDark, roadWidth + 2, 0.6);
    }

    // Second pass: draw all surfaces on top
    for (const segment of this.roadSegments) {
      this.drawSegmentLayer(roadGraphics, segment, roadColor, roadWidth, 0.8);
    }
  }

  /**
   * Draw a single layer (outline or surface) for a road segment
   */
  private drawSegmentLayer(
    roadGraphics: Graphics,
    tiles: HexTile[],
    color: number,
    width: number,
    alpha: number
  ): void {
    if (tiles.length < 2) return;

    const centers = tiles.map(tile => hexIsoCenter(tile));

    roadGraphics.moveTo(centers[0].x, centers[0].y);
    for (let i = 1; i < centers.length; i++) {
      roadGraphics.lineTo(centers[i].x, centers[i].y);
    }
    roadGraphics.stroke({
      color,
      width,
      alpha,
      cap: 'round',
      join: 'round',
    });
  }

  /**
   * Collect road path segments between two settlements for later rendering
   */
  private collectRoadPath(
    from: Settlement,
    to: Settlement,
    worldMap: WorldMap
  ): void {
    const startTile = worldMap.getTile({ col: from.center.col, row: from.center.row });
    const endTile = worldMap.getTile({ col: to.center.col, row: to.center.row });

    if (!startTile || !endTile) {
      console.warn('[RoadRenderer] Could not find start or end tile');
      return;
    }

    // Use pathfinding to get the path
    const pathResult = findPath(startTile, endTile, worldMap, false);
    
    if (!pathResult.found || pathResult.path.length === 0) {
      console.warn(`[RoadRenderer] No path found between ${from.center.col},${from.center.row} and ${to.center.col},${to.center.row}`);
      return;
    }

    console.log(`[RoadRenderer] Collecting road with ${pathResult.path.length} segments`);

    // Collect the path segments
    const fullPath = [startTile, ...pathResult.path];
    
    // First pass: place piers at water crossings
    this.placePiersOnPath(fullPath);
    
    // Second pass: collect road segments (split by water crossings)
    this.collectContinuousRoadSegments(fullPath);
  }

  /**
   * Place a single pier at water entry point only for true crossings
   */
  private placePiersOnPath(path: HexTile[]): void {
    let waterSequence: HexTile[] = [];
    let hasLandBefore = false;

    for (let i = 0; i < path.length; i++) {
      const tile = path[i];
      const tileIsWater = isWater(tile.terrain);

      if (tileIsWater) {
        // Add to current water sequence
        waterSequence.push(tile);
      } else {
        // End of water sequence - place single pier only if it's a true crossing
        if (waterSequence.length > 0 && hasLandBefore) {
          // Only place pier if we have land before AND after the water
          const firstWaterTile = waterSequence[0];

          // Place pier at entry point (first water tile)
          if (firstWaterTile.building === BuildingType.None) {
            firstWaterTile.building = BuildingType.Pier;
          }

          waterSequence = [];
        }
        hasLandBefore = true;
      }
    }

    // Don't process remaining water sequence at the end - no land after means no pier
  }

  /**
   * Collect road segments, splitting at water crossings
   */
  private collectContinuousRoadSegments(path: HexTile[]): void {
    // Group consecutive land tiles into continuous path segments
    let currentSegment: HexTile[] = [];

    for (let i = 0; i < path.length; i++) {
      const tile = path[i];

      if (isWater(tile.terrain)) {
        // Water tile - end current segment and store it
        if (currentSegment.length >= 2) {
          this.roadSegments.push([...currentSegment]);
        }
        currentSegment = [];
      } else {
        // Land tile - add to current segment
        currentSegment.push(tile);
      }
    }

    // Store final segment if any
    if (currentSegment.length >= 2) {
      this.roadSegments.push([...currentSegment]);
    }
  }

  /**
   * Find nearest settlement
   */
  private findNearestSettlement(from: Settlement, candidates: Settlement[]): Settlement | null {
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

  /**
   * Draw a bridge structure
   */
  drawBridge(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Bridge];
    
    // Wooden bridge structure - spans the entire tile
    const bridgeW = 16;
    const bridgeH = 20;
    const pierColor = config.baseColor;
    const pierDark = config.accentColor;

    // Shadow under bridge
    gfx.ellipse(cx + 1, cy + 2, bridgeW * 0.9, 4);
    gfx.fill({ color: 0x000000, alpha: 0.25 });

    // Support posts on both sides
    const postPositions = [
      { x: cx - bridgeW / 2, y: cy - bridgeH / 2 },
      { x: cx + bridgeW / 2, y: cy - bridgeH / 2 },
      { x: cx - bridgeW / 2, y: cy + bridgeH / 2 },
      { x: cx + bridgeW / 2, y: cy + bridgeH / 2 },
    ];

    for (const pos of postPositions) {
      // Vertical support post
      gfx.rect(pos.x - 1.5, pos.y, 3, 8);
      gfx.fill({ color: pierDark });
      // Post cap
      gfx.rect(pos.x - 2, pos.y - 1, 4, 2);
      gfx.fill({ color: config.accentColor });
    }

    // Main bridge deck (horizontal planks spanning the tile)
    gfx.rect(cx - bridgeW / 2, cy - 4, bridgeW, 8);
    gfx.fill({ color: pierColor });

    // Plank lines (running perpendicular to bridge direction)
    for (let i = 0; i < 5; i++) {
      const plankX = cx - bridgeW / 2 + (i * bridgeW) / 4;
      gfx.moveTo(plankX, cy - 4);
      gfx.lineTo(plankX, cy + 4);
      gfx.stroke({ color: pierDark, width: 1, alpha: 0.4 });
    }

    // Side railings
    gfx.rect(cx - bridgeW / 2 - 1, cy - 5, bridgeW + 2, 1);
    gfx.fill({ color: pierDark, alpha: 0.7 });
    gfx.rect(cx - bridgeW / 2 - 1, cy + 4, bridgeW + 2, 1);
    gfx.fill({ color: pierDark, alpha: 0.7 });

    // Bridge outline for definition
    gfx.rect(cx - bridgeW / 2, cy - 4, bridgeW, 8);
    gfx.stroke({ color: pierDark, width: 1, alpha: 0.6 });
  }

  /**
   * Draw a pier structure
   */
  drawPier(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Pier];
    
    // Wooden pier structure
    const pierColor = config.baseColor;
    const pierDark = config.accentColor;
    const pierW = 12;
    const pierH = 8;

    // Shadow under pier
    gfx.ellipse(cx + 1, cy + 2, pierW * 0.9, 3);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Main pier platform (horizontal planks)
    gfx.rect(cx - pierW / 2, cy - pierH / 2, pierW, pierH);
    gfx.fill({ color: pierColor });
    
    // Plank lines (horizontal boards)
    for (let i = 1; i < 4; i++) {
      const plankY = cy - pierH / 2 + (i * pierH) / 4;
      gfx.moveTo(cx - pierW / 2, plankY);
      gfx.lineTo(cx + pierW / 2, plankY);
      gfx.stroke({ color: pierDark, width: 1, alpha: 0.4 });
    }

    // Pier posts (vertical supports)
    const postPositions = [
      { x: cx - pierW / 3, y: cy },
      { x: cx + pierW / 3, y: cy },
    ];

    for (const pos of postPositions) {
      // Post going down into water
      gfx.rect(pos.x - 1, cy + pierH / 2, 2, 4);
      gfx.fill({ color: pierDark });
    }

    // Pier outline for definition
    gfx.rect(cx - pierW / 2, cy - pierH / 2, pierW, pierH);
    gfx.stroke({ color: pierDark, width: 1, alpha: 0.6 });
  }

  /**
   * Draw a dock structure
   */
  drawDock(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Dock];
    const w = 10;
    const h = 16;

    // Shadow
    gfx.ellipse(cx + 1, cy + 2, w * 1.2, 4);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Wooden dock planks (horizontal)
    for (let i = 0; i < 5; i++) {
      const y = cy - h / 2 + i * 4;
      gfx.rect(cx - w, y, w * 2, 2);
      gfx.fill({ color: i % 2 === 0 ? config.baseColor : config.accentColor });
    }

    // Support posts
    const posts = [
      { x: cx - w / 2, y: cy },
      { x: cx + w / 2, y: cy },
    ];
    for (const post of posts) {
      gfx.rect(post.x - 1, post.y, 2, 10);
      gfx.fill({ color: darkenColor(config.baseColor, 0.7) });
    }

    // Barrel on dock
    gfx.ellipse(cx - w / 2, cy - h / 4, 3, 2);
    gfx.fill({ color: 0x8b4513 });
    gfx.rect(cx - w / 2 - 3, cy - h / 4, 6, 5);
    gfx.fill({ color: 0x8b4513 });
  }

  /**
   * Draw additional tiles marked with hasRoad that aren't part of main road segments
   * (e.g., hamlet connections from Pass 9)
   */
  private drawAdditionalRoadTiles(roadGraphics: Graphics, grid: Iterable<HexTile>): void {
    const roadColor = 0xa89968;
    const roadDark = 0x8b7e5a;
    const roadWidth = 6;

    // Collect all tiles with hasRoad that aren't in existing segments
    const existingRoadTiles = new Set<string>();
    for (const segment of this.roadSegments) {
      for (const tile of segment) {
        existingRoadTiles.add(`${tile.col},${tile.row}`);
      }
    }

    const additionalTiles: HexTile[] = [];
    for (const tile of grid) {
      if (tile.hasRoad && !existingRoadTiles.has(`${tile.col},${tile.row}`)) {
        additionalTiles.push(tile);
      }
    }

    if (additionalTiles.length === 0) return;

    console.log(`[RoadRenderer] Drawing ${additionalTiles.length} additional road tiles (hamlet connections)`);

    // Group connected tiles into paths for smoother rendering
    const paths = this.groupAdjacentTiles(additionalTiles);

    // Draw each path as a segment (matching main road style)
    for (const path of paths) {
      // Draw outline first
      this.drawSegmentLayer(roadGraphics, path, roadDark, roadWidth + 2, 0.6);
    }

    for (const path of paths) {
      // Draw surface on top
      this.drawSegmentLayer(roadGraphics, path, roadColor, roadWidth, 0.8);
    }
  }

  /**
   * Group adjacent road tiles into connected paths for smoother rendering
   */
  private groupAdjacentTiles(tiles: HexTile[]): HexTile[][] {
    if (tiles.length === 0) return [];

    const paths: HexTile[][] = [];
    const remaining = new Set(tiles);

    while (remaining.size > 0) {
      const path: HexTile[] = [];
      const startIter = remaining.values().next();
      if (startIter.done) break;
      const start = startIter.value;
      path.push(start);
      remaining.delete(start);

      // Greedily extend path by finding adjacent tiles
      let extended = true;
      while (extended) {
        extended = false;
        const last = path[path.length - 1];

        // Try to find an adjacent tile in remaining set
        for (const tile of remaining) {
          const dx = Math.abs(tile.col - last.col);
          const dy = Math.abs(tile.row - last.row);
          if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
            path.push(tile);
            remaining.delete(tile);
            extended = true;
            break;
          }
        }
      }

      paths.push(path);
    }

    return paths;
  }
}
