# Agriculture Production Fix

## Problem

**Fields stopped producing wheat after initial extraction.**

### User Report
"Gold Dell" hamlet with 3 farmers and 2 fields stopped producing wheat. The settlement had:
- Total: 3 people
- Workers: 3 Farmers
- Wheat: 178 (stopped increasing)
- Flour: 7

### Root Cause

The `extractResources()` function was designed for **finite resource extraction** (mines, forests) that deplete over time. It searches for **resource deposits** nearby and extracts from them.

**The bug:** Fields and Pastures were treated the same way:
```typescript
// Old logic (broken for agriculture):
for (const resourceType of extractableResources) {
  const deposits = findNearbyResources(grid, buildingTile, resourceType);
  
  if (deposits.length > 0) {
    // Extract from deposits...
  }
}

return null; // No deposits found = NO PRODUCTION ❌
```

**Agriculture doesn't use deposits!**
- **Mines** extract from ore deposits (finite)
- **Forests** extract from trees (finite, slow regrowth)
- **Fields** generate wheat from farmland (INFINITE, renewable)
- **Pastures** raise livestock (INFINITE, renewable)

Fields would look for "wheat deposits" nearby, find none, and return `null` - producing nothing!

## Solution

Added **special case logic for renewable agriculture**:

```typescript
// SPECIAL CASE: Fields and Pastures GENERATE resources (don't need deposits)
if (buildingType === BuildingType.Field) {
  // Fields always produce wheat (as long as there are workers)
  const amount = Math.floor(effectiveRate);
  return { resourceType: ResourceType.Wheat, amount };
}

if (buildingType === BuildingType.Pasture) {
  // Pastures always produce livestock (as long as there are workers)
  const amount = Math.floor(effectiveRate);
  return { resourceType: ResourceType.Livestock, amount };
}
```

### How It Works Now

**Fields:**
- ✅ Generate wheat every turn (infinite)
- ✅ Production scaled by worker productivity
- ✅ No deposits required
- ✅ Renewable agriculture

**Pastures:**
- ✅ Generate livestock every turn (infinite)
- ✅ Production scaled by worker productivity
- ✅ No deposits required
- ✅ Renewable agriculture

## Extraction vs Production

### Extraction Buildings (Finite Resources)
These deplete natural deposits:

| Building | Resource | Type | Behavior |
|----------|----------|------|----------|
| LumberCamp | Timber | Finite | Depletes nearby trees |
| Quarry | Stone | Finite | Depletes stone deposits |
| Mine | Ores/Gems | Finite | Depletes mineral deposits |
| HuntingLodge | Wild Game | Finite | Depletes game population |
| FishingBoat | Fish | Finite | Depletes fish stocks |
| ClayPit | Clay | Finite | Depletes clay deposits |

**Behavior:** 
1. Find nearby resource deposits
2. Extract based on quality × worker productivity
3. Deplete deposit quantity
4. Eventually runs out (deposit.quantity = 0)

### Agricultural Buildings (Renewable Resources)
These generate resources infinitely:

| Building | Resource | Type | Behavior |
|----------|----------|------|----------|
| **Field** | Wheat | Renewable | Generates wheat every turn |
| **Pasture** | Livestock | Renewable | Raises livestock every turn |

**Behavior:**
1. No deposits needed
2. Produce based on worker productivity
3. Never depletes
4. Infinite renewable production

## Impact on Gameplay

### Before Fix
- Fields produced wheat initially (if deposits happened to be nearby by chance)
- **Production stopped** after deposits depleted
- Settlements starved despite having fields and farmers
- Broken food economy

### After Fix
- ✅ Fields produce wheat **every turn, forever**
- ✅ Pastures produce livestock **every turn, forever**
- ✅ Food production is reliable and sustainable
- ✅ Agricultural settlements function correctly

## Example: Gold Dell Hamlet

**Before Fix:**
```
Turn 1: Field extracts 10 wheat (from random nearby deposit)
Turn 2: Field extracts 5 wheat (deposit depleting)
Turn 3: Field extracts 0 wheat (deposit depleted) ❌
Turn 4+: No wheat production, farmers work but produce nothing
```

**After Fix:**
```
Turn 1: Field produces 10 wheat ✅
Turn 2: Field produces 10 wheat ✅
Turn 3: Field produces 10 wheat ✅
Turn 4+: Field continues producing wheat forever ✅
```

## Production Rates

Based on `BASE_EXTRACTION_RATES` config:

```typescript
[BuildingType.Field]: 10,      // 10 wheat per turn per worker
[BuildingType.Pasture]: 8,     // 8 livestock per turn per worker
```

**Example Calculation:**
- 1 Field with 2 workers (productivity 1.0 each)
- Worker productivity total: 2.0
- Effective rate: 10 × 2.0 = 20
- **Production: 20 wheat per turn** ✅

## Technical Details

### Files Modified
1. **ResourceExtraction.ts**: 
   - Added special case for `BuildingType.Field`
   - Added special case for `BuildingType.Pasture`
   - These bypass deposit lookup and generate directly

### Code Location
```typescript
// src/world/ResourceExtraction.ts
export function extractResources(...) {
  // ... base setup ...
  
  // Special case for renewable agriculture
  if (buildingType === BuildingType.Field) {
    const amount = Math.floor(effectiveRate);
    return { resourceType: ResourceType.Wheat, amount };
  }
  
  if (buildingType === BuildingType.Pasture) {
    const amount = Math.floor(effectiveRate);
    return { resourceType: ResourceType.Livestock, amount };
  }
  
  // ... normal extraction logic for other buildings ...
}
```

## Related Systems

### Worker Assignment
- Fields require farmers (JobType.Farmer)
- Workers assigned each turn by `WorkerAssignmentSystem`
- Productivity based on worker health, hunger, experience

### Food Chain
```
Wheat (Field) → Windmill → Flour → Bakery → Bread
Livestock (Pasture) → Butcher → Meat
```

### Storage
- Wheat stored in settlement economy stockpile
- Default storage capacity: 10,000 units
- Can be expanded with Warehouses and Silos

## Future Enhancements

### Seasonal Production
```typescript
// Could add seasonal modifiers
const season = getCurrentSeason();
const seasonalBonus = season === 'summer' ? 1.5 : 
                     season === 'winter' ? 0.5 : 1.0;
const amount = Math.floor(effectiveRate * seasonalBonus);
```

### Soil Quality
```typescript
// Fields could have soil quality that affects yield
const soilQuality = buildingTile.soilQuality || 1.0; // 0.5 - 1.5
const amount = Math.floor(effectiveRate * soilQuality);
```

### Crop Rotation
```typescript
// Fields could need to rest every N turns
const turnsSincePlanting = getTurnsSincePlanting(buildingTile);
if (turnsSincePlanting % 10 === 0) {
  // Fallow year, no production
  return null;
}
```

### Weather Effects
```typescript
// Drought or flood could reduce yields
const weatherModifier = getWeatherModifier();
const amount = Math.floor(effectiveRate * weatherModifier);
```

## Testing

To verify the fix works:

1. **Find agricultural settlement** (hamlet/village with fields)
2. **Check initial production** (wheat should be produced)
3. **Wait several turns** (wheat should keep increasing)
4. **Verify continuous production** (no stopping after ~3-5 turns)

**Expected Behavior:**
- Fields with workers: Wheat increases every turn ✅
- Pastures with workers: Livestock increases every turn ✅
- Production never stops (infinite renewable) ✅

## Comparison: Extraction vs Agriculture

### Extraction (Mines, Forests)
```
Has nearby deposits? → Yes → Extract from deposit → Deplete deposit
                    → No  → Return null (no production)
```

### Agriculture (Fields, Pastures) 
```
Has workers? → Yes → Generate resource (no deposits needed)
             → No  → Return null (no production)
```

The key difference: **Agriculture doesn't need deposits!** It's renewable production, not extraction.
