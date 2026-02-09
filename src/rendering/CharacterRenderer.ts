import { Container, Graphics } from "pixi.js";
import { Palette } from "./Palette";
import { HEX_SIZE } from "../world/HexTile";

/**
 * Renders the player character as a simple pixel-art figure
 * with a ground shadow for the isometric view.
 */
export class CharacterRenderer {
  readonly container: Container;
  private graphic: Graphics;

  /** Current rendered position (for smooth movement). */
  private renderX: number = 0;
  private renderY: number = 0;

  /** Target position (actual character position). */
  private targetX: number = 0;
  private targetY: number = 0;

  /** Movement animation speed. */
  private moveSpeed: number = 0.18;

  constructor() {
    this.container = new Container({ label: "character" });
    this.graphic = new Graphics();
    this.drawCharacter();
    this.container.addChild(this.graphic);
  }

  setPosition(worldX: number, worldY: number): void {
    this.targetX = worldX;
    this.targetY = worldY;
  }

  snapToPosition(worldX: number, worldY: number): void {
    this.targetX = worldX;
    this.targetY = worldY;
    this.renderX = worldX;
    this.renderY = worldY;
    this.container.position.set(this.renderX, this.renderY);
  }

  update(dt: number): void {
    const t = 1 - Math.pow(1 - this.moveSpeed, dt * 60);
    this.renderX += (this.targetX - this.renderX) * t;
    this.renderY += (this.targetY - this.renderY) * t;
    this.container.position.set(this.renderX, this.renderY);
  }

  private drawCharacter(): void {
    const g = this.graphic;
    const s = HEX_SIZE * 0.3;

    // Ground shadow (isometric ellipse)
    g.ellipse(1.5, s * 0.5, s * 1.0, s * 0.35);
    g.fill({ color: 0x000000, alpha: 0.2 });

    // Feet / legs
    g.rect(-s * 0.35, s * 0.1, s * 0.25, s * 0.35);
    g.fill({ color: Palette.characterOutline });
    g.rect(s * 0.1, s * 0.1, s * 0.25, s * 0.35);
    g.fill({ color: Palette.characterOutline });

    // Body outline
    g.roundRect(-s * 0.55, -s * 0.6, s * 1.1, s * 0.9, 2);
    g.fill({ color: Palette.characterOutline });

    // Body
    g.roundRect(-s * 0.45, -s * 0.5, s * 0.9, s * 0.7, 2);
    g.fill({ color: Palette.character });

    // Belt
    g.rect(-s * 0.45, -s * 0.0, s * 0.9, s * 0.15);
    g.fill({ color: Palette.characterOutline });

    // Head outline
    g.circle(0, -s * 1.1, s * 0.5);
    g.fill({ color: Palette.characterOutline });

    // Head
    g.circle(0, -s * 1.1, s * 0.4);
    g.fill({ color: Palette.character });

    // Eyes
    g.circle(-s * 0.12, -s * 1.2, 1.5);
    g.fill({ color: 0xffffff });
    g.circle(s * 0.12, -s * 1.2, 1.5);
    g.fill({ color: 0xffffff });

    // Eye pupils
    g.circle(-s * 0.1, -s * 1.18, 0.8);
    g.fill({ color: 0x222233 });
    g.circle(s * 0.14, -s * 1.18, 0.8);
    g.fill({ color: 0x222233 });
  }
}
