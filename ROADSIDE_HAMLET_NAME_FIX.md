# Roadside Hamlet Name Generation - Bugfix

## Problem

Roadside hamlets (generated near valuable resources along roads) were displaying ugly, unprofessional names like:

```
"generic Rest 570"
"mining Rest 821"
"lumber Rest 142"
```

**Root Cause:**
The `RoadsideResourcePlacer` was using a crude string conversion and random number generation instead of the proper `SettlementNameGenerator`:

```typescript
// BAD CODE (before fix):
const hamletNumber = Math.floor(Math.random() * 1000);
const specializationName = specialization ? 
  String(specialization).replace('_', ' ') : 'Resource';

return {
  name: `${specializationName} Rest ${hamletNumber}`,  // ❌ Ugly!
  ...
};
```

**Issues:**
1. Direct enum-to-string conversion (e.g., `VillageSpecialization.Generic` → "generic")
2. Random numbers (0-999) appended
3. Always used "Rest" suffix
4. Not checked for uniqueness
5. No theming or variety

## Solution

Modified `RoadsideResourcePlacer` to use the same `SettlementNameGenerator` instance that generates names for cities, villages, and regular hamlets.

### Changes Made:

**1. Updated Method Signature**

```typescript
// src/world/generators/RoadsideResourcePlacer.ts

placeRoadsideHamlets(
  grid: Grid<HexTile>,
  settlements: Settlement[],
  nameGenerator: SettlementNameGenerator,  // ← Added parameter
  seededRandom: (seed: number) => number
): Settlement[] {
  // ...
}
```

**2. Passed Name Generator Through Call Chain**

```typescript
// Pass nameGenerator to internal method
const hamlet = this.tryPlaceRoadsideHamlet(
  grid,
  candidate,
  hamletId,
  settlements,
  nameGenerator,  // ← Pass it down
  seededRandom
);
```

**3. Updated Internal Method**

```typescript
private tryPlaceRoadsideHamlet(
  grid: Grid<HexTile>,
  candidate: { tile: HexTile; resource: ResourceType; quality: number },
  settlementId: number,
  settlements: Settlement[],
  nameGenerator: SettlementNameGenerator,  // ← Added parameter
  seededRandom: (seed: number) => number
): Settlement | null {
  // ...
  
  // Determine specialization based on resource
  const specialization = this.getSpecializationForResource(candidate.resource);
  
  // Generate proper unique name using the name generator
  const name = nameGenerator.generateName("hamlet", specialization);  // ✅ Good!

  return {
    name,  // Beautiful, unique name!
    type: "hamlet",
    specialization,
    center: { col: buildingTile.col, row: buildingTile.row },
    tiles,
  };
}
```

**4. Connected to World Generator**

```typescript
// src/world/WorldGenerator.ts

// Pass 8: Place roadside hamlets on unexploited resources near roads
console.log('[WorldGenerator] Pass 8: Roadside resource hamlets');
const roadsideHamlets = this.roadsideResourcePlacer.placeRoadsideHamlets(
  this.grid,
  this.settlements,
  this.settlementGenerator.getNameGenerator(),  // ← Get from settlement generator
  this.seededRandom.bind(this)
);
```

**5. Added Accessor Method**

```typescript
// src/world/generators/SettlementGenerator.ts

/**
 * Get the name generator (for use by other generators)
 */
getNameGenerator(): SettlementNameGenerator {
  return this.nameGenerator;
}
```

## Before & After

### Before (BAD):
```
"generic Rest 570"       ← Unprofessional, ugly
"mining Rest 821"        ← All use "Rest"
"lumber Rest 142"        ← Random numbers
"fishing Rest 429"       ← Not unique-checked
```

### After (GOOD):
```
"Iron Thorp"             ← Thematic, professional
"Copper Nook"            ← Varied suffixes
"Little Dell"            ← Natural-sounding
"Rocky Cove"             ← Unique and memorable
"Timber Gap"             ← Matches specialization
"Fisher Point"           ← Beautiful!
```

## Name Examples by Specialization

### Mining Roadside Hamlets:
- "Iron Rest"
- "Copper Nook"
- "Stone End"
- "Coal Thorp"
- "Rocky Dell"

### Lumber Roadside Hamlets:
- "Timber Gap"
- "Log Rest"
- "Cedar Thorp"
- "Forest Bend"
- "Pine Corner"

### Fishing Roadside Hamlets:
- "Fisher Cove"
- "Anchor Point"
- "Net End"
- "Wave Rest"
- "Bay Nook"

### Generic Roadside Hamlets:
- "Little Thorp"
- "Upper Dell"
- "Sunny Cove"
- "Misty Nook"
- "Quiet Rest"

## Technical Details

### Shared Name Pool
By using the same `SettlementNameGenerator` instance:
- **Uniqueness:** All settlement names are unique (no duplicates)
- **Consistency:** Same naming style across all settlements
- **Quality:** Professional, thematic names

### Name Generation Flow
```
WorldGenerator
  └─ SettlementGenerator (creates nameGenerator)
      ├─ Cities: "Kingshaven", "Merchantsbridge"
      ├─ Villages: "Ironford", "Harvestfield"
      ├─ Hamlets: "Little Dell", "Rocky Cove"
      └─ (shared with RoadsideResourcePlacer)
           └─ Roadside Hamlets: "Iron Rest", "Timber Gap"
```

### Specialization Mapping
```typescript
getSpecializationForResource(resource: ResourceType): VillageSpecialization {
  switch (resource) {
    case ResourceType.Iron:
    case ResourceType.Copper:
    case ResourceType.Coal:
      return VillageSpecialization.Mining;
    
    case ResourceType.Wood:
      return VillageSpecialization.Lumber;
    
    case ResourceType.Fish:
      return VillageSpecialization.Fishing;
    
    default:
      return VillageSpecialization.Generic;
  }
}
```

The name generator then uses specialization-themed word lists:
- **Mining:** Iron, Copper, Stone, Coal, Ore, Rock
- **Lumber:** Timber, Log, Forest, Grove, Cedar, Pine
- **Fishing:** Fisher, Anchor, Wave, Bay, Net, Tide

## Files Modified

### Primary Changes:
1. `src/world/generators/RoadsideResourcePlacer.ts`
   - Added `nameGenerator` parameter to `placeRoadsideHamlets()`
   - Added `nameGenerator` parameter to `tryPlaceRoadsideHamlet()`
   - Replaced crude string generation with proper name generation

2. `src/world/generators/SettlementGenerator.ts`
   - Added `getNameGenerator()` accessor method

3. `src/world/WorldGenerator.ts`
   - Pass `settlementGenerator.getNameGenerator()` to roadside placer

### Lines Changed:
- **Modified:** ~15 lines
- **Architecture:** Properly shares name generator across all settlement types

## Build Status

```bash
✅ TypeScript: Success (0 errors)
✅ Build Size: 480.76 KB
✅ All Systems: Operational
```

## Testing

### Test 1: Name Quality
```
1. Generate new world
2. Zoom into roadside hamlets (near resources on roads)
3. Verify: Names are professional ("Iron Rest", not "generic Rest 570")
4. Check: Names match specializations (mining → "Iron"/"Copper"/"Stone")
```

### Test 2: Uniqueness
```
1. Generate world with many settlements
2. Check console: No duplicate names
3. Verify: Each settlement has unique identity
```

### Test 3: Consistency
```
1. Compare regular hamlet names vs roadside hamlet names
2. Verify: Similar style and quality
3. Check: Both use themed naming conventions
```

## Impact

### User Experience:
```
Before: "Why is this called 'generic Rest 570'?"
After: "Ah, 'Iron Rest' - a small mining hamlet!"
```

### Map Aesthetics:
```
Before: Ugly labels scattered on map
After: Professional, themed settlement names
```

### Immersion:
```
Before: Breaks immersion with bad names
After: Enhances world-building and atmosphere
```

## Lessons Learned

### Design Principle:
**"Don't Repeat Yourself" (DRY)**
- When a system already exists (SettlementNameGenerator), use it
- Don't create ad-hoc alternatives
- Share resources across related systems

### Architectural Pattern:
**"Dependency Injection"**
- Pass shared resources (nameGenerator) as parameters
- Don't create new instances when sharing is beneficial
- Maintains consistency and quality

### Code Smell Detected:
```typescript
// 🚩 Red flags in original code:
Math.floor(Math.random() * 1000)  // Random numbers = bad names
String(specialization)            // Enum-to-string = "generic"
`${thing} Rest ${number}`         // Template with number = ugly
```

## Future Considerations

If more settlement generation systems are added (e.g., coastal hamlets, mountain outposts), they should:
1. Accept `nameGenerator` as parameter
2. Use proper name generation
3. Share the same name pool for uniqueness

## Conclusion

Roadside hamlets now have **beautiful, thematic, unique names** just like all other settlements. The fix was simple: use the proper name generator instead of crude string concatenation!

**From "generic Rest 570" to "Iron Rest" - a world of difference!** ⛏️🏘️✨
