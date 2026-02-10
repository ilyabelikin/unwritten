# Robust Trade System - Economic Survival

**Goal:** Remove building requirements for trade and make the system more robust so settlements don't die out.

## Changes Made

### 1. Removed Building Requirements for Traders

**Old System:**
- Traders only spawned if settlement had TradingPost OR Warehouse building
- Many settlements couldn't trade because they lacked these buildings
- Struggling settlements couldn't get help via trade

**New System:**
- **Any settlement can spawn traders** from their settlement center
- No building requirements - traders emerge based on economic need
- Trading Posts and Warehouses still exist for:
  - Visual variety and settlement character
  - Employment (2 merchants each)
  - Village specialization themes

### 2. Need-Based Trader Spawning

**Old Logic:**
```typescript
// Only spawn if has trading building
if (!hasTradingBuilding) continue;

// Static max based on size
const maxTraders = city ? 3 : village ? 2 : 1;
```

**New Logic:**
```typescript
// Spawn based on economic health
const hasUrgentNeeds = checkForCriticalShortages();
const hasSurplus = checkForExcessGoods();

// Dynamic max based on economic situation
let maxTraders = city ? 3 : village ? 2 : 1;
if (hasUrgentNeeds) maxTraders += 2;  // Emergency traders!
if (hasSurplus) maxTraders += 1;       // Extra seller
```

**Economic Health Checks:**
1. **Urgent Needs** (spawns +2 traders):
   - High-priority buy offers (priority >= 85)
   - Population health < 60%
   - Population hunger > 60%

2. **Surplus** (spawns +1 trader):
   - Total sellable goods > 100 units

### 3. Critical Trade Priority System

**Problem:** Traders ignored unprofitable trades even if settlements were starving

**Solution:** Accept slightly unprofitable trades if they're critical

```typescript
// New priority-based sorting
if (priority >= 85) {
  // CRITICAL trades always go first, even if unprofitable
  acceptTrade(evenIfLoss);
}
```

**Critical Trades (priority >= 85):**
- Emergency food orders from starving settlements
- Settlements with < 2 turns of food reserves
- Population health/hunger in danger zone

**Trade Acceptance:**
- Normal trades: Must be profitable (profit > 0)
- Critical trades: Accept small losses (profit >= -10g)

### 4. Emergency Food System

**Trigger:** Settlement has < 2 turns of total food

**Response:**
```typescript
// Create high-priority orders for ANY food
this.buyOffers.push({
  material: GoodType.Bread,
  quantity: Math.ceil(emergency / 3),
  pricePerUnit: basePrice * 1.5,  // Pay MORE for emergency food
  priority: 100,                   // CRITICAL
});
```

**Benefits:**
- Starving settlements pay 50% more for food
- Attracts traders even from distant settlements
- Multiple food types ordered simultaneously
- Guaranteed to be processed first

## Benefits

### 1. Economic Resilience
- **Before:** Settlements with no trading buildings died from starvation
- **After:** Any settlement in crisis can spawn traders to get help

### 2. Dynamic Response
- **Before:** Fixed trader counts regardless of need
- **After:** More traders spawn when settlements struggle or have surplus

### 3. Humanitarian Aid
- **Before:** No trader would deliver food to starving settlements (unprofitable)
- **After:** Traders accept small losses to deliver critical food

### 4. Better Market Efficiency
- **Before:** Surplus goods accumulated with no outlet (no trading building)
- **After:** Settlements with surplus automatically spawn sellers

## Example Scenarios

### Scenario 1: Starving Hamlet

**Situation:**
- Small hamlet with only 8 people
- No TradingPost (used to = no traders)
- Food ran out, population at 40% health

**Old System:**
```
❌ No trading building → No traders spawn
❌ Population slowly dies
❌ Settlement may disappear
```

**New System:**
```
✅ Urgent need detected (health < 60%)
✅ Spawns 3 traders (1 base + 2 emergency)
✅ Emergency food orders created (priority 100)
✅ Nearby settlements deliver food
✅ Population recovers
```

### Scenario 2: Farming Village with Surplus

**Situation:**
- Farming village producing 200 bread/turn
- Only needs 50 for population
- 400+ bread stockpiled
- No TradingPost

**Old System:**
```
❌ No trading building → No traders spawn
❌ Surplus keeps growing
❌ No trade economy
```

**New System:**
```
✅ Surplus detected (400+ bread)
✅ Spawns 3 traders (2 base + 1 surplus)
✅ Traders sell excess to hungry settlements
✅ Village earns money from trade
✅ Healthy trade economy emerges
```

### Scenario 3: Mining City in Crisis

**Situation:**
- City with iron/copper mines
- 60 population
- Bakery stopped working (no wheat)
- Food critically low
- Has TradingPost but all 3 trader slots full with mineral trades

**Old System:**
```
✅ Has trading building
✅ Has 3 traders (max)
⚠️ All traders busy with profitable mineral trades
❌ No one brings food (unprofitable route)
❌ Population starves despite having traders
```

**New System:**
```
✅ Urgent need detected (food < 2 turns)
✅ Max traders increased to 5 (3 base + 2 emergency)
✅ Spawns 2 new emergency traders
✅ Emergency food orders (priority 100, paying +50%)
✅ New traders prioritize food over minerals
✅ Food arrives within 2-3 turns
✅ Population survives
```

## Technical Details

### Trade Opportunity Sorting

```typescript
// Critical trades always first
if (priority >= 85) {
  return -1; // Move to top
}

// Then by priority bands
if (Math.abs(a.priority - b.priority) > 10) {
  return b.priority - a.priority;
}

// Finally by efficiency
return b.profitPerTile - a.profitPerTile;
```

### Economic Health Detection

```typescript
hasUrgentEconomicNeeds(market, population) {
  // Check for critical buy offers
  if (buyOffers.some(o => o.priority >= 85)) {
    return true;
  }
  
  // Check population metrics
  if (avgHealth < 60 || avgHunger > 60) {
    return true;
  }
  
  return false;
}
```

## Backward Compatibility

- **Trading Posts & Warehouses:** Still generated, still employ merchants
- **Trading Villages:** Still specialize in commerce buildings
- **Existing saves:** Will work but benefit from new spawning logic
- **Visual:** No changes to building appearance

## Future Enhancements

1. **Trader AI Improvements:**
   - Prefer trade routes to struggling settlements
   - Form regular trade routes between partners
   - Specialize in certain goods

2. **Economic Indicators:**
   - Settlement "health" rating visible to player
   - Trade deficit/surplus tracking
   - Economic collapse warnings

3. **Trade Policies:**
   - Settlements can prioritize certain trade partners
   - Export restrictions during shortages
   - Trade agreements between settlements

4. **Advanced Buildings:**
   - **Market Square:** +1 trader capacity, better prices
   - **Caravanserai:** Rest stop for traders, faster routes
   - **Port:** Maritime trade (future)

## Summary

The trade system is now **economically robust** and **survival-focused**:

- ✅ Any settlement can trade (no building requirement)
- ✅ Traders spawn based on economic need
- ✅ Critical trades prioritized over profit
- ✅ Settlements help each other survive
- ✅ Emergency response to starvation
- ✅ Dynamic trader capacity

**Result:** Settlements are less likely to die out from economic isolation or starvation.
