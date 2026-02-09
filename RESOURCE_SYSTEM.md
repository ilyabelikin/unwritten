# Resource System Documentation

## Overview

The resource system adds natural resources to the map that can form the foundation of a medieval circular economy. Resources are strategically placed based on terrain type, elevation, and other environmental factors.

## Resource Types

### Renewable Resources (Food & Materials)

#### Wild Game
- **Location**: Dense forests (tree density > 0.6)
- **Terrain**: Plains with heavy forest, Hills with heavy forest
- **Spawn Chance**: 5%
- **Use**: Hunting, food production
- **Renewable**: Yes
- **Icon**: Deer antlers silhouette

#### Fish
- **Location**: Waters only (not shores)
- **Terrain**: Deep Water, Shallow Water
- **Spawn Chance**: 1.5%
- **Use**: Fishing, food production
- **Renewable**: Yes
- **Icon**: Fish shape with tail

#### Timber
- **Location**: Forests with moderate to high tree density
- **Terrain**: Plains/Hills with trees (density > 0.3)
- **Spawn Chance**: 4%
- **Use**: Construction, fuel, shipbuilding
- **Renewable**: Yes
- **Icon**: Log stack

### Agricultural Resources

#### Livestock
- **Location**: Open plains and hills
- **Terrain**: Plains, Hills (with low tree density < 0.4)
- **Spawn Chance**: 3%
- **Use**: Food, wool, leather
- **Renewable**: Yes
- **Icon**: Sheep silhouette

#### Clay
- **Location**: Plains
- **Terrain**: Plains
- **Spawn Chance**: 2%
- **Use**: Pottery, bricks, construction
- **Renewable**: No
- **Icon**: Clay pot

### Common Minerals

#### Stone
- **Location**: Mountains
- **Terrain**: Mountains
- **Spawn Chance**: 8%
- **Use**: Construction, fortifications, roads
- **Renewable**: No
- **Icon**: Rock pile

#### Copper
- **Location**: Hills and mountains
- **Terrain**: Hills (primarily)
- **Spawn Chance**: 3%
- **Use**: Early metalworking, tools, coins
- **Renewable**: No
- **Icon**: Copper ore nugget

#### Salt
- **Location**: Coastal areas
- **Terrain**: Shore
- **Spawn Chance**: 2%
- **Use**: Food preservation, trade commodity
- **Renewable**: No
- **Icon**: Salt crystals

### Valuable Minerals

#### Iron
- **Location**: Mountains and hills
- **Terrain**: Mountains, Hills
- **Spawn Chance**: 2.5%
- **Use**: Weapons, tools, construction
- **Renewable**: No
- **Icon**: Iron ore nugget

#### Silver
- **Location**: Mountains (especially high elevation)
- **Terrain**: Mountains (elevation > 0.75 increases chance)
- **Spawn Chance**: 0.8% (rare)
- **Use**: Currency, jewelry, trade
- **Renewable**: No
- **Icon**: Silver ore with sparkle

#### Gold
- **Location**: Mountains and hills
- **Terrain**: Mountains, Hills
- **Spawn Chance**: 0.4% (very rare)
- **Use**: Currency, luxury goods, trade
- **Renewable**: No
- **Icon**: Gold ore with sparkles

#### Gems
- **Location**: High mountains
- **Terrain**: Mountains (especially high elevation)
- **Spawn Chance**: 0.4% (very rare)
- **Use**: Jewelry, luxury trade
- **Renewable**: No
- **Icon**: Multiple colored gemstones

## Resource Properties

Each resource deposit has:

### Type
The `ResourceType` enum value identifying what resource it is.

### Quantity
The amount of resource available:
- **Renewable resources**: 1000 base quantity
- **Non-renewable resources**: 500 base quantity
- Modified by quality multiplier

### Quality
A value from 0.3 to 1.0 representing the richness of the deposit:
- **0.3-0.4**: Poor quality
- **0.4-0.6**: Fair quality
- **0.6-0.8**: Good quality
- **0.8-1.0**: Excellent quality

Quality affects the base quantity and could affect extraction efficiency.

## Map Generation

Resources are generated in **Pass 6** of world generation, after settlements but before roads. This ensures:
1. Resources don't spawn on settlement tiles
2. Roads can potentially be routed to resource-rich areas
3. Terrain and vegetation patterns are established first

### Generation Algorithm

1. **Terrain-based filtering**: Determine which resources can spawn based on terrain type
2. **Weighted selection**: Use noise functions to weight resource selection
3. **Spawn chance roll**: Each candidate resource has a base spawn chance
4. **Quality determination**: Use secondary noise to set deposit quality
5. **Quantity calculation**: Base quantity × quality = final quantity

### Spawn Distribution

The system uses Perlin noise for:
- **Resource placement** (scale: 0.1): Creates natural clustering
- **Quality variation** (scale: 0.15): Makes some areas richer than others

This creates realistic patterns where resources cluster in specific regions.

### Balancing Notes

Resource spawn rates have been carefully balanced to create scarcity:
- **All spawn rates reduced** by 50-75% to make resources valuable and strategic
- **Stone**: Most common mineral (8%), down from 20%
- **Food sources** (Fish, Game, Livestock): 3-5% spawn rate
- **Materials** (Timber, Clay, Salt): 2-4% spawn rate
- **Industrial minerals** (Copper, Iron): 2.5-3% spawn rate
- **Precious materials** (Silver, Gold, Gems): 0.4-0.8% spawn rate (very rare)

Fish-specific tuning:
- **Deep Water**: Weight 1 (sparse deposits)
- **Shallow Water**: Weight 2 (more abundant than deep water)
- **Shores**: No fish (salt only - fish are in the water, not on land)
- **Base Spawn Chance**: 3% (creates scarcity)

## Visual Representation

Resources are rendered on the map using the `ResourceRenderer`:

- **Icon size**: Approximately 12-14 pixels (fits within hex tile)
- **Style**: Pixel-art medieval aesthetic
- **Position**: Centered on tile
- **Visibility**: Only shown on explored, non-settlement tiles
- **Layers**: Drawn after rocks but before buildings

### Icon Design Philosophy

1. **Recognizable**: Each icon should be instantly identifiable
2. **Distinct**: Resources should not be confused with each other
3. **Atmospheric**: Fits the medieval fantasy setting
4. **Scalable**: Works at different zoom levels
5. **Color-coded**: Uses resource-specific colors from config

## UI Integration

### Tooltip Display

When hovering over or selecting a tile with a resource:
- Resource name is displayed with a diamond bullet (⬥)
- Quality descriptor shown in parentheses
- Example: "⬥ Iron (Excellent)"

### Quality Descriptors
- **Poor**: 0.3-0.4 quality
- **Fair**: 0.4-0.6 quality
- **Good**: 0.6-0.8 quality
- **Excellent**: 0.8-1.0 quality

## Economic Design

The resource system is designed to support a **circular medieval economy**:

### Basic Needs
- **Food**: Wild Game, Fish, Livestock
- **Shelter**: Timber, Stone, Clay

### Tools & Equipment
- **Basic tools**: Copper, Iron, Stone
- **Advanced tools**: Iron, Steel (requires Iron)

### Trade & Currency
- **Common trade**: Salt, Copper, Timber
- **Valuable trade**: Silver, Gold, Gems
- **Currency**: Gold, Silver

### Production Chains

Example chains that can be implemented:

1. **Construction**
   - Timber → Lumber → Buildings
   - Stone → Quarried Stone → Walls
   - Clay → Bricks → Buildings

2. **Metalworking**
   - Copper → Copper Tools
   - Iron → Iron Tools/Weapons
   - Gold/Silver → Coins, Jewelry

3. **Food Production**
   - Wild Game → Meat → Preserved Meat (needs Salt)
   - Fish → Food → Preserved Fish (needs Salt)
   - Livestock → Meat/Wool

## Code Architecture

### Files

- **`src/world/Resource.ts`**: Resource types, configurations, and interfaces
- **`src/world/generators/ResourceGenerator.ts`**: Resource placement logic
- **`src/rendering/renderers/ResourceRenderer.ts`**: Visual rendering of resource icons
- **`src/world/HexTile.ts`**: Tile data includes optional `resource` field
- **`src/rendering/HUD.ts`**: Tooltip display integration

### Key Classes

#### ResourceGenerator
```typescript
class ResourceGenerator {
  generateResources(grid: Grid<HexTile>): void
  private placeResource(hex: HexTile, grid: Grid<HexTile>): ResourceDeposit | undefined
  private getCandidateResources(...): Array<{ type: ResourceType; weight: number }>
}
```

#### ResourceRenderer
```typescript
class ResourceRenderer {
  drawResource(gfx: Graphics, resource: ResourceType, cx: number, cy: number): void
  private drawWildGameIcon(...)
  private drawFishIcon(...)
  // ... one method per resource type
}
```

### Data Flow

1. **Generation**: `WorldGenerator` → `ResourceGenerator` → `HexTile.resource`
2. **Rendering**: `Game` → `TileRenderer.drawResource()` → `ResourceRenderer`
3. **Display**: `Game.handleSelect()` → `HUD.showTooltip()` → Shows resource info

## Extension Guide

### Adding New Resources

1. **Add to ResourceType enum** (`src/world/Resource.ts`):
   ```typescript
   export enum ResourceType {
     // ...
     NewResource = "new_resource",
   }
   ```

2. **Add to RESOURCE_CONFIG**:
   ```typescript
   [ResourceType.NewResource]: {
     name: "New Resource",
     description: "Description here",
     color: 0xFFFFFF,
     accentColor: 0xEEEEEE,
     baseSpawnChance: 0.1,
     renewable: false,
     category: "mineral",
   }
   ```

3. **Update ResourceGenerator.getCandidateResources()** to include spawning logic:
   ```typescript
   case TerrainType.SomeTerrain:
     candidates.push({ type: ResourceType.NewResource, weight: 2 });
     break;
   ```

4. **Add drawing method to ResourceRenderer**:
   ```typescript
   private drawNewResourceIcon(gfx: Graphics, cx: number, cy: number, color: number, accent: number): void {
     // Drawing code here
   }
   ```

5. **Add case to ResourceRenderer.drawResource()** switch statement

### Balancing Spawn Rates

To adjust spawn rates:
1. Modify `baseSpawnChance` in `RESOURCE_CONFIG`
2. Adjust `weight` values in `getCandidateResources()`
3. Change terrain-specific logic in placement algorithm

### Adding Resource Mechanics

Future systems that could hook into resources:
- **Extraction**: Mining/harvesting mechanics
- **Depletion**: Reducing quantity over time
- **Trade**: Resource as commodity
- **Production**: Crafting and manufacturing
- **Economy**: Supply and demand pricing
- **Settlements**: Resource-based growth and specialization

## Performance Considerations

- Resources are generated once during world generation
- Icons are drawn once per tile during initial render
- No per-frame updates for static resources
- Minimal memory overhead (one optional field per tile)
- Efficient noise-based generation (no expensive pathfinding or search)

## Future Enhancements

Potential additions to the system:

1. **Resource extraction buildings**: Mines, lumber camps, fishing docks
2. **Resource depletion**: Non-renewable resources gradually exhaust
3. **Resource regeneration**: Renewable resources slowly replenish
4. **Resource visibility**: Show/hide resource icons at different zoom levels
5. **Resource management UI**: Inventory and production screens
6. **Trade routes**: Transport resources between settlements
7. **Resource-based AI**: Settlements prioritize nearby resources
8. **Specialized settlements**: Mining towns, fishing villages, etc.
9. **Resource combination**: Crafting and production chains
10. **Economic simulation**: Dynamic pricing and scarcity

## Testing

To verify the resource system:

1. **Generation**: Check console logs for resource distribution
2. **Placement**: Observe that resources match expected terrains
3. **Visuals**: Verify icons appear on appropriate tiles
4. **Tooltips**: Hover/click tiles to see resource information
5. **Settlement clearing**: Confirm no resources on settlement tiles

## Credits

Resource system designed and implemented for the Unwritten medieval strategy game.
