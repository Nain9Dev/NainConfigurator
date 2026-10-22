import { describe, expect, it } from "vitest";

import { swatchColorsFor } from "./swatches";
import type { VisualPack } from "./types";

const pack: VisualPack = {
  schemaVersion: 1,
  key: "Sample",
  label: "Sample",
  camera: { yaw: 0, pitch: 0, scale: 1, target: [0, 0, 0] },
  frame: { width: 4, height: 3 },
  light: { yaw: 0, pitch: 45 },
  ground: null,
  vars: {},
  slots: {
    top: {
      base: "oak",
      when: [
        { key: "Finish_Walnut", material: "walnut" },
        { key: "Finish_Missing", material: "nowhere" },
      ],
    },
    trim: {
      base: "steel",
      when: [{ key: "Finish_Walnut", material: "brass" }],
    },
  },
  materials: {
    oak: { color: "#c9a872" },
    walnut: { color: "#5a3a22" },
    steel: { color: "#8a9199" },
    brass: { color: "#b08d3c" },
  },
  parts: [],
};

describe("swatchColorsFor", () => {
  it("returns every override colour a key binds, in slot order", () => {
    expect(swatchColorsFor(pack, "Finish_Walnut")).toEqual([
      "#5a3a22",
      "#b08d3c",
    ]);
  });

  it("returns nothing for a key no slot overrides", () => {
    expect(swatchColorsFor(pack, "Finish_Oak")).toEqual([]);
    expect(swatchColorsFor(pack, "Size_Large")).toEqual([]);
  });

  it("skips an override whose material is not declared", () => {
    expect(swatchColorsFor(pack, "Finish_Missing")).toEqual([]);
  });

  it("returns nothing without a pack or a key", () => {
    expect(swatchColorsFor(null, "Finish_Walnut")).toEqual([]);
    expect(swatchColorsFor(pack, null)).toEqual([]);
  });
});
