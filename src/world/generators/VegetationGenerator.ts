import { Grid } from "honeycomb-grid";
import { HexTile } from "../HexTile";
import { VegetationType, supportsVegetation, isWater, TerrainType } from "../Terrain";
import { LayeredNoise } from "../../utils/noise";
import { WorldGenConfig } from "../WorldGenerator";

/**
 * Handles vegetation and rough terrain generation
 */
export class VegetationGenerator {
  private vegetationNoise: LayeredNoise;
  private roughNoise: LayeredNoise;
  private config: WorldGenConfig;

  constructor(config: WorldGenConfig, seed: string) {
    this.config = config;
    this.vegetationNoise = new LayeredNoise(seed + "_veg");
    this.roughNoise = new LayeredNoise(seed + "_rough");
  }

  /**
   * Scatter vegetation on eligible tiles
   */
  applyVegetation(grid: Grid<HexTile>): void {
    grid.forEach((hex) => {
      if (!supportsVegetation(hex.terrain)) return;

      const vegValue = this.vegetationNoise.sample(hex.col, hex.row, {
        scale: this.config.vegetationScale,
        octaves: 3,
        persistence: 0.6,
      });

      if (vegValue > this.config.vegetationThreshold) {
        // Higher values = trees (denser vegetation), lower = bushes
        const treeThreshold = this.config.vegetationThreshold + 0.08;

        if (vegValue > treeThreshold) {
          // Trees with varying density based on noise value
          hex.vegetation = VegetationType.Tree;
          // Map vegValue to density: normalize from treeThreshold-1.0 to 0.0-1.0
          // Use power curve to make dense forests more common
          const densityRange = 1.0 - treeThreshold;
          const normalizedValue = (vegValue - treeThreshold) / densityRange;
          // Square root curve makes dense forests appear at lower thresholds
          hex.treeDensity = Math.max(0, Math.min(1, Math.pow(normalizedValue, 0.6)));
        } else {
          hex.vegetation = VegetationType.Bush;
          hex.treeDensity = 0;
        }
      }
    });
  }

  /**
   * Mark rough terrain patches
   */
  applyRoughTerrain(grid: Grid<HexTile>): void {
    grid.forEach((hex) => {
      // Only apply rough terrain to land tiles (not water or shore)
      if (isWater(hex.terrain) || hex.terrain === TerrainType.Shore) return;

      // Mountains are always rough (per terrain config)
      if (hex.terrain === TerrainType.Mountains) {
        hex.isRough = true;
        return;
      }

      // Use noise to create patches of rough terrain on hills and plains
      const roughValue = this.roughNoise.sample(hex.col, hex.row, {
        scale: this.config.roughScale,
        octaves: 2,
        persistence: 0.5,
      });

      if (roughValue > this.config.roughThreshold) {
        hex.isRough = true;
      }
    });
  }
}
