# Flour Production Chain - Wheat → Flour → Bread

## Problem

The user correctly pointed out that the bread production was skipping an important step:

**User Feedback:**
> "so we have wheat → bread but we also have windmills, should not we produce flour first? please adjust the whole system for that"

**Current System (Wrong):**
```
Fields produce Wheat
     ↓
Bakery: Wheat → Bread (unrealistic!)
```

**Realistic System (Fixed):**
```
Fields produce Wheat
     ↓
Windmill: Wheat → Flour
     ↓
Bakery: Flour → Bread
```

## Solution

Implemented a proper **two-stage production chain** with Flour as an intermediate product.

## Implementation

### 1. Added Flour Good Type

**File: `src/world/Goods.ts`**

```typescript
export enum GoodType {
  // Fuel
  Coal = "coal",
  Charcoal = "charcoal",
  
  // Food ingredients (intermediate products)
  Flour = "flour",  // ← NEW!
  
  // Metal ingots
  CopperIngot = "copper_ingot",
  // ...
}
```

**Flour Configuration:**
```typescript
[GoodType.Flour]: {
  name: "Flour",
  description: "Ground wheat flour ready for baking",
  color: 0xFFF8DC, // Cornsilk (off-white)
  accentColor: 0xF5DEB3, // Wheat
  category: "food",
  value: 1.5,
  weight: 0.5,
}
```

### 2. Windmill Production - Grinding Flour

**File: `src/world/ProductionRecipe.ts`**

**New Recipe:**
```typescript
grind_flour: {
  id: "grind_flour",
  name: "Grind Flour",
  description: "Windmill grinds wheat into flour for baking",
  inputs: [
    { type: ResourceType.Wheat, quantity: 10 },
  ],
  outputs: [
    { type: GoodType.Flour, quantity: 10 },
  ],
  productionTime: 1,
  buildingType: BuildingType.Windmill,
  priority: 10, // Highest priority - essential for baking
}
```

**How It Works:**
- Windmills automatically grind wheat into flour
- 1:1 conversion rate (10 wheat → 10 flour)
- Fast production (1 turn)
- High priority (happens before baking)

### 3. Updated Bakery Recipe - Using Flour

**Before (Wrong):**
```typescript
bakery_bread: {
  inputs: [
    { type: ResourceType.Wheat, quantity: 10 },  // ❌ Direct wheat
  ],
  outputs: [
    { type: GoodType.Bread, quantity: 20 },
  ],
}
```

**After (Correct):**
```typescript
bakery_bread: {
  id: "bakery_bread",
  name: "Bake Bread",
  description: "Professional bakery produces bread efficiently from flour",
  inputs: [
    { type: GoodType.Flour, quantity: 10 },  // ✅ Uses flour!
  ],
  outputs: [
    { type: GoodType.Bread, quantity: 20 },
  ],
  productionTime: 1,
  buildingType: BuildingType.Bakery,
  priority: 10,
}
```

### 4. Updated House Recipes - Using Flour

**House Baking:**
```typescript
bake_bread: {
  id: "bake_bread",
  name: "Bake Bread",
  description: "Bake bread from flour in household ovens",
  inputs: [
    { type: GoodType.Flour, quantity: 5 },  // ✅ Uses flour
  ],
  outputs: [
    { type: GoodType.Bread, quantity: 8 },
  ],
  productionTime: 1,
  buildingType: BuildingType.House,
  priority: 7,
}
```

**House Grinding (Fallback):**
```typescript
grind_flour_house: {
  id: "grind_flour_house",
  name: "Grind Flour",
  description: "Grind wheat into flour using a handmill",
  inputs: [
    { type: ResourceType.Wheat, quantity: 5 },
  ],
  outputs: [
    { type: GoodType.Flour, quantity: 4 },  // Less efficient!
  ],
  productionTime: 1,
  buildingType: BuildingType.House,
  priority: 6, // Lower than baking
}
```

**Why Houses Can Grind:**
- Fallback for settlements without windmills
- Uses handmill (slow, manual)
- Less efficient (5 wheat → 4 flour vs 10→10 at windmill)
- Lower priority (windmills preferred)

## Complete Production Chain

### Full Flow:

```
STAGE 1: FARMING
┌────────────┐
│   Field    │ → Wheat (resource)
└────────────┘

STAGE 2: MILLING
┌────────────┐
│  Windmill  │ → Wheat (10) → Flour (10)  [Professional, 1:1]
└────────────┘
      OR
┌────────────┐
│   House    │ → Wheat (5) → Flour (4)    [Handmill, 5:4]
└────────────┘

STAGE 3: BAKING
┌────────────┐
│   Bakery   │ → Flour (10) → Bread (20)  [Professional, 1:2]
└────────────┘
      OR
┌────────────┐
│   House    │ → Flour (5) → Bread (8)    [Household, 5:8]
└────────────┘
```

### Efficiency Comparison:

**Professional Path (Windmill + Bakery):**
```
Wheat (10) → Flour (10) → Bread (20)
Final: 10 wheat → 20 bread (2.0 efficiency)
Buildings: Field + Windmill + Bakery
Workers: Farmers + Millers + Bakers
```

**Household Path (House only):**
```
Wheat (5) → Flour (4) → Bread (6.4)
Final: 5 wheat → 6.4 bread (1.28 efficiency)
Buildings: Field + House
Workers: Just household labor
```

**Result:** Professional path is **56% more efficient!**

## Settlement Economics

### Farming Village (Ideal Setup):

```
Buildings:
- 4 Fields       → Produce 40 wheat/turn
- 1 Windmill     → Grind 40 wheat → 40 flour/turn
- 2 Bakeries     → Bake 40 flour → 80 bread/turn
- 5 Houses       → Housing for workers

Production Flow:
Wheat (40) → Flour (40) → Bread (80)

Result: 80 bread/turn from 40 wheat!
Export: Surplus bread to other settlements
```

### Generic Village (Basic Setup):

```
Buildings:
- No fields (imports wheat)
- No windmill (imports flour OR uses handmills)
- 1 Bakery      → Needs flour to operate
- 3 Houses      → Can grind wheat manually if needed

Options:
A) Import flour → Bake bread (best)
B) Import wheat → Grind manually → Bake (slower)
C) Import bread (no production)
```

### Mining Village (Trade-Dependent):

```
Buildings:
- 3 Mines       → Produce ore
- 0 Fields      → No wheat production!
- 0 Windmill    → No flour production!
- 0 Bakery      → No bread production!

Survival:
1. Export ore to farming villages
2. Import flour or bread
3. Houses can grind + bake if desperate
```

## Trade Implications

### New Trade Goods:

**Before (2 tradeable):**
- Wheat (resource)
- Bread (final product)

**After (3 tradeable):**
- Wheat (resource)
- Flour (intermediate product) ← NEW!
- Bread (final product)

### Trade Routes:

**Wheat Trade:**
```
Farming Village → Mining Village
"We grow wheat, you mine ore"
```

**Flour Trade:**
```
Farming Village (with Windmill) → Generic Village (with Bakery)
"We mill flour, you bake bread"
```

**Bread Trade:**
```
Farming Village (complete chain) → Mining Village
"We make bread, you make tools"
```

### Specialization Opportunities:

**Mill Town:**
```
Buildings: Windmills + Storage
Strategy: Import wheat → Export flour
Profit: Milling fee (wheat value < flour value)
```

**Bakery Town:**
```
Buildings: Bakeries + Trading Posts
Strategy: Import flour → Export bread
Profit: Baking fee (flour value < bread value)
```

**Complete Food Hub:**
```
Buildings: Fields + Windmills + Bakeries
Strategy: Vertical integration (wheat → bread)
Profit: Maximum value added
```

## Recipe Priority System

The system automatically handles the correct order:

```
Priority 10: Windmill grinds flour     ← FIRST
Priority 10: Bakery bakes bread        ← SECOND
Priority 7:  House bakes bread         ← THIRD (if has flour)
Priority 6:  House grinds flour        ← FOURTH (if desperate)
```

**How It Works:**
1. Windmills grind all available wheat → flour
2. Bakeries bake all available flour → bread
3. If flour remains, houses can bake
4. If wheat remains, houses can grind (handmill)

## Value Chain Economics

### Value Added:

```
Wheat (resource):       Value = 1.0
  ↓ Milling
Flour (intermediate):   Value = 1.5  (+50%)
  ↓ Baking
Bread (final product):  Value = 3.0  (+100% from flour, +200% from wheat)
```

**Economic Insight:**
- Milling adds 50% value
- Baking adds 100% value
- Total chain adds 200% value

### Profit Opportunities:

**Scenario 1: Buy wheat, sell bread**
```
Cost: 10 wheat × 1.0 = 10g
Product: 20 bread × 3.0 = 60g
Profit: 50g (500% ROI!)
```

**Scenario 2: Buy wheat, sell flour**
```
Cost: 10 wheat × 1.0 = 10g
Product: 10 flour × 1.5 = 15g
Profit: 5g (50% ROI)
```

**Scenario 3: Buy flour, sell bread**
```
Cost: 10 flour × 1.5 = 15g
Product: 20 bread × 3.0 = 60g
Profit: 45g (300% ROI)
```

## Build Status

```bash
✅ TypeScript: Success (0 errors)
✅ Linter: 0 errors
✅ Build Size: 483.64 KB (gzipped: 140.73 kB)
✅ Flour System: Complete
```

## Code Statistics

**Files Modified:** 2
- `src/world/Goods.ts` - Added Flour good type
- `src/world/ProductionRecipe.ts` - Updated all bread recipes

**New Items:**
- 1 Good Type (Flour)
- 1 Windmill Recipe (grind_flour)
- 2 House Fallback Recipes (grind_flour_house, grind_flour_city_house)

**Updated Recipes:** 3
- bakery_bread (now uses flour)
- bake_bread (now uses flour)
- bake_bread_city (now uses flour)

**Lines Changed:** ~80 lines

## Testing Checklist

### Test 1: Windmill Production
```
1. Find farming village with windmill
2. Check after a few turns
3. Verify: Flour in stockpile
4. Check: Wheat being consumed
```

### Test 2: Bakery Production
```
1. Find bakery building
2. Check stockpile has flour
3. Wait a turn
4. Verify: Bread production
5. Check: Flour consumption
```

### Test 3: Production Chain
```
1. Find village with Field + Windmill + Bakery
2. Track over 3 turns:
   Turn 1: Wheat produced
   Turn 2: Flour produced from wheat
   Turn 3: Bread produced from flour
3. Verify: Complete chain working
```

### Test 4: House Fallback
```
1. Find settlement WITHOUT windmill
2. Check: Houses with wheat
3. Verify: Houses grind flour (handmill)
4. Check: Less efficient (5→4 not 10→10)
```

### Test 5: Trade System
```
1. Check market buy/sell offers
2. Verify: Flour appears in trade goods
3. Check: Traders carrying flour
4. Verify: Three-tier trade (wheat/flour/bread)
```

## Future Enhancements

### 1. Mill Quality Tiers
```typescript
BuildingType.Windmill:   10 wheat → 10 flour (1.0x)
BuildingType.Watermill:  10 wheat → 11 flour (1.1x)
BuildingType.SteamMill:  10 wheat → 12 flour (1.2x)
```

### 2. Flour Types
```typescript
GoodType.WheatFlour:  "wheat_flour"   // Standard
GoodType.RyeFlour:    "rye_flour"     // From rye
GoodType.CornFlour:   "corn_flour"    // From corn
```

### 3. Bread Varieties
```typescript
// Different flour types = different breads
WheatFlour → WhiteBread   (high value)
RyeFlour   → RyeBread     (standard)
CornFlour  → Cornbread    (filling)
```

### 4. Miller Profession
```typescript
JobType.Miller = "miller";  // Specialized windmill workers
BUILDING_JOB_MAPPING[BuildingType.Windmill] = JobType.Miller;
```

## Real-World Accuracy

This matches medieval production:

**Historical Flow:**
1. Farmers harvest grain (wheat, rye, barley)
2. Millers grind grain at windmills/watermills
3. Bakers bake bread at bakeries
4. Households could grind manually (slow, hard work)

**Economic Roles:**
- Farmers: Grow wheat
- Millers: Control milling (monopoly!)
- Bakers: Control baking
- Each adds value and takes profit

**Our System:** ✅ Accurately represents this!

## Conclusion

The production chain now follows a **realistic two-stage process**:
- ✅ **Stage 1:** Windmills grind wheat → flour
- ✅ **Stage 2:** Bakeries bake flour → bread
- ✅ **Fallback:** Houses can grind + bake (less efficient)
- ✅ **Trade:** Three-tier commodity system
- ✅ **Economics:** Proper value chain

**From grain to loaf, the authentic way!** 🌾⚙️🍞✅
