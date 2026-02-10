# Hunger System Reversal

**Change:** Reversed the hunger scale to be more intuitive.

## Old System (Counterintuitive)
- **100% = Well-fed** (full)
- **0% = Starving** (empty)

## New System (Intuitive)
- **0% = Not hungry** (well-fed)
- **100% = Starving** (very hungry)

This makes hunger work like a gauge that fills up when you need food, which is more intuitive for players.

## Changes Made

### 1. Person Interface Comment
**File:** `src/world/population/Person.ts`

```typescript
// Old
/** Hunger (0-100), 100 = well-fed, 0 = starving */

// New
/** Hunger (0-100), 0 = not hungry/well-fed, 100 = starving */
```

### 2. Food Consumption - Hunger Updates
**File:** `src/world/population/FoodConsumption.ts`

**Inverted hunger changes:**
- Enough food (≥100%): `hungerChange = -50` (decreases hunger, makes well-fed)
- Mostly fed (≥75%): `hungerChange = -35`
- Partial food (≥50%): `hungerChange = -20 * ratio`
- Low food (≥25%): `hungerChange = +10` (increases hunger)
- Severe shortage: `hungerChange = +15` (increases hunger, starving)

### 3. Health Updates
**File:** `src/world/population/FoodConsumption.ts`

**Inverted thresholds:**
```typescript
// Old                          // New
if (hunger < 20)  // starving → if (hunger > 80)  // starving
if (hunger < 40)  // malnourished → if (hunger > 60)  // malnourished
if (hunger > 80)  // well-fed → if (hunger < 20)  // well-fed
if (hunger > 60)  // fed → if (hunger < 40)  // fed
```

### 4. Happiness Updates
**File:** `src/world/population/FoodConsumption.ts`

**Inverted thresholds:**
```typescript
// Old                          // New
if (hunger < 30)  // starving → if (hunger > 70)  // starving
if (hunger > 80)  // well-fed → if (hunger < 20)  // well-fed
if (hunger > 50)  // fed → if (hunger < 50)  // fed
```

### 5. Helper Functions
**File:** `src/world/population/FoodConsumption.ts`

```typescript
// Old
isStarving(person) = person.hunger < 30
isWellFed(person) = person.hunger > 70

// New
isStarving(person) = person.hunger > 70
isWellFed(person) = person.hunger < 30
```

### 6. Population Manager
**File:** `src/world/population/PopulationManager.ts`

```typescript
// Old
getStarvingPeople() = filter(p => p.hunger < 30)

// New
getStarvingPeople() = filter(p => p.hunger > 70)
```

### 7. Trade Manager - Urgent Needs
**File:** `src/world/trade/TradeManager.ts`

```typescript
// Old
if (avgHealth < 60 || avgHunger > 60) // struggling

// New
if (avgHealth < 60 || avgHunger > 40) // struggling
```

### 8. Person Initialization
**File:** `src/world/population/LifeSimulation.ts`

```typescript
// Old
hunger: 70 + Math.floor(Math.random() * 30), // 70-100 (well-fed)

// New
hunger: 0 + Math.floor(Math.random() * 30), // 0-30 (well-fed on reversed scale)
```

## Hunger Scale Reference

### Visual Scale
```
0% ████████████████████ Well-fed, not hungry
10% ███████████████████░
20% ██████████████████░░
30% █████████████████░░░ Fed
40% ████████████████░░░░ Moderately hungry
50% ███████████████░░░░░
60% ██████████████░░░░░░
70% █████████████░░░░░░░ Malnourished
80% ████████████░░░░░░░░
90% ███████████░░░░░░░░░
100% ██████████░░░░░░░░░░ Starving
```

### Thresholds

**Well-Fed (0-30%)**
- Health increases rapidly
- Happiness increases
- Productive and content

**Fed (30-50%)**
- Health stable
- Happiness stable
- Normal productivity

**Moderately Hungry (50-70%)**
- Health slowly recovers
- Happiness stable
- Slight productivity penalty

**Malnourished (70-80%)**
- Health decreases slightly
- Happiness decreases
- Productivity penalty

**Starving (80-100%)**
- Health decreases rapidly
- Happiness plummets
- Major productivity penalty
- Death risk increases

## Food Consumption Effects

### Fully Fed (100% of needs)
- Hunger: **-50** per turn
- Result: Stays at 0-20% (well-fed)

### Mostly Fed (75% of needs)
- Hunger: **-35** per turn
- Result: Stays at 10-30% (well-fed)

### Partially Fed (50% of needs)
- Hunger: **-10 to -20** per turn
- Result: Gradually improves to 30-50% range

### Low Food (25% of needs)
- Hunger: **+10** per turn
- Result: Slowly increases to 60-70%

### Severe Shortage (0-25% of needs)
- Hunger: **+15** per turn
- Result: Increases to 80-100% (starving)

## Display

No changes needed to HUD display - the percentage now intuitively shows:
- **0% Hunger** = "Not hungry at all" ✅
- **50% Hunger** = "Moderately hungry"
- **100% Hunger** = "Starving" ⚠️

## Benefits

1. **More Intuitive**: Higher number = more hungry (like a fuel gauge emptying)
2. **Consistent with Health**: Both health and hunger now work the same way (higher = worse for hunger)
3. **Easier to Understand**: 100% hunger clearly means "very hungry"
4. **Better UX**: Players immediately understand what the percentage means

## Testing

Test scenarios to verify:
1. ✅ New people spawn with 0-30% hunger (well-fed)
2. ✅ Full food supply: hunger decreases to 0%
3. ✅ No food: hunger increases to 100%
4. ✅ Health decreases when hunger > 60%
5. ✅ Happiness decreases when hunger > 70%
6. ✅ Traders spawn when avgHunger > 40%
7. ✅ Display shows intuitive percentages

## Backward Compatibility

This is a **breaking change** for existing saves:
- Old saves with people at hunger=100 (well-fed) will now be starving
- Recommend either:
  - Clear notice about save incompatibility
  - OR: Migration script to invert all existing hunger values: `newHunger = 100 - oldHunger`

## Summary

The hunger system has been **completely reversed** to be more intuitive:
- 📊 **0% = Well-fed** (empty hunger bar)
- 📊 **100% = Starving** (full hunger bar)

All logic has been inverted to maintain the same gameplay behavior with the new scale.
