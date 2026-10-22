/**
 * Pack + selected visual asset keys -> a concrete scene.
 *
 * Pure and total: every path either returns a scene or throws `PackError`, and
 * the caller treats a throw as "fall back to the accessible plate view".
 */

import { evaluateExpression } from "./expression";
import type {
  Expression,
  Material,
  Part,
  Point3,
  ResolvedGeometry,
  ResolvedPart,
  ResolvedScene,
  Vector3,
  VisualPack,
} from "./types";

export class PackError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "PackError";
  }
}

const FALLBACK_MATERIAL: Material = { color: "#9aa5ad", sheen: 0.12 };

/**
 * Overrides let the renderer draw an intermediate frame: the selection decides
 * which parts exist, while dimensions and slot colours come from values that
 * are still easing toward the ones the selection resolves to.
 */
export interface ResolveOverrides {
  values?: Readonly<Record<string, number>>;
  slotColors?: Readonly<Record<string, string>>;
}

export function resolveScene(
  pack: VisualPack,
  selectedVisualKeys: readonly string[],
  overrides: ResolveOverrides = {},
): ResolvedScene {
  const selected = new Set(selectedVisualKeys);
  const values = overrides.values ?? resolveVariables(pack, selected);
  const slots = resolveSlots(pack, selected);

  const parts = pack.parts
    .filter((part) => isVisible(part, selected))
    .map((part) =>
      resolvePart(pack, part, slots, values, overrides.slotColors ?? {}),
    );

  return {
    key: pack.key,
    label: pack.label,
    camera: pack.camera,
    frame: pack.frame,
    light: pack.light,
    ground: pack.ground ?? null,
    parts,
    values,
  };
}

/** Variable values alone, for callers that interpolate between two scenes. */
export function resolveVariables(
  pack: VisualPack,
  selected: ReadonlySet<string>,
): Record<string, number> {
  const values: Record<string, number> = Object.create(null) as Record<
    string,
    number
  >;

  for (const [name, definition] of Object.entries(pack.vars)) {
    const override = definition.when?.find((entry) => selected.has(entry.key));
    const value = override?.value ?? definition.base;

    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new PackError(`Variable "${name}" resolves to a non-number.`);
    }

    values[name] = value;
  }

  return values;
}

export function resolveSlots(
  pack: VisualPack,
  selected: ReadonlySet<string>,
): Record<string, string> {
  const slots: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;

  for (const [name, definition] of Object.entries(pack.slots)) {
    const override = definition.when?.find((entry) => selected.has(entry.key));
    slots[name] = override?.material ?? definition.base;
  }

  return slots;
}

function isVisible(part: Part, selected: ReadonlySet<string>): boolean {
  if (part.when !== undefined && !part.when.every((key) => selected.has(key))) {
    return false;
  }

  if (
    part.unless !== undefined &&
    part.unless.some((key) => selected.has(key))
  ) {
    return false;
  }

  return true;
}

function resolvePart(
  pack: VisualPack,
  part: Part,
  slots: Readonly<Record<string, string>>,
  values: Readonly<Record<string, number>>,
  slotColors: Readonly<Record<string, string>>,
): ResolvedPart {
  return {
    id: part.id,
    label: part.label ?? null,
    shape: part.shape,
    material: resolveMaterial(pack, part.material, slots, slotColors),
    geometry: resolveGeometry(part, values),
  };
}

const SLOT_PREFIX = "slot:";

export function resolveMaterial(
  pack: VisualPack,
  reference: string,
  slots: Readonly<Record<string, string>>,
  slotColors: Readonly<Record<string, string>> = {},
): Material {
  const slotName = reference.startsWith(SLOT_PREFIX)
    ? reference.slice(SLOT_PREFIX.length)
    : null;
  const name = slotName === null ? reference : slots[slotName];
  const material =
    name === undefined
      ? FALLBACK_MATERIAL
      : (pack.materials[name] ?? FALLBACK_MATERIAL);

  const override = slotName === null ? undefined : slotColors[slotName];

  return override === undefined ? material : { ...material, color: override };
}

function resolveGeometry(
  part: Part,
  values: Readonly<Record<string, number>>,
): ResolvedGeometry {
  switch (part.shape) {
    case "box":
      return {
        shape: "box",
        at: point(part.at, values, part.id),
        size: point(part.size, values, part.id),
      };
    case "tube":
      return {
        shape: "tube",
        from: point(part.from, values, part.id),
        to: point(part.to, values, part.id),
        radius: scalar(part.radius, values, part.id),
      };
    case "ring":
      return {
        shape: "ring",
        at: point(part.at, values, part.id),
        radius: scalar(part.radius, values, part.id),
        tube: scalar(part.tube, values, part.id),
        plane: part.plane,
      };
  }
}

function point(
  vector: Vector3,
  values: Readonly<Record<string, number>>,
  partId: string,
): Point3 {
  return {
    x: scalar(vector[0], values, partId),
    y: scalar(vector[1], values, partId),
    z: scalar(vector[2], values, partId),
  };
}

function scalar(
  expression: Expression,
  values: Readonly<Record<string, number>>,
  partId: string,
): number {
  try {
    return evaluateExpression(expression, values);
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);

    throw new PackError(`Part "${partId}": ${detail}`);
  }
}

/**
 * Structural validation of a document that arrived over the network.
 *
 * It checks shape, not intent: a pack that passes can still describe the wrong
 * object, but it cannot make the renderer throw at frame time.
 */
export function parsePack(document: unknown): VisualPack {
  if (!isRecord(document)) {
    throw new PackError("Pack is not an object.");
  }

  if (document.schemaVersion !== 1) {
    throw new PackError(
      `Unsupported pack schema version: ${String(document.schemaVersion)}.`,
    );
  }

  const key = requireString(document, "key");
  const label = requireString(document, "label");
  const camera = requireRecord(document, "camera");
  const frame = requireRecord(document, "frame");
  const light = requireRecord(document, "light");

  const pack: VisualPack = {
    schemaVersion: 1,
    key,
    label,
    camera: {
      yaw: requireNumber(camera, "yaw"),
      pitch: requireNumber(camera, "pitch"),
      scale: requireNumber(camera, "scale"),
      target: requireTriple(camera, "target"),
    },
    frame: {
      width: requireNumber(frame, "width"),
      height: requireNumber(frame, "height"),
    },
    light: {
      yaw: requireNumber(light, "yaw"),
      pitch: requireNumber(light, "pitch"),
    },
    ground: parseGround(document.ground),
    vars: parseVars(document.vars),
    slots: parseSlots(document.slots),
    materials: parseMaterials(document.materials),
    parts: parseParts(document.parts),
  };

  // Resolving against the empty selection proves every default expression is
  // computable, so a malformed pack fails on load instead of mid-interaction.
  resolveScene(pack, []);

  return pack;
}

function parseGround(value: unknown): VisualPack["ground"] {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new PackError("`ground` must be an object or null.");
  }

  return {
    spreadX: requireNumber(value, "spreadX"),
    spreadZ: requireNumber(value, "spreadZ"),
  };
}

function parseVars(value: unknown): VisualPack["vars"] {
  const source = optionalRecord(value, "vars");
  const vars: VisualPack["vars"] = {};

  for (const [name, definition] of Object.entries(source)) {
    if (!isRecord(definition)) {
      throw new PackError(`Variable "${name}" must be an object.`);
    }

    vars[name] = {
      base: requireNumber(definition, "base"),
      when: parseWhen(definition.when, name, (entry) => ({
        key: requireString(entry, "key"),
        value: requireNumber(entry, "value"),
      })),
    };
  }

  return vars;
}

function parseSlots(value: unknown): VisualPack["slots"] {
  const source = optionalRecord(value, "slots");
  const slots: VisualPack["slots"] = {};

  for (const [name, definition] of Object.entries(source)) {
    if (!isRecord(definition)) {
      throw new PackError(`Slot "${name}" must be an object.`);
    }

    slots[name] = {
      base: requireString(definition, "base"),
      when: parseWhen(definition.when, name, (entry) => ({
        key: requireString(entry, "key"),
        material: requireString(entry, "material"),
      })),
    };
  }

  return slots;
}

function parseWhen<T>(
  value: unknown,
  owner: string,
  read: (entry: Record<string, unknown>) => T,
): T[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new PackError(`"${owner}.when" must be an array.`);
  }

  return value.map((entry) => {
    if (!isRecord(entry)) {
      throw new PackError(`"${owner}.when" entries must be objects.`);
    }

    return read(entry);
  });
}

function parseMaterials(value: unknown): VisualPack["materials"] {
  const source = optionalRecord(value, "materials");
  const materials: VisualPack["materials"] = {};

  for (const [name, definition] of Object.entries(source)) {
    if (!isRecord(definition)) {
      throw new PackError(`Material "${name}" must be an object.`);
    }

    materials[name] = {
      color: requireString(definition, "color"),
      sheen: optionalNumber(definition, "sheen"),
      opacity: optionalNumber(definition, "opacity"),
      emissive: definition.emissive === true,
    };
  }

  return materials;
}

function parseParts(value: unknown): Part[] {
  if (!Array.isArray(value)) {
    throw new PackError("`parts` must be an array.");
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new PackError(`Part ${index} must be an object.`);
    }

    const common = {
      id: requireString(entry, "id"),
      when: optionalStringArray(entry, "when"),
      unless: optionalStringArray(entry, "unless"),
      material: requireString(entry, "material"),
      label: typeof entry.label === "string" ? entry.label : undefined,
    };

    switch (entry.shape) {
      case "box":
        return {
          ...common,
          shape: "box",
          at: requireVector(entry, "at"),
          size: requireVector(entry, "size"),
        };
      case "tube":
        return {
          ...common,
          shape: "tube",
          from: requireVector(entry, "from"),
          to: requireVector(entry, "to"),
          radius: requireExpression(entry, "radius"),
        };
      case "ring": {
        const plane = requireString(entry, "plane");

        if (plane !== "xy" && plane !== "xz" && plane !== "yz") {
          throw new PackError(`Part "${common.id}": unknown plane "${plane}".`);
        }

        return {
          ...common,
          shape: "ring",
          at: requireVector(entry, "at"),
          radius: requireExpression(entry, "radius"),
          tube: requireExpression(entry, "tube"),
          plane,
        };
      }
      default:
        throw new PackError(
          `Part "${common.id}": unknown shape "${String(entry.shape)}".`,
        );
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    throw new PackError(`\`${field}\` must be an object.`);
  }

  return value;
}

function requireRecord(
  record: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  const value = record[field];

  if (!isRecord(value)) {
    throw new PackError(`\`${field}\` must be an object.`);
  }

  return value;
}

function requireString(record: Record<string, unknown>, field: string): string {
  const value = record[field];

  if (typeof value !== "string" || value.length === 0) {
    throw new PackError(`\`${field}\` must be a non-empty string.`);
  }

  return value;
}

function requireNumber(record: Record<string, unknown>, field: string): number {
  const value = record[field];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new PackError(`\`${field}\` must be a finite number.`);
  }

  return value;
}

function optionalNumber(
  record: Record<string, unknown>,
  field: string,
): number | undefined {
  return record[field] === undefined ? undefined : requireNumber(record, field);
}

function optionalStringArray(
  record: Record<string, unknown>,
  field: string,
): string[] | undefined {
  const value = record[field];

  if (value === undefined) {
    return undefined;
  }

  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new PackError(`\`${field}\` must be an array of strings.`);
  }

  return value as string[];
}

function requireExpression(
  record: Record<string, unknown>,
  field: string,
): Expression {
  const value = record[field];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new PackError(`\`${field}\` must be a number or an expression.`);
}

function requireVector(
  record: Record<string, unknown>,
  field: string,
): Vector3 {
  const value = record[field];

  if (!Array.isArray(value) || value.length !== 3) {
    throw new PackError(`\`${field}\` must be an array of three entries.`);
  }

  const entries = value.map((_, index) =>
    requireExpression(
      value as unknown as Record<string, unknown>,
      String(index),
    ),
  );

  return [entries[0], entries[1], entries[2]] as Vector3;
}

function requireTriple(
  record: Record<string, unknown>,
  field: string,
): [number, number, number] {
  const value = record[field];

  if (!Array.isArray(value) || value.length !== 3) {
    throw new PackError(`\`${field}\` must be an array of three numbers.`);
  }

  const numbers = value.map((entry, index) => {
    if (typeof entry !== "number" || !Number.isFinite(entry)) {
      throw new PackError(`\`${field}[${index}]\` must be a finite number.`);
    }

    return entry;
  });

  return [numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0];
}
