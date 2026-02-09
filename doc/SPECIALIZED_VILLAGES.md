# Specialized Villages Implementation

## Overview

Added a comprehensive village specialization system that creates diverse, context-aware settlements based on nearby terrain. Villages now have unique identities with specialized buildings and purposes.

## New Village Specializations

### 1. **Fishing Villages** 🐟
- **Spawns**: Near coastal areas (requires nearby water/shore tiles)
- **Buildings**:
  - **Fishing Huts**: Small wooden huts with thatched roofs and fishing rods
  - **Docks**: Wooden dock structures with barrels and support posts
- **Special Feature**: Can place buildings on shore tiles (unique to this type)
- **Purpose**: Coastal fishing and maritime trade

### 2. **Lumber Villages** 🪵
- **Spawns**: Near forests (requires nearby tree vegetation)
- **Buildings**:
  - **Lumber Camps**: Log piles with axes and stumps (common)
  - **Sawmills**: Medium-sized buildings with water wheels for processing lumber (rare)
- **Purpose**: Forestry and wood processing
- **Balance**: Mostly lumber camps where trees are cut, with occasional sawmills for processing

### 3. **Mining Villages** ⛏️
- **Spawns**: Near mountains (requires nearby mountain terrain)
- **Buildings**:
  - **Mines**: Cave entrances with mine carts and dark tunnels (common)
  - **Quarries**: Large rock piles with pickaxes and stone blocks (rare)
- **Purpose**: Stone quarrying and ore extraction
- **Balance**: Mostly underground mines with occasional surface quarries

### 4. **Religious Settlements** ⛪
- **Spawns**: Randomly across the map
- **Buildings**:
  - **Monastery**: Large landmark building with bell tower and gold cross (central)
  - **Chapels**: Medium-sized religious buildings with peaked roofs
- **Special Feature**: Has a landmark building (monastery)
- **Purpose**: Religious retreat and spiritual center

### 5. **Trading Posts** 💰
- **Spawns**: Randomly across the map
- **Buildings**:
  - **Trading Posts**: Buildings with awnings, signs, and displayed goods
  - **Warehouses**: Large storage buildings with big doors and stacked crates
- **Purpose**: Commerce and trade hub

### 6. **Farming Villages** 🌾
- **Spawns**: Randomly across the map
- **Buildings**:
  - **Windmill**: Iconic landmark with rotating blades (central)
  - **Fields**: Crop rows with planted patterns
  - **Grain Silos**: Tall cylindrical storage structures
- **Special Feature**: Has a landmark building (windmill)
- **Purpose**: Agriculture and grain processing

### 7. **Military Outposts** ⚔️
- **Spawns**: Randomly across the map
- **Buildings**:
  - **Barracks**: Sturdy rectangular buildings with multiple windows
  - **Watchtowers**: Tall narrow towers with battlements and flags
- **Purpose**: Defense and military presence

### 8. **Generic Villages** 🏘️
- **Spawns**: Anywhere suitable terrain exists
- **Buildings**:
  - **Houses**: Standard wooden dwellings
  - **Fields**: Basic agricultural plots
- **Purpose**: General farming settlements (fallback type)

## Technical Implementation

### Building Types Added

New building types in `BuildingType` enum:
- `Sawmill`, `Quarry`, `FishingHut`, `Dock`
- `Monastery`, `Chapel`
- `TradingPost`, `Warehouse`
- `Windmill`, `GrainSilo`
- `Barracks`, `Watchtower`

Each building has:
- Unique visual design in pixel-art isometric style
- Custom colors and size configuration
- Detailed rendering with shadows, textures, and decorations

### Specialization Logic

Villages determine their specialization based on:
1. **Nearby terrain** (within 3 tiles):
   - Water tiles → Fishing villages (50% chance if 3+ water tiles)
   - Mountain tiles → Mining villages (60% chance if 2+ mountain tiles)
   - Forest tiles → Lumber villages (50% chance if 8+ trees)

2. **Random assignment** for non-terrain-specific types:
   - Religious: 15%
   - Trading: 15%
   - Farming: 20%
   - Military: 15%
   - Generic: 35% (default fallback)

### Building Distribution in Villages

Each village has:
- **Central building**: Either a landmark (monastery/windmill) or primary specialized building
- **Surrounding buildings** (3-6 additional tiles):
  - 50% Houses (residential)
  - 30% Primary specialized building (common work buildings)
  - 20% Secondary specialized building (rare, advanced facilities)

This creates a natural progression where basic resource buildings are common and processing facilities are rare. For example:
- Lumber villages: Mostly lumber camps (30%) with 1-2 sawmills (20%)
- Mining villages: Mostly mines (30%) with 1-2 quarries (20%)

### Visual Highlights

All new buildings feature:
- **Flat, top-down pixel art style** (see [ART_STYLE_GUIDE.md](ART_STYLE_GUIDE.md) for details)
- **Cute, readable designs** with simple shapes and bright colors
- **Minimal 3D depth** - flat rectangles with simple shadows
- **Charming details**:
  - Water wheels on sawmills (flat circular design)
  - Rotating blades on windmills (flat spokes)
  - Mine carts and cave entrances (simple shapes)
  - Fishing nets and rods (line decorations)
  - Crates, barrels, and trade goods (small rectangles)
  - Military shields and flags (circles and triangles)
  - Religious crosses and bell towers (simple rectangles)

**Important**: We maintain a consistent flat pixel art aesthetic across all buildings. No realistic 3D isometric rendering - everything should look like a cute top-down 2D game.

## Console Output

The generator now logs detailed statistics:
```
Generated 3 cities and 12 villages:
  - 2 fishing village(s)
  - 1 lumber village(s)
  - 3 mining village(s)
  - 1 religious village(s)
  - 2 trading village(s)
  - 2 farming village(s)
  - 1 military village(s)
```

## Files Modified

- ✅ `src/world/Building.ts` - Added new building types, configs, and `VillageSpecialization` enum
- ✅ `src/world/WorldGenerator.ts` - Implemented specialization logic and terrain-aware placement
- ✅ `src/rendering/TileRenderer.ts` - Added 12 new building rendering methods (flat pixel art style)
- ✅ `ART_STYLE_GUIDE.md` - Comprehensive guide for maintaining consistent flat pixel art style

## Future Enhancements

The specialization system provides a foundation for:
- **Economy systems**: Trade routes between specialized villages
- **Resource production**: Villages produce goods based on their specialization
- **Quest systems**: Location-specific quests and interactions
- **Visual variety**: Different architectural styles per specialization
- **Population dynamics**: Villages grow based on resources

## Testing

To see the new villages:
1. Run `npm run dev`
2. Open `http://localhost:5173/`
3. Explore the map to find different village types
4. Check console for specialization statistics

Villages will naturally cluster near appropriate terrain:
- Fishing villages along coastlines
- Mining villages near mountains
- Lumber villages in forests
- Others scattered across plains and hills
