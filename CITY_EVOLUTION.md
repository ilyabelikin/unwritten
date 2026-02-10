# City Evolution System

## Overview

Villages can naturally evolve into **Cities** when they grow large enough and accumulate sufficient construction materials. This creates a progression system: **Hamlet → Village → City**.

## Evolution Requirements

### Village → City

A village becomes a city when ALL conditions are met:

1. **Population**: ≥ 50 people
2. **Infrastructure**: ≥ 10 housing tiles
3. **Resources**: 100 Timber + 80 Stone + 50 Bricks

### What Happens

When a village evolves:

1. **Resources Consumed**: Removes 100 timber, 80 stone, 50 bricks from stockpile
2. **Type Changes**: `settlement.type = "city"`
3. **Landmark Built**: Constructs Church or Tower
4. **Visual Update**: Settlement appearance reflects city status

## Landmark Selection

The system intelligently chooses a landmark:

### Church Landmark
- **Condition**: Village has a Chapel building
- **Action**: Upgrade Chapel → Church
- **Theme**: Religious city (monastery, pilgrimage site)

### Tower Landmark
- **Condition**: No chapel present
- **Action**: Build Tower on central house tile
- **Theme**: Fortified city (trade hub, military outpost)

## Example Evolution

### Scenario: Village of "Riverside"

**Starting State:**
- Type: Village
- Population: 62 people
- Housing: 15 tiles (avg density 4.1)
- Stockpile: 150 Timber, 100 Stone, 60 Bricks
- Buildings: Houses, Sawmill, Quarry, ClayPit, Kiln, Chapel

**Turn Processing:**
```
[Economy] Processing settlement 3 (village)
  - Population: 62 people
  - Housing: 62 / 65 (95%)
  - Checking city evolution requirements...
  - Population: 62 ✓ (≥ 50)
  - Housing tiles: 15 ✓ (≥ 10)
  - Resources: 150 timber ✓, 100 stone ✓, 60 bricks ✓
  [City Evolution] Riverside evolved from village to city! Built landmark: church
  - Settlement evolved to CITY!
```

**Final State:**
- Type: **City**
- Landmark: Church (upgraded from Chapel)
- Stockpile: 50 Timber, 20 Stone, 10 Bricks (consumed 100/80/50)
- Same population and housing (no change)

## Strategic Implications

### Resource Accumulation
Cities require **significant stockpiling**:
- Timber: Common (forests, lumber camps)
- Stone: Moderate (quarries on mountains)
- Bricks: Rare (requires Clay → Kiln production chain)

### Production Chains
To evolve, villages must develop:

```
Clay Deposit → ClayPit → Clay (resource)
Clay + Charcoal → Kiln → Bricks (good)

Forest → LumberCamp → Timber (resource)

Mountains → Quarry → Stone (resource)
```

### Trade Dependency
Not all villages can evolve independently:
- **No clay nearby**: Must trade for bricks
- **No mountains**: Must trade for stone
- **No forests**: Must trade for timber

This creates **economic interdependence** between settlements.

## Game Progression

### Natural Hierarchy

The system creates realistic settlement hierarchies:

**Early Game (Year 1-5)**
- Most settlements: Hamlets (density 1-2)
- Few villages: Moderate populations
- No cities: Insufficient resources

**Mid Game (Year 5-10)**
- Villages grow: Stockpiling resources
- First cities emerge: Best-positioned settlements
- Trade networks: Moving construction materials

**Late Game (Year 10+)**
- Multiple cities: Competing for resources
- Dense housing: Density 4-5 common in cities
- Economic specialization: City vs production villages

## Economic Impact

### Resource Demand
City evolution creates **spike demand**:
- One city evolution = 100 timber (10 LumberCamp turns)
- Multiple cities = Competition for materials
- Price increases: Construction materials become valuable

### Strategic Choices
Settlements must balance:
- **Housing upgrades**: Small incremental costs (10-30 resources)
- **City evolution**: Large one-time cost (100/80/50)
- **Production**: Use resources vs save for evolution
- **Trade**: Buy materials vs produce locally

## Console Output

### Successful Evolution
```
[City Evolution] Oakwood evolved from village to city! Built landmark: church
```

### Blocked Evolution (Insufficient Resources)
```
[City Evolution] Village has 52 population but lacks resources for landmark (need timber:100 stone:80 bricks:50)
```

### No Output
- Population too low (< 50)
- Not enough housing (< 10 tiles)
- Already a city

## Technical Details

### Check Frequency
- Runs **every turn** after population dynamics
- Only for villages (not hamlets or existing cities)
- No cooldown or restrictions (can evolve immediately if conditions met)

### Building Placement
Tower placement algorithm:
1. Find all House tiles in settlement
2. Sort by distance to settlement center
3. Convert closest house to Tower
4. Preserves housing capacity (Tower still provides housing)

### Type Safety
```typescript
settlement.type: "hamlet" | "village" | "city"
settlement.landmark?: BuildingType
```

## Future Enhancements

### Hamlet → Village Evolution
Similar system for hamlets:
- Requirements: 20+ people, 5+ housing tiles
- Cost: 20 timber, 10 stone
- Builds: Chapel or TradingPost

### Multiple Landmarks
Cities could build multiple landmarks:
- Church + Tower (fortified religious city)
- Multiple towers (military stronghold)
- Requires additional resources

### City Specialization
Cities could develop specializations:
- **Trade City**: TradingPost + Warehouse + Market
- **Religious City**: Church + Monastery
- **Military City**: Barracks + Towers + Walls
- **Industrial City**: Multiple production buildings

### Prestige System
Cities provide benefits:
- Higher trade volume
- Better worker productivity
- Immigration bonuses
- Tax revenue multipliers

## Related Systems

### Housing Density
- Cities can continue densifying after evolution
- Density 5 housing creates megacities (100+ people)
- Resource consumption continues for upgrades

### Trade System
- Cities become **trade hubs**
- Higher trade volume and better prices
- Attract traders from other settlements
- Export finished goods, import raw materials

### Population Growth
- Cities attract immigration (future feature)
- Better health/happiness (if not overcrowded)
- More workers for production
- Higher food consumption
