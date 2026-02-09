# Rendering Architecture

This document describes the modular rendering architecture for the game.

## Overview

The rendering system has been refactored from a single 2755-line file into a clean, modular architecture with focused, maintainable components.

## Directory Structure

```
src/rendering/
├── TileRenderer.ts              # Main coordinator (~250 lines)
├── Isometric.ts                 # Isometric projection utilities
├── Palette.ts                   # Color definitions
├── renderers/                   # Specialized renderers
│   ├── TerrainRenderer.ts       # Terrain details, elevations, side faces
│   ├── VegetationRenderer.ts    # Trees, bushes, forests, rocks
│   ├── RoadRenderer.ts          # Roads, bridges, piers, docks
│   └── SettlementRenderer.ts    # Fences, walls, paths, ground textures
└── buildings/                   # Building renderers by category
    ├── BuildingRenderer.ts      # Building coordinator
    ├── HouseRenderer.ts         # Village & city houses
    ├── ReligiousRenderer.ts     # Churches, monasteries, chapels, symbols
    ├── LandmarkRenderer.ts      # Towers, castles, windmills
    ├── IndustrialRenderer.ts    # Lumber camps, sawmills, mines, quarries
    ├── CommercialRenderer.ts    # Trading posts, warehouses
    ├── AgriculturalRenderer.ts  # Fields, grain silos
    └── MilitaryRenderer.ts      # Barracks, watchtowers
```

## Component Responsibilities

### TileRenderer (Main Coordinator)
- Creates and manages tile graphics
- Coordinates between specialized renderers
- Handles decoration containers and layers
- Delegates rendering to appropriate specialists

### TerrainRenderer
- Draws isometric side faces for terrain elevation
- Renders terrain-specific details (water waves, mountain peaks, hill bumps)
- Handles shore decorations

### VegetationRenderer
- Renders individual trees (cone and oval variants)
- Draws bushes
- Creates forests with varying density (1-9 trees)
- Places rocks on rough terrain

### RoadRenderer
- Draws roads between settlements using pathfinding
- Renders bridges over land
- Places piers at water crossings
- Draws docks

### SettlementRenderer
- Draws paths connecting settlement tiles
- Renders settlement ground textures
- Places perimeter fences (villages) and walls (cities)
- Draws battlements and decorative elements

### BuildingRenderer (Coordinator)
- Routes building rendering to appropriate specialist
- Manages all building type renderers

### Building Specialist Renderers

#### HouseRenderer
- Village houses (single or cluster variants)
- City houses (single or townhouse style)
- All house variations with deterministic randomness

#### ReligiousRenderer
- Churches with random religious symbols
- Monasteries
- Chapels
- 7 different religious symbols (cross, crescent, Star of David, dharma wheel, om, torii, ankh)

#### LandmarkRenderer
- Towers (short and tall variants)
- Castles (multi-tower fortifications)
- Windmills

#### IndustrialRenderer
- Lumber camps with log piles
- Sawmills with water wheels
- Mines with mine carts
- Quarries with rock piles
- Fishing huts

#### CommercialRenderer
- Trading posts with awnings
- Warehouses with loading docks

#### AgriculturalRenderer
- Fields with crop rows
- Grain silos

#### MilitaryRenderer
- Barracks with shields
- Watchtowers with arrow slits

## Benefits of This Architecture

### Maintainability
- Each file is focused (100-400 lines vs 2755 lines)
- Easy to find and modify specific buildings
- Clear separation of concerns

### Scalability
- Add new buildings by editing only their category renderer
- Easy to add new building categories
- Independent development of different features

### Testability
- Each renderer can be tested in isolation
- Mock dependencies easily
- Clear interfaces between components

### Collaboration
- Multiple developers can work on different renderers simultaneously
- No merge conflicts when adding different building types
- Clear ownership of components

### Code Reuse
- Shared utilities in dedicated renderers
- Building renderer coordinator eliminates duplication
- Common patterns easily extracted

## Adding New Buildings

To add a new building type:

1. Define the building in `BuildingType` enum and `BUILDING_CONFIG`
2. Choose the appropriate renderer based on building category
3. Add a new `draw*` method in that renderer
4. Add a case to `BuildingRenderer.drawBuilding()`
5. Done!

Example: Adding a "Tavern" (commercial building):

```typescript
// In CommercialRenderer.ts
drawTavern(gfx: Graphics, cx: number, cy: number): void {
  const config = BUILDING_CONFIG[BuildingType.Tavern];
  // ... rendering code
}

// In BuildingRenderer.ts
case BuildingType.Tavern:
  this.commercialRenderer.drawTavern(gfx, cx, cy);
  break;
```

## Performance

The refactored architecture maintains the same performance characteristics:
- Same painter's algorithm for drawing order
- Same layer structure (tiles, roads, decorations)
- Same Graphics object pooling
- All rendering still happens in RequestAnimationFrame

## Art Style Consistency

All renderers follow the flat pixel art style guide in `doc/ART_STYLE_GUIDE.md`:
- Top-down flat view
- Simple rectangles and shapes
- Minimal 3D effects
- Cute and readable
- Consistent shadow and outline styles
