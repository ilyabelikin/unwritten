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

    const cities = settlements.filter(s => s.type === 'city');
    const villages = settlements.filter(s => s.type === 'village');

    // Connect all cities to each other
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        this.drawRoadPath(roadGraphics, cities[i], cities[j], worldMap);
      }
    }

    // Connect each village to nearest city
    for (const village of villages) {
      const nearestCity = this.findNearestSettlement(village, cities);
      if (nearestCity) {
        this.drawRoadPath(roadGraphics, village, nearestCity, worldMap);
      }
    }

    console.log('[RoadRenderer] Roads drawn successfully');
  }

  /**
   * Draw a road path between two settlements using pathfinding
   */
  private drawRoadPath(
    roadGraphics: Graphics,
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

    console.log(`[RoadRenderer] Drawing road with ${pathResult.path.length} segments`);

    // Draw the path as a continuous road
    const fullPath = [startTile, ...pathResult.path];
    
    // First pass: place piers at water crossings
    this.placePiersOnPath(fullPath);
    
    // Second pass: draw road segments (skipping water)
    for (let i = 0; i < fullPath.length - 1; i++) {
      const tile1 = fullPath[i];
      const tile2 = fullPath[i + 1];
      
      this.drawRoadSegment(roadGraphics, tile1, tile2);
    }
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
   * Draw a road segment between two tiles on the dedicated road layer
   */
  private drawRoadSegment(roadGraphics: Graphics, tile1: HexTile, tile2: HexTile): void {
    // Don't draw roads over water tiles
    if (isWater(tile1.terrain) || isWater(tile2.terrain)) {
      return;
    }

    // Get absolute world positions for both tiles
    const center1 = hexIsoCenter(tile1);
    const center2 = hexIsoCenter(tile2);

    const roadColor = 0xa89968;
    const roadDark = 0x8b7e5a;
    const roadWidth = 6;

    // Draw outline on dedicated road graphics (using absolute world coordinates)
    roadGraphics.moveTo(center1.x, center1.y);
    roadGraphics.lineTo(center2.x, center2.y);
    roadGraphics.stroke({
      color: roadDark,
      width: roadWidth + 2,
      alpha: 0.6,
      cap: 'round',
    });

    // Draw surface
    roadGraphics.moveTo(center1.x, center1.y);
    roadGraphics.lineTo(center2.x, center2.y);
    roadGraphics.stroke({
      color: roadColor,
      width: roadWidth,
      alpha: 0.8,
      cap: 'round',
    });
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
}
