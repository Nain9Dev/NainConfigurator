/**
 * The whole renderer's geometry and lighting, with no DOM in sight.
 *
 * An axonometric camera, back-face culling, Lambert shading with a Blinn
 * specular term and a painter's sort. That is enough to draw massing and
 * proportion convincingly, and it is small enough to read in one sitting.
 *
 * Axes: +x right, +y up, +z toward the viewer at yaw 0.
 */

import type { Camera, Material, Point3, ResolvedPart } from "./types";

export interface ScreenPoint {
  x: number;
  y: number;
  /** Larger means closer to the camera. */
  nearness: number;
}

export interface Projector {
  point(p: Point3): ScreenPoint;
  /** Screen-space direction of a world-space direction, normalized. */
  direction(d: Point3): { x: number; y: number };
  /** Unit vector from the origin toward the camera. */
  readonly eye: Point3;
  /** Pixels per scene unit. The projection is orthographic, so this is exact. */
  readonly unitScale: number;
}

export interface Primitive {
  id: string;
  kind: "face" | "stroke";
  /** Painter's-algorithm key: smaller is drawn first. */
  depth: number;
  path: string;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  /** A second, thinner stroke drawn on top: the highlight pass. */
  highlight: { path: string; stroke: string; strokeWidth: number } | null;
}

const DEGREES = Math.PI / 180;

export function createProjector(camera: Camera): Projector {
  const yaw = camera.yaw * DEGREES;
  const pitch = camera.pitch * DEGREES;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  const raw = (p: Point3) => {
    const u = p.x * cosYaw + p.z * sinYaw;
    const w = p.z * cosYaw - p.x * sinYaw;

    return {
      u,
      v: w * sinPitch - p.y * cosPitch,
      nearness: w * cosPitch + p.y * sinPitch,
    };
  };

  const target = raw({
    x: camera.target[0],
    y: camera.target[1],
    z: camera.target[2],
  });

  return {
    eye: {
      x: -sinYaw * cosPitch,
      y: sinPitch,
      z: cosYaw * cosPitch,
    },
    unitScale: camera.scale,
    point(p) {
      const projected = raw(p);

      return {
        x: (projected.u - target.u) * camera.scale,
        y: (projected.v - target.v) * camera.scale,
        nearness: projected.nearness,
      };
    },
    direction(d) {
      const projected = raw(d);
      const length = Math.hypot(projected.u, projected.v);

      return length === 0
        ? { x: 0, y: -1 }
        : { x: projected.u / length, y: projected.v / length };
    },
  };
}

/** Unit vector from the scene toward a light at the given yaw and pitch. */
export function lightVector(light: { yaw: number; pitch: number }): Point3 {
  const yaw = light.yaw * DEGREES;
  const pitch = light.pitch * DEGREES;

  return {
    x: Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: Math.cos(yaw) * Math.cos(pitch),
  };
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface SceneExtent {
  center: Point3;
  /** Half the diagonal of the axis-aligned bounding box. */
  radius: number;
  /** Lowest point of the scene, where the contact shadow belongs. */
  floor: number;
  min: Point3;
  max: Point3;
}

/**
 * Half the width and height of a viewBox that frames the scene.
 *
 * Projecting the eight corners of the bounding box is tight without ever
 * clipping, and because the box itself does not rotate the framing only moves
 * when the object actually changes size. `aspect` is the frame's width over its
 * height: the returned box carries that ratio, so the scene fills the panel
 * instead of being letterboxed inside a square.
 */
export function fitHalfExtent(
  extent: SceneExtent,
  projector: Projector,
  aspect: number,
): { x: number; y: number } {
  let halfX = 1;
  let halfY = 1;

  for (const x of [extent.min.x, extent.max.x]) {
    for (const y of [extent.min.y, extent.max.y]) {
      for (const z of [extent.min.z, extent.max.z]) {
        const projected = projector.point({ x, y, z });

        halfX = Math.max(halfX, Math.abs(projected.x));
        halfY = Math.max(halfY, Math.abs(projected.y));
      }
    }
  }

  const safeAspect = aspect > 0 ? aspect : 1;
  const height = Math.max(halfY, halfX / safeAspect);

  return { x: height * safeAspect, y: height };
}

/**
 * The scene's extent in world space.
 *
 * Framing from here rather than from the projected silhouette keeps the view
 * steady while the camera orbits: the bounding box does not rotate, so the
 * object only changes size on screen when it actually changes size.
 */
export function sceneExtent(parts: readonly ResolvedPart[]): SceneExtent {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  const include = (point: Point3, pad: number) => {
    minX = Math.min(minX, point.x - pad);
    maxX = Math.max(maxX, point.x + pad);
    minY = Math.min(minY, point.y - pad);
    maxY = Math.max(maxY, point.y + pad);
    minZ = Math.min(minZ, point.z - pad);
    maxZ = Math.max(maxZ, point.z + pad);
  };

  for (const part of parts) {
    const geometry = part.geometry;

    switch (geometry.shape) {
      case "box":
        include(
          {
            x: geometry.at.x - geometry.size.x / 2,
            y: geometry.at.y - geometry.size.y / 2,
            z: geometry.at.z - geometry.size.z / 2,
          },
          0,
        );
        include(
          {
            x: geometry.at.x + geometry.size.x / 2,
            y: geometry.at.y + geometry.size.y / 2,
            z: geometry.at.z + geometry.size.z / 2,
          },
          0,
        );
        break;
      case "tube":
        include(geometry.from, geometry.radius);
        include(geometry.to, geometry.radius);
        break;
      case "ring":
        include(geometry.at, geometry.radius + geometry.tube);
        break;
    }
  }

  if (!Number.isFinite(minX)) {
    const origin = { x: 0, y: 0, z: 0 };

    return { center: origin, radius: 1, floor: 0, min: origin, max: origin };
  }

  const size = { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };

  return {
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2,
    },
    radius: Math.max(1, Math.hypot(size.x, size.y, size.z) / 2),
    floor: minY,
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

export interface Drawing {
  primitives: Primitive[];
  /** Screen bounds of everything drawn, stroke width included. */
  bounds: Bounds;
}

export function buildPrimitives(
  parts: readonly ResolvedPart[],
  projector: Projector,
  light: Point3,
): Drawing {
  const screenLight = projector.direction(light);
  const primitives: Primitive[] = [];

  for (const part of parts) {
    switch (part.geometry.shape) {
      case "box":
        primitives.push(
          ...boxPrimitives(part, part.geometry, projector, light),
        );
        break;
      case "tube":
        primitives.push(
          tubePrimitive(part, part.geometry, projector, light, screenLight),
        );
        break;
      case "ring":
        primitives.push(ringPrimitive(part, part.geometry, projector, light));
        break;
    }
  }

  primitives.sort((left, right) => left.depth - right.depth);

  return { primitives, bounds: measure(primitives) };
}

const COORDINATE = /-?\d+(?:\.\d+)?/g;

/**
 * Screen bounds read back from the generated paths.
 *
 * Every path in this module is emitted as `M x y L x y … [Z]`, so the numbers
 * in it are exactly the points it passes through.
 */
function measure(primitives: readonly Primitive[]): Bounds {
  const bounds: Bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (const primitive of primitives) {
    const pad = primitive.strokeWidth / 2;
    const numbers = primitive.path.match(COORDINATE) ?? [];

    for (let index = 0; index + 1 < numbers.length; index += 2) {
      const x = Number(numbers[index]);
      const y = Number(numbers[index + 1]);

      bounds.minX = Math.min(bounds.minX, x - pad);
      bounds.maxX = Math.max(bounds.maxX, x + pad);
      bounds.minY = Math.min(bounds.minY, y - pad);
      bounds.maxY = Math.max(bounds.maxY, y + pad);
    }
  }

  return Number.isFinite(bounds.minX)
    ? bounds
    : { minX: -1, minY: -1, maxX: 1, maxY: 1 };
}

const BOX_FACES: ReadonlyArray<{
  normal: Point3;
  corners: ReadonlyArray<[number, number, number]>;
}> = [
  {
    normal: { x: 0, y: 1, z: 0 },
    corners: [
      [-1, 1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
  },
  {
    normal: { x: 0, y: -1, z: 0 },
    corners: [
      [-1, -1, 1],
      [1, -1, 1],
      [1, -1, -1],
      [-1, -1, -1],
    ],
  },
  {
    normal: { x: 0, y: 0, z: 1 },
    corners: [
      [-1, -1, 1],
      [-1, 1, 1],
      [1, 1, 1],
      [1, -1, 1],
    ],
  },
  {
    normal: { x: 0, y: 0, z: -1 },
    corners: [
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, -1],
    ],
  },
  {
    normal: { x: 1, y: 0, z: 0 },
    corners: [
      [1, -1, 1],
      [1, 1, 1],
      [1, 1, -1],
      [1, -1, -1],
    ],
  },
  {
    normal: { x: -1, y: 0, z: 0 },
    corners: [
      [-1, -1, -1],
      [-1, 1, -1],
      [-1, 1, 1],
      [-1, -1, 1],
    ],
  },
];

function boxPrimitives(
  part: ResolvedPart,
  geometry: { at: Point3; size: Point3 },
  projector: Projector,
  light: Point3,
): Primitive[] {
  const half = {
    x: geometry.size.x / 2,
    y: geometry.size.y / 2,
    z: geometry.size.z / 2,
  };

  const primitives: Primitive[] = [];

  for (const face of BOX_FACES) {
    // A face whose outward normal points away from the eye cannot be seen.
    if (dot(face.normal, projector.eye) <= 1e-6) {
      continue;
    }

    const points = face.corners.map((corner) =>
      projector.point({
        x: geometry.at.x + corner[0] * half.x,
        y: geometry.at.y + corner[1] * half.y,
        z: geometry.at.z + corner[2] * half.z,
      }),
    );

    const fill = shade(part.material, face.normal, light, projector.eye);

    primitives.push({
      id: `${part.id}:${face.normal.x}${face.normal.y}${face.normal.z}`,
      kind: "face",
      // Sorted ascending, so the farthest primitive is painted first.
      depth: average(points.map((point) => point.nearness)),
      path: polygonPath(points),
      fill,
      stroke: fill,
      // Hairline self-stroke closes the sub-pixel seams between adjacent faces.
      strokeWidth: 0.6,
      opacity: part.material.opacity ?? 1,
      highlight: null,
    });
  }

  return primitives;
}

function tubePrimitive(
  part: ResolvedPart,
  geometry: { from: Point3; to: Point3; radius: number },
  projector: Projector,
  light: Point3,
  screenLight: { x: number; y: number },
): Primitive {
  const from = projector.point(geometry.from);
  const to = projector.point(geometry.to);
  const axis = normalize(subtract(geometry.to, geometry.from));

  // Brightest normal on a cylinder: the light direction with its axial
  // component removed.
  const lit = normalize(subtract(light, scale(axis, dot(light, axis))));
  const body = shade(part.material, lit, light, projector.eye, 0.55);
  const crest = shade(part.material, lit, light, projector.eye, 1);

  const width = Math.max(1, geometry.radius * 2 * projector.unitScale);
  const offset = width * 0.22;

  return {
    id: part.id,
    kind: "stroke",
    depth: (from.nearness + to.nearness) / 2,
    path: `M ${round(from.x)} ${round(from.y)} L ${round(to.x)} ${round(to.y)}`,
    fill: null,
    stroke: body,
    strokeWidth: width,
    opacity: part.material.opacity ?? 1,
    highlight: {
      path: `M ${round(from.x + screenLight.x * offset)} ${round(
        from.y + screenLight.y * offset,
      )} L ${round(to.x + screenLight.x * offset)} ${round(
        to.y + screenLight.y * offset,
      )}`,
      stroke: crest,
      strokeWidth: width * 0.42,
    },
  };
}

const RING_SEGMENTS = 44;

function ringPrimitive(
  part: ResolvedPart,
  geometry: {
    at: Point3;
    radius: number;
    tube: number;
    plane: "xy" | "xz" | "yz";
  },
  projector: Projector,
  light: Point3,
): Primitive {
  const points: ScreenPoint[] = [];

  for (let index = 0; index < RING_SEGMENTS; index += 1) {
    const angle = (index / RING_SEGMENTS) * Math.PI * 2;
    const a = Math.cos(angle) * geometry.radius;
    const b = Math.sin(angle) * geometry.radius;

    const offset =
      geometry.plane === "xy"
        ? { x: a, y: b, z: 0 }
        : geometry.plane === "xz"
          ? { x: a, y: 0, z: b }
          : { x: 0, y: a, z: b };

    points.push(
      projector.point({
        x: geometry.at.x + offset.x,
        y: geometry.at.y + offset.y,
        z: geometry.at.z + offset.z,
      }),
    );
  }

  const normal =
    geometry.plane === "xy"
      ? { x: 0, y: 0, z: 1 }
      : geometry.plane === "xz"
        ? { x: 0, y: 1, z: 0 }
        : { x: 1, y: 0, z: 0 };

  return {
    id: part.id,
    kind: "stroke",
    depth: projector.point(geometry.at).nearness,
    path: `${polygonPath(points)}`,
    fill: null,
    stroke: shade(part.material, normal, light, projector.eye, 0.7),
    strokeWidth: Math.max(1, geometry.tube * 2 * projector.unitScale),
    opacity: part.material.opacity ?? 1,
    highlight: null,
  };
}

/* -------------------------------------------------------------- shading --- */

const AMBIENT = 0.42;
const DIFFUSE = 0.52;
const SKY = 0.1;

/**
 * Lambert plus a hemisphere term plus Blinn specular, applied to the material
 * colour. `bias` lets a curved primitive ask for a fraction of the full
 * response, which is what keeps a tube from reading as a flat ribbon.
 */
export function shade(
  material: Material,
  normal: Point3,
  light: Point3,
  eye: Point3,
  bias = 1,
): string {
  const base = parseColor(material.color);

  if (material.emissive === true) {
    return formatColor(base);
  }

  const unit = normalize(normal);
  const lambert = Math.max(0, dot(unit, light));
  const sky = (unit.y * 0.5 + 0.5) * SKY;
  const intensity = AMBIENT + (DIFFUSE * lambert + sky) * bias;

  const halfway = normalize(add(light, eye));
  const specular =
    (material.sheen ?? 0) *
    Math.pow(Math.max(0, dot(unit, halfway)), 26) *
    bias;

  return formatColor({
    r: clamp01(base.r * intensity + specular),
    g: clamp01(base.g * intensity + specular),
    b: clamp01(base.b * intensity + specular),
  });
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseColor(value: string): Rgb {
  const hex = value.trim().replace("#", "");

  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;

  if (expanded.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return { r: 0.6, g: 0.65, b: 0.68 };
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16) / 255,
    g: Number.parseInt(expanded.slice(2, 4), 16) / 255,
    b: Number.parseInt(expanded.slice(4, 6), 16) / 255,
  };
}

export function formatColor(rgb: Rgb): string {
  const channel = (value: number) =>
    Math.round(clamp01(value) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
}

export function mixColor(from: Rgb, to: Rgb, ratio: number): Rgb {
  const t = clamp01(ratio);

  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
  };
}

/* ----------------------------------------------------------------- math --- */

function dot(left: Point3, right: Point3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function add(left: Point3, right: Point3): Point3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function subtract(left: Point3, right: Point3): Point3 {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function scale(vector: Point3, factor: number): Point3 {
  return { x: vector.x * factor, y: vector.y * factor, z: vector.z * factor };
}

function normalize(vector: Point3): Point3 {
  const length = Math.hypot(vector.x, vector.y, vector.z);

  return length < 1e-9
    ? { x: 0, y: 1, z: 0 }
    : { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function polygonPath(points: readonly ScreenPoint[]): string {
  return `${points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${round(point.x)} ${round(point.y)}`,
    )
    .join(" ")} Z`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
