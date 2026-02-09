import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Palette } from "./Palette";
import { MAX_AP } from "../entity/Character";
import { TERRAIN_CONFIG, TerrainType } from "../world/Terrain";

/**
 * Heads-Up Display — overlays AP counter, turn info, terrain tooltip,
 * and an End Turn button on the screen.
 */
export class HUD {
  readonly container: Container;

  private apContainer: Container;
  private apDiamonds: Graphics[] = [];
  private turnText: Text;
  private tooltipContainer: Container;
  private tooltipBg: Graphics;
  private tooltipText: Text;
  private endTurnButton: Container;
  private endTurnBg: Graphics;
  private endTurnText: Text;

  /** Callback when End Turn is clicked. */
  onEndTurn?: () => void;

  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.container = new Container({ label: "hud" });

    // -- AP Display --
    this.apContainer = new Container({ label: "ap-display" });
    this.container.addChild(this.apContainer);

    const apLabel = new Text({
      text: "AP",
      style: this.labelStyle(),
    });
    apLabel.position.set(0, 0);
    this.apContainer.addChild(apLabel);

    for (let i = 0; i < MAX_AP; i++) {
      const diamond = new Graphics();
      this.drawDiamond(diamond, true);
      diamond.position.set(35 + i * 22, 8);
      this.apDiamonds.push(diamond);
      this.apContainer.addChild(diamond);
    }

    this.apContainer.position.set(20, 20);

    // -- Turn Counter --
    this.turnText = new Text({
      text: "Turn 1",
      style: this.labelStyle(),
    });
    this.turnText.position.set(20, 50);
    this.container.addChild(this.turnText);

    // -- Terrain Tooltip --
    this.tooltipContainer = new Container({ label: "tooltip" });
    this.tooltipContainer.visible = false;

    this.tooltipBg = new Graphics();
    this.tooltipContainer.addChild(this.tooltipBg);

    this.tooltipText = new Text({
      text: "",
      style: this.tooltipStyle(),
    });
    this.tooltipText.position.set(10, 6);
    this.tooltipContainer.addChild(this.tooltipText);

    this.container.addChild(this.tooltipContainer);

    // -- End Turn Button --
    this.endTurnButton = new Container({ label: "end-turn-btn" });
    this.endTurnButton.eventMode = "static";
    this.endTurnButton.cursor = "pointer";

    this.endTurnBg = new Graphics();
    this.endTurnBg.roundRect(0, 0, 100, 32, 4);
    this.endTurnBg.fill({ color: Palette.uiBg, alpha: 0.85 });
    this.endTurnBg.roundRect(0, 0, 100, 32, 4);
    this.endTurnBg.stroke({ color: Palette.uiAccent, width: 1.5 });
    this.endTurnButton.addChild(this.endTurnBg);

    this.endTurnText = new Text({
      text: "End Turn",
      style: this.buttonStyle(),
    });
    this.endTurnText.position.set(12, 6);
    this.endTurnButton.addChild(this.endTurnText);

    this.endTurnButton.on("pointerdown", () => {
      this.onEndTurn?.();
    });

    this.container.addChild(this.endTurnButton);

    // Position elements
    this.layout();
  }

  /** Update AP display. */
  setAP(current: number): void {
    for (let i = 0; i < this.apDiamonds.length; i++) {
      this.apDiamonds[i].clear();
      this.drawDiamond(this.apDiamonds[i], i < current);
    }
  }

  /** Update turn display. */
  setTurn(turn: number): void {
    this.turnText.text = `Turn ${turn}`;
  }

  /** Show terrain tooltip at a screen position. */
  showTooltip(
    terrain: TerrainType,
    screenX: number,
    screenY: number
  ): void {
    const config = TERRAIN_CONFIG[terrain];
    const text = `${config.name}  (${config.apCost} AP)`;
    this.tooltipText.text = text;

    // Redraw background to fit text
    this.tooltipBg.clear();
    const w = this.tooltipText.width + 20;
    const h = this.tooltipText.height + 12;
    this.tooltipBg.roundRect(0, 0, w, h, 3);
    this.tooltipBg.fill({ color: Palette.uiBg, alpha: 0.9 });
    this.tooltipBg.roundRect(0, 0, w, h, 3);
    this.tooltipBg.stroke({ color: Palette.hexOutlineLight, width: 1 });

    // Position tooltip near cursor but keep on screen
    let tx = screenX + 16;
    let ty = screenY - 10;
    if (tx + w > this.screenWidth) tx = screenX - w - 8;
    if (ty + h > this.screenHeight) ty = screenY - h - 8;
    if (ty < 0) ty = 4;

    this.tooltipContainer.position.set(tx, ty);
    this.tooltipContainer.visible = true;
  }

  /** Hide the terrain tooltip. */
  hideTooltip(): void {
    this.tooltipContainer.visible = false;
  }

  /** Handle screen resize. */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.layout();
  }

  /** Position HUD elements. */
  private layout(): void {
    // End Turn button: bottom-right corner
    this.endTurnButton.position.set(
      this.screenWidth - 120,
      this.screenHeight - 52
    );
  }

  /** Draw a diamond shape (filled or empty). */
  private drawDiamond(gfx: Graphics, filled: boolean): void {
    const s = 7;
    gfx.poly([
      { x: 0, y: -s },
      { x: s, y: 0 },
      { x: 0, y: s },
      { x: -s, y: 0 },
    ]);
    if (filled) {
      gfx.fill({ color: Palette.uiAccent });
    } else {
      gfx.fill({ color: Palette.uiDim, alpha: 0.4 });
    }
    gfx.poly([
      { x: 0, y: -s },
      { x: s, y: 0 },
      { x: 0, y: s },
      { x: -s, y: 0 },
    ]);
    gfx.stroke({ color: Palette.uiAccent, width: 1, alpha: filled ? 1 : 0.5 });
  }

  private labelStyle(): TextStyle {
    return new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: Palette.uiText,
      fontWeight: "bold",
    });
  }

  private tooltipStyle(): TextStyle {
    return new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: Palette.uiText,
    });
  }

  private buttonStyle(): TextStyle {
    return new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: Palette.uiAccent,
      fontWeight: "bold",
    });
  }
}
