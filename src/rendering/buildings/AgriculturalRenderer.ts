import { Graphics } from "pixi.js";
import { BuildingType, BUILDING_CONFIG } from "../../world/Building";
import { HEX_SIZE } from "../../world/HexTile";
import { darkenColor } from "../Isometric";

/**
 * Renders agricultural buildings (field, windmill handled in LandmarkRenderer, grain silo)
 */
export class AgriculturalRenderer {
  /**
   * Draw a field with crops
   */
  drawField(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.Field];
    const w = HEX_SIZE * 0.6;
    const h = HEX_SIZE * 0.4;

    // Draw rows of crops (horizontal lines)
    const numRows = 5;
    for (let i = 0; i < numRows; i++) {
      const yOffset = (i / numRows) * h - h * 0.5;
      const rowY = cy + yOffset;
      
      gfx.moveTo(cx - w * 0.8, rowY);
      gfx.lineTo(cx + w * 0.8, rowY);
      gfx.stroke({ color: config.accentColor, width: 2, alpha: 0.6 });
    }

    // Add some crop dots
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < 8; col++) {
        const x = cx - w * 0.7 + (col / 7) * w * 1.4;
        const y = cy - h * 0.5 + (row / numRows) * h;
        gfx.circle(x, y, 1.5);
        gfx.fill({ color: config.baseColor, alpha: 0.8 });
      }
    }
  }

  /**
   * Draw a grain silo
   */
  drawGrainSilo(gfx: Graphics, cx: number, cy: number): void {
    const config = BUILDING_CONFIG[BuildingType.GrainSilo];
    const w = 7;
    const h = 18;

    // Shadow
    gfx.ellipse(cx + 1, cy + h / 2 + 2, w * 1.3, 4);
    gfx.fill({ color: 0x000000, alpha: 0.2 });

    // Cylindrical silo (represented as vertical ellipses)
    gfx.ellipse(cx, cy - h / 2, w, h / 2);
    gfx.fill({ color: config.baseColor });

    // Vertical bands (texture)
    for (let i = -1; i <= 1; i++) {
      gfx.moveTo(cx + i * 4, cy - h);
      gfx.lineTo(cx + i * 4, cy + h / 2);
      gfx.stroke({ color: config.accentColor, width: 1, alpha: 0.4 });
    }

    // Conical roof
    gfx.poly([
      { x: cx - w, y: cy - h },
      { x: cx, y: cy - h - 8 },
      { x: cx + w, y: cy - h },
    ]);
    gfx.fill({ color: config.roofColor });

    // Loading door
    gfx.rect(cx - 3, cy + h / 4, 6, 5);
    gfx.fill({ color: 0x654321 });
  }
}
