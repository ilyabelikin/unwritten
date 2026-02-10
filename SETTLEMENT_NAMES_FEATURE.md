# Settlement Names Feature - Implementation

## Overview

Added unique, procedurally generated names for all settlements (cities, villages, hamlets) with visual display on the map and integration throughout the UI. Settlements now have memorable identities instead of anonymous IDs.

## Problem Solved

**Before:**
- Settlements referred to as "city (0)", "hamlet (23)"
- No names on the map
- Hard to track which settlement is which
- Tooltips showed generic type names
- Traders going to/from "unknown" places

**After:**
- ✅ Unique names: "Kingshaven", "Ironford", "Little Dell"
- ✅ Names displayed on map above settlements
- ✅ Tooltips show settlement names
- ✅ Traders display clear origins and destinations
- ✅ Easy navigation and identification

## Name Generation System

### City Names (Compound Style)

**Format:** [Prefix] + [Root]

**Examples:**
- Kingshaven
- Merchantsbridge
- Highcastle
- Grandford
- Royalbury

**Prefixes:** Kings, Queens, Lords, Merchants, Traders, Masters, High, New, Old, Grand, Great, Royal, Imperial

**Roots:** haven, port, bridge, cross, gate, way, bury, stead, ton, ford, castle, hall, keep, crown

### Village Names (Nature-Themed)

**Format:** [Prefix] + [Suffix]

**Examples:**
- Greendale
- Oakwood
- Riverford
- Stonebridge
- Millbrook

**Prefixes:** Green, Oak, Elm, Pine, River, Stone, Mill, Brook, Hill, Dale, Meadow, Marsh, Lake, Wood

**Suffixes:** vale, brook, field, wood, glen, ton, ham, ford, bridge, mill, hollow, ridge, creek, run

**Specialization-Themed:**
- Mining villages: "Ironford", "Copperhill", "Stoneton"
- Farming villages: "Harvestfield", "Wheatham", "Cropdale"
- Fishing villages: "Fisherbrook", "Anchorford", "Wavehaven"
- Trading villages: "Marketton", "Fairbridge", "Merchantdale"
- Lumber villages: "Timberwood", "Logmill", "Forestdale"

### Hamlet Names (Descriptive Style)

**Format:** [Descriptor] + [Base Name]

**Examples:**
- Little Thorp
- Upper Dell
- Rocky Cove
- Sunny Nook
- Foggy Rest

**Descriptors:** Little, Upper, Lower, East, West, North, South, Sunny, Rocky, Misty, Quiet, Windy, Foggy, Cold

**Base Names:** Thorp, Dell, Cove, Nook, Rest, End, Corner, Bend, Point, Gap, Pass, Ridge, Peak, Vale

**Specialization-Themed:**
- Mining hamlets: "Iron Rest", "Copper Nook", "Coal End"
- Farming hamlets: "Harvest Thorp", "Grain Dell", "Wheat Corner"
- Fishing hamlets: "Fisher Cove", "Anchor Point", "Net End"
- Lumber hamlets: "Timber Gap", "Log Rest", "Forest Bend"

## Visual Display

### Settlement Names on Map

**Rendering Style:**
- **Cities:** 14pt bold, gold color (#FFD700)
- **Villages:** 12pt normal, white color
- **Hamlets:** 10pt normal, light gray

**Position:**
- Centered above settlement (x-axis)
- Offset above center tile (y-axis):
  - Cities: -40px
  - Villages: -30px
  - Hamlets: -25px

**Text Effects:**
- Black stroke (3px) for visibility on any background
- Drop shadow (2px) for depth
- Anchor: center-bottom (0.5, 1)

### Example Map Display:

```
       Kingshaven        [Gold, Bold, 14pt]
          🏛️⚒️🏛️
          
    Ironford           [White, Normal, 12pt]
       ⛏️🏠
       
  Little Dell          [Gray, Normal, 10pt]
     🏠
```

## UI Integration

### Tooltips

**Settlement Tooltip:**
```
--- Kingshaven ---      ← Name instead of "city (0)"
Plains (smooth)
Population: 45 people
...
```

**Trader Tooltip:**
```
--- Traders on Tile ---

Aldric Miller
• Home: Ironford          ← Name instead of "village (3)"
• Status: Traveling to Sell
• Going to: Kingshaven    ← Name instead of "city (0)"
• Carrying: 20 Bread
• Coins: 60g
```

### Console Logs (Updated Automatically):

```
[Trade] Created trader Aldric Miller at Ironford
[Trade] Aldric accepted contract: 20 bread from Ironford to Kingshaven (profit: 38g)
[Trade] Aldric bought 20 bread for 40g at Ironford
[Trade] Aldric sold 20 bread for 80g at Kingshaven (profit: 40g)
```

## Technical Implementation

### Created Files:

**1. `src/world/generators/SettlementNameGenerator.ts`** (200 lines)
- `SettlementNameGenerator` class
- Name component arrays (prefixes, roots, suffixes)
- Specialization-themed word lists
- Uniqueness tracking
- Three generation methods: `generateCityName()`, `generateVillageName()`, `generateHamletName()`

**2. `src/rendering/SettlementNameRenderer.ts`** (85 lines)
- `SettlementNameRenderer` class
- Renders text labels above settlements
- Styled by settlement type
- Updates dynamically

### Modified Files:

**1. `src/world/Building.ts`**
- Added `name: string` property to `Settlement` interface

**2. `src/world/generators/SettlementGenerator.ts`**
- Imported `SettlementNameGenerator`
- Added `nameGenerator` property
- Modified city creation: `name: this.nameGenerator.generateName("city")`
- Modified village creation: `name: this.nameGenerator.generateName("village", specialization)`
- Modified hamlet creation: `name: this.nameGenerator.generateName("hamlet", specialization)`

**3. `src/world/generators/RoadsideResourcePlacer.ts`**
- Added name generation for roadside hamlets
- Format: `"[Specialization] Rest [Number]"`

**4. `src/game/Game.ts`**
- Imported `SettlementNameRenderer`
- Added `settlementNameRenderer` property
- Added to world container (on top layer)
- Called `update()` during game start
- Modified `getTradersAtTile()` to use `settlement.name` instead of type+ID

**5. `src/rendering/HUD.ts`**
- No changes needed! Already uses `settlement.name` via Settlement object

## Name Examples by Type

### Cities (13 × 14 = 182 possible):
- Kingshaven, Queensport, Lordsbridge
- Merchantscross, Tradersgate, Mastersway
- Highbury, Newstead, Oldton
- Grandford, Greatcastle, Royalhall

### Villages (14 × 14 = 196 possible):
- Greendale, Oakbrook, Elmfield
- Pinewood, Riverglen, Stoneton
- Millham, Brookford, Hillbridge
- Meadowmill, Marshhollow, Lakeridge

### Specialized Villages:
- **Mining:** Ironford, Copperhill, Coalbrook, Stoneton
- **Farming:** Harvestfield, Wheatham, Graindale, Cropbridge
- **Fishing:** Fisherbrook, Anchorford, Netmill, Baybridge
- **Trading:** Marketton, Fairdale, Merchantbrook, Exchangeham
- **Lumber:** Timberwood, Logmill, Forestglern, Groveton

### Hamlets (13 × 14 = 182 possible):
- Little Thorp, Upper Dell, Lower Cove
- East Nook, West Rest, North End
- Sunny Corner, Rocky Bend, Misty Point
- Quiet Gap, Windy Pass, Foggy Ridge

### Specialized Hamlets:
- **Mining:** Iron Rest, Copper Nook, Stone End
- **Farming:** Harvest Thorp, Grain Dell, Wheat Corner
- **Fishing:** Fisher Cove, Anchor Point, Wave Rest
- **Lumber:** Timber Gap, Log Dell, Cedar Thorp

## Uniqueness System

The name generator ensures no duplicate names:

```typescript
class SettlementNameGenerator {
  private usedNames: Set<string>;
  
  generateName(type, specialization?) {
    // Try up to 100 times to find unique name
    while (attempts < 100) {
      const name = generateRandomName();
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
    }
    // Fallback: append number
    return "Basename123";
  }
}
```

**Collision Handling:**
- First 100 attempts: Try random combinations
- After 100 failures: Append unique number
- Guaranteed unique name

## Visual Style Guide

### Font & Size:
- **Cities:** Serif, 14pt, Bold → Looks important
- **Villages:** Serif, 12pt, Normal → Readable
- **Hamlets:** Serif, 10pt, Normal → Subtle

### Colors:
- **Cities:** Gold (#FFD700) → Wealth and importance
- **Villages:** White → Clean and clear
- **Hamlets:** Light Gray (#CCCCCC) → Less prominent

### Effects:
- **Stroke:** 3px black → Readable on any terrain
- **Shadow:** 2px drop shadow → Depth and separation

## Performance

**Rendering:**
- One Text object per settlement
- Static labels (no animation)
- Minimal draw calls (~10-50 per world)

**Memory:**
- ~200 bytes per name string
- ~1KB per Text object
- Total: ~50KB for 50 settlements

**Generation:**
- O(1) name generation (hash set lookup)
- O(n) for collision checking
- Runs once at world generation

## Game Impact

### Navigation:
```
Old: "Go to city (0)" - What's city 0?
New: "Go to Kingshaven" - Ah, the big city!
```

### Trade Clarity:
```
Old: "Trader from village (3) to hamlet (23)"
New: "Trader from Ironford to Little Dell"
     → Clearly a mining village sending to small hamlet
```

### Storytelling:
```
"The people of Ironford mine copper and iron, trading with the great city of Kingshaven.
 Traders from Harvestfield bring grain to feed the miners of Little Dell."
```

### Immersion:
- Named places feel real
- Create mental maps
- Remember settlements
- Build narrative

## Testing

### Test 1: Name Generation
```
1. Generate new world
2. Check console: All settlements have names
3. Verify: No duplicate names
4. Check: Names match specializations
```

### Test 2: Map Display
```
1. Zoom into city
2. Verify: Gold text above settlement
3. Zoom into village
4. Verify: White text above settlement
5. Zoom into hamlet
6. Verify: Gray text above settlement
```

### Test 3: Tooltip Integration
```
1. Hover over settlement
2. Verify: Name shown in tooltip header
3. Click on trader
4. Verify: Home and destination show names
```

### Test 4: Specialization Themes
```
1. Find mining village
2. Check name: Contains "Iron", "Copper", "Stone", or "Coal"
3. Find fishing village
4. Check name: Contains "Fisher", "Anchor", "Wave", or "Net"
```

## Code Statistics

- **New Files:** 2 (SettlementNameGenerator, SettlementNameRenderer)
- **Lines Added:** ~285 lines
- **Files Modified:** 5 files
- **Build Size:** +4.33 KB (476.40 KB → 480.73 KB)

## Build Status

```bash
✅ TypeScript: Success
✅ Linter: 0 errors
✅ Build Size: 480.73 kB (gzipped: 140.19 kB)
✅ All Systems: Operational
```

## Future Enhancements

### 1. Custom Names
```typescript
// Allow player to rename settlements
settlement.rename("My Capital");
```

### 2. Historical Names
```typescript
// Track previous names
settlement.history = [
  { name: "Oldtown", year: 0 },
  { name: "Kingshaven", year: 50 }
];
```

### 3. Cultural Variations
```typescript
// Different naming styles by region
NorthernNames: "Bjornhaven", "Sigridton"
SouthernNames: "San Marco", "Porto Alto"
EasternNames: "Dragonrest", "Phoenixbridge"
```

### 4. Dynamic Renaming
```typescript
// Rename based on events
if (settlement.destroyed) name = "Ruins of " + name;
if (settlement.conquered) name = "New " + name;
```

## Conclusion

Settlements now have **identity and character** through unique, thematic names. The map feels more alive with labeled locations, traders have clear origins and destinations, and the world is easier to navigate and understand.

**Key Benefits:**
- ✅ **Easy Navigation** - Know where you are at a glance
- ✅ **Trade Clarity** - Understand trade routes instantly
- ✅ **Immersion** - Named places feel real and memorable
- ✅ **Specialization Hints** - Names suggest what settlements do
- ✅ **Visual Polish** - Professional-looking labeled map

**The world now has character - from the great city of Kingshaven to Little Dell, each settlement has its own identity!** 🏰🗺️
