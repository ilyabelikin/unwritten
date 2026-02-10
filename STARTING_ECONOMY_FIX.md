# Starting Economy Defaults Fix

## Issue

Settlements were starting with arbitrary raw construction materials (100 timber, 50 stone) which made no sense for lived-in communities.

## Problem

```typescript
// ❌ OLD: Raw construction materials
economy.addResource("timber", 100);
economy.addResource("stone", 50);
```

**Why this was wrong:**
- Settlements are **established communities**, not construction sites
- People would have **consumed** these materials to build existing buildings
- No **food stockpiles** - what are people eating?
- No **consumable goods** - cloth, fuel, etc.
- Same amounts for all settlement types (cities vs hamlets)

## Solution

Settlements now start with **consumable goods and food** that scale by settlement type:

```typescript
// ✅ NEW: Realistic stockpiles based on settlement type
if (settlement.type === "city") {
  // Cities: Large stockpiles
  economy.addGood("bread", 50);
  economy.addGood("meat", 30);
  economy.addGood("prepared_fish", 25);
  economy.addGood("cloth", 20);
  economy.addGood("leather", 15);
  economy.addGood("coal", 40);
  economy.addGood("planks", 30);
  economy.addGood("bricks", 25);
  economy.addResource("timber", 20);
  economy.addResource("stone", 15);
  
} else if (settlement.type === "village") {
  // Villages: Moderate stockpiles
  economy.addGood("bread", 20);
  economy.addGood("meat", 12);
  economy.addGood("prepared_fish", 10);
  economy.addGood("cloth", 8);
  economy.addGood("leather", 6);
  economy.addGood("coal", 15);
  economy.addGood("planks", 12);
  economy.addResource("timber", 10);
  economy.addResource("stone", 5);
  
} else { // hamlet
  // Hamlets: Small stockpiles, mostly food
  economy.addGood("bread", 8);
  economy.addGood("meat", 5);
  economy.addGood("coal", 5);
  economy.addResource("timber", 5);
}
```

## New Starting Stockpiles

### Cities (8-15 buildings)
**Food (105 units total):**
- 50 Bread
- 30 Meat
- 25 Prepared Fish

**Goods (100 units):**
- 20 Cloth
- 15 Leather
- 40 Coal (fuel)
- 30 Planks
- 25 Bricks

**Raw Materials (35 units):**
- 20 Timber
- 15 Stone

**Rationale**: Large population needs substantial food reserves. Has processed goods from active economy. Some raw materials for ongoing construction.

### Villages (4-7 buildings)
**Food (42 units total):**
- 20 Bread
- 12 Meat
- 10 Prepared Fish

**Goods (41 units):**
- 8 Cloth
- 6 Leather
- 15 Coal (fuel)
- 12 Planks

**Raw Materials (15 units):**
- 10 Timber
- 5 Stone

**Rationale**: Smaller population, moderate reserves. Active production of basic goods. Minimal raw materials.

### Hamlets (1-2 buildings)
**Food (13 units total):**
- 8 Bread
- 5 Meat

**Goods (5 units):**
- 5 Coal

**Raw Materials (5 units):**
- 5 Timber

**Rationale**: Tiny outpost, barely self-sufficient. Just enough food to survive. Very limited production capacity.

## Design Principles

### 1. **Food First**
Settlements need to eat! Food should be the primary stockpile, reflecting that these are living communities with daily needs.

### 2. **Consumables Over Raw Materials**
- **Processed goods** (bread, cloth) show active economy
- **Raw materials** (timber, stone) should be minimal - they've been used to build the existing structures

### 3. **Scale by Population**
- Cities have 3-4x more than villages
- Villages have 2-3x more than hamlets
- Reflects population size and economic activity

### 4. **Essential Fuel**
Coal is critical for production, so established settlements would have reserves built up.

### 5. **Construction Materials**
Some planks/bricks show ongoing building activity, but not excessive amounts.

## Why These Numbers?

### Food Consumption
If we assume:
- 1 person eats 2-3 food per turn
- City has ~30 people = 60-90 food/turn
- Village has ~12 people = 24-36 food/turn
- Hamlet has ~3 people = 6-9 food/turn

**Starting reserves:**
- Cities: 105 food = 1-2 turns of reserves ✅
- Villages: 42 food = 1-2 turns of reserves ✅
- Hamlets: 13 food = 1-2 turns of reserves ✅

This gives settlements a small buffer while production ramps up.

### Production Balance
With houses producing food:
- 5 houses × 8 bread/turn = 40 bread/turn
- This exceeds consumption, building reserves over time ✅

### Material Stockpiles
Cities with 40 coal can:
- Run 1 smelter (1.25 coal/turn) for 32 turns
- Run 1 smithy (1.0 coal/turn) for 40 turns
- Plenty of time to establish timber → coal production ✅

## Benefits

### 1. **Immersion**
Settlements feel **lived-in** with food on hand, not empty construction sites.

### 2. **Realism**
Established communities would have:
- ✅ Food reserves
- ✅ Basic goods (cloth, fuel)
- ✅ Some processed materials
- ❌ NOT piles of unused raw timber/stone

### 3. **Gameplay**
- Players see **active economy** immediately
- Food stockpiles show settlements can survive
- Diverse goods show what the settlement produces
- Creates immediate goals (maintain/grow reserves)

### 4. **Balance**
- Small buffer prevents immediate starvation
- But not so much that production is unnecessary
- Encourages building sustainable food production

## Testing

When you start a new game:

1. **Find a city** - Hover over a city tile
2. **Check stockpile** - Should see ~50 bread, ~30 meat, etc.
3. **Find a village** - Check stockpile
4. **Compare** - Village should have ~1/2 to 1/3 of city amounts
5. **Find a hamlet** - Should have minimal food reserves

### Expected Tooltip
```
--- Stockpile ---
• Bread: 50
• Meat: 30
• Prepared Fish: 25
• Coal: 40
• Cloth: 20
  ... and X more
```

## Future Enhancements

1. **Food Consumption** - Settlements consume food over time
2. **Starvation** - Low food affects production/morale
3. **Trade** - Food-poor settlements trade for food
4. **Seasonal Variation** - Harvest times increase food reserves
5. **Population Growth** - More food = can support more people

## Update: Building-Aware Initialization

The system now scans each settlement's buildings and adds appropriate stockpiles:

### Extraction Buildings → Resources
- **Lumber Camp/Sawmill** → timber + planks
- **Quarry** → stone
- **Clay Pit** → clay
- **Iron/Copper/Silver/Gold Mine** → ore
- **Field** → wheat + bread
- **Fishing Hut** → fish + prepared fish
- **Pasture** → livestock + meat
- **Hunting Lodge** → wild game + meat

### Production Buildings → Goods
- **Charcoal Burner** → coal (2x amount - critical!)
- **Smelter** → coal + ingots (copper & iron)
- **Smithy** → swords, tools, armor
- **Kiln** → bricks + pottery
- **Tannery** → leather + leather armor
- **Windmill/Grain Silo** → wheat + bread

### Amount Calculation
- Base: 10 units per building
- Multiple buildings = cumulative stockpiles
- Production buildings get finished goods (what they make)
- Extraction buildings get raw resources + some processed goods

### Example
A village with:
- 1 Lumber Camp → 10 timber, 5 planks
- 1 Smithy → 2 swords, 3 tools, 2 copper tools, 1 armor
- 2 Fields → 20 wheat, 20 bread
- 3 Houses → (houses produce but don't add initial stock)

**Result**: Settlement starts with what it actually produces! ✅

## Summary

Starting stockpiles now reflect **established settlements** with:
- **Food first** - Universal base food for all settlements
- **Building-specific stockpiles** - Each building type adds what it produces
- **Realistic quantities** - 10 units per building × count
- **Smart initialization** - Scans actual buildings, not random amounts

This makes settlements feel realistic with stockpiles matching their actual economy! 🍞🥩🔥
