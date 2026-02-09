# Resource Extraction Buildings

## Overview

This document describes all buildings designed to extract and process natural resources in the game. Each resource type has one or more specialized buildings for its exploitation.

## Building Categories

### Food Production Buildings

#### Hunting Lodge
- **Extracts**: Wild Game
- **Location**: Near dense forests
- **Size**: Small
- **Description**: A rustic lodge where hunters prepare for expeditions into the forest. Features deer antlers mounted above the door.
- **Visual**: Dark brown wooden structure with sloped green roof, decorated antlers
- **Purpose**: Provides meat through hunting

#### Fishing Hut
- **Extracts**: Fish
- **Location**: Adjacent to water (shores, shallow water)
- **Size**: Small
- **Description**: Small weathered hut where fishermen store their gear and prepare their catch
- **Visual**: Light wood construction with thatched roof, fishing rod and nets outside
- **Purpose**: Provides fish through fishing

#### Pasture
- **Extracts**: Livestock
- **Location**: Open plains or hills
- **Size**: Medium
- **Description**: Fenced grazing land with a small barn for shelter
- **Visual**: Green grass field with wooden fence, small barn in corner, sheep grazing
- **Purpose**: Provides meat, wool, and leather from livestock

### Material Processing Buildings

#### Lumber Camp
- **Extracts**: Timber (harvesting)
- **Location**: Near forests
- **Size**: Small
- **Description**: Work site with stacked logs and tools for felling trees
- **Visual**: Log pile with axe stuck in stump
- **Purpose**: Harvests raw timber from forests

#### Sawmill
- **Extracts**: Timber (processing)
- **Location**: Near forests or lumber camps, requires water
- **Size**: Medium
- **Description**: Water-powered mill for processing logs into lumber
- **Visual**: Building with water wheel, log pile outside
- **Purpose**: Processes timber into refined lumber

#### Clay Pit
- **Extracts**: Clay
- **Location**: On plains with clay deposits
- **Size**: Small
- **Description**: Excavated pit where workers extract clay
- **Visual**: Brown depression with exposed clay, shed and shovel, cart with clay
- **Purpose**: Provides clay for pottery and bricks

#### Quarry
- **Extracts**: Stone
- **Location**: Mountains or rocky hills
- **Size**: Medium
- **Description**: Open-pit quarry where stone is cut and extracted
- **Visual**: Pile of irregular stone blocks, pickaxe leaning against rocks
- **Purpose**: Provides building stone

#### Salt Works
- **Extracts**: Salt
- **Location**: Coastal shores
- **Size**: Medium
- **Description**: Evaporation pans where seawater is dried to harvest salt
- **Visual**: Rectangular salt pans with white salt crystals, work shed
- **Purpose**: Provides salt for preservation and trade

### Mineral Extraction Buildings

#### Copper Mine
- **Extracts**: Copper ore
- **Location**: Hills (primarily)
- **Size**: Medium
- **Description**: Mine entrance with stone pillars and support beams
- **Visual**: Stone entrance, dark shaft, cart with copper-colored ore
- **Purpose**: Extracts copper for early metalworking

#### Iron Mine
- **Extracts**: Iron ore
- **Location**: Mountains and hills
- **Size**: Medium
- **Description**: Fortified mine entrance for extracting iron ore
- **Visual**: Gray stone entrance, cart with gray ore, lantern
- **Purpose**: Extracts iron for tools and weapons

#### Silver Mine
- **Extracts**: Silver ore
- **Location**: Mountains (especially high elevation)
- **Size**: Medium
- **Description**: Precious metal mine with reinforced entrance
- **Visual**: Silver-gray stone entrance, cart with silver ore
- **Purpose**: Extracts silver for currency and trade

#### Gold Mine
- **Extracts**: Gold ore
- **Location**: Mountains and hills (rare)
- **Size**: Medium
- **Description**: Heavily guarded mine for extracting gold
- **Visual**: Golden-colored entrance, cart with golden ore
- **Purpose**: Extracts gold for currency and luxury goods

#### Gem Mine
- **Extracts**: Gems
- **Location**: High mountains (very rare)
- **Size**: Medium
- **Description**: Specialized mine for extracting precious gemstones
- **Visual**: Purple-tinted stone entrance, cart with colorful gems
- **Purpose**: Extracts gemstones for jewelry and trade

## Building Design Philosophy

### Visual Consistency
All resource buildings follow these design principles:
1. **Recognizable**: Building type is immediately clear from visual
2. **Resource-appropriate**: Colors and elements match the resource
3. **Contextual**: Fits the terrain where the resource is found
4. **Scaled**: Size reflects building complexity and importance

### Color Coding
Buildings use colors that hint at their purpose:
- **Food buildings**: Natural browns and greens
- **Material buildings**: Earth tones and construction colors
- **Mineral buildings**: Stone grays and metal tones
- **Precious buildings**: Distinctive colors (gold, silver, purple)

### Mine Variants
All mine types share a common structure:
- Stone entrance pillars
- Dark shaft entrance
- Support beams
- Mine cart with ore
- Pickaxe tool
- Lantern for light
- **Distinctive feature**: Ore color in cart matches resource

## Resource-Building Mapping

### Quick Reference Table

| Resource | Primary Building | Alternative |
|----------|-----------------|-------------|
| Wild Game | Hunting Lodge | - |
| Fish | Fishing Hut | Dock |
| Livestock | Pasture | - |
| Timber | Lumber Camp | Sawmill (processing) |
| Clay | Clay Pit | - |
| Stone | Quarry | - |
| Salt | Salt Works | - |
| Copper | Copper Mine | - |
| Iron | Iron Mine | - |
| Silver | Silver Mine | - |
| Gold | Gold Mine | - |
| Gems | Gem Mine | - |

## Building Placement Guidelines

### Optimal Placement
Buildings should be placed:
1. **Adjacent to resource**: Within 1-2 tiles of the resource deposit
2. **Accessible terrain**: On buildable terrain (not water, not mountains for most)
3. **Near settlements**: Close enough for workers to travel
4. **Strategic location**: Consider trade routes and defense

### Terrain Requirements
- **Hunting Lodge**: Forest edges or clearings
- **Fishing Hut**: Shore or shallow water edges
- **Pasture**: Open plains or gentle hills
- **Lumber Camp**: Forest clearings
- **Sawmill**: Near water (for water wheel)
- **Clay Pit**: Plains with clay deposits
- **Quarry**: Mountains or rocky terrain
- **Salt Works**: Coastal shores
- **All Mines**: Hills or mountains (where deposits exist)

## Economic Integration

### Production Chains

#### Basic Construction
1. **Lumber Camp** → Raw Timber
2. **Sawmill** → Processed Lumber → Buildings

#### Masonry
1. **Quarry** → Stone → Buildings/Walls
2. **Clay Pit** → Clay → Bricks → Buildings

#### Metalworking
1. **Copper Mine** → Copper Ore → Tools/Coins
2. **Iron Mine** → Iron Ore → Weapons/Tools
3. **Precious Mines** → Ore → Currency/Luxury Goods

#### Food Supply
1. **Hunting Lodge** → Meat
2. **Fishing Hut** → Fish
3. **Pasture** → Meat/Wool/Leather
4. **Salt Works** → Salt → Food Preservation

### Trade Value
Buildings produce resources with varying trade values:
- **Low value**: Clay, Stone, Timber (bulk materials)
- **Medium value**: Copper, Iron, Salt (useful materials)
- **High value**: Silver, Gold, Gems (luxury goods)
- **Consumable**: Food resources (continuous demand)

## Implementation Details

### Code Structure

#### Files
- **`src/world/Building.ts`**: Building type definitions and configs
- **`src/rendering/buildings/IndustrialRenderer.ts`**: Visual rendering
- **`src/world/ResourceExtraction.ts`**: Resource-building mapping logic

#### Key Functions

```typescript
// Get the building that extracts a resource
getPrimaryExtractionBuilding(resourceType: ResourceType): BuildingType | null

// Check if building can extract resource
canBuildingExtractResource(building: BuildingType, resource: ResourceType): boolean

// Get all resources a building can extract
getResourcesForBuilding(building: BuildingType): ResourceType[]

// Get building recommendation for resource
getRecommendedBuilding(resourceType: ResourceType): BuildingPlacementRecommendation | null
```

### Building Configuration

Each building has:
```typescript
{
  name: string;              // Display name
  isLandmark: boolean;       // Is this a major landmark?
  size: "small" | "medium" | "large";  // Visual size
  baseColor: number;         // Primary color (hex)
  accentColor: number;       // Secondary color (hex)
  roofColor: number;         // Roof color (hex)
}
```

## Future Enhancements

### Potential Features

1. **Building Upgrades**
   - Tier 1: Basic extraction building
   - Tier 2: Improved efficiency (+25% yield)
   - Tier 3: Advanced processing (+50% yield, refined products)

2. **Worker Management**
   - Assign villagers to buildings
   - Skill progression for workers
   - Efficiency based on worker count

3. **Resource Depletion**
   - Non-renewable resources gradually exhaust
   - Buildings become inactive when resource depletes
   - Can be demolished or repurposed

4. **Building Maintenance**
   - Buildings require upkeep (materials, workers)
   - Decay over time if not maintained
   - Can be repaired or upgraded

5. **Production Chains**
   - Multi-stage processing (ore → ingot → tool)
   - Buildings can feed into each other
   - Transportation mechanics between buildings

6. **Specialization Bonuses**
   - Villages specialized in mining get bonus to mine output
   - Lumber villages process timber faster
   - Coastal villages get fishing bonuses

7. **Building Networks**
   - Connected buildings work more efficiently
   - Road quality affects transportation
   - Storage buildings reduce waste

8. **Environmental Impact**
   - Quarries create rock faces
   - Lumber camps clear forests (regrow over time)
   - Mines create tailings

## Testing

### Verification Steps

1. **Visual Test**: Each building renders correctly with appropriate colors
2. **Placement Test**: Buildings can be placed on appropriate terrain
3. **Resource Test**: Buildings correctly identify nearby resources
4. **UI Test**: Tooltips show correct building names and info

### Known Limitations

- Buildings don't yet have functional extraction mechanics (visual only)
- No worker assignment system
- No production output tracking
- No building upgrades
- Resource-building connection is defined but not enforced in gameplay

## Summary

The resource extraction building system provides:
- ✅ **12 new specialized buildings** for resource extraction
- ✅ **Complete visual designs** for each building type
- ✅ **Resource-building mapping system** for game logic
- ✅ **Extensible architecture** for future gameplay mechanics
- ✅ **Medieval aesthetic** consistent with art style guide
- ✅ **Economic foundation** for production chains

This system forms the backbone of the game's resource economy and provides clear visual feedback about which resources are being exploited and where economic activity is occurring.
