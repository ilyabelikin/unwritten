/**
 * Types of equipment slots available on the character.
 */
export type EquipmentSlot =
  | "leftHand"
  | "rightHand"
  | "head"
  | "jewelry"
  | "chest"
  | "pants"
  | "shoes";

/**
 * Base item interface.
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  icon?: string; // Could be used for sprite/texture later
  equipmentSlot?: EquipmentSlot; // If undefined, item cannot be equipped
}

/**
 * Inventory and equipment management for the character.
 */
export class Inventory {
  /** Items in the character's backpack. */
  private items: Item[] = [];

  /** Equipped items by slot. */
  private equipment: Map<EquipmentSlot, Item> = new Map();

  /** Max number of items in backpack. */
  readonly maxItems: number = 20;

  constructor() {
    // Initialize with some test items
    this.items = [
      {
        id: "potion1",
        name: "Health Potion",
        description: "Restores 50 HP",
      },
      {
        id: "bread1",
        name: "Bread",
        description: "A simple loaf of bread",
      },
      {
        id: "sword1",
        name: "Iron Sword",
        description: "A well-crafted iron blade",
        equipmentSlot: "rightHand",
      },
    ];

    // Start with some equipped items
    this.equipment.set("chest", {
      id: "armor1",
      name: "Leather Armor",
      description: "Light but protective",
      equipmentSlot: "chest",
    });

    this.equipment.set("shoes", {
      id: "boots1",
      name: "Worn Boots",
      description: "Comfortable walking boots",
      equipmentSlot: "shoes",
    });
  }

  /** Get all items in backpack. */
  getItems(): Item[] {
    return [...this.items];
  }

  /** Get equipped item in a specific slot. */
  getEquipped(slot: EquipmentSlot): Item | undefined {
    return this.equipment.get(slot);
  }

  /** Get all equipment slots and their contents. */
  getAllEquipment(): Map<EquipmentSlot, Item> {
    return new Map(this.equipment);
  }

  /** Add item to inventory. Returns false if inventory is full. */
  addItem(item: Item): boolean {
    if (this.items.length >= this.maxItems) {
      return false;
    }
    this.items.push(item);
    return true;
  }

  /** Remove item from inventory by ID. */
  removeItem(itemId: string): Item | undefined {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) return undefined;

    const [removed] = this.items.splice(index, 1);
    return removed;
  }

  /** Equip an item from inventory. */
  equipItem(itemId: string): boolean {
    const item = this.items.find((i) => i.id === itemId);
    if (!item || !item.equipmentSlot) return false;

    // Unequip current item in slot if any
    const currentItem = this.equipment.get(item.equipmentSlot);
    if (currentItem) {
      this.items.push(currentItem);
    }

    // Remove from inventory and equip
    this.removeItem(itemId);
    this.equipment.set(item.equipmentSlot, item);
    return true;
  }

  /** Unequip an item and return it to inventory. */
  unequipItem(slot: EquipmentSlot): boolean {
    const item = this.equipment.get(slot);
    if (!item) return false;

    if (!this.addItem(item)) return false; // Inventory full

    this.equipment.delete(slot);
    return true;
  }
}
