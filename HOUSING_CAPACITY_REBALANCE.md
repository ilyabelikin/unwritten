# Housing Capacity Rebalance

## Problem

The housing density system had **unrealistically low capacity**:
- Density 1 = 1 person per tile ❌
- A "house" could only hold 1 person, not a family
- Visual mismatch: Renderer showed 3 small houses, but capacity was only 1

## Solution

Increased capacity to realistic family sizes:

### New Capacity Table

| Density | People | Description | Visual Goal |
|---------|--------|-------------|-------------|
| **1** | **6** | Small family home | Single house sprite |
| **2** | **12** | Large family home | Larger house sprite |
| **3** | **18** | Small apartment | Multi-unit building |
| **4** | **24** | Multi-story building | 2-story building |
| **5** | **30** | Dense tenement | Packed apartment block |

### Before vs After

**Old System:**
```
1 house tile at density 1 = 1 person ❌
1 house tile at density 5 = 5 people ❌
```

**New System:**
```
1 house tile at density 1 = 6 people ✅
1 house tile at density 5 = 30 people ✅
```

## Visual Representation Issue

The **renderer** currently shows decorative building sprites that don't match the game mechanics:

### What You See
- Multiple small house sprites grouped together
- Looks like 3 houses

### What It Actually Is
- **1 game tile** (1 hex)
- Houses density level (1-5)
- Capacity based on density, not visual count

### Future Fix
The renderer should show different sprites based on density:
- **Density 1**: Small house sprite
- **Density 2**: Larger house sprite  
- **Density 3**: Small 2-unit building
- **Density 4**: Multi-story building
- **Density 5**: Dense apartment complex

Currently, the renderer doesn't differentiate - it just shows a generic "house" visual.

## Impact on Gameplay

### Settlement Starting Sizes

**Hamlets** (1 house at density 1):
- Old: 1 person capacity ❌
- New: 6 people capacity ✅

**Villages** (3-5 houses at density 2):
- Old: 6-10 people capacity
- New: 36-60 people capacity ✅

**Cities** (10+ houses at density 3):
- Old: 30+ people capacity
- New: 180+ people capacity ✅

### Housing Upgrades

Upgrading density now provides **significant capacity increases**:

```
Density 1 → 2: +6 people (+100%)
Density 2 → 3: +6 people (+50%)
Density 3 → 4: +6 people (+33%)
Density 4 → 5: +6 people (+25%)
```

Each upgrade adds **6 people**, so the shortfall calculation was updated:
```typescript
// Old: Each upgrade adds 1 person
const tilesToUpgrade = Math.ceil(shortfall / 1);

// New: Each upgrade adds 6 people
const tilesToUpgrade = Math.ceil(shortfall / 6);
```

## Resource Cost Adjustments

Costs increased proportionally to match larger capacity gains:

| Density | Capacity | Cost (Timber/Stone/Bricks) |
|---------|----------|----------------------------|
| 1 | 6 people | Free (basic construction) |
| 2 | 12 people | 15 / 5 / 0 |
| 3 | 18 people | 25 / 10 / 5 |
| 4 | 24 people | 40 / 20 / 10 |
| 5 | 30 people | 60 / 30 / 20 |

**Rationale:**
- Each density level adds 6 people
- Cost increases reflect larger building projects
- Density 5 requires significant investment (tenement construction)

## City Evolution Impact

City evolution requirements remain the same, but now more achievable:

**Requirements:**
- ≥ 50 people ✅ (8-9 houses at density 1, very achievable)
- ≥ 10 housing tiles
- 100 Timber + 80 Stone + 50 Bricks

**Old System:**
- 50 people = 50 housing tiles needed! ❌ (impossible for hamlets/villages)

**New System:**
- 50 people = 8-9 housing tiles at density 1 ✅ (reasonable for villages)

## Example: West Peak Hamlet

Looking at your screenshot:

**Display:**
- Total: 6 people ✅
- Housing: 6 / 6 ✅ (now shows realistic capacity)
- (1 tiles, avg density 1)

**New Calculation:**
- 1 housing tile × density 1 = 6 capacity
- Current population: 6 people
- Utilization: 100% (at capacity)

**Growth Path:**
- Settlement generates resources (wheat, flour)
- Accumulates timber/stone
- When population pressure hits 90%, upgrades to density 2
- New capacity: 12 people
- Settlement can continue growing!

## Settlement Progression Examples

### Hamlet Growth
```
Start: 1 house (density 1) = 6 people
Growth: 1 house (density 2) = 12 people
Mature: 2 houses (density 2) = 24 people
```

### Village Growth
```
Start: 5 houses (density 2) = 60 people
Growth: 5 houses (density 3) = 90 people
Mature: 8 houses (density 3) = 144 people
```

### City Growth
```
Start: 15 houses (density 3) = 270 people
Growth: 15 houses (density 4) = 360 people
Metropolis: 20 houses (density 5) = 600 people! 🏙️
```

## Technical Changes

### Files Modified
1. **Building.ts**:
   - `HOUSING_DENSITY_CAPACITY = [0, 6, 12, 18, 24, 30]`
   - Updated `calculateHousingCapacity()` to use capacity array

2. **HousingUpgrade.ts**:
   - Updated costs: Density 2 now costs 15 timber + 5 stone (was 10 timber)
   - Updated shortfall calculation: `/6` instead of `/1`
   - Updated class documentation

### Code Example
```typescript
// Capacity lookup
export const HOUSING_DENSITY_CAPACITY = [0, 6, 12, 18, 24, 30];

// Usage
const density = tile.housingDensity; // 1-5
const capacity = HOUSING_DENSITY_CAPACITY[density]; // 6-30
```

## Future Enhancements

### Visual Density Representation
Update `BuildingRenderer.ts` to show different sprites:
```typescript
switch (tile.housingDensity) {
  case 1: renderSmallHouse(); break;
  case 2: renderLargeHouse(); break;
  case 3: renderDuplex(); break;
  case 4: renderApartment(); break;
  case 5: renderTenement(); break;
}
```

### Density Effects on Gameplay
- **Higher density** (4-5):
  - Negative: Lower happiness (overcrowding)
  - Negative: Higher disease risk
  - Positive: More tax revenue
  - Positive: Better worker availability

- **Lower density** (1-2):
  - Positive: Higher happiness (spacious)
  - Positive: Lower disease risk
  - Negative: Less efficient land use
  - Negative: Sprawling settlements

### Manual Upgrades
Allow player to upgrade housing manually (with resource cost):
- Click house → "Upgrade Density" button
- Shows cost and capacity increase
- Instant upgrade if resources available
- Strategic choice: dense cities vs spread villages

## Comparison to Original Design

Your suggestion matched realistic expectations:
- **1 house = 6 people minimum** ✅ Implemented
- **3 houses = 18 people** ✅ Now possible (3 tiles at density 1 = 18)
- Visual should match capacity ⚠️ Future improvement

The system now supports proper family-sized housing and realistic settlement populations!
