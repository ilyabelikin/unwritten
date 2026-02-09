import { TerrainType } from "../world/Terrain";
import type { HexTile } from "../world/HexTile";

/**
 * Isometric projection constants and helpers.
 *
 * The approach: honeycomb-grid computes flat 2D hex positions.
 * We keep x as-is and compress y by ISO_Y_SCALE to create
 * the top-down-at-an-angle illusion. All tile top faces stay
 * at the grid level for seamless tiling. The 3D depth effect
 * comes from varying side wall heights per terrain type.
 */

/** Vertical compression ratio (0.5 = classic 2:1 isometric). */
export const ISO_Y_SCALE = 0.55;

/**
 * Side wall depth per terrain type (pixels).
 * Taller walls = terrain looks more "raised."
 */
export const TERRAIN_SIDE_DEPTH: Record<TerrainType, number> = {
  [TerrainType.DeepWater]: 6,
  [TerrainType.ShallowWater]: 7,
  [TerrainType.Shore]: 9,
  [TerrainType.Plains]: 10,
  [TerrainType.Hills]: 16,
  [TerrainType.Mountains]: 24,
};

/**
 * Vertical elevation offset per terrain type (pixels).
 * This raises the entire tile upward to show height differences.
 * Larger values create dramatic elevation changes.
 */
export const TERRAIN_ELEVATION: Record<TerrainType, number> = {
  [TerrainType.DeepWater]: -6,
  [TerrainType.ShallowWater]: -3,
  [TerrainType.Shore]: 0,
  [TerrainType.Plains]: 2,
  [TerrainType.Hills]: 10,
  [TerrainType.Mountains]: 20,
};

/** Get the side wall depth for a terrain type. */
export function getTileSideHeight(terrain: TerrainType): number {
  return TERRAIN_SIDE_DEPTH[terrain] ?? 10;
}

/** Get the vertical elevation offset for a terrain type. */
export function getTerrainElevation(terrain: TerrainType): number {
  return TERRAIN_ELEVATION[terrain] ?? 0;
}

/**
 * Get hex corners in local (relative) coordinates with isometric Y squish.
 *
 * honeycomb-grid's `hex.corners` are ABSOLUTE world positions (they already
 * include hex.x / hex.y). We subtract the hex position so the corners are
 * relative to the Graphics object that is placed at hexIsoPosition().
 */
export function isoCorners(hex: HexTile): { x: number; y: number }[] {
  return hex.corners.map((c) => ({
    x: c.x - hex.x,
    y: (c.y - hex.y) * ISO_Y_SCALE,
  }));
}

/**
 * Get the isometric screen position for a hex tile.
 * Includes a small elevation offset to show height differences.
 */
export function hexIsoPosition(hex: HexTile): { x: number; y: number } {
  const elevation = getTerrainElevation(hex.terrain);
  return {
    x: hex.x,
    y: hex.y * ISO_Y_SCALE - elevation,
  };
}

/**
 * Get the isometric center of a hex tile in world space
 * (used for camera targeting, character positioning).
 *
 * Since hex.corners are already absolute, the center is just their average.
 * Includes elevation offset to match tile rendering position.
 */
export function hexIsoCenter(hex: HexTile): { x: number; y: number } {
  const corners = hex.corners;
  const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
  const cy = corners.reduce((s, c) => s + c.y, 0) / corners.length;
  const elevation = getTerrainElevation(hex.terrain);
  return {
    x: cx,
    y: cy * ISO_Y_SCALE - elevation,
  };
}

/**
 * Reverse the isometric transform for click detection.
 * Takes isometric world coords and returns flat 2D coords
 * that can be passed to honeycomb-grid's pointToHex.
 *
 * Note: ignores elevation (good enough for hex-sized click targets).
 */
export function isoToFlat(
  isoX: number,
  isoY: number
): { x: number; y: number } {
  return { x: isoX, y: isoY / ISO_Y_SCALE };
}

/**
 * Darken a hex color by a factor (0–1).
 * Used for side face shading.
 */
export function darkenColor(color: number, factor: number): number {
  const r = Math.max(
    0,
    Math.min(255, Math.floor(((color >> 16) & 0xff) * factor))
  );
  const g = Math.max(
    0,
    Math.min(255, Math.floor(((color >> 8) & 0xff) * factor))
  );
  const b = Math.max(0, Math.min(255, Math.floor((color & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}

/**
 * Lighten a hex color by blending toward white.
 */
export function lightenColor(color: number, factor: number): number {
  const r = Math.min(
    255,
    Math.floor(((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * factor)
  );
  const g = Math.min(
    255,
    Math.floor(((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * factor)
  );
  const b = Math.min(
    255,
    Math.floor((color & 0xff) + (255 - (color & 0xff)) * factor)
  );
  return (r << 16) | (g << 8) | b;
}
