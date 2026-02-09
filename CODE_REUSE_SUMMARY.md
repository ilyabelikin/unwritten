# Code Reuse Refactoring Summary

## Problem

Roads were using a different algorithm (Bezier curves) than character movement (A\* pathfinding), causing roads to cut through expensive terrain like mountains instead of going around them.

## Solution: Maximum Code Reuse

### 1. **Single Source of Truth for AP Costs**

- **File**: `src/world/Terrain.ts`
- **Function**: `getAPCost()`
- **Used by**:
  - Character movement (via pathfinding)
  - Road generation (via pathfinding)
  - UI tooltips
  - AP validation

### 2. **Single Pathfinding Algorithm**

- **File**: `src/pathfinding/Pathfinding.ts`
- **Function**: `findPath()`
- **Internally uses**: `getAPCost()` for edge weights
- **Used by**:
  - Character movement planning (`Game.ts`)
  - Road generation (`RoadGenerator.ts`)
- **Interface**: `IPathfindingMap` allows both `WorldMap` and `WorldGenerator` to use the same pathfinding code

### 3. **Shared Hex Map Utilities**

- **File**: `src/world/HexMapUtils.ts` (NEW)
- **Exports**:
  - `HEX_NEIGHBOR_DIRS` - Neighbor directions constant
  - `getHexNeighbors()` - Get all 6 neighbors
  - `getHexDistance()` - Calculate hex distance
- **Used by**:
  - `WorldMap` (gameplay)
  - `WorldGenerator` (world generation)
  - Eliminates duplicate implementations

### 4. **Eliminated Duplicate AP Calculations**

- **Before**: `Game.processMovementQueue()` calculated cost, then `Character.tryMove()` calculated it again
- **After**: Cost calculated once, passed to `tryMove()` via optional parameter
- **Benefit**: ~50% reduction in AP cost calculations during movement

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Terrain.ts                           │
│            getAPCost() - Single Source of Truth         │
└─────────────────┬───────────────────────────────────────┘
                  │ (used by)
                  ↓
┌─────────────────────────────────────────────────────────┐
│                 Pathfinding.ts                          │
│   findPath() - Single A* Implementation                 │
│   • Uses getAPCost() for edge weights                   │
│   • Works with IPathfindingMap interface                │
└────────┬──────────────────────────┬─────────────────────┘
         │                          │
         ↓                          ↓
┌────────────────────┐    ┌──────────────────────┐
│   Game.ts          │    │  RoadGenerator.ts    │
│ (Character Move)   │    │  (Road Generation)   │
│ • Calls findPath() │    │  • Calls findPath()  │
└────────────────────┘    └──────────────────────┘


┌─────────────────────────────────────────────────────────┐
│                  HexMapUtils.ts                         │
│  • HEX_NEIGHBOR_DIRS (constant)                         │
│  • getHexNeighbors() (shared implementation)            │
│  • getHexDistance() (shared implementation)             │
└────────┬──────────────────────────┬─────────────────────┘
         │                          │
         ↓                          ↓
┌────────────────────┐    ┌──────────────────────┐
│   WorldMap.ts      │    │ WorldGenerator.ts    │
│ (implements        │    │ (implements          │
│  IPathfindingMap)  │    │  IPathfindingMap)    │
└────────────────────┘    └──────────────────────┘
```

## Results

✅ **Roads now use the same pathfinding as characters**

- Both use A\* algorithm
- Both consider terrain AP costs
- Roads avoid mountains and prefer optimal paths

✅ **Zero code duplication for core logic**

- Single AP cost calculation function
- Single pathfinding implementation
- Single hex utilities implementation

✅ **Performance optimization**

- Eliminated redundant AP calculations in movement queue
- Pre-calculate costs once, reuse multiple times

✅ **Maintainability**

- Changes to AP costs only need to be made in one place
- Pathfinding improvements benefit both systems
- Hex utilities shared across codebase

## Files Changed

1. `src/pathfinding/Pathfinding.ts` - Made interface-based for reuse
2. `src/world/RoadGenerator.ts` - Now uses findPath() instead of Bezier curves
3. `src/world/WorldGenerator.ts` - Implements IPathfindingMap, uses shared utilities
4. `src/world/WorldMap.ts` - Uses shared utilities
5. `src/world/HexMapUtils.ts` - NEW: Shared hex map utilities
6. `src/entity/Character.ts` - Accepts pre-calculated cost parameter
7. `src/game/Game.ts` - Passes pre-calculated cost to avoid duplication
