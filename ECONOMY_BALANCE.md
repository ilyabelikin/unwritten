# Economy System Balance Analysis

## Extraction Rates (per turn)

### Renewable Resources
- **Timber**: 12 units/turn (LumberCamp)
- **Wild Game**: 8 units/turn (HuntingLodge)
- **Fish**: 10-12 units/turn (FishingHut/FishingBoat)
- **Livestock**: 7 units/turn (Pasture)

### Non-Renewable Resources
- **Iron Ore**: 7 units/turn (IronMine)
- **Copper Ore**: 8 units/turn (CopperMine)
- **Stone**: 10 units/turn (Quarry)
- **Clay**: 8 units/turn (ClayPit)
- **Salt**: 6 units/turn (SaltWorks)

### Precious Resources
- **Silver**: 5 units/turn (SilverMine)
- **Gold**: 4 units/turn (GoldMine)
- **Gems**: 3 units/turn (GemMine)

## Production Chains Analysis

### Chain 1: Fuel Production (Critical Path)

**Timber → Coal**
- Input: 10 Timber
- Output: 5 Coal
- Time: 2 turns
- **Rate**: 2.5 coal/turn per CharcoalBurner
- **Source Rate**: 1 LumberCamp produces 12 timber/turn
- **Balance**: 1 LumberCamp can support 2.4 CharcoalBurners ✅

### Chain 2: Iron Weapons

**Iron Ore → Iron Ingots → Iron Sword**

1. **Smelting**:
   - Input: 10 Iron Ore + 5 Coal
   - Output: 8 Iron Ingots
   - Time: 4 turns
   - **Coal Consumption**: 1.25 coal/turn
   - **Ore Consumption**: 2.5 ore/turn

2. **Forging**:
   - Input: 3 Iron Ingots + 4 Coal
   - Output: 1 Iron Sword
   - Time: 4 turns
   - **Coal Consumption**: 1.0 coal/turn
   - **Ingot Consumption**: 0.75 ingots/turn

**Full Chain Balance**:
- 1 IronMine (7 ore/turn) → 1 Smelter needs 2.5 ore/turn
- **Result**: 1 IronMine can support 2.8 Smelters ✅
- 1 CharcoalBurner (2.5 coal/turn) → 1 Smelter needs 1.25 coal/turn
- **Result**: 1 CharcoalBurner can support 2.0 Smelters ✅
- 1 Smelter produces 2 ingots/turn → 1 Smithy needs 0.75 ingots/turn
- **Result**: 1 Smelter can support 2.6 Smithies ✅
- **Coal for Smithy**: 1 CharcoalBurner (2.5 coal/turn) supports 2.5 Smithies ✅

### Chain 3: Copper Tools

**Copper Ore → Copper Ingots → Copper Tools**

1. **Smelting**:
   - Input: 10 Copper Ore + 4 Coal
   - Output: 8 Copper Ingots
   - Time: 3 turns
   - **Coal Consumption**: 1.33 coal/turn
   - **Ore Consumption**: 3.33 ore/turn

2. **Forging**:
   - Input: 2 Copper Ingots + 2 Coal
   - Output: 1 Copper Tools
   - Time: 2 turns
   - **Coal Consumption**: 1.0 coal/turn
   - **Ingot Consumption**: 1 ingot/turn

**Full Chain Balance**:
- 1 CopperMine (8 ore/turn) → 1 Smelter needs 3.33 ore/turn
- **Result**: 1 CopperMine can support 2.4 Smelters ✅
- 1 CharcoalBurner (2.5 coal/turn) → 1 Smelter needs 1.33 coal/turn
- **Result**: 1 CharcoalBurner can support 1.9 Smelters ✅

### Chain 4: Construction Materials

**Timber → Planks**
- Input: 10 Timber
- Output: 15 Planks
- Time: 2 turns
- **Rate**: 7.5 planks/turn per Sawmill
- **Source**: 1 LumberCamp (12 timber/turn) can support 2.4 Sawmills ✅

**Clay → Bricks**
- Input: 10 Clay + 3 Coal
- Output: 12 Bricks
- Time: 3 turns
- **Rate**: 4 bricks/turn per Kiln
- **Coal Consumption**: 1.0 coal/turn
- **Source**: 1 ClayPit (8 clay/turn) can support 2.4 Kilns ✅
- **Coal**: 1 CharcoalBurner (2.5 coal/turn) supports 2.5 Kilns ✅

## Circular Economy Verification

### Scenario: Small Mining Settlement
**Buildings**: 1 LumberCamp, 2 CharcoalBurner, 1 IronMine, 1 Smelter, 1 Smithy

**Resources per turn**:
- Timber extracted: 12
- Coal produced: 5.0 (consumes 10 timber, 2 burners)
- Iron ore extracted: 7
- Iron ingots produced: 2 (consumes 2.5 ore, 1.25 coal)
- Iron swords produced: 0.25 (consumes 0.75 ingots, 1.0 coal)

**Coal balance**: 5.0 produced - 2.25 consumed = **+2.75 surplus** ✅
**Timber balance**: 12 extracted - 10 consumed = **+2 surplus** ✅
**Iron ore balance**: 7 extracted - 2.5 consumed = **+4.5 surplus** ✅

**Note**: With higher coal requirements, you need 2 CharcoalBurners instead of 1, but economy is still self-sustaining! ✅

### Scenario: Large Industrial City
**Buildings**: 3 LumberCamp, 4 CharcoalBurner, 2 IronMine, 2 CopperMine, 3 Smelter, 2 Smithy

**Resources per turn**:
- Timber extracted: 36
- Coal produced: 10.0 (consumes 20 timber, 4 burners)
- Iron ore extracted: 14
- Copper ore extracted: 16
- Ingots produced: ~6 total (consumes ~4.0 coal)
- Weapons/tools produced: ~0.75 (consumes ~2.0 coal)

**Coal balance**: 10.0 - 6.0 = **+4.0 surplus** ✅
**Timber balance**: 36 - 20 = **+16 surplus** ✅

**Conclusion**: With more CharcoalBurners, economy scales well to larger settlements! ✅

## Recommendations

### Current Balance Assessment: EXCELLENT ✅

The economy is well-balanced with:
1. ✅ Renewable fuel source (timber → coal)
2. ✅ Multiple production chains that don't bottleneck
3. ✅ Good surplus ratios allowing for growth
4. ✅ Reasonable production times (2-5 turns)
5. ✅ Clear resource dependencies

### Minor Adjustments (Optional)

If testing reveals issues, consider:
1. **Reduce coal consumption** by 10-20% if coal becomes bottleneck
2. **Increase extraction rates** by 20% if production is too slow
3. **Adjust production times** ±1 turn for specific recipes if needed

### Storage Considerations

- Default storage: 10,000 units per settlement
- Recommended storage per building type:
  - Small hamlet: 5,000 units
  - Village: 10,000 units
  - City: 20,000 units

## Production Priority System

Priority values ensure critical goods are produced first:
- **10**: Coal (essential for all production)
- **8-9**: Iron ingots, iron tools (military/economy critical)
- **7**: Copper ingots, construction materials
- **5-6**: Weapons, armor
- **3-4**: Luxury goods, pottery

This prioritization ensures:
1. Fuel is always available
2. Essential materials are produced before luxuries
3. Military/survival goods take precedence
4. Economic balance is maintained

## Conclusion

The economy system is **balanced and ready for production**. The circular economy is self-sustaining, scales well, and provides meaningful progression through production chains.
