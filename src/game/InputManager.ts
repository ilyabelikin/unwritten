import { Application, FederatedPointerEvent } from "pixi.js";
import { Camera } from "./Camera";

export type ClickHandler = (
  worldX: number,
  worldY: number,
  button: number
) => void;
export type HoverHandler = (
  worldX: number,
  worldY: number,
  screenX: number,
  screenY: number
) => void;
export type KeyHandler = (key: string) => void;
export type WheelHandler = (delta: number, screenX: number, screenY: number) => void;

/** Pixel threshold — if the mouse moves less than this, it's a click not a drag. */
const DRAG_THRESHOLD = 5;

/**
 * InputManager handles mouse/keyboard input.
 *
 * Controls:
 *   Left click        — select tile (show info)
 *   Left drag         — pan camera
 *   Right click       — command character to move
 *   Mouse wheel       — zoom in/out
 *   Mouse hover       — terrain tooltip
 *   C                 — center camera on character
 *   Space / Enter     — end turn
 */
export class InputManager {
  private camera: Camera;

  private selectHandlers: ClickHandler[] = [];
  private moveHandlers: ClickHandler[] = [];
  private hoverHandlers: HoverHandler[] = [];
  private keyHandlers: KeyHandler[] = [];
  private wheelHandlers: WheelHandler[] = [];

  /** Panning state */
  private isPanning = false;
  private panStartScreenX = 0;
  private panStartScreenY = 0;
  private panStartCamX = 0;
  private panStartCamY = 0;
  private didDrag = false;

  constructor(app: Application, camera: Camera) {
    this.camera = camera;

    // Make the stage interactive
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    // Prevent the browser context menu on right-click
    app.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // ─── Pointer down ───────────────────────────────
    app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
      if (e.button === 0) {
        // Left button — start potential pan
        this.isPanning = true;
        this.didDrag = false;
        this.panStartScreenX = e.globalX;
        this.panStartScreenY = e.globalY;
        const camPos = this.camera.getPosition();
        this.panStartCamX = camPos.x;
        this.panStartCamY = camPos.y;
      } else if (e.button === 2) {
        // Right button — command move
        const world = this.camera.screenToWorld(e.globalX, e.globalY);
        for (const handler of this.moveHandlers) {
          handler(world.x, world.y, e.button);
        }
      }
    });

    // ─── Pointer move ───────────────────────────────
    app.stage.on("pointermove", (e: FederatedPointerEvent) => {
      // Pan while left button is held
      if (this.isPanning) {
        const dx = e.globalX - this.panStartScreenX;
        const dy = e.globalY - this.panStartScreenY;

        if (
          !this.didDrag &&
          Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD
        ) {
          this.didDrag = true;
        }

        if (this.didDrag) {
          this.camera.setPanOffset(
            this.panStartCamX - dx,
            this.panStartCamY - dy
          );
        }
      }

      // Hover (always fires for tooltip)
      const world = this.camera.screenToWorld(e.globalX, e.globalY);
      for (const handler of this.hoverHandlers) {
        handler(world.x, world.y, e.globalX, e.globalY);
      }
    });

    // ─── Pointer up ─────────────────────────────────
    app.stage.on("pointerup", (e: FederatedPointerEvent) => {
      if (e.button === 0 && this.isPanning) {
        if (!this.didDrag) {
          // No drag happened — this is a left click (select)
          const world = this.camera.screenToWorld(e.globalX, e.globalY);
          for (const handler of this.selectHandlers) {
            handler(world.x, world.y, e.button);
          }
        }
        this.isPanning = false;
        this.didDrag = false;
      }
    });

    // Also cancel pan if pointer leaves the canvas
    app.stage.on("pointerupoutside", () => {
      this.isPanning = false;
      this.didDrag = false;
    });

    // ─── Keyboard ───────────────────────────────────
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      for (const handler of this.keyHandlers) {
        handler(e.key);
      }
    });

    // ─── Mouse wheel (zoom) ─────────────────────────
    app.canvas.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault(); // Prevent page scroll
      
      // Normalize wheel delta (different browsers report different values)
      const delta = -Math.sign(e.deltaY);
      
      for (const handler of this.wheelHandlers) {
        handler(delta, e.clientX, e.clientY);
      }
    });
  }

  /** Left click (no drag) — select tile for info. */
  onSelect(handler: ClickHandler): void {
    this.selectHandlers.push(handler);
  }

  /** Right click — command movement. */
  onMove(handler: ClickHandler): void {
    this.moveHandlers.push(handler);
  }

  onHover(handler: HoverHandler): void {
    this.hoverHandlers.push(handler);
  }

  onKey(handler: KeyHandler): void {
    this.keyHandlers.push(handler);
  }

  onWheel(handler: WheelHandler): void {
    this.wheelHandlers.push(handler);
  }
}
