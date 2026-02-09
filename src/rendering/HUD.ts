import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Palette } from "./Palette";
import { MAX_AP } from "../entity/Character";
import { TERRAIN_CONFIG, TerrainType, VegetationType } from "../world/Terrain";
import { BuildingType, BUILDING_CONFIG, Settlement } from "../world/Building";
import { ResourceDeposit, RESOURCE_CONFIG } from "../world/Resource";

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
  private messageContainer: Container;
  private messageBg: Graphics;
  private messageText: Text;
  private messageTimer: number = 0;

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

    // -- Message Display (for feedback like "Not enough AP!") --
    this.messageContainer = new Container({ label: "message" });
    this.messageContainer.visible = false;

    this.messageBg = new Graphics();
    this.messageContainer.addChild(this.messageBg);

    this.messageText = new Text({
      text: "",
      style: this.messageStyle(),
    });
    this.messageText.position.set(12, 8);
    this.messageContainer.addChild(this.messageText);

    this.container.addChild(this.messageContainer);

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

  /** Show terrain tooltip in a fixed position under the minimap. */
  showTooltip(
    terrain: TerrainType,
    isRough: boolean,
    movementCost: number | null,
    currentAP: number,
    building?: BuildingType,
    settlement?: Settlement,
    vegetation?: VegetationType,
    treeDensity?: number,
    resource?: ResourceDeposit,
  ): void {
    const config = TERRAIN_CONFIG[terrain];
    const roughSuffix = isRough ? " (Rough)" : "";

    // Build tooltip text with movement cost if provided
    let text = `${config.name}${roughSuffix}`;
    if (movementCost !== null) {
      const canAfford = movementCost <= currentAP;
      const costColor = canAfford ? "" : " (!)";
      text += `  [${movementCost} AP${costColor}]`;
    }

    // Add vegetation information if present
    if (vegetation && vegetation !== VegetationType.None) {
      if (vegetation === VegetationType.Bush) {
        text += `\n• Shrub`;
      } else if (
        vegetation === VegetationType.Tree &&
        treeDensity !== undefined
      ) {
        // Describe forest density
        let forestType: string;
        if (treeDensity < 0.2) {
          forestType = "Sparse Trees";
        } else if (treeDensity < 0.4) {
          forestType = "Light Woods";
        } else if (treeDensity < 0.6) {
          forestType = "Light Forest";
        } else if (treeDensity < 0.75) {
          forestType = "Forest";
        } else if (treeDensity < 0.9) {
          forestType = "Dense Forest";
        } else {
          forestType = "Very Dense Forest";
        }
        // Mark dense forests (>= 0.6) as rough terrain
        const roughSuffix = treeDensity >= 0.6 ? " (Rough)" : "";
        text += `\n• ${forestType}${roughSuffix}`;
      }
    }

    // Add building information if present
    if (building && building !== BuildingType.None) {
      const buildingConfig = BUILDING_CONFIG[building];
      text += `\n• ${buildingConfig.name}`;
    }

    // Add settlement information if present
    if (settlement) {
      const settlementType = 
        settlement.type === "city" ? "City" : 
        settlement.type === "hamlet" ? "Hamlet" : 
        "Village";
      const tileCount = settlement.tiles.length;
      text += `\n• ${settlementType} (${tileCount} tile${tileCount > 1 ? "s" : ""})`;

      // Show landmark for cities
      if (settlement.type === "city" && settlement.landmark) {
        const landmarkConfig = BUILDING_CONFIG[settlement.landmark];
        text += `\n  Landmark: ${landmarkConfig.name}`;
      }
    }

    // Add resource information if present
    if (resource && resource.type !== "none") {
      const resourceConfig = RESOURCE_CONFIG[resource.type];
      const qualityPercent = Math.round(resource.quality * 100);
      const qualityDesc = 
        resource.quality >= 0.8 ? "Excellent" :
        resource.quality >= 0.6 ? "Good" :
        resource.quality >= 0.4 ? "Fair" :
        "Poor";
      text += `\n⬥ ${resourceConfig.name} (${qualityDesc})`;
    }

    this.tooltipText.text = text;

    // Redraw background to fit text
    this.tooltipBg.clear();
    const w = this.tooltipText.width + 20;
    const h = this.tooltipText.height + 12;
    this.tooltipBg.roundRect(0, 0, w, h, 3);
    this.tooltipBg.fill({ color: Palette.uiBg, alpha: 0.9 });
    this.tooltipBg.roundRect(0, 0, w, h, 3);
    this.tooltipBg.stroke({ color: Palette.hexOutlineLight, width: 1 });

    // Position tooltip in a fixed location under the minimap
    // Minimap is 200x200 at (screenWidth - 200 - 20, 20)
    const miniMapWidth = 200;
    const miniMapHeight = 200;
    const miniMapPadding = 20;
    const tooltipSpacing = 10;

    const tx = this.screenWidth - miniMapWidth - miniMapPadding;
    const ty = miniMapPadding + miniMapHeight + tooltipSpacing;

    this.tooltipContainer.position.set(tx, ty);
    this.tooltipContainer.visible = true;
  }

  /** Hide the terrain tooltip. */
  hideTooltip(): void {
    this.tooltipContainer.visible = false;
  }

  /** Show a temporary message (e.g., "Not enough AP!"). */
  showMessage(text: string, durationSeconds: number = 2): void {
    this.messageText.text = text;

    // Redraw background to fit text
    this.messageBg.clear();
    const w = this.messageText.width + 24;
    const h = this.messageText.height + 16;
    this.messageBg.roundRect(0, 0, w, h, 4);
    this.messageBg.fill({ color: 0x8b2020, alpha: 0.9 });
    this.messageBg.roundRect(0, 0, w, h, 4);
    this.messageBg.stroke({ color: 0xe85040, width: 2 });

    // Center at top of screen
    this.messageContainer.position.set((this.screenWidth - w) / 2, 60);

    this.messageContainer.visible = true;
    this.messageTimer = durationSeconds;
  }

  /** Update message timer (call from game loop). */
  update(dt: number): void {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        this.messageContainer.visible = false;
      }
    }
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
      this.screenHeight - 52,
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

  private messageStyle(): TextStyle {
    return new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: "bold",
    });
  }
}
