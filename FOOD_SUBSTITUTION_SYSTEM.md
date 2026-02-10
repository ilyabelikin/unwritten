# Food Substitution System - Implementation

## Overview

Implemented a sophisticated food consumption system where people prefer a **balanced diet** but can **substitute foods** when options are limited. Raw materials (Wheat, Fish, Livestock) can be consumed as emergency food when processed food is unavailable.

## Problem Solved

**Before:**
- Simple priority list: Bread → Meat → Fish
- No distinction between processed and raw food
- No balance consideration
- Inflexible diet

**After:**
- ✅ Balanced diet preference (50% grain, 50% protein)
- ✅ Food substitution (eat more meat if no bread)
- ✅ Raw food consumption (eat wheat if no bread)
- ✅ Diet quality tracking (affects happiness)
- ✅ Nutritional value system (raw < processed)

## Food System Architecture

### Food Categories

```typescript
enum FoodCategory {
  Grain = "grain",       // Bread, Wheat
  Protein = "protein",   // Meat, Fish, Livestock, WildGame
}
```

### Food Sources & Nutritional Values

#### Processed Foods (Preferred)
| Food | Category | Nutrition Value | Notes |
|------|----------|-----------------|-------|
| Bread | Grain | 1.0 | Ideal grain source |
| Meat | Protein | 1.2 | High value protein |
| Prepared Fish | Protein | 1.0 | Standard protein |

#### Raw Foods (Emergency Substitutes)
| Food | Category | Nutrition Value | Notes |
|------|----------|-----------------|-------|
| Wheat | Grain | 0.7 | Raw grain, less effective |
| Livestock | Protein | 0.9 | Fresh meat, decent |
| Wild Game | Protein | 0.8 | Hunted meat |
| Fish | Protein | 0.6 | Raw fish, least effective |

**Nutrition Value Explained:**
- `1.0` = 1 unit provides 1 food point
- `0.7` = 1 unit provides 0.7 food points (need ~1.4 units for 1 food point)
- `1.2` = 1 unit provides 1.2 food points (bonus!)

## How It Works

### Phase 1: Balanced Diet (Ideal)

Population tries to get a **50/50 split** of grain and protein:

```
Population: 10 people
Needed: 20 food/turn (2 per person)
Target: 10 grain + 10 protein

Available Stockpile:
- Bread: 15 units
- Meat: 8 units

Consumption:
1. Consume 10 Bread (10 nutrition from grain)
2. Consume 8 Meat (9.6 nutrition from protein, at 1.2x value)
3. Total: 19.6 nutrition
4. Shortfall: 0.4 (minor)
5. Diet Quality: 85% (well-balanced, mostly processed)
```

### Phase 2: Substitution (Limited Options)

When one category is missing, substitute with the other:

```
Population: 10 people
Needed: 20 food/turn
Target: 10 grain + 10 protein

Available Stockpile:
- Bread: 3 units
- Meat: 20 units

Consumption Phase 1 (Balanced):
1. Consume 3 Bread (3 nutrition from grain)
2. Consume 8 Meat (9.6 nutrition from protein)
3. Total: 12.6 nutrition
4. Still need: 7.4 nutrition

Consumption Phase 2 (Substitute):
5. Consume 6 more Meat (7.2 nutrition)
6. Total: 19.8 nutrition
7. Diet Quality: 65% (sufficient but unbalanced, all processed)

Result: People are fed but unhappy about diet imbalance
```

### Phase 3: Emergency Raw Food

When processed food runs out, consume raw materials:

```
Population: 10 people
Needed: 20 food/turn

Available Stockpile:
- Bread: 0 units
- Meat: 2 units
- Wheat: 20 units (raw)
- Fish: 10 units (raw)

Consumption:
1. Consume 2 Meat (2.4 nutrition from protein)
2. Consume 14 Wheat (9.8 nutrition from grain, at 0.7x)
3. Consume 12 Fish (7.2 nutrition from protein, at 0.6x)
4. Total: 19.4 nutrition
5. Diet Quality: 48% (sufficient, balanced, but mostly raw)

Result: People are fed but unhappy about eating raw food
```

### Phase 4: Starvation

When not enough food of any type:

```
Population: 10 people
Needed: 20 food/turn

Available Stockpile:
- Bread: 2 units
- Wheat: 5 units (raw)

Consumption:
1. Consume 2 Bread (2 nutrition)
2. Consume 5 Wheat (3.5 nutrition)
3. Total: 5.5 nutrition
4. Shortfall: 14.5 (severe!)
5. Diet Quality: 14% (insufficient, poor)

Result: People starve, hunger/health/happiness all decrease
```

## Diet Quality System

### Calculation Formula

```typescript
Diet Quality = (Sufficiency × 0.5) + (Balance × 0.3) + (Processing × 0.2)

Sufficiency = min(1, nutrition consumed / nutrition needed)
Balance = 1 - |grain ratio - 0.5| - |protein ratio - 0.5|
Processing = processed food count / total food count
```

### Quality Levels

| Quality | Sufficiency | Balance | Processing | Effect |
|---------|-------------|---------|------------|--------|
| 90-100% | Full | Perfect 50/50 | All processed | +5 happiness |
| 70-89% | Full | Good balance | Mostly processed | +3 happiness |
| 50-69% | Full | Unbalanced OR | Half raw | +0 happiness |
| 30-49% | Partial | Any | Any | -2 happiness |
| 0-29% | Starving | Any | Any | -15 happiness |

### Impact on Hunger

Diet quality modifies how effective food is at restoring hunger:

```typescript
Hunger Change = Base Change × Quality Multiplier

Quality Multiplier = 0.5 + (diet quality × 0.5)

Examples:
- Quality 100%: 1.0× effectiveness (full effect)
- Quality 50%: 0.75× effectiveness (reduced)
- Quality 0%: 0.5× effectiveness (half effect)
```

**Example:**
```
Scenario: Fed but eating only raw wheat
- Consumed: 20 nutrition (sufficient)
- Quality: 40% (unbalanced, all raw)
- Base hunger gain: +50
- Actual hunger gain: +50 × 0.7 = +35
- Result: Fed but less satisfied
```

## Food Preference Logic

### Priority Order

1. **Processed food of needed category** (Bread for grain, Meat for protein)
2. **Processed food of any category** (Any processed food to fill gaps)
3. **Raw food of needed category** (Wheat for grain, Fish for protein)
4. **Raw food of any category** (Last resort)

### Example Consumption Order

```
Needed: 10 grain + 10 protein

Priority for Grain:
1. Bread (1.0 nutrition, processed) ← First choice
2. Wheat (0.7 nutrition, raw) ← Fallback

Priority for Protein:
1. Meat (1.2 nutrition, processed) ← First choice
2. Prepared Fish (1.0 nutrition, processed) ← Good choice
3. Livestock (0.9 nutrition, raw) ← OK choice
4. Wild Game (0.8 nutrition, raw) ← Acceptable
5. Fish (0.6 nutrition, raw) ← Last resort
```

## Console Output

The system provides detailed logging:

```
[Food] Population 25: needed 50.0, consumed 47.3 (32 processed, 8 raw), quality 78%
```

**Breakdown:**
- `needed 50.0` = 25 people × 2 food/turn
- `consumed 47.3` = Total nutrition consumed (accounting for values)
- `32 processed` = 32 units of processed food (Bread, Meat, Fish)
- `8 raw` = 8 units of raw food (Wheat, Livestock, etc.)
- `quality 78%` = Good diet (well-balanced, mostly processed)

## Game Balance

### Processed vs Raw Food

**Processed Food Advantages:**
- Higher nutrition value (1.0-1.2×)
- Better diet quality
- More happiness
- More effective hunger restoration

**Raw Food Drawbacks:**
- Lower nutrition value (0.6-0.9×)
- Worse diet quality
- Less happiness
- Less effective hunger restoration

### Economic Implications

**Without Processing:**
```
Settlement with 10 people
Raw Wheat: 30 units available
Consumed: 30 Wheat = 21 nutrition (at 0.7×)
Result: Shortfall of -1, poor quality (50%)
```

**With Processing:**
```
Settlement with 10 people
Bread: 20 units (made from 20 Wheat)
Consumed: 20 Bread = 20 nutrition (at 1.0×)
Result: Perfect sufficiency, good quality (80%)
```

**Lesson:** Processing buildings (bakeries) are valuable!

### Trade Implications

**Mining Settlement (No Farms):**
```
Turn 1-3: 
- Eat stockpiled Bread (good quality)

Turn 4-5:
- Bread runs out, eat raw Livestock (poor quality)
- Happiness drops

Turn 6+:
- Traders arrive with Bread from farming villages
- Quality restored, happiness recovers
```

The poor diet quality creates stronger demand for processed food trade!

## UI/UX Considerations

### Tooltip Enhancement (Future)

Could show diet breakdown:

```
--- Population ---
• Total: 25 people
• Avg Health: 85%
• Avg Hunger: 72%
• Diet Quality: 78% ✓ (Good)
  - Grain: 48% (Balanced)
  - Protein: 52% (Balanced)
  - Processed: 80%
```

### Console Logs for Debugging

```
[Food] Population 10: needed 20.0, consumed 18.5 (12 processed, 8 raw), quality 67%
```

This tells you:
- How much food was needed
- How much was actually consumed
- How much was processed vs raw
- Overall diet quality

## Testing Scenarios

### Test 1: Ideal Balanced Diet
```
Setup: 10 Bread, 10 Meat
Expected: 100% quality, full happiness
```

### Test 2: Protein-Only Diet
```
Setup: 0 Bread, 20 Meat
Expected: 65% quality, reduced happiness
```

### Test 3: Raw Food Emergency
```
Setup: 0 Bread, 0 Meat, 30 Wheat
Expected: 50% quality, unhappy but fed
```

### Test 4: Substitution Chain
```
Setup: 3 Bread, 5 Meat, 10 Wheat
Expected: 75% quality, good result
Consumption: All Bread + All Meat + Some Wheat
```

## Code Changes

### Modified File:
- `src/world/population/FoodConsumption.ts` (completely rewritten)
  - Added `FoodCategory` enum
  - Added `FoodItem` interface with nutrition values
  - Added `FOOD_SOURCES` array
  - Rewrote `consumeFood()` with 2-phase system
  - Added `consumeFoodCategory()` helper
  - Added `consumeAnyAvailableFood()` helper
  - Added `calculateDietQuality()` function
  - Added `updateHungerWithQuality()` function
  - Modified `updateHappinessFromFood()` to use quality
  - Added `getAvailableAmount()` helper
  - Added `removeFromEconomy()` helper

- `src/world/population/PopulationManager.ts`
  - Added `lastDietQuality` property
  - Modified `processTurn()` to store diet quality
  - Modified `updateHealth()` to pass quality to happiness

## Results

✅ **Balanced diet preference** - System tries 50/50 grain/protein  
✅ **Food substitution** - Eats more of one type if other is missing  
✅ **Raw food consumption** - Can eat Wheat, Fish, Livestock as last resort  
✅ **Diet quality tracking** - Affects hunger restoration and happiness  
✅ **Nutritional values** - Raw food less effective than processed  
✅ **Economic incentive** - Processing buildings now more valuable  
✅ **Trade demand** - Poor diets create demand for balanced food  

**People now adapt their diet based on what's available, making the food economy more realistic and flexible!**
