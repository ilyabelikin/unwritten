# Housing Density System

## Overview

Housing tiles can now support **1-5 people per tile** through a density system. As settlements grow, housing automatically upgrades to accommodate more people without requiring more land.

## How It Works

### Density Levels
Each housing tile (`House`, `CityHouse`, `FishingHut`) has a `housingDensity` property:
- **Level 1**: 1 person per tile (sparse, rural)
- **Level 2**: 2 people per tile (low density)
- **Level 3**: 3 people per tile (medium density)
- **Level 4**: 4 people per tile (dense)
- **Level 5**: 5 people per tile (very dense, packed)

### Initial Densities (World Generation)
When settlements are generated, they start with appropriate densities:
- **Hamlets**: Density 1 (sparse, frontier settlements)
- **Villages**: Density 2 (moderate density)
- **Cities**: Density 3 (already somewhat dense)

### Automatic Upgrades
During each economy turn, settlements check if they're overcrowded:

1. **Trigger**: Population reaches 90%+ of housing capacity
2. **Cost Check**: System checks if settlement has required resources
3. **Action**: Upgrade lowest-density housing tiles first (if affordable)
4. **Limit**: Tiles can upgrade to max density 5
5. **Strategy**: Fair distribution (upgrade lowest density first)

### Resource Costs
Each density level requires construction materials:
- **Density 2**: 10 Timber (basic wood construction)
- **Density 3**: 15 Timber + 5 Stone (stone foundation)
- **Density 4**: 20 Timber + 10 Stone + 5 Bricks (multi-story with bricks)
- **Density 5**: 30 Timber + 15 Stone + 10 Bricks (dense tenement)

### Example
A village with 5 housing tiles (all at density 2 = 10 capacity):
- Population grows to 9 people (90% full)
- Settlement has: 20 Timber, 10 Stone, 3 Bricks
- System upgrades 1 tile: density 2 → 3 (costs 15 timber + 5 stone)
- New capacity: 11 people
- Remaining resources: 5 Timber, 5 Stone, 3 Bricks
- Tooltip shows: "Housing: 9 / 11 (82%)" and "(5 tiles, avg density 2.2)"

## City Evolution

### Village → City Upgrade
Villages can evolve into cities when they meet requirements:

**Requirements:**
- Population ≥ 50 people
- Housing tiles ≥ 10 tiles
- Resources: 100 Timber + 80 Stone + 50 Bricks

**Benefits:**
- Settlement type changes to "City"
- Builds a landmark (Church or Tower)
- Higher prestige and importance
- Can continue to grow denser

**Landmark Selection:**
- If settlement has a Chapel → Upgraded to Church
- Otherwise → Tower built on central house tile

### Example Evolution
A village "Oakwood":
- Has 62 people, 15 housing tiles
- Stockpiled: 150 Timber, 100 Stone, 60 Bricks
- Meets all requirements → Consumes resources
- Becomes "City of Oakwood" with Church landmark

## Benefits

### Gameplay
- **Natural growth**: Settlements densify as they succeed
- **Urban evolution**: Cities become denser than villages naturally
- **Space efficiency**: Don't need to spam housing tiles
- **Economic realism**: Overcrowded cities develop naturally
- **Resource pressure**: Growing cities need construction materials
- **Strategic choices**: Invest in housing vs other production

### Technical
- **Reduced tile sprawl**: Same 10 housing tiles can grow from 10 → 50 people
- **Simple mechanic**: Single number per tile, automatic upgrades
- **Visual potential**: Can render denser buildings differently (future)

## HUD Display

Tooltip now shows:
```
--- Population ---
• Total: 62 people
• Workers: 11
• Housing: 62 / 65 (95%)
  (15 tiles, avg density 4.3)
• Health: 97%
• Hunger: 93%
```

Color coding:
- **Green** (< 90%): Comfortable
- **Orange** (90-99%): Getting crowded
- **Red** (100%+): Overcrowded (blocks growth)

## Technical Details

### Files Modified
- `HexTile.ts`: Added `housingDensity: number` property (default 1)
- `Building.ts`: New density-aware `calculateHousingCapacity()` function
- `HousingUpgrade.ts`: New system for automatic upgrades
- `WorldGenerator.ts`: Sets initial densities during generation
- `Game.ts`: Runs upgrade check each turn after population changes
- `HUD.ts`: Displays density information in tooltips

### Algorithm
```typescript
// Upgrade trigger
utilizationRate = currentPopulation / currentCapacity;
if (utilizationRate >= 0.9) {
  // Find upgradeable tiles (density < 5)
  // Sort by current density (lowest first)
  // Upgrade enough tiles to accommodate shortfall
  tile.housingDensity += 1;
}
```

## Economic Integration

### Resource Demand
Growing settlements create demand for:
- **Timber**: From forests (LumberCamp, Sawmill)
- **Stone**: From mountains (Quarry)
- **Bricks**: Produced from Clay (ClayPit → Kiln → Bricks)

### Production Chain
To support housing growth, settlements need:
1. **Extract Clay** from clay deposits
2. **Fire Bricks** in Kilns (requires Clay + Charcoal)
3. **Extract Timber** from forests
4. **Extract Stone** from quarries
5. **Stockpile** these materials for housing upgrades

### Strategic Importance
- Settlements without Timber/Stone deposits must **trade** for materials
- City evolution requires **significant stockpiling**
- Growing cities compete for construction materials
- Creates natural **trade routes** between resource-rich and population-rich settlements

## Future Enhancements

### Visual Differentiation
- Density 1-2: Single small building
- Density 3: Larger building
- Density 4: Multi-story building
- Density 5: Dense tenement/apartment block

### Manual Control
- Allow player to manually upgrade housing (costs resources)
- Different upgrade paths (quality vs quantity)
- Maintenance costs for denser housing

### Economic Effects
- Higher density → lower happiness (overcrowding)
- Higher density → higher disease risk
- Higher density → more tax revenue
- Trade-off between growth and quality of life

### Hamlet Evolution
- Hamlets → Villages (20+ people, landmark building)
- Creates progression: Hamlet → Village → City

## Related Systems

### Population Growth
- Immigration blocked if `population >= housingCapacity`
- Births continue if housing available
- Natural incentive to maintain spare housing capacity

### Worker Housing
- Workers don't need to be "near" their workplace
- Housing is settlement-wide abstraction
- Density upgrades happen automatically based on total need

### Resource Extraction
- No connection between housing density and resource extraction
- FishingHuts provide housing (4 capacity like regular houses)
- FishingBoats extract fish (2 workers each)
