import { describe, expect, it } from "vitest";

import {
  buildPrimitives,
  createProjector,
  fitHalfExtent,
  formatColor,
  lightVector,
  mixColor,
  parseColor,
  sceneExtent,
  shade,
} from "./projection";
import type { Camera, Material, ResolvedPart } from "./types";

const camera: Camera = { yaw: 35, pitch: 25, scale: 1, target: [0, 0, 0] };
const light = lightVector({ yaw: -40, pitch: 50 });
const steel: Material = { color: "#808080", sheen: 0 };

function box(id: string, at: [number, number, number]): ResolvedPart {
  return {
    id,
    label: null,
    shape: "box",
    material: steel,
    geometry: {
      shape: "box",
      at: { x: at[0], y: at[1], z: at[2] },
      size: { x: 10, y: 10, z: 10 },
    },
  };
}

describe("createProjector", () => {
  it("places the camera above the horizon", () => {
    expect(createProjector(camera).eye.y).toBeGreaterThan(0);
  });

  it("reports the scene point it is aimed at as the origin", () => {
    const projector = createProjector({ ...camera, target: [12, 34, 56] });
    const centre = projector.point({ x: 12, y: 34, z: 56 });

    expect(centre.x).toBeCloseTo(0, 10);
    expect(centre.y).toBeCloseTo(0, 10);
  });

  it("draws a higher point higher on screen", () => {
    const projector = createProjector(camera);

    expect(projector.point({ x: 0, y: 10, z: 0 }).y).toBeLessThan(
      projector.point({ x: 0, y: 0, z: 0 }).y,
    );
  });

  it("reports a point nearer the camera as nearer", () => {
    const projector = createProjector({ ...camera, yaw: 0, pitch: 0 });

    expect(projector.point({ x: 0, y: 0, z: 10 }).nearness).toBeGreaterThan(
      projector.point({ x: 0, y: 0, z: -10 }).nearness,
    );
  });

  it("carries the camera scale as the stroke scale", () => {
    expect(createProjector({ ...camera, scale: 3 }).unitScale).toBe(3);
  });
});

describe("buildPrimitives", () => {
  const projector = createProjector(camera);

  it("culls the three faces a box cannot show", () => {
    const { primitives } = buildPrimitives(
      [box("a", [0, 0, 0])],
      projector,
      light,
    );

    expect(primitives).toHaveLength(3);
  });

  it("paints the farther box first", () => {
    const { primitives } = buildPrimitives(
      [box("near", [0, 0, 40]), box("far", [0, 0, -40])],
      projector,
      light,
    );

    expect(primitives[0]?.id.startsWith("far")).toBe(true);
    expect(primitives.at(-1)?.id.startsWith("near")).toBe(true);
  });

  it("shades the three visible faces differently", () => {
    const { primitives } = buildPrimitives(
      [box("a", [0, 0, 0])],
      projector,
      light,
    );
    const fills = new Set(primitives.map((primitive) => primitive.fill));

    expect(fills.size).toBe(3);
  });

  it("gives a tube a highlight pass and a stroke width in scene units", () => {
    const { primitives } = buildPrimitives(
      [
        {
          id: "bar",
          label: null,
          shape: "tube",
          material: steel,
          geometry: {
            shape: "tube",
            from: { x: -10, y: 5, z: 0 },
            to: { x: 10, y: 5, z: 0 },
            radius: 2,
          },
        },
      ],
      projector,
      light,
    );

    expect(primitives).toHaveLength(1);
    expect(primitives[0]?.strokeWidth).toBe(4);
    expect(primitives[0]?.highlight).not.toBeNull();
  });

  it("closes a ring into a single stroked path", () => {
    const { primitives } = buildPrimitives(
      [
        {
          id: "wheel",
          label: null,
          shape: "ring",
          material: steel,
          geometry: {
            shape: "ring",
            at: { x: 0, y: 30, z: 0 },
            radius: 30,
            tube: 2,
            plane: "xy",
          },
        },
      ],
      projector,
      light,
    );

    expect(primitives[0]?.fill).toBeNull();
    expect(primitives[0]?.path.endsWith("Z")).toBe(true);
  });

  it("reports bounds that contain every drawn coordinate", () => {
    const { primitives, bounds } = buildPrimitives(
      [box("a", [0, 0, 0]), box("b", [50, 20, -30])],
      projector,
      light,
    );

    for (const primitive of primitives) {
      for (const value of primitive.path.match(/-?\d+(?:\.\d+)?/gu) ?? []) {
        expect(Number(value)).toBeGreaterThanOrEqual(
          Math.min(bounds.minX, bounds.minY),
        );
        expect(Number(value)).toBeLessThanOrEqual(
          Math.max(bounds.maxX, bounds.maxY),
        );
      }
    }
  });
});

describe("sceneExtent", () => {
  it("measures the axis-aligned box around every part", () => {
    const extent = sceneExtent([box("a", [0, 5, 0]), box("b", [20, 5, 0])]);

    expect(extent.min).toMatchObject({ x: -5, y: 0, z: -5 });
    expect(extent.max).toMatchObject({ x: 25, y: 10, z: 5 });
    expect(extent.center.x).toBe(10);
    expect(extent.floor).toBe(0);
  });

  it("returns a usable extent for an empty scene", () => {
    expect(sceneExtent([]).radius).toBe(1);
  });
});

describe("fitHalfExtent", () => {
  const projector = createProjector(camera);
  const extent = sceneExtent([box("a", [0, 0, 0])]);

  it("carries the requested aspect ratio", () => {
    const fit = fitHalfExtent(extent, projector, 2);

    expect(fit.x / fit.y).toBeCloseTo(2, 10);
  });

  it("never clips: every projected corner stays inside the box", () => {
    const fit = fitHalfExtent(extent, projector, 1.5);

    for (const x of [extent.min.x, extent.max.x]) {
      for (const y of [extent.min.y, extent.max.y]) {
        for (const z of [extent.min.z, extent.max.z]) {
          const point = projector.point({ x, y, z });

          expect(Math.abs(point.x)).toBeLessThanOrEqual(fit.x + 1e-9);
          expect(Math.abs(point.y)).toBeLessThanOrEqual(fit.y + 1e-9);
        }
      }
    }
  });

  it("grows when the scene grows", () => {
    const bigger = sceneExtent([box("a", [0, 0, 0]), box("b", [100, 0, 0])]);

    expect(fitHalfExtent(bigger, projector, 1).x).toBeGreaterThan(
      fitHalfExtent(extent, projector, 1).x,
    );
  });
});

describe("shading", () => {
  it("is deterministic", () => {
    const normal = { x: 0, y: 1, z: 0 };
    const eye = createProjector(camera).eye;

    expect(shade(steel, normal, light, eye)).toBe(
      shade(steel, normal, light, eye),
    );
  });

  it("lights a face turned toward the light more than one turned away", () => {
    const eye = createProjector(camera).eye;
    const lit = shade(steel, { x: 0, y: 1, z: 0 }, light, eye);
    const dark = shade(steel, { x: 0, y: -1, z: 0 }, light, eye);

    expect(parseColor(lit).r).toBeGreaterThan(parseColor(dark).r);
  });

  it("leaves an emissive material at its own colour", () => {
    const emissive: Material = { color: "#112233", emissive: true };

    expect(
      shade(
        emissive,
        { x: 0, y: -1, z: 0 },
        light,
        createProjector(camera).eye,
      ),
    ).toBe("#112233");
  });
});

describe("colour helpers", () => {
  it("round-trips a six-digit hex", () => {
    expect(formatColor(parseColor("#3a414b"))).toBe("#3a414b");
  });

  it("expands a three-digit hex", () => {
    expect(formatColor(parseColor("#abc"))).toBe("#aabbcc");
  });

  it("falls back to a neutral grey for an unparseable value", () => {
    expect(parseColor("transparent").r).toBeCloseTo(0.6, 5);
  });

  it("mixes toward the target colour", () => {
    const mixed = mixColor(parseColor("#000000"), parseColor("#ffffff"), 0.5);

    expect(formatColor(mixed)).toBe("#808080");
  });
});
