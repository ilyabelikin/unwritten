# Food Production Feature

## Overview

Houses can now produce basic food goods from raw resources, simulating household food processing activities like baking bread, butchering meat, and preparing fish.

## What Was Added

### 1. New Resource: Wheat

Added **Wheat** as a new renewable food resource:
- **Location**: Plains terrain (farmland)
- **Color**: Khaki/wheat gold (0xF0E68C)
- **Spawn Chance**: 3.5% on suitable plains
- **Category**: Food (renewable)
- **Extraction**: Fields extract wheat at 10 units/turn

### 2. New Food Goods

Added 3 new food good types:

| Good | Description | Category | Value | Source |
|------|-------------|----------|-------|--------|
| **Bread** | Baked from wheat | food | 3 | Wheat |
| **Meat** | Butchered from animals | food | 4 | Livestock/Game |
| **Prepared Fish** | Cleaned fish | food | 3 | Fish |

### 3. Food Production Recipes (Houses)

Houses and City Houses can now produce food with these simple recipes:

#### Bake Bread
- **Input**: 5 Wheat
- **Output**: 8 Bread
- **Time**: 1 turn
- **Building**: House / CityHouse
- **Priority**: 9 (high - basic food)

#### Butcher Livestock
- **Input**: 3 Livestock
- **Output**: 5 Meat
- **Time**: 1 turn
- **Building**: House / CityHouse
- **Priority**: 9 (high - basic food)

#### Butcher Game
- **Input**: 3 Wild Game
- **Output**: 4 Meat
- **Time**: 1 turn
- **Building**: House / CityHouse
- **Priority**: 9 (high - basic food)

#### Prepare Fish
- **Input**: 4 Fish
- **Output**: 6 Prepared Fish
- **Time**: 1 turn
- **Building**: House / CityHouse
- **Priority**: 9 (high - basic food)

## How It Works

### Food Production Cycle

```
Each turn:
1. Fields extract Wheat (10/turn) → Settlement stockpile
2. Houses check stockpile for Wheat
3. If available, House bakes Bread (5 wheat → 8 bread)
4. Bread added to settlement stockpile

Similarly for meat and fish:
1. Pasture/Hunting/Fishing extracts raw food
2. Houses process into prepared food
3. Prepared food added to stockpile
```

### Automatic Production

- Houses automatically produce food when resources are available
- High priority (9) ensures food is produced before luxury goods
- Fast production (1 tick) means rapid food processing
- No fuel cost - households use basic cooking fires

### Multiple Houses

Each house can produce independently:
- 10 houses with wheat access = 10 simultaneous bread production
- Houses process different food types based on availability
- Settlements with multiple food sources have diverse stockpiles

## Benefits

### Realism
- Medieval households processed their own food
- Bread was baked at home or communal ovens
- Animals were butchered locally
- Fish cleaned and prepared for consumption

### Gameplay
1. **Settlement Value**: Houses contribute to economy, not just population
2. **Food Security**: Settlements can build food stockpiles
3. **Resource Chain**: Raw resources → processed food → consumption (future)
4. **Specialization**: Fishing villages produce fish, farming villages produce bread
5. **Strategic Choices**: Players must ensure houses have access to food sources

## Production Rates

### Example: Village with 5 Houses

**Resources available per turn:**
- Wheat: 10 (1 Field)
- Fish: 10 (1 Fishing Hut)
- Livestock: 7 (1 Pasture)

**Food production potential:**
- Bread: Each house can produce 8 bread/turn (if wheat available)
- Meat: Each house can produce 5 meat/turn (if livestock available)
- Fish: Each house can produce 6 prepared fish/turn (if fish available)

**With 5 houses:**
- If 2 houses bake bread: 16 bread/turn (consumes 10 wheat/turn)
- If 1 house butchers: 5 meat/turn (consumes 3 livestock/turn)
- If 2 houses prepare fish: 12 fish/turn (consumes 8 fish/turn)

**Result**: Diverse food stockpile growing rapidly! ✅

## Balance

### Fast Production
- **1 turn** production time is intentional
- Represents simple household tasks (not complex manufacturing)
- Allows settlements to quickly build food reserves
- Houses don't compete with industrial buildings for coal/resources

### No Fuel Required
- Households use basic cooking fires
- No coal consumption for food processing
- Keeps food production accessible and simple
- Differentiates from industrial production

### High Priority
- Priority 9 ensures food is produced first
- More important than weapons/tools (priority 4-8)
- Equal to coal production (priority 10)
- Reflects survival importance of food

### Good Conversion Rates
- 5 wheat → 8 bread (160% yield)
- 3 livestock → 5 meat (167% yield)
- 4 fish → 6 prepared fish (150% yield)

These generous yields ensure food production is worthwhile and settlements can build reserves.

## Files Modified

### Modified Files
- `src/world/Resource.ts` - Added Wheat resource
- `src/world/Goods.ts` - Added Bread, Meat, PreparedFish goods
- `src/world/ProductionRecipe.ts` - Added 8 food production recipes
- `src/world/ResourceExtraction.ts` - Added Field extraction for wheat
- `src/world/generators/ResourceGenerator.ts` - Added wheat spawning on plains

### No New Files
All changes integrated into existing systems.

## Testing

### Verify Food Production

1. **Find a settlement with houses**
2. **Check for food resources nearby** (wheat fields, pastures, fishing)
3. **End your turn** (Space or End Turn button) to process economy
4. **Houses should automatically produce food** when resources available
5. **Check settlement tooltip** to see Bread, Meat, or Prepared Fish in stockpile
6. **Continue ending turns** to see food accumulate

### Expected Behavior

- Fields should extract wheat
- Houses should produce bread if wheat is available
- Pastures should provide livestock for meat production
- Fishing areas should provide fish for preparation
- Food goods should appear in settlement stockpiles

## Future Enhancements

Potential additions:

1. **Food Consumption** - Population consumes food over time
2. **Food Variety Bonus** - Diverse diet improves morale/productivity
3. **Preservation** - Salt + meat = preserved meat (long storage)
4. **Markets** - Specialized buildings for food distribution
5. **Cooking Quality** - Better kitchens produce better food
6. **Recipes** - Combine ingredients (bread + meat = sandwich?)
7. **Seasonal Variation** - Harvest seasons affect wheat production
8. **Storage Spoilage** - Food degrades without proper storage
9. **Trade** - Food as trade commodity between settlements
10. **Festivals** - Food consumption for celebrations

## Summary

Houses are now productive members of the economy, processing raw food resources into prepared goods. This creates a complete food production chain:

**Raw Extraction → Household Processing → Prepared Food → Storage**

The system is simple, fast, and realistic - perfect for representing household food production in a medieval economy. Every house contributes to the settlement's food security! 🍞🥩🐟
