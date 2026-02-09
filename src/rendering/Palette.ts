/**
 * Consistent pixel-art color palette for the game.
 * Warm, earthy tones inspired by classic RPGs.
 */
export const Palette = {
  // Water
  waterDeep: 0x2b5b84,
  waterShallow: 0x3b7cb8,
  waterHighlight: 0x4d8ec8,

  // Shore / Sand
  shore: 0xe8d5a3,
  shoreWet: 0xc4b07e,

  // Plains / Grass
  plainsLight: 0x7bc950,
  plainsDark: 0x5a9e3a,

  // Hills
  hillsLight: 0x8b9e3a,
  hillsDark: 0x6b7a30,

  // Mountains
  mountainStone: 0x8c8c8c,
  mountainPeak: 0xc8c8c8,
  mountainSnow: 0xf0f0f0,

  // Vegetation
  bush: 0x3d7a2a,
  bushLight: 0x4e8b3b,
  treeTrunk: 0x6b4226,
  treeCanopy: 0x2d6e1e,
  treeCanopyLight: 0x3e8f2f,
  forestDark: 0x1a4d1a,
  forestMedium: 0x2d6e1e,

  // Character
  character: 0xe85040,
  characterOutline: 0x8b2020,

  // Fog
  fog: 0x1a1a2e,

  // UI
  uiBg: 0x1a1a2e,
  uiText: 0xf0e8d8,
  uiAccent: 0xe8a840,
  uiDim: 0x666680,

  // Hex outlines
  hexOutline: 0x2a2a3a,
  hexOutlineLight: 0x3a3a4a,
} as const;
