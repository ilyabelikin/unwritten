# Boat Embarkation Feature

## Overview

Implemented a realistic water movement system where characters cannot walk on water directly. Instead, they must use piers and docks to embark on boats, travel across water while embarked, and disembark back at piers/docks.

## Features

### 1. Water Movement Restrictions
- **Cannot walk on water**: Characters can no longer move directly onto water tiles
- **Pier/Dock accessibility**: Piers and docks are always accessible from land (even though they're on water terrain)
- **Pier/Dock requirement**: Must be standing on a pier or dock to embark onto open water
- **Automatic embarkation**: When moving from a pier/dock to open water, a boat is automatically created (character becomes embarked)
- **Automatic disembarkation**: When moving from water to a pier/dock while embarked, the boat is removed

### 2. Embarked Mode
- **Water movement cost**: While embarked, water tiles cost **1 AP** (same as roads)
- **Embark/Disembark cost**: Transitioning between land and water costs **+2 AP** (as before)
- **Status indicator**: HUD shows "⛵ Embarked" when the character is on a boat
- **Visual feedback**: A small wooden boat appears beneath the character sprite when embarked
- **Movement validation**: Cannot disembark on regular land tiles (only piers/docks)

### 3. Pathfinding Integration
- **Smart routing**: Pathfinding algorithm respects embarkation rules
- **Water paths**: Only finds paths through water if:
  - Character is already embarked, OR
  - Path starts from a pier/dock (can embark)
- **Disembarkation planning**: Ensures paths end at piers/docks when coming from water

## Implementation Details

### Files Modified

1. **Character.ts** (`src/entity/Character.ts`)
   - Added `embarked: boolean` state
   - Added `onEmbark` and `onDisembark` callbacks
   - Updated `tryMove()` to handle embark/disembark logic and validate water movement

2. **Terrain.ts** (`src/world/Terrain.ts`)
   - Added `isPierOrDock(tile)` helper function
   - Updated `getAPCost()` to accept `isEmbarked` parameter
   - Embarked water movement costs 1 AP (like roads)

3. **Pathfinding.ts** (`src/pathfinding/Pathfinding.ts`)
   - Updated `findPath()` to accept `isEmbarked` parameter
   - Added water movement validation in pathfinding algorithm
   - Updated `isPathValid()` to respect embarkation rules

4. **Game.ts** (`src/game/Game.ts`)
   - Updated all `findPath()` calls to pass character's embarked state
   - Updated `getMovementCostForTile()` to calculate costs with embarked state
   - Updated `processMovementQueue()` to handle embarked costs
   - Updated `updateNeighborHighlights()` to respect water restrictions
   - Wired up `onEmbark` and `onDisembark` callbacks to HUD

5. **HUD.ts** (`src/rendering/HUD.ts`)
   - Added `embarkedText` display field
   - Added `setEmbarked(boolean)` method
   - Shows "⛵ Embarked" status when character is on water

6. **CharacterRenderer.ts** (`src/rendering/CharacterRenderer.ts`)
   - Added `boatGraphic` rendered beneath character (character sits in boat)
   - Added `setEmbarked(boolean)` method to show/hide boat
   - Boat visual: isometric wooden hull with triangular sail
   - Animated blue water ripples and waves around boat
   - Smooth wave animation using sine wave calculations
   - Character appears to be sitting/standing in the boat

## Gameplay Impact

### Before
- Character could walk on water freely (unrealistic)
- Water tiles cost 2 AP like regular terrain

### After
- Character must use piers/docks to access water
- Embarking/disembarking costs 2 AP (transition penalty)
- While embarked, water movement is efficient (1 AP per tile)
- Clear visual feedback:
  - ⛵ Embarked indicator in HUD
  - Character appears in a wooden boat with sail
  - Animated blue water ripples and waves
  - Isometric boat design that matches the game's art style

## Testing Recommendations

1. **Basic embarkation**: Move character to a coastal settlement with a pier/dock
2. **Embark on water**: Click on water tiles adjacent to the pier
3. **Water travel**: Navigate across water while embarked (1 AP per tile)
4. **Disembark**: Return to a pier/dock to disembark
5. **Invalid moves**: Try to move to water from regular land (should be blocked)
6. **Pathfinding**: Click on distant water locations and verify paths use piers/docks

## Edge Cases Handled

- ✅ Cannot walk directly onto open water from regular land
- ✅ Piers and docks are always accessible from land (special exception)
- ✅ Moving from land to pier on water does NOT embark (pier is treated as land)
- ✅ Moving from pier to open water DOES embark
- ✅ Cannot disembark onto regular land (must use pier/dock)
- ✅ Pathfinding finds routes through water only via piers/docks
- ✅ Embarked state persists across turns during multi-turn water journeys
- ✅ AP costs correctly calculated for embarked vs non-embarked movement
- ✅ Visual feedback shows embarked status clearly

## Future Enhancements

Possible improvements for the future:
- Add boat visual representation on water tiles
- Different boat types with varying speeds/costs
- Sailing animations
- Weather effects on water travel
- Boat upgrades/equipment
- Naval combat system
