# Trader Fog of War Fix

## Problem

Traders were rendering **on top of fog of war**, making them visible even in unexplored areas. This broke immersion and the fog of war mechanic.

**User Report:**
> "I notice you showing traders on top of the fog of war this is not right they should be below"

## Root Cause

The rendering layer order had traders added **after** the fog overlay:

```typescript
// WRONG ORDER (before fix):
1. Tiles
2. Roads
3. Decorations
4. Fog overlay           ← Fog here
5. Path overlay
6. Highlight overlay
7. Character renderer
8. Trader renderer       ← Traders on TOP of fog! ❌
9. Settlement names
```

Because traders were added to the world container after the fog overlay, they appeared on top of it.

## Solution

Reordered the rendering layers so traders are added **before** the fog overlay:

```typescript
// CORRECT ORDER (after fix):
1. Tiles
2. Roads
3. Decorations
4. Character renderer    ← Player
5. Trader renderer       ← NPCs (BEFORE fog)
6. Fog overlay           ← Fog covers everything below ✅
7. Path overlay          ← UI elements above fog
8. Highlight overlay
9. Settlement names
```

## Implementation

**File: `src/game/Game.ts`**

```typescript
// Before:
this.worldContainer.addChild(this.tileRenderer.decorationContainer);
this.fogOverlay = new FogOfWarOverlay();
this.worldContainer.addChild(this.fogOverlay.container);
this.pathOverlay = new PathOverlay();
this.worldContainer.addChild(this.pathOverlay.container);
this.highlightOverlay = new HighlightOverlay();
this.worldContainer.addChild(this.highlightOverlay.container);
this.characterRenderer = new CharacterRenderer();
this.worldContainer.addChild(this.characterRenderer.container);
this.traderRenderer = new TraderRenderer();
this.worldContainer.addChild(this.traderRenderer.container);  // ❌ Too late!

// After:
this.worldContainer.addChild(this.tileRenderer.decorationContainer);
this.characterRenderer = new CharacterRenderer();
this.worldContainer.addChild(this.characterRenderer.container);
this.traderRenderer = new TraderRenderer();
this.worldContainer.addChild(this.traderRenderer.container);  // ✅ Before fog!
this.fogOverlay = new FogOfWarOverlay();
this.worldContainer.addChild(this.fogOverlay.container);
this.pathOverlay = new PathOverlay();
this.worldContainer.addChild(this.pathOverlay.container);
this.highlightOverlay = new HighlightOverlay();
this.worldContainer.addChild(this.highlightOverlay.container);
```

## Visual Effect

### Before Fix:
```
Unexplored Area:
███████████████████
█░░░░░░░░░░░░░░░░░█
█░░  🚶 Trader ░░░█  ← Visible through fog! ❌
█░░  (wrong)   ░░░█
█░░░░░░░░░░░░░░░░░█
███████████████████
```

### After Fix:
```
Unexplored Area:
███████████████████
█░░░░░░░░░░░░░░░░░█
█░░░░░░░░░░░░░░░░░█  ← Trader hidden! ✅
█░░░ (correct) ░░░█
█░░░░░░░░░░░░░░░░░█
███████████████████

Explored Area:
        
    🚶 Trader        ← Visible!
  (traveling)        
```

## Layer Order Explained

### Game World Layers (bottom to top):

1. **Tiles** - Base terrain (grass, water, mountains)
2. **Roads** - Road network connecting settlements
3. **Decorations** - Buildings, vegetation, resources
4. **Character** - Player character sprite
5. **Traders** - NPC trader sprites
6. **Fog Overlay** ← KEY: Covers everything below
7. **Path Overlay** - Movement path visualization
8. **Highlight Overlay** - Tile selection highlights
9. **Settlement Names** - Always visible labels

### Why This Order:

**Below Fog (hidden when unexplored):**
- Terrain, buildings, resources → World elements
- Player character → Can't see yourself in unexplored areas
- Traders → NPCs hidden until you discover them

**Above Fog (always visible):**
- Path overlay → You plan your route
- Highlight overlay → You select tiles to explore
- Settlement names → You've heard of places (but blurred)

## Gameplay Impact

### Before Fix:
```
Player: "I can see traders in fog of war areas!"
        "Where are they going? I haven't explored there!"
        "This is cheating!"
```

### After Fix:
```
Player: "I wonder if there are traders nearby?"
        "Let me explore to find out!"
        "Oh! A trader just appeared as I explored this area!"
```

## Technical Details

### Container Hierarchy:
```
App Stage
└── World Container (camera transforms this)
    ├── Tile Container
    ├── Road Container
    ├── Decoration Container
    ├── Character Container
    ├── Trader Container
    ├── Fog Container        ← Covers all above
    ├── Path Container       ← UI, not covered
    ├── Highlight Container  ← UI, not covered
    └── Name Container       ← UI, not covered
```

### Z-Index:
Each `addChild()` call increments the z-index automatically. Children added later appear on top.

### Fog Rendering:
The `FogOfWarOverlay` uses a semi-transparent black overlay that:
- Fully covers unexplored areas (alpha ~0.9)
- Partially dims explored but not visible areas (alpha ~0.5)
- Doesn't cover visible areas (alpha 0.0)

## Testing

### Test 1: Unexplored Areas
```
1. Start new game
2. Check distant areas with traders
3. Verify: Traders hidden by fog
4. Zoom out to see full map
5. Verify: No traders visible in fog
```

### Test 2: Exploring Reveals Traders
```
1. Move toward trader location
2. Watch as fog clears
3. Verify: Trader appears when area explored
4. Move away (fog returns)
5. Verify: Trader visible in explored but not visible area (dimmed)
```

### Test 3: Settlement Names Still Visible
```
1. Check distant settlements in fog
2. Verify: Names still show (blurred)
3. Check traders near those settlements
4. Verify: Traders hidden, names visible
```

## Other Elements Correctly Hidden by Fog

The following elements are also correctly below fog:
- ✅ Terrain (grass, water, mountains)
- ✅ Roads (connections between settlements)
- ✅ Buildings (houses, mines, smithies)
- ✅ Vegetation (trees, bushes)
- ✅ Resources (ore, wood, fish)
- ✅ Player character
- ✅ Traders (now fixed!)

## Elements Correctly Above Fog

The following UI elements appear above fog:
- ✅ Movement path (blue line showing your planned route)
- ✅ Tile highlights (yellow/red selection indicators)
- ✅ Settlement names (blurred when unexplored)

## Build Status

```bash
✅ TypeScript: Success (0 errors)
✅ Build Size: 480.93 KB (gzipped: 140.20 KB)
✅ Layer Order: Corrected
✅ All Systems: Operational
```

## Related Systems

This fix ensures consistency with:
- **Fog of War** - Traders now respect visibility rules
- **Exploration** - Discovery is rewarding (traders appear)
- **Settlement Names** - Intentional exception (always visible)

## Future Considerations

### Potential Enhancements:

1. **Trader Rumors:**
   ```typescript
   // Show trader trails in fog (you've heard they passed through)
   if (!centerTile.visible && centerTile.explored) {
     drawTraderTrail(trader.recentPath);
   }
   ```

2. **Trade Notifications:**
   ```typescript
   // Notify when trader discovered
   if (trader.justDiscovered) {
     hud.showMessage(`Trader discovered: ${trader.name}`);
   }
   ```

3. **Scout Ability:**
   ```typescript
   // Special ability to reveal traders in expanded radius
   if (player.hasScoutAbility) {
     traderRenderer.setVisibilityRadius(visionRadius + 3);
   }
   ```

## Conclusion

Traders are now correctly hidden by fog of war, creating a proper exploration experience:
- ✅ **Immersive:** Can't see NPCs in unexplored areas
- ✅ **Fair:** No information advantage from fog-piercing bugs
- ✅ **Rewarding:** Discovering traders feels like a real discovery
- ✅ **Consistent:** Follows same rules as player character

**The fog of war now works correctly for all game elements!** 🌫️✅
