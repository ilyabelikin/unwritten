# Resource-Aware Settlement System

## Overview

The settlement generation system has been completely overhauled to create plausible, economically-driven settlements that emerge based on nearby natural resources. Settlements now actively exploit resources with appropriate extraction buildings, creating a believable medieval economy where villages form around valuable resources.

## Core Philosophy

**"Settlements follow resources"** - Rather than randomly placing settlements and hoping resources are nearby, the system actively seeks out resource-rich locations and creates settlements specialized to exploit them.

### Historical Inspiration

This mirrors real medieval settlement patterns:
- Mining towns emerged around ore deposits
- Fishing villages formed on productive coastlines
- Lumber camps appeared near old-growth forests
- Salt works developed at coastal evaporation sites
- Trading posts arose where multiple resources converged

## World Generation Order

**CRITICAL**: Resources MUST be generated BEFORE settlements to enable resource-aware placement.

```
Pass 1: Terrain generation
Pass 2: Shore generation  
Pass 3: Vegetation
Pass 4: Rough terrain
Pass 5: Resources          ← Generated FIRST
Pass 6: Settlements        ← Then placed near resources
Pass 7: Roads              ← Connect settlements
Pass 8: Roadside hamlets   ← Exploit remaining resources near roads
```

**Why This Order Matters**:
- If settlements are placed before resources, the resource-aware system finds ZERO resources → rejects all cities/villages
- Resources are natural features (like terrain/vegetation) that settlements should respond to
- Roads connect existing settlements
- Roadside hamlets exploit leftover resources that happen to be accessible

## System Architecture

### 1. Resource Analysis (`ResourceAwareSettlementPlacer`)

When searching for settlement locations, the system:

1. **Scans surrounding area** (3-5 tile radius) for resources
2. **Counts resource types** and identifies the dominant resource
3. **Evaluates resource quality** (0.3-1.0, Poor to Excellent)
4. **Calculates a score** based on:
   - Resource quantity (more = better)
   - Resource proximity (closer = better)
   - **Resource quality** (Excellent 0.8-1.0 = 1.3x multiplier, Good 0.6-0.8 = 1.0x, Fair 0.4-0.6 = 0.85x, Poor 0.3-0.4 = 0.7x)
   - Resource value (precious metals > common materials)
   - Resource diversity (cities prefer variety, hamlets prefer focus)

```typescript
interface ResourceAnalysis {
  totalResources: number;              // How many deposits nearby
  resourceCounts: Map<ResourceType, number>;  // Count per resource type
  dominantResource: ResourceType | null;      // Most common resource
  score: number;                              // Overall quality score
  resourceTiles: Array<...>;                  // Specific locations
}
```

### 2. Location Scoring

Different settlement types prefer different resource patterns:

#### Cities
- **Prefer**: Multiple different resource types (economic diversity)
- **Bonus**: +2 points per unique resource type
- **Radius**: 5 tiles
- **Strategy**: Generalist economy with many industries
- **Exploitation**: 70% of nearby resources (shows why city exists)
- **Quality**: Prioritizes best quality resources first

#### Villages
- **Prefer**: Concentrated resources (specialization)
- **Bonus**: +1.5 per dominant resource deposit
- **Radius**: 4 tiles
- **Strategy**: Specialist economy focused on primary export

#### Hamlets
- **Prefer**: Single focused resource (extraction outpost)
- **Bonus**: High weight on dominant resource
- **Radius**: 3 tiles
- **Strategy**: Pure extraction, minimal supporting infrastructure

### 3. Resource-Based Specialization

Specialization is now determined primarily by resources, not terrain:

```
Resource Found → Settlement Type

Fish               → Fishing Village
Iron/Copper/Silver → Mining Village (with specific mine type)
Stone              → Mining Village (quarry focus)
Timber/Wild Game   → Lumber Village (forestry/hunting)
Salt               → Trading Village (valuable commodity)
Gold/Gems          → Mining Village (precious materials)
```

**Fallback**: If no dominant resource, uses terrain-based specialization (original system).

### 4. Coastal Settlement Formation

**Special logic for fishing villages and coastal settlements:**

Fish resources spawn in water (1-2 tiles offshore), so coastal settlements require special handling:

#### Shore Terrain Allowed
- Settlement centers can be placed on **Shore** tiles (not just Plains/Hills)
- This enables settlements to form directly on the coast
- Puts them within range (3-4 tiles) of nearby fish resources

#### Coastal Location Bonus
```typescript
if (hex.terrain === Shore) {
  score += 1.5; // Coastal location bonus
}
```
Encourages settlements to form on coasts even if fish aren't the highest quality resource.

#### Fish Resource Value
- Fish have value **2.0** (same as salt, stone, timber)
- Higher than other food sources (livestock 1.5, wild game 1.5)
- Reflects importance of fishing in medieval coastal economies

#### Shallow Water Priority
- Shallow water has **4x weight** for fish spawning (vs 1x for deep water)
- Shallow water is closer to shore → more accessible
- Creates prime fishing grounds near potential settlement sites

#### Fishing Hut Placement
- Fish are IN water (can't build on them)
- Fishing Huts placed **adjacent** to fish (on shore or plains)
- System automatically finds suitable adjacent tiles
- Up to 2 tiles away if needed

**Result**: Vibrant fishing villages form on coasts with multiple fishing huts exploiting nearby waters.

### 5. Extraction Building Placement

After determining specialization, the system:

1. **Groups resources by type** (e.g., all Iron deposits together)
2. **Determines building count**: 
   - 4+ deposits → place 2 extraction buildings
   - 2-3 deposits → place 1 extraction building
   - 1 deposit → place 1 if hamlet, maybe skip if village
3. **Finds optimal locations**:
   - **DIRECTLY ON the resource tile** (mine AT the ore, not next to it!)
   - Fallback: Adjacent if resource tile unsuitable (e.g., fish in water → hut on shore)
   - On suitable terrain for that building type
   - Not conflicting with other buildings
4. **Places specific buildings**:
   - Iron deposit → Iron Mine **ON** the iron tile
   - Fish deposit → Fishing Hut **ADJACENT** (fish in water, hut on shore)
   - Clay deposit → Clay Pit **ON** the clay tile
   - etc.
5. **Hides resource icon**:
   - Once building is placed, resource icon no longer renders
   - Building itself shows the resource is being exploited
   - Resource data remains for game mechanics

### 6. Roadside Resource Exploitation (Pass 8 - After roads in Pass 7)

After roads are generated, a final pass places **roadside hamlets** to exploit high-quality resources near trade routes:

**Selection Criteria**:
- Resource must be **unexploited** (no building on it)
- Must be within **2 tiles of a road**
- Quality must be **Good or better** (≥0.6) OR be a precious resource (Gold/Silver/Gems)
- Must be at least **3 tiles from existing settlements**

**Prioritization**:
1. Sort by quality (Excellent first)
2. Tie-breaker: resource value
3. Place up to 30% of candidates (max 10)

**Result**: Excellent Salt deposits near roads get Salt Works, high-quality Iron near roads gets Iron Mines, etc.

## Settlement Types and Behaviors

### Resource-Focused Hamlets

**Size**: 1-2 buildings  
**Purpose**: Pure resource extraction outpost

**Building Composition** (when good resource nearby):
- 60%: Just extraction building (e.g., lone iron mine)
- 40%: House + extraction building

**Examples**:
- Silver Mine hamlet (1 building: Silver Mine)
- Fishing Hut hamlet (1 building: Fishing Hut near water)
- Clay Pit hamlet (2 buildings: House + Clay Pit)
- **Excellent Salt Works** (1 building: Salt Works on Excellent quality salt)

### Roadside Hamlets (Pass 8 - After roads in Pass 7)

**Size**: 1-2 buildings  
**Purpose**: Exploit high-quality resources along trade routes

**Selection**:
- Only Good+ quality (≥0.6) or precious resources
- Within 2 tiles of a road
- 30% chance of adding worker's house

**Examples**:
- **Roadside Iron Mine** (Excellent iron near main trade road)
- **Roadside Salt Works** (Excellent salt near coastal road)
- **Roadside Gold Mine** (Any quality gold near road)

### Specialized Villages

**Size**: 4-7 buildings  
**Purpose**: Focused resource exploitation with support infrastructure

**Building Composition**:
- 1 extraction building per 2-3 resource deposits
- 50% houses (workers)
- 30% primary industry buildings
- 20% secondary industry buildings

**Examples**:
- **Iron Mining Village**: 2 Iron Mines, 3 Houses, 1 Warehouse
- **Fishing Village**: 2 Fishing Huts, 1 Dock, 3 Houses
- **Lumber Village**: 1 Lumber Camp, 1 Sawmill, 4 Houses

### Diverse Cities

**Size**: 8-15 buildings  
**Purpose**: Multi-industry economic hub

**Resource Exploitation Strategy**:
- Cities **exploit 70% of nearby resources** (more than villages)
- Prioritizes **highest quality** resources first
- Places multiple extraction buildings of different types
- Shows clear economic reason for city location

**Building Composition**:
- Multiple extraction buildings (up to 70% of nearby resources)
- Many city houses (large population)
- Central landmark (Church/Tower/Castle)
- Warehouses and trading posts (15-20% of non-extraction buildings)
- Varied industries based on available resources

**Examples**:
- **Coastal City**: 2 Fishing Huts (excellent quality fish), Salt Works (good salt), Trading Post, Warehouse, 8 houses, Church
- **Mountain City**: Iron Mine (excellent), Quarry (good), Copper Mine (good), Trading Post, Warehouse, 7 houses, Castle
- **Trading Hub**: Salt Works, Iron Mine, Copper Mine, 2 Trading Posts, Warehouse, 6 houses, Tower

## Resource Value Hierarchy

The system weights resources differently for settlement placement:

### Tier 1: Precious Materials (3.0x weight)
- Gold, Silver, Gems
- **Justification**: Extremely valuable, worth establishing settlements

### Tier 2: Industrial Metals (2.5x weight)
- Iron, Copper
- **Justification**: Essential for tools, weapons, economic development

### Tier 3: Building Materials (2.0x weight)
- Stone, Timber, Salt
- **Justification**: Constant demand, bulk trade goods

### Tier 4: Food Sources (1.5x weight)
- Fish, Wild Game, Livestock
- **Justification**: Necessary but renewable, less strategic

### Tier 5: Basic Materials (1.2x weight)
- Clay
- **Justification**: Useful but not rare enough to drive settlement

## Placement Algorithm

### Step 1: Site Selection (Passes 5-6)
```
For each settlement attempt:
  1. Generate random coordinates
  2. Check terrain suitability
  3. Check distance from other settlements
  4. Scan for nearby resources (3-5 tile radius)
  5. Evaluate resource quality
  6. Calculate resource score (with quality multipliers)
  7. Track best location found (highest score)
  
After 100-150 attempts:
  Accept best location if score > 0
```

### Step 2: Specialization
```
If dominant resource found with 2+ deposits:
  Assign specialization based on resource type
Else:
  Fall back to terrain-based specialization
```

### Step 3: Building Placement (Pass 6 - After resources in Pass 5)
```
1. Place extraction buildings DIRECTLY ON resource tiles
   - Check if resource tile is suitable (terrain check)
   - If suitable: place building ON the resource tile
   - If unsuitable: place adjacent (e.g., fish in water → hut on shore)
   - Mark as part of settlement
   - Resource icon hidden (building shows exploitation)
   
2. Place support buildings (houses, warehouses, etc.)
   - Fill remaining settlement slots
   - Mix of housing and industry
   - Based on specialization
```

### Step 4: Roadside Hamlets (Pass 8)
```
After roads are generated:
1. Scan all unexploited resources (no building on them)
2. Filter: near road (≤2 tiles) AND quality ≥ 0.6 OR precious
3. Sort by quality (best first), then value
4. Place up to 30% of candidates (max 10)
   - Place extraction building DIRECTLY ON resource
   - 30% chance: add worker's house adjacent
   - Must be ≥3 tiles from other settlements
   - Resource icon hidden once exploited
```

## Examples of Generated Settlements

### Example 0: Resource-Rich City (NEW!)
```
Location: Hills with 5 Iron, 3 Copper, 2 Stone, 1 Silver nearby
Buildings:
  - Castle (landmark, center)
  - Iron Mine (ON iron deposit - excellent 0.82)
  - Iron Mine (ON iron deposit - good 0.68)
  - Iron Mine (ON iron deposit - good 0.65)
  - Copper Mine (ON copper deposit - good 0.71)
  - Copper Mine (ON copper deposit - fair 0.58)
  - Quarry (ON stone deposit - good 0.69)
  - Silver Mine (ON silver deposit - excellent 0.88)
  - Trading Post
  - Warehouse
  - 5 City Houses
Resources: 70% exploited (7/10), best quality first
Score: 28.5 (very high - diverse high-quality minerals)
Note: City clearly exists because of rich mineral deposits!
```

## Examples of Generated Settlements

### Example 1: Iron Mining Hamlet
```
Location: Mountain region with 2 Iron deposits
Buildings: 
  - Iron Mine (DIRECTLY ON iron deposit)
  - House (adjacent)
Resources: 2 Iron (1 hidden under mine, 1 visible - unexploited)
Score: 5.0 (medium-high)
Note: Iron icon hidden where mine is, visible on unexploited deposit
```

### Example 2: Coastal Fishing Village
```
Location: Shore with 3 Fish, 1 Salt nearby
Buildings:
  - Fishing Hut (on shore, adjacent to fish in water)
  - Fishing Hut (on shore, adjacent to fish in water)
  - Salt Works (DIRECTLY ON salt deposit on shore)
  - 3 Houses
  - 1 Warehouse
Resources: 3 Fish still visible (in water), 1 Salt hidden (has building)
Score: 8.5 (high - multiple valuable resources)
Specialization: Fishing
Note: Fish stay visible because they're in water, salt hidden under building
```

### Example 3: Mixed Mining Town
```
Location: Hills with 3 Copper, 2 Stone, 1 Silver nearby
Buildings:
  - Copper Mine (ON copper deposit #1)
  - Copper Mine (ON copper deposit #2)
  - Quarry (ON stone deposit)
  - Silver Mine (ON silver deposit - priority!)
  - Trading Post
  - 6 Houses
  - Warehouse
Resources: 3 Copper (1 visible, 2 hidden under mines), 
          2 Stone (1 visible, 1 hidden under quarry), 
          1 Silver (hidden under mine)
Score: 14.2 (very high - diverse minerals)
Specialization: Mining
Note: Only unexploited resources show icons
```

### Example 4: Remote Gold Mine
```
Location: Remote mountains with 1 Gold deposit
Buildings:
  - Gold Mine (DIRECTLY ON gold deposit)
Resources: 1 Gold (hidden - building on it)
Score: 3.0 (medium - single rare resource)
Note: Gold icon hidden, mine building shows it's being exploited
```

### Example 5: Roadside Salt Works (Pass 8)
```
Location: Shore with Excellent salt (0.85 quality) 1 tile from coastal road
Buildings:
  - Salt Works (DIRECTLY ON salt deposit)
  - House (worker's home, adjacent)
Resources: 1 Salt (hidden - building on it)
Score: N/A (placed in roadside pass)
Note: Salt icon removed once Salt Works placed - building shows exploitation
```

### Example 6: Roadside Iron Mine (Pass 8)
```
Location: Hills with Good iron (0.72 quality) near mountain pass road
Buildings:
  - Iron Mine (DIRECTLY ON iron deposit)
Resources: 1 Iron (hidden under mine)
Score: N/A (placed in roadside pass)
Note: Iron icon hidden, mine building shows active extraction
```

## Balancing Considerations

### Quality Matters

Resource quality significantly impacts placement:
- **Excellent (0.8-1.0)**: 1.3x score multiplier - highly attractive
- **Good (0.6-0.8)**: 1.0x multiplier - normal attractiveness
- **Fair (0.4-0.6)**: 0.85x multiplier - less attractive
- **Poor (0.3-0.4)**: 0.7x multiplier - may be skipped

**Result**: Excellent salt deposits are much more likely to get Salt Works than Poor quality salt.

### Not Every Resource Gets a Settlement

The system is designed to be selective:
- **Score threshold**: Settlements only place if score > 0
- **Quality threshold**: Roadside hamlets require Good+ quality (≥0.6)
- **Spacing rules**: Minimum distances prevent overcrowding
- **Attempt limits**: Only 100-150 tries per settlement
- **Roadside limit**: Max 30% of roadside candidates, capped at 10
- **Result**: Some resources remain unexploited (player expansion opportunities)

### Resource Distribution Impact

With sparse resources (current 50-75% reduction):
- Fewer settlements can find good resource clusters
- Increases competition for resource-rich areas
- Creates economic differentiation between settlements
- Leaves "frontier" areas with unexploited resources

### Settlement Density

**Cities**: Min 20 tiles apart  
**Villages**: Min 12 tiles apart  
**Hamlets**: Min 5 tiles apart  

This creates:
- Urban cores (cities)
- Rural periphery (villages)
- Remote outposts (hamlets)

## Technical Implementation

### Files Modified

1. **`ResourceAwareSettlementPlacer.ts`** (NEW)
   - Resource scanning and analysis
   - **Quality-aware scoring algorithm**
   - Location scoring algorithm
   - Extraction building placement logic

2. **`SettlementGenerator.ts`** (UPDATED)
   - Uses resource-aware placer
   - Resource-based specialization determination
   - Automatic extraction building placement
   - Updated building selection logic

3. **`RoadsideResourcePlacer.ts`** (NEW - Pass 8)
   - Scans for unexploited resources near roads
   - **Prioritizes high-quality resources**
   - Places roadside hamlets with extraction buildings
   - 30% worker house addition

4. **`ResourceExtraction.ts`** (NEW)
   - Resource-to-building mappings
   - Helper functions for extraction mechanics

5. **`WorldGenerator.ts`** (UPDATED)
   - Added Pass 8: Roadside resource hamlets

### Key Methods

```typescript
// Find location biased toward resources (with quality consideration)
findResourceAwareLocation(grid, type, settlements, config, seededRandom, preferredResources?)

// Analyze resources near a location (includes quality metrics)
analyzeNearbyResources(grid, center, range, preferredResources?)
// Returns: { totalResources, resourceCounts, dominantResource, score, 
//            resourceTiles (with quality), averageQuality, bestQuality }

// Determine specialization from resources
determineVillageSpecializationFromResources(grid, centerTile, resourceAnalysis, settlementId)

// Place extraction buildings on resource tiles
placeExtractionBuildings(grid, centerTile, resourceAnalysis, settlementId, specialization)

// Find best tile for extraction building (prefers resource tile itself)
findExtractionBuildingLocation(grid, resourceTile, settlementId)
// Returns the resource tile if suitable, otherwise adjacent tile

// PASS 8: Place roadside hamlets on high-quality resources
placeRoadsideHamlets(grid, settlements, seededRandom)
// Scans for: unexploited + near road + high quality → places hamlet
```

## Gameplay Implications

### For World Generation
- **More believable**: Settlements make economic sense
- **More strategic**: Resource control becomes important
- **More varied**: Each settlement has unique economic profile
- **More sparse**: Not all resources are immediately exploited

### For Future Gameplay
- **Expansion opportunities**: Unclaimed resources to settle
- **Economic specialization**: Trade between specialized settlements
- **Strategic value**: Control of mines, forests, fishing grounds
- **Resource wars**: Conflict over valuable deposits

### For AI/Player Strategy
- **Settlement placement**: Consider nearby resources
- **Economic planning**: Build extraction buildings on resources
- **Trade routes**: Connect resource producers to consumers
- **Military targets**: Capture resource-producing settlements

## Performance Considerations

### Computational Cost
- **Resource scanning**: O(n) where n = tiles in search radius (~50-100 tiles)
- **Settlement attempts**: 100-150 per settlement type
- **Total overhead**: ~10-20% increase in world generation time
- **Worth it**: Much more intelligent placement

### Optimization Strategies
1. **Limit search radius**: 3-5 tiles (not entire map)
2. **Early termination**: Accept "good enough" locations
3. **Caching**: Resource analysis reusable within same area
4. **Fallback**: Accepts suboptimal locations if necessary

## Future Enhancements

### Potential Additions

1. **Compound Resources**
   - Settlements require multiple resources (e.g., iron + timber for shipbuilding)
   - Bonus for complementary resource combinations

2. **Resource Depletion**
   - Non-renewable resources exhaust over time
   - Settlements decline or shift focus
   - Ghost towns emerge

3. **Trade Networks**
   - Settlements automatically trade with neighbors
   - Roads connect resource producers to consumers
   - Economic interdependence

4. **Dynamic Specialization**
   - Settlements can change focus based on:
     - Resource discovery
     - Resource depletion
     - Trade opportunities
     - Player actions

5. **Resource Conflicts**
   - Multiple settlements compete for same resources
   - Border disputes over extraction rights
   - Defensive structures around valuable resources

6. **Economic Simulation**
   - Resource extraction rates
   - Supply and demand pricing
   - Market dynamics between settlements

## Testing & Verification

### How to Test

1. **Console Output**: Check generation logs for:
   - "Generated N cities/villages/hamlets"
   - Settlement specializations
   - Resource distribution

2. **Visual Inspection**: Look for:
   - Extraction buildings near visible resources
   - Appropriate building types (Iron Mine near iron icon)
   - Hamlets in remote areas near single resources
   - Villages in resource-rich areas

3. **Edge Cases**:
   - World with no resources → Generic settlements
   - World with only one resource type → All settlements specialize
   - Very sparse resources → Fewer settlements

### Expected Results

**With Current Resource Distribution** (3-8% spawn rates):
- ~30-40% of settlements are resource-focused
- ~60-70% fall back to terrain-based or generic
- Hamlets: 50-60% have extraction buildings
- Villages: 70-80% have at least one extraction building
- Cities: 80-90% have multiple extraction buildings
- **Roadside hamlets**: 3-10 additional hamlets placed on high-quality resources near roads
- **Quality impact**: Excellent resources (0.8+) are 30% more likely to be settled than Fair resources (0.4-0.6)

## Summary

The resource-aware settlement system transforms world generation from random placement to economically-driven settlement emergence. Settlements now:

✅ **Form where resources exist** - Biased toward resource-rich locations  
✅ **Consider resource quality** - Excellent deposits are 30% more attractive  
✅ **Exploit resources directly** - Buildings placed ON resources, not adjacent  
✅ **Hide exploited resources** - Icons removed when building placed (shows exploitation)  
✅ **Prioritize quality** - Best quality resources exploited first  
✅ **Cities exploit more** - 70% of nearby resources for economic hubs  
✅ **Specialize appropriately** - Mining towns near mines, fishing villages near water  
✅ **Follow trade routes** - Roadside hamlets exploit resources along roads  
✅ **Make economic sense** - Plausible medieval settlement patterns  
✅ **Create strategic depth** - Resource control matters  
✅ **Leave room for expansion** - Not all resources exploited  

**Key Design Principles**:
1. **Mine AT ore** - Not next to it! Buildings placed directly on resources
2. **Quality matters** - Excellent salt gets Salt Works before poor salt
3. **Icons hidden** - Resource icons disappear when exploited (clear feedback)
4. **Cities show their purpose** - Multiple mines/extraction buildings show why city exists

**Special Feature**: Excellent Salt deposits (near roads or cities) get Salt Works directly on the salt!

This creates a living, believable world where the economic geography drives settlement patterns, just like in real history.
