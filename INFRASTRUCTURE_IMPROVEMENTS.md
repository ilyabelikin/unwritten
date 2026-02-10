# Infrastructure Improvements: Roads & Docks

## Overview

Two major infrastructure improvements have been added to make settlements feel more connected and realistic:

1. **All Hamlets Connected to Roads** - Any hamlet within 3 tiles of a road gets a connecting path (both regular and roadside hamlets)
2. **Coastal Settlements with Docks/Piers** - All settlements near water (cities, villages, hamlets) now include dock structures for maritime trade

### Key Feature: Universal Hamlet Connectivity

**Previous Issue**: Only roadside resource hamlets (Pass 8) got road connections. Regular hamlets (Pass 5) placed near roads had no connection.

**Solution**: Added **Pass 9** - a post-processing pass that connects ANY hamlet within 3 tiles of a road, regardless of when or why it was placed.

## 1. Hamlet Road Connections

### The Problem (Before)
```
❌ Hamlets placed near roads (within 2-3 tiles)
❌ No visual connection to the road
❌ Unclear how people travel to/from hamlet
❌ Hamlet feels isolated despite proximity
❌ Only roadside resource hamlets got connections
```

### The Solution
```
✅ ALL hamlets near roads get connections (not just roadside ones)
✅ BFS pathfinding finds nearest road tile (max 3 tiles)
✅ Road extended to connect hamlet
✅ Clear visual travel route
✅ Post-processing pass connects any hamlet within range
```

### How It Works

**Pass 8: Roadside Resource Hamlets** (`RoadsideResourcePlacer.ts`):
```typescript
// After placing roadside hamlet buildings...
this.connectToRoad(grid, buildingTile);
```

**Pass 9: Connect All Hamlets** (`WorldGenerator.ts`):
```typescript
// After all generation is done, connect ANY hamlet near roads
this.connectHamletsToRoads(grid, settlements);
```

**Connection Logic**:
1. **Find Hamlets** - Identify all hamlets (regular + roadside)
2. **BFS Search** - Find shortest path to nearest road (max 3 tiles)
3. **Mark Path** - Set `hasRoad = true` on intermediate tiles
4. **Avoid Buildings** - Don't place roads on existing buildings
5. **Log Results** - Reports how many hamlets were connected

### Example
```
Before:
  Road ═══════════
             
       Hamlet (isolated)
         🏠

After:
  Road ═══════════
             ║
             ║  (new road connection)
             ║
       Hamlet 🏠
```

### Benefits
✅ **Visual clarity** - Can see how ALL hamlets connect to trade routes  
✅ **Logical placement** - Explains why hamlets are near roads  
✅ **Realistic** - Medieval settlements connected to roads for trade  
✅ **Gameplay potential** - Road connections could affect trade/movement  
✅ **Comprehensive** - Both roadside and regular hamlets get connections

## 2. Coastal Settlements with Docks

### The Problem (Before)
```
❌ Settlements placed on coasts
❌ No maritime infrastructure
❌ Missing economic reason for coastal location
❌ No visual connection to water
```

### The Solution
```
✅ All coastal settlements detected automatically (cities, villages, hamlets)
✅ Dock/pier placed on shore tile
✅ Adjacent to water for loading/unloading
✅ Adds maritime trade infrastructure
✅ Even small fishing hamlets get docks
```

### How It Works

**Detection** (All settlement types):
```typescript
// Cities (SettlementGenerator.ts)
const dockTile = this.tryPlaceCoastalDock(grid, centerTile, settlementId);

// Villages (SettlementGenerator.ts)
const dockTile = this.tryPlaceCoastalDock(grid, centerTile, settlementId);

// Hamlets (SettlementGenerator.ts)
const dockTile = this.tryPlaceCoastalDock(grid, centerTile, settlementId);

// Roadside Hamlets (RoadsideResourcePlacer.ts)
const dockTile = this.tryPlaceCoastalDock(grid, buildingTile, settlementId);
```

**Placement Logic**:
1. **Check Water Proximity** - Search within 2 tiles of city center
2. **Find Shore Tiles** - Must be Shore terrain (perfect for docks)
3. **Verify Water Adjacent** - Shore must touch water (DeepWater/ShallowWater)
4. **Place Dock** - First suitable location gets the dock

### Dock Visual Design

**Structure** (top-down view):
- **Pier** - Long wooden walkway extending toward water (14x4 pixels)
- **Platform** - Wider square area at end for cargo (8x8 pixels)
- **Planks** - Horizontal lines showing wooden construction
- **Pilings** - 4 support posts in water
- **Cargo** - Barrel and crate on platform
- **Mooring** - Cleat for tying boats

**Colors:**
- Wood: Brown (`baseColor`)
- Accents: Lighter wood (`accentColor`)
- Cargo: Dark brown barrel, light crate

### Examples

**City:**
```
  🏛️ (landmark - Castle)
  🏠 🏠 🏠  (houses)
  🏭 🏬      (warehouses)
  
  ⚓ DOCK    (shore tile)
  ≈≈≈≈≈≈     (water)
```

**Fishing Village:**
```
  🐟 🐟 (fishing huts)
  🏠 🏠 🏠
  
  ⚓ DOCK
  🛥️ ≈≈≈≈ (boats in water)
```

**Coastal Hamlet:**
```
  🏠 (house)
  ⚓ DOCK
  ≈≈≈ (water)
```

### Benefits
✅ **Maritime identity** - All coastal settlements clearly connected to sea  
✅ **Economic diversity** - Shows trade/fishing infrastructure at all scales  
✅ **Visual appeal** - Docks add character to coastal settlements  
✅ **Historical accuracy** - Even small medieval coastal villages had docks  
✅ **Gameplay potential** - Docks could enable sea trade/travel  
✅ **Settlement variety** - Coastal vs inland settlements are visually distinct

## Technical Implementation

### Files Modified

#### 1. RoadsideResourcePlacer.ts (Pass 8)
```typescript
// Added after roadside hamlet placement
this.connectToRoad(grid, buildingTile);

// Method for immediate connection
private connectToRoad(grid: Grid<HexTile>, hamletTile: HexTile): void {
  // BFS to find path to nearest road
  // Mark tiles along path as roads
}
```

#### 1b. WorldGenerator.ts (Pass 9)
```typescript
// NEW: Post-processing pass after all generation
console.log('[WorldGenerator] Pass 9: Connect hamlets to nearby roads');
this.connectHamletsToRoads(this.grid, this.settlements);

// Method to connect ALL hamlets (regular + roadside)
private connectHamletsToRoads(
  grid: Grid<HexTile>,
  settlements: Settlement[]
): void {
  // Filter for hamlets only
  const hamlets = settlements.filter(s => s.type === 'hamlet');
  
  // For each hamlet, find path to nearest road
  // Mark intermediate tiles as roads
  // Log number of connections created
}
```

#### 2. SettlementGenerator.ts (All Settlement Types)
```typescript
// Added to cities, villages, and hamlets
const dockTile = this.tryPlaceCoastalDock(grid, centerTile, settlementId);

// Shared method for all settlement types
private tryPlaceCoastalDock(
  grid: Grid<HexTile>,
  centerTile: HexTile,
  settlementId: number
): { col: number; row: number } | null {
  // Find shore tiles within 2 tiles
  // Check water adjacency
  // Place Dock building
}
```

#### 2b. RoadsideResourcePlacer.ts (Roadside Hamlets)
```typescript
// Added for fishing hamlets
if (candidate.resource === ResourceType.Fish) {
  const dockTile = this.tryPlaceCoastalDock(grid, buildingTile, settlementId);
}

// Similar method for roadside hamlets
private tryPlaceCoastalDock(...) { ... }
```

#### 3. IndustrialRenderer.ts
```typescript
// New rendering method
drawDock(gfx: Graphics, cx: number, cy: number): void {
  // Draw pier (long walkway)
  // Draw platform (cargo area)
  // Draw pilings (support posts)
  // Draw cargo (barrel, crate)
  // Draw mooring cleat
}
```

#### 4. BuildingRenderer.ts
```typescript
case BuildingType.Dock:
  this.industrialRenderer.drawDock(gfx, cx, cy);
  break;
```

## Configuration

### Road Connection Parameters
```typescript
maxDistance: 3 tiles     // Won't connect if road is farther
pathSearch: BFS          // Finds shortest path
avoidBuildings: true     // Roads don't overwrite buildings
appliesTo: All hamlets   // Regular hamlets + roadside hamlets
timing: Pass 8 + Pass 9  // Immediate + post-processing
```

### Dock Placement Parameters
```typescript
searchRadius: 2 tiles     // How far from settlement center to search
terrainRequired: Shore    // Must be shore terrain
waterAdjacency: Required  // Shore must touch water
maxDocks: 1              // One dock per settlement
appliesTo: All           // Cities, villages, hamlets, roadside hamlets
```

## Examples

### Example 1: Mining Hamlet with Road Connection
```
Location: Mountain pass with iron ore
Resource: Iron (Excellent)

Before:
  Road ═══════════
    
        [Iron] ⛰️
           🏠

After:
  Road ═══════════
           ║
           ║ (new connection)
        [Mine] ⛰️
           🏠
```

### Example 2: Coastal City with Dock
```
Location: Bay with fish and salt
Resources: 3 Fish, 2 Salt

Buildings:
  🏛️ Castle (landmark)
  🏠 x8 City Houses
  🏬 Warehouse
  🏭 Trading Post
  🐟 x2 Fishing Huts
  🛥️ x2 Fishing Boats
  🧂 Salt Works
  ⚓ DOCK (new!)

Layout:
     🏛️
   🏠 🏠 🏠
  🏭 🏬 🏠 🏠
   🐟 🐟 🧂
   ⚓ DOCK
   🛥️ 🛥️ ≈≈≈
```

### Example 3: Fishing Hamlet with Full Infrastructure
```
Location: Small coastal lake near road
Resource: 1 Fish (Good)

Buildings:
  🐟 Fishing Hut (shore)
  🛥️ Fishing Boat (water)
  ⚓ Dock (shore) ← NEW!
  🏠 House

Infrastructure:
  Road connection to main road
  Dock for loading/unloading
  Fishing boat on fish
  Hut on shore

Result: Fully-equipped coastal fishing outpost
```

### Example 4: Coastal Village
```
Location: Bay near plains
Resources: 2 Fish, Salt

Buildings:
  🏠 x5 Houses
  🐟 x2 Fishing Huts
  🛥️ x2 Fishing Boats
  🧂 Salt Works
  ⚓ Dock ← NEW!

Result: Thriving coastal village with maritime trade
```

## Visual Indicators

### On Map

**Road Connections:**
- Thin brown paths from hamlet to main road
- Clear visual line showing connectivity
- Integrates with existing road system

**Docks:**
- Wooden pier structure on shore
- Extends toward water
- Platform with cargo visible
- Support pilings in water
- Brown/tan wood colors

## Balancing

### Road Connections
- **All hamlets** - Regular hamlets AND roadside hamlets get connections
- **Only within range** - Max 3 tiles, won't connect distant hamlets
- **Short paths** - Keeps it reasonable and realistic
- **Organic** - BFS finds natural path, not straight line
- **Two-stage** - Pass 8 (roadside) + Pass 9 (all others)

### Docks
- **Only coastal settlements** - Must be within 2 tiles of water
- **One per settlement** - Not cluttered with multiple docks
- **Prime location** - Shore tiles are limited, makes it special
- **All sizes** - Cities, villages, hamlets all get docks if coastal
- **Realistic scale** - Even small fishing hamlets had small docks

## Gameplay Implications

### Trade & Travel
- **Road connections** → Easier trade with hamlets
- **Docks** → Maritime trade routes possible
- **Infrastructure network** → Connected economy

### Strategic Value
- **Roadside hamlets** → Control over trade routes
- **Coastal cities** → Sea access for trade/military
- **Docks** → Port cities have advantage

### Visual Storytelling
- Roads show **how** people travel
- Docks show **why** cities are coastal
- Infrastructure creates **believable** world

## Future Enhancements

### Road Improvements
1. **Different road types** - Main roads vs footpaths
2. **Bridges** - Roads crossing water
3. **Road quality** - Better roads = faster travel
4. **Maintenance** - Roads degrade over time

### Dock Improvements
1. **Multiple docks** - Larger cities have bigger ports
2. **Boat traffic** - Ships visible at docks
3. **Warehouses** - Adjacent storage buildings
4. **Harbors** - Protected water areas with multiple docks

### Advanced Features
1. **River docks** - Docks on rivers, not just coasts
2. **Lighthouse** - Navigation aid for major ports
3. **Shipyard** - Boat construction building
4. **Ferry crossings** - Roads crossing water via ferry

## Summary

**Before**:
- ❌ Roadside hamlets isolated (no connection)
- ❌ Coastal settlements lacking maritime infrastructure
- ❌ Unclear why settlements are where they are

**After**:
- ✅ **Roadside hamlets** connected to main roads (clear travel routes)
- ✅ **All coastal settlements** have docks/piers (cities, villages, hamlets)
- ✅ **Visual clarity** - Can see how settlements connect to infrastructure
- ✅ **Logical placement** - Infrastructure explains settlement locations
- ✅ **Realistic world** - Medieval-style connected economy
- ✅ **Scale appropriate** - Even tiny fishing hamlets have small docks

These improvements make the world feel more connected and lived-in, with clear infrastructure showing how people travel and trade between settlements.
