import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Palette } from "./Palette";
import { Character } from "../entity/Character";
import { EquipmentSlot, Item } from "../entity/Item";

/**
 * Character Sheet UI — displays character equipment and inventory.
 */
export class CharacterSheet {
  readonly container: Container;

  private background: Graphics;
  private closeButton: Container;
  private equipmentSlots: Map<EquipmentSlot, Container> = new Map();
  private inventorySlots: Container[] = [];
  private character: Character;

  private screenWidth: number;
  private screenHeight: number;

  /** Callback when the sheet is closed. */
  onClose?: () => void;

  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(character: Character, screenWidth: number, screenHeight: number) {
    this.character = character;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.container = new Container({ label: "character-sheet" });
    this.container.visible = false;

    // Set up ESC and I key handlers
    this.keyHandler = (e: KeyboardEvent) => {
      if (
        this.container.visible &&
        (e.key === "Escape" || e.key === "i" || e.key === "I")
      ) {
        this.hide();
      }
    };
    window.addEventListener("keydown", this.keyHandler);

    // Semi-transparent overlay behind the sheet
    const overlay = new Graphics();
    overlay.rect(0, 0, screenWidth, screenHeight);
    overlay.fill({ color: 0x000000, alpha: 0.5 });
    overlay.eventMode = "static"; // Block clicks to world
    overlay.on("pointerdown", () => this.hide()); // Click outside to close
    this.container.addChild(overlay);

    // Main sheet panel
    const sheetWidth = 880;
    const sheetHeight = 540;
    const sheetX = (screenWidth - sheetWidth) / 2;
    const sheetY = (screenHeight - sheetHeight) / 2;

    this.background = new Graphics();
    this.background.roundRect(0, 0, sheetWidth, sheetHeight, 12);
    this.background.fill({ color: Palette.uiBg, alpha: 0.97 });
    this.background.roundRect(0, 0, sheetWidth, sheetHeight, 12);
    this.background.stroke({ color: Palette.uiAccent, width: 3 });
    this.background.position.set(sheetX, sheetY);
    this.background.eventMode = "static"; // Stop propagation
    this.background.on("pointerdown", (e) => e.stopPropagation());
    this.background.on("pointerup", (e) => e.stopPropagation());
    this.background.on("click", (e) => e.stopPropagation());
    this.container.addChild(this.background);

    // Title bar background
    const titleBar = new Graphics();
    titleBar.roundRect(0, 0, sheetWidth, 50, 12);
    titleBar.fill({ color: 0x1a1a1a, alpha: 0.8 });
    titleBar.position.set(sheetX, sheetY);
    this.container.addChild(titleBar);

    // Title
    const title = new Text({
      text: "Character",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 24,
        fill: Palette.uiAccent,
        fontWeight: "bold",
      }),
    });
    title.position.set(sheetX + 24, sheetY + 13);
    this.container.addChild(title);

    // Close button (X)
    this.closeButton = this.createCloseButton();
    this.closeButton.position.set(sheetX + sheetWidth - 40, sheetY + 18);
    this.container.addChild(this.closeButton);

    // Equipment section (left side)
    this.createEquipmentSection(sheetX + 24, sheetY + 70);

    // Vertical divider line
    const divider = new Graphics();
    divider.rect(0, 0, 2, 450);
    divider.fill({ color: 0x444444, alpha: 0.5 });
    divider.position.set(sheetX + 420, sheetY + 60);
    this.container.addChild(divider);

    // Inventory section (right side)
    this.createInventorySection(sheetX + 440, sheetY + 70, sheetWidth - 464);

    // Keyboard shortcuts help text at bottom
    const helpText = new Text({
      text: "Press [I] or [ESC] to close • Click items to equip/unequip",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: 0x888888,
        align: "center",
      }),
    });
    helpText.anchor.set(0.5, 0);
    helpText.position.set(sheetX + sheetWidth / 2, sheetY + sheetHeight - 30);
    this.container.addChild(helpText);
  }

  /** Show the character sheet. */
  show(): void {
    this.container.visible = true;
    this.refresh();
  }

  /** Hide the character sheet. */
  hide(): void {
    this.container.visible = false;
    this.onClose?.();
  }

  /** Refresh the displayed items. */
  refresh(): void {
    // Update equipment slots
    const allEquipment = this.character.inventory.getAllEquipment();
    for (const [slot, slotContainer] of this.equipmentSlots) {
      const item = allEquipment.get(slot);
      this.updateSlot(slotContainer, item, true, slot);
    }

    // Update inventory slots
    const items = this.character.inventory.getItems();
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const item = items[i];
      this.updateSlot(this.inventorySlots[i], item, false);
    }
  }

  /** Handle screen resize. */
  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // Clear and rebuild the entire UI
    this.container.removeChildren();

    // Recreate overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, width, height);
    overlay.fill({ color: 0x000000, alpha: 0.5 });
    overlay.eventMode = "static";
    overlay.on("pointerdown", () => this.hide());
    this.container.addChild(overlay);

    // Recenter the sheet
    const sheetWidth = 880;
    const sheetHeight = 540;
    const sheetX = (width - sheetWidth) / 2;
    const sheetY = (height - sheetHeight) / 2;

    this.background = new Graphics();
    this.background.roundRect(0, 0, sheetWidth, sheetHeight, 12);
    this.background.fill({ color: Palette.uiBg, alpha: 0.97 });
    this.background.roundRect(0, 0, sheetWidth, sheetHeight, 12);
    this.background.stroke({ color: Palette.uiAccent, width: 3 });
    this.background.position.set(sheetX, sheetY);
    this.background.eventMode = "static";
    this.background.on("pointerdown", (e) => e.stopPropagation());
    this.background.on("pointerup", (e) => e.stopPropagation());
    this.background.on("click", (e) => e.stopPropagation());
    this.container.addChild(this.background);

    // Title bar background
    const titleBar = new Graphics();
    titleBar.roundRect(0, 0, sheetWidth, 50, 12);
    titleBar.fill({ color: 0x1a1a1a, alpha: 0.8 });
    titleBar.position.set(sheetX, sheetY);
    this.container.addChild(titleBar);

    // Title
    const title = new Text({
      text: "Character",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 24,
        fill: Palette.uiAccent,
        fontWeight: "bold",
      }),
    });
    title.position.set(sheetX + 24, sheetY + 13);
    this.container.addChild(title);

    // Close button
    this.closeButton = this.createCloseButton();
    this.closeButton.position.set(sheetX + sheetWidth - 40, sheetY + 18);
    this.container.addChild(this.closeButton);

    // Clear and recreate equipment slots
    this.equipmentSlots.clear();
    this.createEquipmentSection(sheetX + 24, sheetY + 70);

    // Vertical divider line
    const divider = new Graphics();
    divider.rect(0, 0, 2, 450);
    divider.fill({ color: 0x444444, alpha: 0.5 });
    divider.position.set(sheetX + 420, sheetY + 60);
    this.container.addChild(divider);

    // Clear and recreate inventory slots
    this.inventorySlots = [];
    this.createInventorySection(sheetX + 440, sheetY + 70, sheetWidth - 464);

    // Keyboard shortcuts help text at bottom
    const helpText = new Text({
      text: "Press [I] or [ESC] to close • Click items to equip/unequip",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: 0x888888,
        align: "center",
      }),
    });
    helpText.anchor.set(0.5, 0);
    helpText.position.set(sheetX + sheetWidth / 2, sheetY + sheetHeight - 30);
    this.container.addChild(helpText);

    // Refresh the data
    this.refresh();
  }

  /** Create the equipment section (left side). */
  private createEquipmentSection(x: number, y: number): void {
    // Section header with background
    const headerBg = new Graphics();
    headerBg.roundRect(0, 0, 380, 32, 6);
    headerBg.fill({ color: 0x1a1a1a, alpha: 0.6 });
    headerBg.position.set(x, y - 40);
    this.container.addChild(headerBg);

    const sectionTitle = new Text({
      text: "Equipment",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: Palette.uiText,
        fontWeight: "bold",
      }),
    });
    sectionTitle.position.set(x + 10, y - 34);
    this.container.addChild(sectionTitle);

    // Draw large pixel art character in the center
    const charCenterX = x + 150;
    const charCenterY = y + 180;
    const characterGraphic = this.createLargeCharacter();
    characterGraphic.position.set(charCenterX, charCenterY);
    this.container.addChild(characterGraphic);

    // Position equipment slots around the character
    // Head - above character
    const headSlot = this.createSlotUI(
      "head",
      charCenterX - 100,
      charCenterY - 160,
      200,
      40,
    );
    this.equipmentSlots.set("head", headSlot);
    this.container.addChild(headSlot);

    // Jewelry - below head
    const jewelrySlot = this.createSlotUI(
      "jewelry",
      charCenterX - 100,
      charCenterY - 110,
      200,
      40,
    );
    this.equipmentSlots.set("jewelry", jewelrySlot);
    this.container.addChild(jewelrySlot);

    // Left Hand - left of character
    const leftHandSlot = this.createSlotUI(
      "leftHand",
      charCenterX - 240,
      charCenterY - 40,
      130,
      80,
    );
    this.equipmentSlots.set("leftHand", leftHandSlot);
    this.container.addChild(leftHandSlot);

    // Right Hand - right of character
    const rightHandSlot = this.createSlotUI(
      "rightHand",
      charCenterX + 110,
      charCenterY - 40,
      130,
      80,
    );
    this.equipmentSlots.set("rightHand", rightHandSlot);
    this.container.addChild(rightHandSlot);

    // Chest - center below character
    const chestSlot = this.createSlotUI(
      "chest",
      charCenterX - 100,
      charCenterY + 60,
      200,
      40,
    );
    this.equipmentSlots.set("chest", chestSlot);
    this.container.addChild(chestSlot);

    // Pants - below chest
    const pantsSlot = this.createSlotUI(
      "pants",
      charCenterX - 100,
      charCenterY + 110,
      200,
      40,
    );
    this.equipmentSlots.set("pants", pantsSlot);
    this.container.addChild(pantsSlot);

    // Shoes - at bottom
    const shoesSlot = this.createSlotUI(
      "shoes",
      charCenterX - 100,
      charCenterY + 160,
      200,
      40,
    );
    this.equipmentSlots.set("shoes", shoesSlot);
    this.container.addChild(shoesSlot);
  }

  /** Create the inventory section (right side). */
  private createInventorySection(x: number, y: number, width: number): void {
    // Section header with background
    const headerBg = new Graphics();
    headerBg.roundRect(0, 0, width, 32, 6);
    headerBg.fill({ color: 0x1a1a1a, alpha: 0.6 });
    headerBg.position.set(x, y - 40);
    this.container.addChild(headerBg);

    const sectionTitle = new Text({
      text: "Inventory",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: Palette.uiText,
        fontWeight: "bold",
      }),
    });
    sectionTitle.position.set(x + 10, y - 34);
    this.container.addChild(sectionTitle);

    // Create a grid of inventory slots
    const slotSize = 64;
    const gap = 8;
    const cols = Math.floor(width / (slotSize + gap));
    const rows = 6;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const slotX = x + col * (slotSize + gap);
        const slotY = y + row * (slotSize + gap);
        const slotContainer = this.createInventorySlotUI(
          slotX,
          slotY,
          slotSize,
        );
        this.inventorySlots.push(slotContainer);
        this.container.addChild(slotContainer);
      }
    }
  }

  /** Create a single equipment slot UI. */
  private createSlotUI(
    slot: EquipmentSlot,
    x: number,
    y: number,
    width: number = 300,
    height: number = 50,
  ): Container {
    const container = new Container({ label: `slot-${slot}` });
    container.position.set(x, y);

    // Slot background
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 6);
    bg.fill({ color: 0x1f1f1f, alpha: 0.9 });
    bg.roundRect(0, 0, width, height, 6);
    bg.stroke({ color: 0x444444, width: 1.5 });
    container.addChild(bg);

    // Slot label
    const label = new Text({
      text: this.getSlotLabel(slot),
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 10,
        fill: 0x888888,
      }),
    });
    label.position.set(10, 6);
    container.addChild(label);

    // Item name (will be updated)
    const itemText = new Text({
      text: "Empty",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: height > 50 ? 12 : 14,
        fill: Palette.uiText,
        wordWrap: true,
        wordWrapWidth: width - 20,
      }),
    });
    itemText.position.set(10, height > 50 ? 26 : 26);
    container.addChild(itemText);

    // Store references for updating
    (container as any).itemText = itemText;
    (container as any).bg = bg;
    (container as any).width = width;
    (container as any).height = height;

    // Add click interaction for equipment slots
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointerdown", (e) => {
      e.stopPropagation();
      this.handleEquipmentSlotClick(slot);
    });

    return container;
  }

  /** Create a single inventory slot UI. */
  private createInventorySlotUI(x: number, y: number, size: number): Container {
    const container = new Container({ label: "inventory-slot" });
    container.position.set(x, y);

    // Slot background
    const bg = new Graphics();
    bg.roundRect(0, 0, size, size, 6);
    bg.fill({ color: 0x1f1f1f, alpha: 0.9 });
    bg.roundRect(0, 0, size, size, 6);
    bg.stroke({ color: 0x444444, width: 1.5 });
    container.addChild(bg);

    // Item text (will be updated)
    const itemText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 9,
        fill: Palette.uiText,
        wordWrap: true,
        wordWrapWidth: size - 10,
        align: "center",
      }),
    });
    itemText.position.set(5, 5);
    container.addChild(itemText);

    // Store references
    (container as any).itemText = itemText;
    (container as any).bg = bg;
    (container as any).item = null;

    // Add click interaction
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointerdown", (e) => {
      e.stopPropagation();
      this.handleInventorySlotClick(container);
    });

    return container;
  }

  /** Update a slot with item data. */
  private updateSlot(
    slotContainer: Container,
    item: Item | undefined,
    isEquipment: boolean,
    equipSlot?: EquipmentSlot,
  ): void {
    const itemText = (slotContainer as any).itemText as Text;
    const bg = (slotContainer as any).bg as Graphics;
    const w = (slotContainer as any).width || (isEquipment ? 300 : 64);
    const h = (slotContainer as any).height || (isEquipment ? 50 : 64);

    if (item) {
      itemText.text = isEquipment ? item.name : item.name;
      itemText.style.fill = Palette.uiAccent;
      (slotContainer as any).item = item;

      // Highlight if item is hoverable
      bg.clear();
      bg.roundRect(0, 0, w, h, 6);
      bg.fill({ color: 0x2d2d2d, alpha: 0.95 });
      bg.roundRect(0, 0, w, h, 6);
      bg.stroke({ color: Palette.uiAccent, width: 2 });
    } else {
      itemText.text = isEquipment ? "Empty" : "";
      itemText.style.fill = 0x666666;
      (slotContainer as any).item = null;

      // Reset background
      bg.clear();
      bg.roundRect(0, 0, w, h, 6);
      bg.fill({ color: 0x1f1f1f, alpha: 0.9 });
      bg.roundRect(0, 0, w, h, 6);
      bg.stroke({ color: 0x444444, width: 1.5 });
    }
  }

  /** Handle click on equipment slot. */
  private handleEquipmentSlotClick(slot: EquipmentSlot): void {
    const item = this.character.inventory.getEquipped(slot);
    if (item) {
      // Unequip the item
      const success = this.character.inventory.unequipItem(slot);
      if (success) {
        console.log(`Unequipped ${item.name} from ${slot}`);
        this.refresh();
      } else {
        console.log("Inventory is full!");
      }
    }
  }

  /** Handle click on inventory slot. */
  private handleInventorySlotClick(slotContainer: Container): void {
    const item = (slotContainer as any).item as Item | null;
    if (item && item.equipmentSlot) {
      // Try to equip the item
      const success = this.character.inventory.equipItem(item.id);
      if (success) {
        console.log(`Equipped ${item.name} to ${item.equipmentSlot}`);
        this.refresh();
      }
    }
  }

  /** Get a readable label for an equipment slot. */
  private getSlotLabel(slot: EquipmentSlot): string {
    const labels: Record<EquipmentSlot, string> = {
      leftHand: "Left Hand",
      rightHand: "Right Hand",
      head: "Head",
      jewelry: "Jewelry",
      chest: "Chest",
      pants: "Pants",
      shoes: "Shoes",
    };
    return labels[slot];
  }

  /** Create the close button. */
  private createCloseButton(): Container {
    const btn = new Container({ label: "close-btn" });
    btn.eventMode = "static";
    btn.cursor = "pointer";

    const bg = new Graphics();
    bg.circle(0, 0, 14);
    bg.fill({ color: 0x8b2020 });
    bg.circle(0, 0, 14);
    bg.stroke({ color: 0xe85040, width: 2 });
    btn.addChild(bg);

    const x = new Text({
      text: "X",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: "bold",
      }),
    });
    x.anchor.set(0.5);
    x.position.set(0, 0);
    btn.addChild(x);

    // Hover effect
    btn.on("pointerover", () => {
      bg.clear();
      bg.circle(0, 0, 14);
      bg.fill({ color: 0xb02828 });
      bg.circle(0, 0, 14);
      bg.stroke({ color: 0xff6050, width: 2 });
    });

    btn.on("pointerout", () => {
      bg.clear();
      bg.circle(0, 0, 14);
      bg.fill({ color: 0x8b2020 });
      bg.circle(0, 0, 14);
      bg.stroke({ color: 0xe85040, width: 2 });
    });

    btn.on("pointerdown", (e) => {
      e.stopPropagation();
      this.hide();
    });
    btn.on("pointerup", (e) => e.stopPropagation());
    btn.on("click", (e) => e.stopPropagation());

    return btn;
  }

  /** Clean up resources. */
  destroy(): void {
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
    this.container.destroy();
  }

  /** Create a large pixel art character for display. */
  private createLargeCharacter(): Graphics {
    const g = new Graphics();
    const scale = 5; // Make it 5x larger than the in-game sprite
    const px = 2 * scale; // Pixel size

    // Ground shadow (isometric ellipse)
    g.ellipse(0, 40, 40, 15);
    g.fill({ color: 0x000000, alpha: 0.2 });

    // === LEGS (dark outline color) ===
    // Left leg
    g.rect(-px * 2.5, -px * 2, px, px * 2);
    g.fill({ color: Palette.characterOutline });
    g.rect(-px * 1.5, -px * 2, px, px * 2);
    g.fill({ color: Palette.characterOutline });

    // Right leg
    g.rect(px * 0.5, -px * 2, px, px * 2);
    g.fill({ color: Palette.characterOutline });
    g.rect(px * 1.5, -px * 2, px, px * 2);
    g.fill({ color: Palette.characterOutline });

    // === BODY ===
    // Body outline (dark)
    g.rect(-px * 3, -px * 6.5, px * 6, px * 4.5);
    g.fill({ color: Palette.characterOutline });

    // Body fill (main color)
    g.rect(-px * 2.5, -px * 6, px * 5, px * 3.5);
    g.fill({ color: Palette.character });

    // Body shading (darker side for depth)
    g.rect(px * 1.5, -px * 6, px, px * 3.5);
    g.fill({ color: Palette.characterOutline, alpha: 0.3 });

    // Belt (dark strip)
    g.rect(-px * 2.5, -px * 3, px * 5, px);
    g.fill({ color: Palette.characterOutline });

    // Belt buckle (small highlight)
    g.rect(-px * 0.5, -px * 3, px, px);
    g.fill({ color: 0xffc107, alpha: 0.8 });

    // === ARMS (simple pixel blocks) ===
    // Left arm
    g.rect(-px * 3.5, -px * 5.5, px * 1.5, px * 2.5);
    g.fill({ color: Palette.character });

    // Right arm
    g.rect(px * 2, -px * 5.5, px * 1.5, px * 2.5);
    g.fill({ color: Palette.character });

    // === HEAD ===
    // Head outline (8x6 pixels)
    g.rect(-px * 2.5, -px * 9.5, px * 5, px * 3);
    g.fill({ color: Palette.characterOutline });

    // Head fill
    g.rect(-px * 2, -px * 9, px * 4, px * 2.5);
    g.fill({ color: Palette.character });

    // Hair/helmet detail (darker top)
    g.rect(-px * 2, -px * 9, px * 4, px);
    g.fill({ color: Palette.characterOutline });

    // === FACE (pixel art details) ===
    // Eyes (2x2 white blocks with 1x1 pupils)
    // Left eye
    g.rect(-px * 1.5, -px * 8.5, px * 1.5, px);
    g.fill({ color: 0xffffff });
    g.rect(-px * 1, -px * 8.5, px * 0.5, px);
    g.fill({ color: 0x222233 });

    // Right eye
    g.rect(px * 0.5, -px * 8.5, px * 1.5, px);
    g.fill({ color: 0xffffff });
    g.rect(px * 1, -px * 8.5, px * 0.5, px);
    g.fill({ color: 0x222233 });

    // Nose (single pixel detail)
    g.rect(0, -px * 7.5, px * 0.5, px * 0.5);
    g.fill({ color: Palette.characterOutline, alpha: 0.5 });

    // === HIGHLIGHTS (pixel art shading) ===
    // Shoulder highlight (left side lighter)
    g.rect(-px * 2, -px * 6, px, px);
    g.fill({ color: 0xffffff, alpha: 0.2 });

    return g;
  }
}
