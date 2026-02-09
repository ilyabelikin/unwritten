import { Container } from "pixi.js";

/**
 * Camera controls the viewport position.
 *
 * Two modes:
 *   - "follow" (default): lerps toward a target (e.g. the character).
 *   - "free pan": the user drags to move the camera freely.
 *     Pressing C or moving the character snaps back to follow mode.
 */
export class Camera {
  private worldContainer: Container;

  private screenWidth: number;
  private screenHeight: number;

  /** Current camera center in world coordinates. */
  private x: number = 0;
  private y: number = 0;

  /** Follow-mode target (character position). */
  private followX: number = 0;
  private followY: number = 0;

  /** When true the camera lerps toward followX/Y each frame. */
  private following: boolean = true;

  /** Lerp speed (0–1). Higher = snappier. */
  private lerpSpeed: number = 0.12;

  /** Zoom/scale (1 = 100%, 0.5 = 50%, 2 = 200%). */
  private scale: number = 1;

  /** Min/max zoom bounds. */
  private minScale: number = 0.3;
  private maxScale: number = 2.5;

  constructor(
    worldContainer: Container,
    screenWidth: number,
    screenHeight: number
  ) {
    this.worldContainer = worldContainer;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  // ─── Follow mode ──────────────────────────────────

  /** Set the follow target (e.g. character position). */
  setTarget(worldX: number, worldY: number): void {
    this.followX = worldX;
    this.followY = worldY;
    this.following = true;
  }

  /** Instantly snap to the follow target. */
  snapToTarget(): void {
    this.x = this.followX;
    this.y = this.followY;
    this.following = true;
    this.applyTransform();
  }

  /** Re-center on the follow target with smooth lerp. */
  centerOnTarget(): void {
    this.following = true;
  }

  // ─── Free pan ─────────────────────────────────────

  /** Set the camera position directly (used during left-drag panning). */
  setPanOffset(worldX: number, worldY: number): void {
    this.x = worldX;
    this.y = worldY;
    this.following = false; // stop auto-following while user pans
    this.applyTransform();
  }

  // ─── Zoom ─────────────────────────────────────────

  /**
   * Zoom in/out by a delta factor, centered on a screen position.
   * @param delta Positive = zoom in, negative = zoom out
   * @param screenX Screen X coordinate to zoom toward (usually mouse position)
   * @param screenY Screen Y coordinate to zoom toward
   */
  zoom(delta: number, screenX: number, screenY: number): void {
    const oldScale = this.scale;
    
    // Calculate world position under cursor BEFORE changing scale
    const worldX = (screenX - this.worldContainer.x) / oldScale;
    const worldY = (screenY - this.worldContainer.y) / oldScale;
    
    // Apply zoom with exponential scaling for smooth feel
    this.scale *= Math.pow(1.1, delta);
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale));

    // If scale didn't actually change (hit limits), don't adjust position
    if (this.scale === oldScale) return;

    // Adjust camera position so the world point stays under the cursor
    // New container offset needed: screenX = containerX + worldX * newScale
    // So: containerX = screenX - worldX * newScale
    // And: containerX = screenWidth/2 - camX * newScale
    // Therefore: screenWidth/2 - camX * newScale = screenX - worldX * newScale
    // camX = (screenWidth/2 - screenX + worldX * newScale) / newScale
    this.x = (this.screenWidth / 2 - screenX) / this.scale + worldX;
    this.y = (this.screenHeight / 2 - screenY) / this.scale + worldY;

    // Stop following when user zooms
    this.following = false;
    
    this.applyTransform();
  }

  /** Get the current zoom scale. */
  getScale(): number {
    return this.scale;
  }

  // ─── Queries ──────────────────────────────────────

  /** Get the current camera center position. */
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /** Convert screen coordinates to world coordinates. */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.worldContainer.x) / this.scale,
      y: (screenY - this.worldContainer.y) / this.scale,
    };
  }

  /** Resize the viewport. */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.applyTransform();
  }

  /** Get the visible world-space bounds for frustum culling. */
  getVisibleBounds() {
    const margin = 100;
    const halfWidth = (this.screenWidth / 2) / this.scale;
    const halfHeight = (this.screenHeight / 2) / this.scale;
    return {
      left: this.x - halfWidth - margin,
      right: this.x + halfWidth + margin,
      top: this.y - halfHeight - margin,
      bottom: this.y + halfHeight + margin,
    };
  }

  // ─── Frame update ─────────────────────────────────

  update(dt: number): void {
    if (this.following) {
      const t = 1 - Math.pow(1 - this.lerpSpeed, dt * 60);
      this.x += (this.followX - this.x) * t;
      this.y += (this.followY - this.y) * t;
      this.applyTransform();
    }
  }

  private applyTransform(): void {
    this.worldContainer.scale.set(this.scale);
    this.worldContainer.x = this.screenWidth / 2 - this.x * this.scale;
    this.worldContainer.y = this.screenHeight / 2 - this.y * this.scale;
  }
}
