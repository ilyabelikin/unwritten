# Coastal Settlement System

## Overview

Fishing villages and coastal settlements are now properly supported in the resource-aware settlement system. This document explains how the system handles water-based resources and coastal settlement formation.

## The Challenge

Fish resources present a unique challenge:
- **Fish spawn in water** (DeepWater, ShallowWater)
- **Buildings can't be placed in water** (need solid ground)
- **Settlements need to be close** to resources they exploit

### The Problem (Before Fix)

```
❌ Settlement centers: Only Plains + Hills
❌ Fish location: 1-2 tiles offshore in water
❌ Result: Settlements too far inland, can't reach fish
❌ Outcome: No fishing villages, fish unexploited
```

## The Solution

### 1. Shore Terrain for Settlements

**Allow settlement centers on Shore tiles:**

```typescript
// SettlementPlacer.ts
isSuitableForBuilding(hex: HexTile): boolean {
  return (
    hex.terrain === TerrainType.Plains ||
    hex.terrain === TerrainType.Hills ||
    hex.terrain === TerrainType.Shore  // ← NEW: Coastal settlements!
  );
}
```

**Impact**:
- ✅ Villages can form directly on the coast
- ✅ 1-2 tiles from water = within search radius
- ✅ Perfect for fishing villages

### 2. Coastal Location Bonus

**Shore tiles get a scoring bonus:**

```typescript
// ResourceAwareSettlementPlacer.ts
if (hex.terrain === TerrainType.Shore) {
  score += 1.5;  // Coastal bonus
}
```

**Impact**:
- Encourages coastal settlement placement
- Makes shore locations competitive with inland resource sites
- Reflects historical preference for coastal towns

### 3. Fish Resource Value

**Increased fish value to match staple resources:**

```typescript
// Old
Fish: 1.5  (medium-low)

// New  
Fish: 2.0  (medium - same as salt, stone, timber)
```

**Rationale**:
- Fish are a **primary food source** in medieval economies
- Coastal cities historically depended on fishing
- As valuable as salt trade or stone quarrying

### 4. Enhanced Fish Spawning

**Optimized fish distribution for settlement formation:**

```typescript
// Resource.ts
baseSpawnChance: 0.025  // Was 0.015 (67% increase)

// ResourceGenerator.ts
ShallowWater: weight 4  // Was 2 (2x increase)
DeepWater:    weight 1  // Unchanged
```

**Rationale**:
- **Shallow water** = close to shore = accessible to settlements
- **Deep water** = offshore = harder to exploit
- Creates dense fishing grounds near potential settlement sites

### 5. Fishing Hut & Boat Placement

**Two-part exploitation for fish resources:**

```typescript
// SettlementGenerator.ts
For each fish resource:
  1. Place Fishing Hut adjacent to fish (on shore/land)
  2. ALSO place Fishing Boat ON the fish itself (in water)
```

**Why Two Buildings?**
- **Fishing Hut** (shore): Worker's base, storage, processing
- **Fishing Boat** (water): Visual indicator ON fish showing active exploitation

**Result**:
- Fishing Huts appear on shore or coastal plains
- Fishing Boats placed directly ON fish in water
- Clear visual: boat ON resource (like mines), hut on shore for workers
- Both buildings part of same settlement

## Critical: Fish Validation

**Fishing villages MUST have actual fish resources, not just water!**

### The Problem (Before Fix)
```
❌ Hamlet placed near small lake
❌ No fish spawned (randomness)
❌ Fallback to terrain-based specialization
❌ Sees water → assigns "Fishing"
❌ Places Fishing Huts... but no fish!
```

### The Solution
```typescript
// Terrain-based fallback NOW checks for actual fish
let hasFish = false;
for (const tile of nearbyTiles) {
  if (tile.resource && tile.resource.type === ResourceType.Fish) {
    hasFish = true;
  }
}

// Only fishing if fish exist
if (waterCount > 3 && hasFish && roll < 0.5) {
  return VillageSpecialization.Fishing;
}
```

**Result**: Fishing huts only appear where fish actually exist! ✅

## Settlement Formation Flow

### Step 1: Location Search
```
1. Scan map for suitable settlement locations
2. Shore tiles are valid candidates (NEW!)
3. Check nearby resources (3-5 tile radius)
4. Find fish in adjacent water tiles
```

### Step 2: Scoring
```
Base score from resources:
  + Fish count × 2.0 (resource value)
  + Quality multiplier (0.7x - 1.3x)
  + Proximity bonus (closer = better)
  
Coastal bonus:
  + 1.5 if on shore tile

Total score determines best location
```

### Step 3: Specialization
```
If dominant resource is Fish:
  → Fishing Village specialization
  → Multiple Fishing Huts
  → Supporting buildings (houses, maybe dock)
```

### Step 4: Building Placement
```
For each fish resource nearby:
  1. Find suitable adjacent tile (shore/plains)
  2. Place Fishing Hut
  3. Hide fish icon (exploited)
  4. Mark as part of settlement
```

## Example: Fishing Village Generation

### Scenario
```
Map: Coastal bay with shallow water
Fish: 5 deposits in shallow water, 1-2 tiles offshore
Quality: 2 Good, 3 Excellent
Shore: Sandy beach adjacent to water
```

### Generation Process
```
1. Settlement search finds shore tile
   - Score: Fish (2.0 × 5 deposits) + Coastal (1.5) = 11.5
   - Quality bonus: ~1.2x average
   - Final score: ~13.8 (high!)

2. Specialization: Fishing (dominant resource)

3. Building placement:
   - 2 Fishing Huts (5 deposits → 2 buildings)
   - Placed on shore adjacent to best fish
   - 3-4 Houses for fishermen
   - Possibly a Dock (secondary building)

4. Result: Fishing village with 6-7 buildings
```

## Spawn Rates Comparison

### Fish Spawn Rates
| Water Type | Weight | Accessibility | Settlement Use |
|------------|--------|---------------|----------------|
| Shallow    | 4      | High          | Prime fishing  |
| Deep       | 1      | Low           | Rare           |

### Typical Map (120×120)
- **Shallow water tiles**: ~800-1200
- **Fish deposits (2.5% spawn)**: ~20-30
- **Shallow water fish (4x weight)**: ~80% of all fish
- **Exploitable fish (near shore)**: ~50-70%

## Coastal Settlement Types

### Fishing Village
```
Dominant Resource: Fish (3+ deposits)
Buildings:
  - 2-3 Fishing Huts (extraction, on shore)
  - 2-3 Fishing Boats (ON fish in water)
  - 1 Dock (optional, secondary)
  - 3-5 Houses
Location: Shore tile
Radius: 4 tiles (can reach 3-4 fish deposits)
Visual: Boats visible ON water where fish are
```

### Coastal City
```
Resources: Fish + Salt + Copper (diverse)
Buildings:
  - 2 Fishing Huts (70% of 3 fish, on shore)
  - 2 Fishing Boats (ON fish in water)
  - 1 Salt Works (70% of 2 salt, on shore)
  - 1 Copper Mine (70% of 1 copper)
  - Trading Post, Warehouse, Houses
Location: Shore or adjacent plains
Radius: 5 tiles (reaches more resources)
Visual: Boats visible ON exploited fish
```

### Coastal Hamlet (Roadside)
```
Resource: Single Excellent fish deposit near road
Buildings:
  - 1 Fishing Hut (exploitation, on shore)
  - 1 Fishing Boat (ON fish in water)
  - 1 House (30% chance, worker housing)
Location: Shore tile within 2 tiles of road
Purpose: Isolated fishing outpost
Visual: Single boat visible ON fish
```

## Visual Indicators

### On Map
```
Fish Icon (🐟):
  - Appears in water tiles (unexploited)
  - Silver/blue color
  - Hidden when Fishing Boat placed

Fishing Boat (⛵):
  - Small wooden boat with sail
  - Placed ON fish in water (like mines on ore)
  - Brown hull, wheat-colored sail, dark mast
  - Net deployed in water on side (active fishing!)
  - Rope connecting net to boat
  - Additional net in boat, oar on side
  - Shows active exploitation of fish
  - No settlement fence (it's in water!)

Fishing Hut (🏠):
  - Brown/wood structure with thatched roof
  - On shore/plains adjacent to water
  - Fishing rod, net, bucket as decorations
  - Worker's base and storage
  
Settlement Pattern:
  - Boats IN water ON fish tiles
  - Fishing huts on shore at water's edge
  - Houses inland slightly
  - Clear visual: boats exploit, huts support
```

## Historical Accuracy

This system mirrors real medieval coastal settlement patterns:

### Medieval Fishing Villages
- **Formed on coasts** near productive fishing grounds
- **Primary economy**: Fish for food and trade
- **Supporting industry**: Boat building, net making, fish preservation
- **Strategic value**: Food security, trade goods

### Real Examples
- **Cornwall, England**: Fishing villages on rocky coasts
- **Brittany, France**: Coastal settlements exploiting Atlantic fish
- **Hanseatic ports**: Herring fishing drove town growth
- **Mediterranean**: Fishing supported major coastal cities

## Balancing

### Fish Abundance
- **Not too rare**: Need enough for multiple fishing villages
- **Not too common**: Should feel special when found
- **2.5% spawn rate**: ~20-30 deposits per map (reasonable)

### Settlement Competition
- Fish (2.0) = Salt (2.0) = Stone (2.0)
- Competitive with other staple resources
- Cities prefer diversity → coastal cities with fish + other resources
- Villages prefer concentration → pure fishing villages

### Geographic Distribution
- **Shallow water**: Bays, coastal areas (high fish weight)
- **Deep water**: Open ocean (low fish weight)
- **Result**: Fish cluster near shores (realistic!)

## Gameplay Impact

### Food Production
- Fishing villages provide renewable food
- Multiple Fishing Huts = sustainable harvest
- Fish don't deplete (renewable: true)

### Trade Goods
- Fish can be traded between settlements
- Coastal cities have food surplus
- Inland settlements need food imports

### Settlement Diversity
- Not all settlements are inland mining/farming
- Coastal areas have distinct economy
- Creates variety in settlement types

## Technical Implementation

### Files Modified
1. **SettlementPlacer.ts**: Allow Shore terrain
2. **ResourceAwareSettlementPlacer.ts**: Coastal bonus, fish value
3. **Resource.ts**: Fish spawn rate increase
4. **ResourceGenerator.ts**: Shallow water fish weight

### Key Functions
```typescript
// Settlement placement
isSuitableForBuilding() → includes Shore

// Resource analysis  
analyzeNearbyResources() → finds fish in water

// Scoring
getResourceValue(Fish) → returns 2.0

// Building placement
findExtractionBuildingLocation() → places adjacent
```

## Testing

### Verification Steps
1. **Check console**: Look for "fishing" specialization
2. **Examine coast**: Look for settlements on shore tiles
3. **Count fishing huts**: Should see 2-3 per fishing village
4. **Verify exploitation**: Fish icons should disappear when hut placed

### Expected Results (120×120 map)
- **Fishing villages**: 2-4
- **Fishing huts**: 5-10 total
- **Coastal settlements**: 20-30% of all settlements
- **Fish exploited**: 50-70% of fish deposits

## Future Enhancements

### Potential Additions
- **Dock building**: Larger coastal trading structures
- **Fish quality impact**: Better fish → larger villages
- **Seasonal fishing**: Resource renewal cycles
- **Fishing fleets**: Multiple boats per village
- **Fish processing**: Smokehouses, salt fish production

### Advanced Mechanics
- **Deep sea fishing**: Expensive but high yield
- **Fishing rights**: Territory conflicts
- **Overfishing**: Resource depletion if over-exploited
- **Fish migration**: Resources move seasonally

## Summary

**Before**: Fish ignored, no coastal settlements, unrealistic economy

**After**: 
- ✅ Vibrant fishing villages on coasts
- ✅ Multiple fishing huts exploiting nearby waters
- ✅ Shore settlements accessing fish 1-2 tiles offshore
- ✅ Coastal bonus encouraging seaside development
- ✅ Fish valued as important staple resource (2.0)
- ✅ Realistic medieval coastal economy

The coastal settlement system creates believable fishing villages that drive the medieval economy's food production and coastal trade.
