# Turn-Based Economy Integration Fix

## Issue

The economy system was incorrectly running on a frame-based timer (every 60 frames) instead of being integrated with the game's existing turn-based system.

## Problem

```typescript
// ❌ OLD: Frame-based (wrong)
private economyTickRate: number = 60; // 1 tick per second at 60fps
private economyTickCounter: number = 0;

private gameLoop(ticker: Ticker): void {
  // ... other updates ...
  
  this.economyTickCounter++;
  if (this.economyTickCounter >= this.economyTickRate) {
    this.economyTickCounter = 0;
    this.economyTick();
  }
}
```

This made no sense because:
- The game has a **turn-based system** where the player takes actions
- Characters have AP (Action Points) and turns
- Players explicitly **end their turn** (Space key or End Turn button)
- Economy should advance with turns, not with real-time

## Solution

Integrated economy with the turn system using the `Character.onNewTurn` callback:

```typescript
// ✅ NEW: Turn-based (correct)
this.character.onNewTurn = (turn: number) => {
  console.log(`[Game] Turn ${turn} started - processing economy`);
  this.economyTick();
};
```

Now the economy processes **once per turn** when the player ends their turn, which is the expected behavior for a turn-based game.

## Changes Made

### 1. Removed Frame-Based Timer (`Game.ts`)

**Removed:**
- `economyTickRate` field
- `economyTickCounter` field  
- Frame counting logic in `gameLoop()`

### 2. Added Turn-Based Integration (`Game.ts`)

**Added:**
```typescript
// Hook into turn system
this.character.onNewTurn = (turn: number) => {
  this.economyTick();
};

// Run initial economy tick on game start (turn 1)
this.economyTick();
```

### 3. Updated Documentation

Updated all documentation to reflect turn-based instead of frame-based:

**Files updated:**
- `ECONOMY_IMPLEMENTATION_SUMMARY.md`
- `ECONOMY_BALANCE.md`
- `FOOD_PRODUCTION_FEATURE.md`

**Changes:**
- "per tick" → "per turn"
- "every 60 frames" → "once per turn"
- "Wait 60 frames" → "End your turn"
- "ticks" (time unit) → "turns" (time unit)

## How It Works Now

### Economy Flow

```
1. Player takes actions (moves, explores)
2. Player ends turn (Space or End Turn button)
3. Character.endTurn() is called
4. Character.onNewTurn callback fires
5. economyTick() executes
   - All settlements extract resources
   - All settlements process production
   - Stockpiles update
6. New turn begins with fresh AP
```

### Initial Turn

On game start, the economy tick runs once for turn 1:
```typescript
// Initialize economies
this.initializeEconomies();

// Run initial economy tick for turn 1
this.economyTick();
```

This ensures settlements start with some extracted resources.

## Benefits

### 1. **Consistent with Game Design**
- Turn-based game → turn-based economy ✅
- Real-time rendering → turn-based simulation ✅

### 2. **Player Control**
- Players explicitly advance the economy by ending turns
- No hidden real-time mechanics in a turn-based game
- Predictable and transparent

### 3. **Balanced Gameplay**
- Production times are in turns, not seconds
- Easy to balance: "X turns to produce Y"
- No frame rate dependencies

### 4. **Debugging**
- Clear logging: "Turn 5 started - processing economy"
- Easy to track economic progression
- Reproducible behavior

## Testing

### Verify Turn-Based Economy

1. **Start game** - Economy initializes
2. **Check turn counter** - Should show "Turn 1"
3. **End turn** (Space or End Turn button)
4. **Check console** - Should see "[Game] Turn 2 started - processing economy"
5. **Hover over settlements** - Stockpiles should increase each turn
6. **End multiple turns** - Resources and goods accumulate per turn

### Expected Console Output

```
[Game] Initial economy processing for turn 1
[Game] Turn 2 started - processing economy
[Game] Turn 3 started - processing economy
[Game] Turn 4 started - processing economy
...
```

## Production Rates Updated

All production rates now in **turns** (not frames):

| Resource/Good | Rate | Unit |
|---------------|------|------|
| Timber | 12 | per turn |
| Coal | 2.5 | per turn |
| Iron Ore | 7 | per turn |
| Iron Ingots | 2 | per turn |
| Iron Sword | 0.25 | per turn |
| Bread | 8 | per turn |
| Meat | 5 | per turn |

Production times also in **turns**:

| Recipe | Time |
|--------|------|
| Coal from Timber | 2 turns |
| Smelt Iron | 4 turns |
| Forge Sword | 4 turns |
| Bake Bread | 1 turn |

## Migration Notes

No save game compatibility issues - this is a pure timing change that doesn't affect data structures or save format.

## Summary

The economy is now properly **turn-based**, not frame-based. It advances when the player ends their turn, making it consistent with the game's core turn-based design. All documentation has been updated to reflect turns as the time unit instead of frames/ticks.

This is how a turn-based economy should work! ✅
