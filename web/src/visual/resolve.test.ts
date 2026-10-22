import { describe, expect, it } from "vitest";

import { PackError, parsePack, resolveScene } from "./resolve";
import type { VisualPack } from "./types";

const document = {
  schemaVersion: 1,
  key: "Test_Pack",
  label: "Test pack",
  camera: { yaw: 30, pitch: 20, scale: 1, target: [0, 0, 0] },
  frame: { width: 600, height: 400 },
  light: { yaw: -40, pitch: 50 },
  ground: { spreadX: 1.2, spreadZ: 1.4 },
  vars: {
    W: { base: 120, when: [{ key: "Size_Large", value: 160 }] },
    H: { base: 74 },
  },
  slots: {
    surface: {
      base: "oak",
      when: [{ key: "Finish_Walnut", material: "walnut" }],
    },
  },
  materials: {
    oak: { color: "#c8975a", sheen: 0.07 },
    walnut: { color: "#4d3425" },
    steel: { color: "#3a414b" },
  },
  parts: [
    {
      id: "top",
      label: "tablero",
      shape: "box",
      material: "slot:surface",
      at: ["0", "H", "0"],
      size: ["W", "4", "60"],
    },
    {
      id: "riser",
      shape: "box",
      material: "steel",
      when: ["Accessory_Riser"],
      at: ["0", "H + 6", "0"],
      size: ["40", "4", "20"],
    },
    {
      id: "brace",
      shape: "tube",
      material: "steel",
      unless: ["Legs_Electric"],
      from: ["-W/2", "10", "0"],
      to: ["W/2", "10", "0"],
      radius: "2",
    },
  ],
};

function pack(): VisualPack {
  return parsePack(structuredClone(document));
}

describe("parsePack", () => {
  it("accepts a well-formed document", () => {
    expect(pack().key).toBe("Test_Pack");
  });

  it("rejects an unsupported schema version", () => {
    expect(() => parsePack({ ...document, schemaVersion: 2 })).toThrow(
      PackError,
    );
  });

  it("rejects a document that is not an object", () => {
    expect(() => parsePack("nope")).toThrow(PackError);
  });

  it("rejects an unknown shape", () => {
    expect(() =>
      parsePack({
        ...document,
        parts: [{ id: "x", shape: "sphere", material: "steel" }],
      }),
    ).toThrow(/unknown shape/iu);
  });

  it("rejects a part whose expression names a variable the pack lacks", () => {
    expect(() =>
      parsePack({
        ...document,
        parts: [
          {
            id: "x",
            shape: "box",
            material: "steel",
            at: ["0", "NOPE", "0"],
            size: ["1", "1", "1"],
          },
        ],
      }),
    ).toThrow(/Unknown variable/u);
  });

  it("rejects a vector that is not three entries", () => {
    expect(() =>
      parsePack({
        ...document,
        parts: [
          {
            id: "x",
            shape: "box",
            material: "steel",
            at: ["0", "0"],
            size: ["1", "1", "1"],
          },
        ],
      }),
    ).toThrow(PackError);
  });
});

describe("resolveScene", () => {
  it("uses base values when nothing is selected", () => {
    const scene = resolveScene(pack(), []);

    expect(scene.values.W).toBe(120);
  });

  it("applies a variable override for a selected key", () => {
    const scene = resolveScene(pack(), ["Size_Large"]);

    expect(scene.values.W).toBe(160);
    expect(scene.parts[0]?.geometry).toMatchObject({
      size: { x: 160, y: 4, z: 60 },
    });
  });

  it("applies a slot override for a selected key", () => {
    expect(resolveScene(pack(), []).parts[0]?.material.color).toBe("#c8975a");
    expect(
      resolveScene(pack(), ["Finish_Walnut"]).parts[0]?.material.color,
    ).toBe("#4d3425");
  });

  it("hides a part whose `when` key is absent", () => {
    expect(resolveScene(pack(), []).parts.map((part) => part.id)).toEqual([
      "top",
      "brace",
    ]);
  });

  it("shows a part once its `when` key is selected", () => {
    expect(
      resolveScene(pack(), ["Accessory_Riser"]).parts.map((part) => part.id),
    ).toContain("riser");
  });

  it("hides a part whose `unless` key is selected", () => {
    expect(
      resolveScene(pack(), ["Legs_Electric"]).parts.map((part) => part.id),
    ).not.toContain("brace");
  });

  it("evaluates expressions against the resolved variables", () => {
    const scene = resolveScene(pack(), ["Size_Large"]);
    const brace = scene.parts.find((part) => part.id === "brace");

    expect(brace?.geometry).toMatchObject({
      from: { x: -80, y: 10, z: 0 },
      to: { x: 80, y: 10, z: 0 },
      radius: 2,
    });
  });

  it("lets an override replace the resolved dimensions mid-animation", () => {
    const scene = resolveScene(pack(), ["Size_Large"], {
      values: { W: 140, H: 74 },
    });

    expect(scene.parts[0]?.geometry).toMatchObject({
      size: { x: 140, y: 4, z: 60 },
    });
  });

  it("lets an override replace a slot colour mid-animation", () => {
    const scene = resolveScene(pack(), [], {
      slotColors: { surface: "#887766" },
    });

    expect(scene.parts[0]?.material.color).toBe("#887766");
    // The override is colour only: the slot's other properties survive.
    expect(scene.parts[0]?.material.sheen).toBe(0.07);
  });

  it("falls back to a neutral material when the name is unknown", () => {
    const broken = pack();
    broken.parts[0].material = "missing";

    expect(resolveScene(broken, []).parts[0]?.material.color).toBe("#9aa5ad");
  });

  it("keeps the declared part order", () => {
    const scene = resolveScene(pack(), ["Accessory_Riser"]);

    expect(scene.parts.map((part) => part.id)).toEqual([
      "top",
      "riser",
      "brace",
    ]);
  });
});
