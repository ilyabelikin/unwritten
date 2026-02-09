# Art Style Guide - Flat Cute Pixel Art

## Core Philosophy

**We use FLAT, TOP-DOWN pixel art style** - NOT realistic 3D isometric art. Think of it as cute, simple shapes viewed from above, like classic 2D pixel games.

## ✅ DO: Flat Pixel Art Style

### Characteristics
- **Simple flat rectangles** for buildings
- **Top-down view** (looking straight down at the building)
- **Minimal depth** - buildings are flat with simple shadows underneath
- **Cute and readable** - clear shapes, bright colors
- **Flat roof overhang** - just a rectangle on top of the building
- **Simple decorations** - windows, doors, flags are just colored rectangles/circles

### Example: House (CORRECT STYLE)
```
Roof (flat rectangle on top)
+--------+
|        |  <- Main building (flat rectangle)
| [] [] |  <- Windows (small squares)
|   ||   |  <- Door (rectangle)
+--------+
  (shadow below)
```

### Good Examples in Codebase
- **House** (`drawHouse`) - Perfect flat top-down style
- **Field** (`drawField`) - Simple rows of crops, flat view
- **Lumber Camp** (`drawLumberCamp`) - Flat log piles
- **Chapel** (`drawChapel`) - Flat building with simple roof overhang

## ❌ DON'T: Realistic 3D Isometric

### What to Avoid
- **Multiple wall faces** (left wall, right wall, front wall)
- **3D depth effects** with separate polygons for each side
- **Complex shading** to simulate 3D depth
- **Isometric perspective** with angled walls
- **Realistic proportions** and details

### Example: What NOT to do
```
        /\  <- Peaked 3D roof
       /  \
      +----+
     /|    |  <- Left wall (3D face)
    / |    |\ 
   /  |    | \ <- Right wall (3D face)
  +---+----+--+
```

This creates visual inconsistency and looks out of place!

## Building Rendering Template

Use this template for all new buildings:

```typescript
private drawYourBuilding(gfx: Graphics, cx: number, cy: number): void {
  const config = BUILDING_CONFIG[BuildingType.YourBuilding];
  const w = 12;  // Width
  const h = 10;  // Height

  // 1. Shadow (flat ellipse underneath)
  gfx.ellipse(cx, cy + 1, w * 0.9, 3);
  gfx.fill({ color: 0x000000, alpha: 0.2 });

  // 2. Main building body (simple flat rectangle)
  gfx.rect(cx - w / 2, cy - h / 2, w, h);
  gfx.fill({ color: config.baseColor });
  
  // 3. Outline for definition
  gfx.rect(cx - w / 2, cy - h / 2, w, h);
  gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

  // 4. Flat roof (simple rectangle on top)
  gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
  gfx.fill({ color: config.roofColor });
  gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
  gfx.stroke({ color: darkenColor(config.roofColor, 0.7), width: 1 });

  // 5. Windows (small rectangles/squares)
  gfx.rect(cx - 3, cy - 1, 2, 2);
  gfx.fill({ color: 0x000000, alpha: 0.6 });

  // 6. Door (centered rectangle at bottom)
  gfx.rect(cx - 2, cy + h / 2 - 3, 4, 3);
  gfx.fill({ color: config.accentColor });

  // 7. Optional: Cute decorative elements (chimneys, flags, etc.)
  // Keep them simple and flat!
}
```

## Color Guidelines

### Use Bright, Friendly Colors
- **Avoid**: Dark, muddy, realistic colors
- **Prefer**: Saturated, cheerful colors that pop

### Keep Shading Minimal
- Use `darkenColor()` with factor 0.6-0.7 for outlines
- Don't create complex gradient effects
- One or two shades maximum per element

## Size Guidelines

### Building Sizes
- **Small buildings**: 8-12 pixels wide, 8-10 pixels tall
- **Medium buildings**: 12-16 pixels wide, 10-14 pixels tall
- **Large buildings**: 16-20 pixels wide, 12-16 pixels tall

### Details
- **Windows**: 2x2 or 3x3 pixels
- **Doors**: 3x3 or 4x4 pixels
- **Outlines**: 0.5 to 1 pixel width
- **Shadows**: Small ellipse, 2-4 pixels tall

## Special Cases

### Landmarks (Windmills, Monasteries, Towers)
These can be **slightly taller** to stand out, but still maintain the flat pixel art style:
- Use vertical rectangles to show height
- Keep decorations simple (crosses, flags, battlements as small rectangles)
- No complex 3D geometry

### Examples
- **Windmill**: Tall flat tower with flat blade spokes radiating from center
- **Monastery**: Tall flat rectangle with small bell tower on top
- **Watchtower**: Narrow tall rectangle with small battlements (rectangles) on top

## Testing Your Building

Ask yourself:
1. ✅ Does it look like a top-down view?
2. ✅ Is it made of simple flat shapes?
3. ✅ Would it fit in a classic 2D pixel game?
4. ✅ Is it cute and readable?
5. ❌ Does it try to show 3D depth with multiple wall faces?
6. ❌ Does it use complex perspective?

If you answered yes to 1-4 and no to 5-6, you're good!

## Common Mistakes to Fix

### Before (3D/Isometric Style - WRONG)
```typescript
// Drawing separate left and right walls
gfx.rect(cx - w, cy - h, w, h);  // Left wall
gfx.fill({ color: config.baseColor });
gfx.rect(cx, cy - h / 2, w, h);  // Right wall (darker)
gfx.fill({ color: darkenColor(config.baseColor, 0.75) });

// 3D peaked roof polygon
gfx.poly([
  { x: cx - w, y: cy - h },
  { x: cx, y: cy - h - 4 },
  { x: cx + w, y: cy - h / 2 - 4 },
  { x: cx, y: cy - h / 2 },
]);
```

### After (Flat Style - CORRECT)
```typescript
// Single flat rectangle for building
gfx.rect(cx - w / 2, cy - h / 2, w, h);
gfx.fill({ color: config.baseColor });
gfx.rect(cx - w / 2, cy - h / 2, w, h);
gfx.stroke({ color: darkenColor(config.baseColor, 0.6), width: 1 });

// Simple flat roof overhang
gfx.rect(cx - w / 2 - 1, cy - h / 2 - 3, w + 2, 4);
gfx.fill({ color: config.roofColor });
```

## Remember

**"Flat, cute, and pixel-perfect beats realistic 3D every time!"**

When in doubt, look at the `drawHouse()` or `drawField()` methods as reference examples of the correct flat style.
