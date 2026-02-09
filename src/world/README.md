# World Generation Architecture

This document describes the modular world generation architecture.

## Overview

The world generation system creates procedurally generated hex-based worlds with terrain, vegetation, settlements, and roads. It has been refactored from a single 672-line file into a clean, modular architecture.

## Directory Structure

```
src/world/
├── WorldGenerator.ts              # Main coordinator (~160 lines)
├── WorldMap.ts                    # World data wrapper
├── HexTile.ts                     # Tile data structure
├── Terrain.ts                     # Terrain type definitions
├── Building.ts                    # Building type definitions
├── RoadGenerator.ts               # Road pathfinding between settlements
├── HexMapUtils.ts                 # Hex grid utilities
└── generators/                    # Specialized generators
    ├── TerrainGenerator.ts        # Elevation, shores (~105 lines)
    ├── VegetationGenerator.ts     # Trees, bushes, rough terrain (~80 lines)
    ├── SettlementGenerator.ts     # Cities & villages (~230 lines)
    └── SettlementPlacer.ts        # Location finding & validation (~110 lines)
```

## Generation Pipeline

The world is generated in 6 passes:

### Pass 1: Terrain Generation
**TerrainGenerator.generateTerrain()**
- Samples layered noise for elevation
- Adds detail noise for variation
- Applies edge fade for island-like feel
- Converts elevation to terrain types (water, plains, hills, mountains)

### Pass 2: Shore Generation
**TerrainGenerator.applyShores()**
- Identifies land tiles adjacent to water
- Converts them to shore terrain
- Creates smooth coastlines

### Pass 3: Vegetation
**VegetationGenerator.applyVegetation()**
- Samples vegetation noise
- Places trees with varying density (1-9 trees per tile)
- Places bushes on lighter vegetation
- Respects terrain suitability

### Pass 4: Rough Terrain
**VegetationGenerator.applyRoughTerrain()**
- Marks mountain tiles as rough
- Creates patches of rough terrain on hills/plains
- Affects movement costs

### Pass 5: Settlements
**SettlementGenerator.generateSettlements()**

#### Cities (3-9 per world)
- 8-15 tiles total
- Landmark building (church, tower, or castle) in center
- City houses around landmark
- Minimum 20 tile separation from other settlements

#### Villages (12-18 per world)
- 4-7 tiles total
- Specialized based on nearby terrain:
  - **Fishing**: Near water (fishing huts, docks)
  - **Lumber**: Near forests (lumber camps, sawmills)
  - **Mining**: Near mountains (mines, quarries)
  - **Religious**: Random (monasteries, chapels)
  - **Trading**: Random (trading posts, warehouses)
  - **Farming**: Random (fields, windmills, grain silos)
  - **Military**: Random (barracks, watchtowers)
  - **Generic**: Default (fields, houses)
- Minimum 12 tile separation from other settlements

### Pass 6: Roads
**RoadGenerator.generateRoads()**
- Connects all cities to each other
- Connects each village to nearest city
- Uses A* pathfinding for natural-looking roads
- Places piers at water crossings

## Component Responsibilities

### WorldGenerator (Main Coordinator)
- Initializes the hex grid
- Orchestrates all generation passes
- Provides pathfinding interface for road generation
- Exposes settlements and grid to game systems

### TerrainGenerator
- **Elevation sampling**: Multi-octave Perlin noise with detail layers
- **Edge fading**: Creates island-like continents
- **Shore placement**: Smooth coastlines at land-water boundaries

### VegetationGenerator
- **Tree placement**: Noise-based clustering with density variation
- **Bush placement**: Lighter vegetation patches
- **Rough terrain**: Patches that slow movement (rocks, dense undergrowth)

### SettlementGenerator
- **City placement**: Large settlements with landmarks
- **Village placement**: Specialized settlements based on terrain
- **Building selection**: Context-appropriate building types
- **Specialization logic**: Determines village type from nearby resources

### SettlementPlacer
- **Location finding**: Finds valid settlement positions
- **Distance checking**: Ensures settlements aren't too close
- **Suitability validation**: Checks terrain requirements
- **Range queries**: Gets neighbors within N tiles

## Key Features

### Deterministic Generation
- Same seed always produces same world
- Seeded random function ensures reproducibility
- Useful for multiplayer, debugging, and sharing worlds

### Terrain-Aware Specialization
- Fishing villages near coasts
- Lumber villages near forests
- Mining villages near mountains
- Natural distribution based on geography

### Smart Building Placement
- 50% houses (residential)
- 30% primary specialized building
- 20% secondary specialized building
- Special handling for coastal fishing villages

### Natural Road Networks
- A* pathfinding creates realistic roads
- Avoids water when possible
- Places piers/bridges at crossings
- Connects all settlements efficiently

## Configuration

Customize world generation via `WorldGenConfig`:

```typescript
const worldGen = new WorldGenerator({
  width: 150,              // World width in hexes
  height: 150,             // World height in hexes
  seed: "my-world",        // Seed for reproducibility
  terrainScale: 0.03,      // Lower = larger continents
  vegetationScale: 0.06,   // Lower = larger forests
  vegetationThreshold: 0.4, // Higher = less vegetation
  roughScale: 0.15,        // Lower = larger rough patches
  roughThreshold: 0.75,    // Higher = less rough terrain
  numCities: 5,            // Number of cities
  numVillages: 20,         // Number of villages
});
```

## Adding New Features

### New Settlement Type
1. Add specialization to `VillageSpecialization` enum
2. Add building mapping in `SettlementGenerator.getBuildingsForSpecialization()`
3. Add detection logic in `SettlementGenerator.determineVillageSpecialization()`

### New Terrain Pass
1. Create new generator in `generators/` folder
2. Add noise layer in generator constructor
3. Add pass in `WorldGenerator.generate()`
4. Call generator method at appropriate stage

### New Building Type
1. Add to `BuildingType` enum
2. Add config in `BUILDING_CONFIG`
3. Add renderer in appropriate building renderer
4. Use in settlement specialization if needed

## Performance

Generation time for default 120x120 world:
- **Pass 1-4** (Terrain & Vegetation): ~50ms
- **Pass 5** (Settlements): ~20ms  
- **Pass 6** (Roads): ~30ms
- **Total**: ~100ms

Scales roughly O(n) with grid size, where n = width × height.

## Benefits of This Architecture

### Maintainability
- Each generator is focused (80-230 lines)
- Clear separation of concerns
- Easy to understand and modify

### Extensibility
- Add new generators without touching existing code
- Add new passes to generation pipeline easily
- Plug in different noise algorithms

### Testability
- Test terrain generation independently from settlements
- Mock generators for unit testing
- Validate individual generation rules

### Debuggability
- Console logs for each pass
- Can disable specific passes for debugging
- Clear generation order

### Reusability
- SettlementPlacer can be used for placing new settlements at runtime
- TerrainGenerator can regenerate specific regions
- Generators can be used in map editor tools
