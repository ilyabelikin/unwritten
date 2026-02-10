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
  private boatGraphic: Graphics;
  private hitbox: Graphics;

  /** Current rendered position (for smooth movement). */
  private renderX: number = 0;
  private renderY: number = 0;

  /** Target position (actual character position). */
  private targetX: number = 0;
  private targetY: number = 0;

  /** Movement animation speed (base speed for normal terrain). */
  private moveSpeed: number = 0.18;
  
  /** Current movement speed (can be boosted for roads). */
  private currentMoveSpeed: number = 0.18;

  /** Is the character currently embarked on a boat? */
  private isEmbarked: boolean = false;

  /** Animation timer for water waves */
  private waveAnimation: number = 0;

  /** Callback when character is left-clicked. */
  onLeftClick?: () => void;
  
  /** Callback when character is right-clicked. */
  onRightClick?: () => void;

  constructor() {
    this.container = new Container({ label: "character" });

    // Boat graphic (rendered below character)
    this.boatGraphic = new Graphics();
    this.drawBoat();
    this.boatGraphic.visible = false; // Hidden by default
    this.container.addChild(this.boatGraphic);

    // Character graphic
    this.graphic = new Graphics();
    this.drawCharacter();
    this.container.addChild(this.graphic);

    // Create clickable hitbox
    this.hitbox = new Graphics();
    this.hitbox.rect(-20, -30, 40, 50);
    this.hitbox.fill({ color: 0xff0000, alpha: 0.001 }); // Nearly invisible
    this.hitbox.eventMode = "static";
    this.hitbox.cursor = "pointer";
    this.hitbox.on("pointerdown", (e) => {
      e.stopPropagation(); // Prevent world click
      if (e.button === 0) {
        // Left click - open character sheet
        this.onLeftClick?.();
      } else if (e.button === 2) {
        // Right click - show location tooltip
        this.onRightClick?.();
      }
    });
    this.container.addChild(this.hitbox);
  }

  setPosition(worldX: number, worldY: number, isOnRoad: boolean = false): void {
    this.targetX = worldX;
    this.targetY = worldY;
    // Roads are 2x faster to make them feel more rewarding
    this.currentMoveSpeed = isOnRoad ? this.moveSpeed * 2 : this.moveSpeed;
  }

  snapToPosition(worldX: number, worldY: number): void {
    this.targetX = worldX;
    this.targetY = worldY;
    this.renderX = worldX;
    this.renderY = worldY;
    this.container.position.set(this.renderX, this.renderY);
  }

  update(dt: number): void {
    const t = 1 - Math.pow(1 - this.currentMoveSpeed, dt * 60);
    this.renderX += (this.targetX - this.renderX) * t;
    this.renderY += (this.targetY - this.renderY) * t;
    this.container.position.set(this.renderX, this.renderY);

    // Animate water waves if embarked
    if (this.isEmbarked) {
      this.waveAnimation += dt * 2; // Animation speed
      this.updateBoatAnimation();
    }
  }

  private drawCharacter(): void {
    const g = this.graphic;
    const s = HEX_SIZE * 0.3;
    const px = 2; // Pixel size for pixel art effect

    // Ground shadow (isometric ellipse)
    g.ellipse(1.5, s * 0.5, s * 1.0, s * 0.35);
    g.fill({ color: 0x000000, alpha: 0.2 });

    // Pixel art character sprite (8x12 pixel grid scaled up)

    // === LEGS (dark outline color) ===
    // Left leg
    g.rect(-px * 2.5, s * 0.1, px, px * 2);
    g.fill({ color: Palette.characterOutline });
    g.rect(-px * 1.5, s * 0.1, px, px * 2);
    g.fill({ color: Palette.characterOutline });

    // Right leg
    g.rect(px * 0.5, s * 0.1, px, px * 2);
    g.fill({ color: Palette.characterOutline });
    g.rect(px * 1.5, s * 0.1, px, px * 2);
    g.fill({ color: Palette.characterOutline });

    // === BODY ===
    // Body outline (dark)
    g.rect(-px * 3, -s * 0.7, px * 6, px * 4.5);
    g.fill({ color: Palette.characterOutline });

    // Body fill (main color)
    g.rect(-px * 2.5, -s * 0.6, px * 5, px * 3.5);
    g.fill({ color: Palette.character });

    // Body shading (darker side for depth)
    g.rect(px * 1.5, -s * 0.6, px, px * 3.5);
    g.fill({ color: Palette.characterOutline, alpha: 0.3 });

    // Belt (dark strip)
    g.rect(-px * 2.5, -px * 0.5, px * 5, px);
    g.fill({ color: Palette.characterOutline });

    // Belt buckle (small highlight)
    g.rect(-px * 0.5, -px * 0.5, px, px);
    g.fill({ color: 0xffc107, alpha: 0.8 });

    // === ARMS (simple pixel blocks) ===
    // Left arm
    g.rect(-px * 3.5, -s * 0.5, px * 1.5, px * 2.5);
    g.fill({ color: Palette.character });

    // Right arm
    g.rect(px * 2, -s * 0.5, px * 1.5, px * 2.5);
    g.fill({ color: Palette.character });

    // === HEAD ===
    // Head outline (8x6 pixels)
    g.rect(-px * 2.5, -s * 1.3, px * 5, px * 3);
    g.fill({ color: Palette.characterOutline });

    // Head fill
    g.rect(-px * 2, -s * 1.2, px * 4, px * 2.5);
    g.fill({ color: Palette.character });

    // Hair/helmet detail (darker top)
    g.rect(-px * 2, -s * 1.2, px * 4, px);
    g.fill({ color: Palette.characterOutline });

    // === FACE (pixel art details) ===
    // Eyes (2x2 white blocks with 1x1 pupils)
    // Left eye
    g.rect(-px * 1.5, -s * 1.05, px * 1.5, px);
    g.fill({ color: 0xffffff });
    g.rect(-px * 1, -s * 1.05, px * 0.5, px);
    g.fill({ color: 0x222233 });

    // Right eye
    g.rect(px * 0.5, -s * 1.05, px * 1.5, px);
    g.fill({ color: 0xffffff });
    g.rect(px * 1, -s * 1.05, px * 0.5, px);
    g.fill({ color: 0x222233 });

    // Nose (single pixel detail)
    g.rect(0, -s * 0.95, px * 0.5, px * 0.5);
    g.fill({ color: Palette.characterOutline, alpha: 0.5 });

    // === HIGHLIGHTS (pixel art shading) ===
    // Shoulder highlight (left side lighter)
    g.rect(-px * 2, -s * 0.6, px, px);
    g.fill({ color: 0xffffff, alpha: 0.2 });
  }

  /** Draw a boat beneath the character (character sits in the boat). */
  private drawBoat(): void {
    // Initial draw - this will be updated in updateBoatAnimation()
    this.updateBoatAnimation();
  }

  /** Update the boat with animated water. */
  private updateBoatAnimation(): void {
    const g = this.boatGraphic;
    g.clear();

    const s = HEX_SIZE * 0.3;
    const px = 2; // Pixel size

    // Boat colors
    const boatWood = 0x8b7355;
    const boatDark = 0x654321;
    const sailColor = 0xf5f5dc; // Beige
    const waterBlue = 0x3b7cb8;
    const waterLight = 0x4d8ec8;

    // Position boat beneath character
    const boatY = s * 0.3;

    // === ANIMATED WATER WAVES (beneath boat) ===
    const waveOffset = Math.sin(this.waveAnimation) * 1;
    
    // Water ripples around boat
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.waveAnimation * 0.5;
      const radius = 16 + i * 2;
      const alpha = 0.3 - i * 0.05;
      
      g.ellipse(
        Math.cos(angle) * 2,
        boatY + 8 + Math.sin(angle) * 1,
        radius,
        radius * 0.4
      );
      g.stroke({ color: waterBlue, width: 1.5, alpha: alpha });
    }

    // Animated water line highlights
    for (let i = 0; i < 3; i++) {
      const phase = this.waveAnimation + i * 1.2;
      const waveY = Math.sin(phase) * 0.8;
      const x = -10 + i * 10;
      
      g.rect(x, boatY + 10 + waveY, 4, 1);
      g.fill({ color: waterLight, alpha: 0.5 });
    }

    // === BOAT HULL (isometric view - character sits in it) ===
    // Shadow beneath boat
    g.ellipse(0, boatY + 10, 18, 6);
    g.fill({ color: 0x000000, alpha: 0.2 });

    // Hull bottom (darker)
    g.moveTo(-14, boatY + 4);
    g.lineTo(-12, boatY + 8);
    g.lineTo(12, boatY + 8);
    g.lineTo(14, boatY + 4);
    g.closePath();
    g.fill({ color: boatDark });

    // Hull sides (main color)
    g.moveTo(-14, boatY + 4);
    g.lineTo(-12, boatY + 8);
    g.lineTo(12, boatY + 8);
    g.lineTo(14, boatY + 4);
    g.lineTo(12, boatY);
    g.lineTo(-12, boatY);
    g.closePath();
    g.fill({ color: boatWood });

    // Hull rim/edge (top)
    g.moveTo(-14, boatY + 4);
    g.lineTo(-12, boatY);
    g.lineTo(12, boatY);
    g.lineTo(14, boatY + 4);
    g.stroke({ color: boatDark, width: 2 });

    // Interior planks (detail)
    for (let i = 0; i < 3; i++) {
      const x = -8 + i * 8;
      g.moveTo(x, boatY + 2);
      g.lineTo(x - 1, boatY + 6);
      g.stroke({ color: boatDark, width: 1, alpha: 0.4 });
    }

    // === SAIL (behind character) ===
    // Mast
    g.moveTo(-px, boatY - 2);
    g.lineTo(-px, boatY - 16);
    g.stroke({ color: boatDark, width: 2 });

    // Sail (triangular)
    g.moveTo(-px, boatY - 16); // Top of mast
    g.lineTo(-px, boatY - 4);  // Bottom of sail
    g.lineTo(px * 6, boatY - 10); // Right edge
    g.closePath();
    g.fill({ color: sailColor, alpha: 0.95 });

    // Sail outline
    g.moveTo(-px, boatY - 16);
    g.lineTo(-px, boatY - 4);
    g.lineTo(px * 6, boatY - 10);
    g.closePath();
    g.stroke({ color: boatDark, width: 1 });

    // Sail details (horizontal lines)
    for (let i = 0; i < 2; i++) {
      const y = boatY - 14 + i * 5;
      g.moveTo(-px, y);
      g.lineTo(px * 5, boatY - 10 + i * 2);
      g.stroke({ color: boatDark, width: 0.5, alpha: 0.3 });
    }
  }

  /** Show or hide the boat. */
  setEmbarked(embarked: boolean): void {
    this.isEmbarked = embarked;
    this.boatGraphic.visible = embarked;
  }
}
