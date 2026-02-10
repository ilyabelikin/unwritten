# Economy System Implementation Summary

## Overview

A complete turn-based economy system has been implemented with extraction buildings producing raw resources and production buildings transforming them into goods through multi-step production chains.

**⚠️ REBALANCED**: Coal requirements have been significantly increased across all recipes to be more realistic. Forging and smelting operations now require substantially more fuel (2-6 coal per recipe instead of 1-3). This makes coal production critical and requires settlements to have 2-3x more CharcoalBurners to sustain production.

## What Was Implemented

### 1. Core Systems

#### Goods System (`src/world/Goods.ts`)
- **22 GoodTypes** including coal, metal ingots, weapons, tools, armor, and construction materials
- **GoodConfig** with name, description, color, category, value, and weight
- **6 GoodCategories**: fuel, material, weapon, tool, armor, luxury, processed

#### Production Recipes (`src/world/ProductionRecipe.ts`)
- **18 production recipes** defining transformation chains
- Recipe system with inputs, outputs, production time, and priority
- Helper functions to query recipes by building, input, or output

#### Settlement Economy (`src/world/SettlementEconomy.ts`)
- **SettlementEconomy** class managing stockpiles and production
- Separate tracking for resources and goods
- Production queue with job tracking
- Storage capacity management (default: 10,000 units)
- **EconomyManager** coordinating all settlement economies

#### Resource Extraction (`src/world/ResourceExtraction.ts`)
- **BASE_EXTRACTION_RATES** for all extraction buildings
- Actual extraction logic that depletes resource deposits
- Quality-based extraction amounts
- Helper functions for extraction queries

### 2. New Buildings

Five production buildings added to `BuildingType` enum:

1. **Smelter** - Processes ore into ingots (requires coal)
2. **Smithy** - Crafts weapons, tools, and armor from ingots
3. **CharcoalBurner** - Converts timber to coal
4. **Kiln** - Fires clay into bricks and pottery
5. **Tannery** - Processes leather from livestock

Each building has:
- Visual configuration (colors, size)
- Custom rendering in IndustrialRenderer
- Associated production recipes

### 3. Game Loop Integration (`src/game/Game.ts`)

- **EconomyManager** initialized on game start
- **economyTick()** method called every 60 frames (1 second)
- Two-phase execution:
  1. **Extraction Phase**: All extraction buildings extract resources
  2. **Production Phase**: Production buildings consume inputs and produce outputs
- Automatic recipe selection based on priority
- Settlement economies initialized with building-aware stockpiles (each building adds what it produces)

### 4. Visualization

#### HUD Updates (`src/rendering/HUD.ts`)
- Settlement tooltips now show:
  - Top 5 resources in stockpile
  - Top 5 produced goods
  - Formatted with amounts and names
- Economy data updates in real-time

#### Building Rendering (`src/rendering/buildings/IndustrialRenderer.ts`)
New rendering methods for production buildings:
- `drawSmelter()` - Stone structure with chimney and glowing furnace
- `drawSmithy()` - Workshop with forge glow and tools
- `drawCharcoalBurner()` - Earth-covered mound with smoke vents
- `drawKiln()` - Brick structure with dome and fire opening
- `drawTannery()` - Building with drying racks and barrels

## Production Chains

### Fuel Chain (Critical)
```
Timber → CharcoalBurner → Coal
10 timber → 5 coal (2 ticks)
```

### Metal Chains
```
Copper Ore + Coal → Smelter → Copper Ingots
10 ore + 4 coal → 8 ingots (3 ticks)

Iron Ore + Coal → Smelter → Iron Ingots
10 ore + 5 coal → 8 ingots (4 ticks)
```

### Weapon/Tool Chains
```
Iron Ingots + Coal → Smithy → Iron Sword
3 ingots + 4 coal → 1 sword (4 ticks)

Iron Ingots + Coal → Smithy → Iron Tools
2 ingots + 3 coal → 1 tool (3 ticks)

Copper Ingots + Coal → Smithy → Copper Sword
2 ingots + 3 coal → 1 sword (3 ticks)
```

### Construction Chains
```
Timber → Sawmill → Planks
10 timber → 15 planks (2 ticks)

Clay + Coal → Kiln → Bricks
10 clay + 3 coal → 12 bricks (3 ticks)
```

### Leather Chain
```
Livestock → Tannery → Leather → Leather Armor
5 livestock → 3 leather (3 ticks)
4 leather → 1 armor (3 ticks)
```

## How It Works

### Economy Tick Cycle

Every turn (when player ends their turn):

1. **For each settlement:**
   - Find all extraction buildings
   - Extract resources from nearby deposits
   - Add extracted resources to settlement stockpile
   - For each production building:
     - Check if building has active production job
     - If yes, advance job by 1 tick
     - If job completes, add outputs to stockpile
     - If no active job, try to start highest-priority recipe
     - Only start if all inputs are available in stockpile

2. **Resource Depletion:**
   - Non-renewable resources decrease in quantity
   - When quantity reaches 0, extraction stops
   - Quality affects extraction efficiency

3. **Production Priority:**
   - Coal production (priority 10) runs first
   - Iron/copper ingots next (priority 7-8)
   - Weapons and tools (priority 5-6)
   - Luxury goods last (priority 3-4)

### Viewing Economy Status

- **Hover over settlement tiles** to see stockpile in HUD tooltip
- **Top resources** displayed with amounts
- **Top goods** displayed separately
- Updates in real-time as economy operates

## Balance Summary

The economy is **self-sustaining and well-balanced**:

### Example Settlement
With appropriate building ratios:
- **Timber extraction**: 12/tick (1 LumberCamp)
- **Coal production**: 5.0/tick (2 CharcoalBurners, consumes 10 timber/tick)
- **Iron smelting**: 2 ingots/tick (1 Smelter, consumes 1.25 coal/tick)
- **Weapon forging**: 0.25 swords/tick (1 Smithy, consumes 1.0 coal/tick)

**Result**: +2.75 coal surplus, +2 timber surplus, sustainable growth ✅

### Scaling
- 1 LumberCamp supports 2.4 CharcoalBurners
- 1 CharcoalBurner supports 2.0 Smelters (coal is more critical now)
- 1 Smelter supports 2.6 Smithies (by ingot output)
- **Important**: Higher coal requirements mean you need more CharcoalBurners
- System scales linearly but requires 2-3x more fuel infrastructure

See `ECONOMY_BALANCE.md` for detailed analysis.

## Testing the System

### In-Game Verification

1. **Start game** - Economies initialize for all settlements, turn 1 economy tick executes
2. **End your turn** (press Space or click End Turn button) - Economy tick executes
3. **Hover over settlement tiles** - See stockpiles in tooltip
4. **Continue playing turns** - Resources accumulate, goods are produced each turn

### Expected Behavior

- Extraction buildings should show resources accumulating
- Production buildings should consume inputs and create outputs
- Coal should be produced continuously (critical resource)
- Metal ingots should appear after smelting
- Finished goods (swords, tools, armor) should be crafted

### Debug Logging

Uncomment these lines in `Game.ts` for detailed logging:
```typescript
// Line ~927: console.log(`[Economy] Settlement ${settlementIndex} extracted...`)
// Line ~964: console.log(`[Economy] Settlement ${settlementIndex} started...`)
```

## Files Modified

### New Files Created
- `src/world/Goods.ts` - Goods system
- `src/world/ProductionRecipe.ts` - Recipe definitions
- `src/world/SettlementEconomy.ts` - Economy management
- `ECONOMY_BALANCE.md` - Balance analysis
- `ECONOMY_IMPLEMENTATION_SUMMARY.md` - This file

### Files Modified
- `src/world/Building.ts` - Added 5 new building types and configs
- `src/world/ResourceExtraction.ts` - Added extraction rates and logic
- `src/game/Game.ts` - Integrated economy tick and manager
- `src/rendering/HUD.ts` - Added economy data display
- `src/rendering/buildings/IndustrialRenderer.ts` - Added 5 rendering methods
- `src/rendering/buildings/BuildingRenderer.ts` - Added switch cases

## Architecture

```
WorldMap
  └── Settlements[]
        ├── Tiles[] (with buildings)
        └── SettlementEconomy
              ├── Resource Stockpile (Map<ResourceType, number>)
              ├── Goods Stockpile (Map<GoodType, number>)
              └── Production Queue (ProductionJob[])

Turn System
  └── Character.endTurn()
        └── Triggers character.onNewTurn callback
              └── economyTick() executes once per turn
                    ├── Extraction Phase
                    │     └── For each extraction building:
                    │           ├── Find nearby resource deposits
                    │           ├── Extract based on rate * quality
                    │           └── Add to settlement stockpile
                    └── Production Phase
                          └── For each production building:
                                ├── Check for active job → advance tick
                                ├── If completed → add outputs
                                └── If idle → start highest priority recipe
```

## Future Enhancements

Potential additions for expanded economy:

1. **Trade Routes** - Settlements trading resources/goods
2. **Population & Workers** - Worker assignment to buildings
3. **Building Upgrades** - Improve extraction/production rates
4. **Resource Quality Impacts** - Better resources = better products
5. **Market Prices** - Dynamic pricing based on supply/demand
6. **Transportation** - Roads affecting resource transfer speed
7. **Storage Buildings** - Warehouses increasing capacity
8. **Consumption** - Population consuming food, tools degrading
9. **Technology Tree** - Unlock advanced recipes over time
10. **Building Networks** - Connected buildings more efficient

## Conclusion

The economy system is **complete, balanced, and operational**. All extraction buildings now produce resources, and a full production chain transforms raw materials into finished goods through multiple production buildings. The circular economy is self-sustaining with coal as the fuel source powering all production.

The system provides a solid foundation for gameplay progression and settlement management, with clear resource flows and meaningful production chains.
