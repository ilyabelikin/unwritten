# Fishing System Fix - Design Clarification

## Problem Diagnosed

From the console logs, **Settlement 0 (Oldton)** was dying out because:

1. **6 workers assigned to fish extraction**
2. **Only 2 workers actually producing** (~17-23 fish/turn from 1 FishingBoat)
3. **4 workers wasted** on FishingHut and Dock that couldn't extract anything
4. **Result**: ~20-40 fish/turn vs 94-124 food needed = massive starvation

### Why Buildings Couldn't Extract

The logs showed:
```
[Economy] Settlement 0 building fishing_hut has 2 workers but extracted nothing (no nearby resources?)
[Economy] Settlement 0 extracted 17 fish (2 workers, 1.62 productivity)  ← FishingBoat working
[Economy] Settlement 0 building dock has 2 workers but extracted nothing (no nearby resources?)
```

**Root Cause**: FishingHuts and Docks were placed 2-3 tiles away from fish deposits during world generation, but extraction only works from the building's tile + **immediate neighbors** (1 tile range).

## Design Clarification (User-Provided)

The user clarified the intended design:

1. **FishingBoats** = ONLY building that extracts fish (placed ON fish deposits in water)
2. **FishingHuts** = Coastal housing (4 people capacity), NOT extraction buildings
3. **Docks** = Shipbuilding facilities (future feature), NOT fishing extraction

## Changes Made

### 1. Resource Extraction (`ResourceExtraction.ts`)
- ✅ Removed `FishingHut` and `Dock` from `RESOURCE_EXTRACTION_BUILDINGS[Fish]`
- ✅ Set `FishingHut` and `Dock` base extraction rates to 0
- ✅ Added clarifying comments

```typescript
// BEFORE:
[ResourceType.Fish]: [BuildingType.FishingHut, BuildingType.FishingBoat, BuildingType.Dock]

// AFTER:
[ResourceType.Fish]: [BuildingType.FishingBoat] // Only boats extract fish
```

### 2. Job Mapping (`JobMapping.ts`)
- ✅ Moved `FishingHut` to housing section (JobType.None, 0 workers)
- ✅ Changed `Dock` job from Fisher → Shipwright (0 workers for now)
- ✅ Only `FishingBoat` requires Fisher workers (2 capacity)

### 3. Housing System (`Building.ts`)
- ✅ Added `FishingHut` to `HOUSING_CAPACITY` map (4 people per hut)
- ✅ Updated comments to clarify purposes
- ✅ Added new job type: `JobType.Shipwright` (for future dock functionality)

### 4. Extraction Building Placement (`ResourceAwareSettlementPlacer.ts`)
- ✅ Removed "last resort" 2-tile-away placement
- ✅ Extraction buildings now ONLY placed ON resource or immediately adjacent (1 tile)
- ✅ This prevents placing useless buildings that can't extract

## Expected Behavior in New Game

### What Will Work Better
1. **No more wasted workers** - FishingHuts and Docks won't assign Fisher workers
2. **Housing from FishingHuts** - Coastal settlements get +4 housing capacity per hut
3. **Only FishingBoats fish** - Clear, focused extraction (2 workers → 12 base extraction rate)
4. **Better building placement** - Future worlds won't place extraction buildings too far from resources

### What Still Needs Attention

The **current game world** (already generated) still has the bad placement:
- FishingHuts and Docks 2-3 tiles from fish
- But now they won't waste workers (good!)
- Settlement 0 will likely still struggle because it has fewer viable fish extractors

**To fully fix the starvation**: Generate a **new world** with corrected building placement logic.

### Recommended: Start Fresh World

The fixes will be most visible in a newly generated world where:
- FishingBoats are placed ON fish deposits ✅
- FishingHuts provide housing, not fishing jobs ✅
- Docks are infrastructure, not fishing ✅
- No extraction buildings placed beyond extraction range ✅

## Additional Observations

### Multiple Settlements Starving
- Many settlements have **0 workers assigned** (hamlets 11, 13, 15, 18, 21-23)
- These need to be roadside hamlets or have no extractable resources nearby
- **Buildings with workers but no extraction**: "field has 3 workers but extracted nothing"
  - This means Field buildings were placed without adjacent wheat/vegetable resources

### Broader Issue: Building Placement Validation
The same placement problem (buildings too far from resources) likely affects other resource types. The fix to `findExtractionBuildingLocation` addresses this for all future generations.

## Summary

**Fixed**: Fishing system now matches intended design (boats-only extraction, huts as housing).
**Fixed**: Extraction buildings no longer placed beyond their working range.
**Result**: New worlds will have functional fish extraction + proper housing in coastal settlements.
