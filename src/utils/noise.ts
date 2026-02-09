import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import alea from "alea";

/**
 * Layered 2D noise with octaves for natural-looking terrain.
 * Returns values in roughly 0–1 range.
 */
export class LayeredNoise {
  private noise: NoiseFunction2D;

  constructor(seed: string = "unwritten") {
    const prng = alea(seed);
    this.noise = createNoise2D(prng);
  }

  /**
   * Sample noise at (x, y) with layered octaves.
   * @returns Value normalized to approximately 0–1
   */
  sample(
    x: number,
    y: number,
    options: {
      scale?: number;
      octaves?: number;
      persistence?: number;
      lacunarity?: number;
    } = {}
  ): number {
    const {
      scale = 0.02,
      octaves = 4,
      persistence = 0.5,
      lacunarity = 2.0,
    } = options;

    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // Normalize from [-1, 1] to [0, 1]
    return (value / maxAmplitude + 1) / 2;
  }
}
