# Fishing Boat Feature

## Overview

Fishing boats are now placed directly ON fish resources in water to visually show active exploitation, similar to how mines are placed ON ore deposits. This makes it immediately clear which fish are being exploited.

## The Problem (Before)

```
❌ Fish icon in water
❌ Fishing Hut on shore nearby
❌ Unclear if fish is being exploited
❌ No visual ON the resource itself
```

When fishing huts were placed adjacent to fish, it wasn't obvious which fish were being exploited. The fish icon remained visible, and there was no clear visual indicator ON the water.

## The Solution (After)

```
✅ Fishing Boat placed ON fish (in water)
✅ Fishing Hut on shore (support building)
✅ Fish icon hidden (replaced by boat)
✅ Clear visual exploitation indicator
```

**Two-part system:**
1. **Fishing Boat** → ON fish in water (primary exploitation indicator)
2. **Fishing Hut** → On shore adjacent (worker base, storage, processing)

## Visual Design

### Fishing Boat (Top-Down View)
```
Components:
- Hull: Brown wooden elongated ellipse (12x5 pixels)
- Inner planking: Darker center stripe
- Benches: 3 horizontal lines across boat
- Mast: Vertical dark pole in center
- Sail: Small wheat-colored triangle
- Net in boat: Small grid pattern
- Net in water: Deployed on side with rope (showing active fishing)
- Oar: Stick extending from side
- Shadow: Subtle in water
```

**Colors:**
- Hull: `0x8b7355` (wood brown)
- Sail: `0xf5deb3` (wheat/canvas)
- Mast: `0x4a4a4a` (dark gray)

## Building Type

```typescript
BuildingType.FishingBoat = "fishing_boat"

Config:
- Name: "Fishing Boat"
- Size: Small
- Landmark: No
- Can be placed on water: Yes
```

## Placement Logic

### Settlement Generation

When a fishing hut is placed for a fish resource:

```typescript
// 1. Place Fishing Hut on shore/land (adjacent to fish)
buildingTile.building = BuildingType.FishingHut;

// 2. ALSO place Fishing Boat ON fish in water
if (resourceType === ResourceType.Fish) {
  resourceTile.building = BuildingType.FishingBoat;
  resourceTile.settlementId = settlementId;
}
```

### Roadside Hamlets

Same logic for roadside fishing hamlets:

```typescript
// 1. Place Fishing Hut on shore
buildingTile.building = BuildingType.FishingHut;

// 2. Place Fishing Boat ON fish
if (candidate.resource === ResourceType.Fish) {
  resourceTile.building = BuildingType.FishingBoat;
}
```

## Files Modified

### Core Files
1. **`Building.ts`**
   - Added `BuildingType.FishingBoat` enum
   - Added `BUILDING_CONFIG[BuildingType.FishingBoat]`

2. **`IndustrialRenderer.ts`**
   - Added `drawFishingBoat()` method
   - Draws boat with hull, sail, mast, net, oar

3. **`BuildingRenderer.ts`**
   - Added case for `BuildingType.FishingBoat`
   - Dispatches to `industrialRenderer.drawFishingBoat()`

### Generation Logic
4. **`SettlementGenerator.ts`**
   - Modified `placeExtractionBuildings()`
   - Special case for fish: place boat ON resource

5. **`RoadsideResourcePlacer.ts`**
   - Modified `tryPlaceRoadsideHamlet()`
   - Special case for fish: place boat ON resource

## Behavior

### What You See

**Fishing Village:**
```
Map view:
- Shore tiles with Fishing Huts
- Water tiles with Fishing Boats ON fish
- Houses inland
- Fish icons hidden where boats are placed
```

**Tooltip:**
```
Hover over Fishing Boat:
- "Fishing Boat"
- Settlement ID
- Part of fishing village

Hover over water (no boat):
- Fish resource info (if unexploited)
- Quality, quantity
```

### Exploitation Pattern

**Village with 3 fish deposits:**
```
Fish 1 (Excellent) → Boat + Hut
Fish 2 (Good)      → Boat + Hut  
Fish 3 (Poor)      → Unexploited (no buildings)

Result:
- 2 Fishing Huts on shore
- 2 Fishing Boats in water ON fish
- 3-4 Houses
```

## Comparison with Other Resources

### Similar Pattern (Direct Placement)
- **Iron ore** → Iron Mine ON ore
- **Salt** → Salt Works ON salt
- **Stone** → Quarry ON stone

### Special Two-Building Pattern (Unique to Fish)
- **Fish** → Fishing Boat ON fish + Fishing Hut adjacent

**Why?**
- Fish are IN water (can't access from land)
- Need shore-based support structure
- Boat shows exploitation, hut provides support

## Advantages

### Visual Clarity
✅ **Immediately obvious** which fish are exploited
✅ **Consistent pattern** with other resources (on-resource placement)
✅ **Realistic** - boats are how you fish!

### Gameplay Benefits
✅ **Clear resource status** - exploited vs available
✅ **Settlement identity** - fishing villages have visible boats
✅ **Strategic visibility** - can see fishing operations at a glance

### Historical Accuracy
✅ Medieval fishing used small boats
✅ Shore-based infrastructure (huts/camps)
✅ Boats went out to fishing grounds daily

## Examples

### Example 1: Small Fishing Village
```
Location: Small bay
Fish: 2 deposits (1 Excellent, 1 Good)

Buildings:
- 1 Fishing Hut (shore, north)
- 1 Fishing Boat (water, ON excellent fish)
- 1 Fishing Hut (shore, south)
- 1 Fishing Boat (water, ON good fish)
- 3 Houses (inland)

Visual: Two boats visible in bay
```

### Example 2: Coastal City
```
Location: Large harbor
Fish: 4 deposits
Other: Salt, Copper

Buildings:
- 3 Fishing Huts (shore)
- 3 Fishing Boats (water, ON fish)
- 1 Salt Works (shore, ON salt)
- 1 Copper Mine (hills)
- Trading Post, Warehouse, 8 City Houses

Visual: Multiple boats in harbor, diverse economy
```

### Example 3: Roadside Fishing Hamlet
```
Location: Small lake near road
Fish: 1 Excellent deposit

Buildings:
- 1 Fishing Hut (shore)
- 1 Fishing Boat (water, ON fish)
- 1 House (shore)

Visual: Single boat on lake, small outpost
```

## Technical Details

### Rendering
```typescript
drawFishingBoat(gfx: Graphics, cx: number, cy: number):
  1. Draw shadow in water (ellipse, alpha 0.15)
  2. Draw hull (ellipse 12x5, brown)
  3. Draw inner planking (darker)
  4. Draw benches (3 lines)
  5. Draw mast (vertical line)
  6. Draw sail (triangle)
  7. Draw net in boat (grid pattern)
  8. Draw oar (extending from side)
  9. Draw deployed net in water (semicircle with mesh, rope to boat)
```

### Building Properties
```typescript
{
  name: "Fishing Boat",
  isLandmark: false,
  size: "small",
  baseColor: 0x8b7355,    // Wood brown
  accentColor: 0xf5deb3,  // Wheat (sail)
  roofColor: 0x4a4a4a     // Dark gray (mast)
}
```

### Placement Rules
- **Must** be placed ON fish resource (water tile)
- Automatically placed when Fishing Hut exploits fish
- Counts as part of settlement (has settlementId)
- Hides fish resource icon when placed
- **No perimeter fence** drawn around it (it's in water!)

## Testing

### Verification Steps
1. **Generate world** - look for fishing villages on coasts
2. **Find fish** - look for fish icons in water
3. **Check exploitation** - fish with nearby fishing huts should have boats ON them
4. **Verify hiding** - fish icon should be hidden when boat is placed
5. **Count buildings** - each exploited fish should have 1 boat + 1 hut

### Expected Results (120×120 map)
- **Fishing villages**: 2-4
- **Fishing huts**: 5-10 total
- **Fishing boats**: 5-10 total (1 per exploited fish)
- **Boat-to-hut ratio**: ~1:1
- **Visual**: Boats clearly visible ON water

## Future Enhancements

### Potential Additions
1. **Boat Types**
   - Small fishing boat (current)
   - Large fishing boat (for deep water)
   - Trading ship (for docks)

2. **Animations**
   - Bobbing motion in water
   - Sail fluttering
   - Fishing net being pulled

3. **Gameplay Mechanics**
   - Boat maintenance costs
   - Fishing efficiency based on boat quality
   - Fish migration requiring boat repositioning

4. **Visual Variants**
   - Different boat designs by culture
   - Damaged/old boats (lower quality fishing)
   - Nets deployed vs stowed

## Summary

**Before**: Fish exploitation was unclear - hut on shore, no indicator ON fish

**After**:
- ✅ Fishing Boat placed ON fish (like mines on ore)
- ✅ Fishing Hut on shore (support structure)
- ✅ Clear two-part system (exploitation + support)
- ✅ Visually obvious which fish are being used
- ✅ Realistic medieval fishing pattern

The fishing boat system completes the visual exploitation pattern for resources, making fishing villages as clear and compelling as mining towns or salt works!
