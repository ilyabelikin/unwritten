# Trading Post Improvements

## Problem

Previously, cities could generate **multiple trading posts** (3+ in large cities), which were redundant because:
- Only **1 trading post** is needed to enable trader spawning
- Multiple trading posts don't provide additional benefits
- They took up valuable building slots that could be production buildings

## Solution

### City Building Distribution (Updated)

Cities now have smarter building placement:

**Old Distribution:**
- 80% City Houses
- 15% Warehouses
- 5% Trading Posts (could spawn multiple)

**New Distribution:**
- 70% City Houses
- **Exactly 1 Trading Post** (first special building placed)
- 10% Warehouses (storage)
- 5% Windmills (grain → flour processing)
- 5% Bakeries (flour → bread production)
- 5% Grain Silos (wheat storage)
- 5% Butchers (meat production)

### Benefits

✅ **No More Redundant Buildings**: Only 1 trading post per city
✅ **More Production**: Cities now have food production chains built-in
✅ **Economic Diversity**: Windmills, bakeries, butchers provide goods
✅ **Better Balance**: More useful buildings overall

## What Do Trading Posts Actually Do?

### Current Function

Trading posts serve **one purpose**: Enable trader spawning.

```typescript
// TradeManager checks for trading infrastructure
const hasTradingBuilding = settlement.tiles.some(tile => 
  tile.building === BuildingType.TradingPost ||
  tile.building === BuildingType.Warehouse
);

if (!hasTradingBuilding) continue; // No traders spawn
```

### Trader Spawning Rules

- **Requirement**: Settlement must have ≥1 Trading Post OR Warehouse
- **Max Traders**:
  - Cities: 3 traders
  - Villages: 2 traders
  - Hamlets: 1 trader
- **Spawn Condition**: Only when trade opportunities exist

### Employment

- Trading Posts employ: **2 Merchants**
- Warehouses employ: **2 Merchants**
- Merchants currently track trade activity (future: may provide bonuses)

## Village Trading Specialization

Some villages generate as "Trading Villages" (rare):

**Triggers:**
- Village built near **Salt** deposits (valuable commodity)
- 15% random chance as fallback specialization

**Buildings:**
- Primary: Trading Post
- Secondary: Warehouse
- Mix of houses

**Note:** These villages still only need 1 trading post to function, but may generate more due to specialization.

## Example: City Before/After

### Before (Old System)
```
City of "Riverside" (25 tiles)
- 20 City Houses
- 3 Warehouses
- 2 Trading Posts  ← Redundant!
- 1 Church (landmark)
```

### After (New System)
```
City of "Riverside" (25 tiles)
- 17 City Houses
- 2 Warehouses
- 1 Trading Post    ← Single, functional
- 1 Windmill        ← NEW! Processes wheat
- 1 Bakery          ← NEW! Produces bread
- 1 Grain Silo      ← NEW! Stores wheat
- 1 Butcher         ← NEW! Produces meat
- 1 Church (landmark)
```

The city now has **built-in food production** while still supporting traders!

## Production Chains Enabled

Cities now naturally support these production chains:

### Grain Processing
```
Wheat (fields) → Windmill → Flour → Bakery → Bread
                                            ↓
                                      Grain Silo (storage)
```

### Meat Production
```
Livestock (pastures) → Butcher → Meat
Wild Game (hunting) → Butcher → Meat
```

## Future Enhancements

### Trading Post Bonuses (Potential)
- **Trade Volume**: +20% trader capacity
- **Better Prices**: -10% buy prices, +10% sell prices
- **Faster Trading**: Reduced trader travel time
- **Market Information**: See prices at other settlements

### Merchant Jobs
- Merchants could provide **trade bonuses** when staffing trading posts
- Higher merchant skill = better trade deals
- Merchants gain experience from successful trades

### Multiple Trading Posts (If Implemented)
If we add trading post bonuses:
- 1st Trading Post: Enables traders
- 2nd Trading Post: +1 trader, +10% trade efficiency
- 3rd Trading Post: +1 trader, +20% trade efficiency

This would make multiple trading posts useful, but currently not implemented.

## Technical Details

### City Generation Code

```typescript
// First special building is always a trading post
const hasTradeBuilding = tiles.some(t => {
  const tile = grid.getHex(t);
  return tile && tile.building === BuildingType.TradingPost;
});

if (!hasTradeBuilding && buildingRoll >= 0.85) {
  building = BuildingType.TradingPost; // Place exactly 1
}
```

### Distribution Logic

The system ensures:
1. **First** special building (>0.85 roll) becomes Trading Post
2. **Subsequent** buildings follow normal distribution (Windmill, Bakery, etc.)
3. Once trading post placed, that slot is no longer available

## Related Systems

### Trade System
- See `TradeManager.ts` for trader spawning logic
- See `Market.ts` for supply/demand pricing
- See `Trader.ts` for trader behavior

### Worker Assignment
- Merchants assigned to trading posts (2 workers)
- Merchants don't currently affect trade (future feature)

### Production System
- Windmills produce Flour (wheat → flour)
- Bakeries produce Bread (flour → bread)
- Butchers produce Meat (livestock/game → meat)
