/**
 * The visual pack contract (schema version 1).
 *
 * A pack is a declarative scene recipe addressed by a product's
 * `visualAssetKey`. It is data, not code: the only thing it can read is the set
 * of `visualAssetKey` values the catalog attaches to the product and to the
 * currently selected options.
 *
 * Nothing in this directory may name a product, a company or an option.
 */

/** An arithmetic expression over the pack's resolved variables, or a number. */
export type Expression = number | string;

export type Vector3 = [Expression, Expression, Expression];

export interface VariableDefinition {
  base: number;
  /** First entry whose key is selected wins; otherwise `base`. */
  when?: Array<{ key: string; value: number }>;
}

export interface SlotDefinition {
  base: string;
  /** First entry whose key is selected wins; otherwise `base`. */
  when?: Array<{ key: string; material: string }>;
}

export interface Material {
  /** Base colour, `#rgb` or `#rrggbb`. */
  color: string;
  /** Specular response in [0, 1]. Low reads as wood, high reads as metal. */
  sheen?: number;
  /** Surface opacity in [0, 1]. */
  opacity?: number;
  /** Self-lit surfaces (lamps, screens) ignore the shading pass. */
  emissive?: boolean;
}

interface PartCommon {
  id: string;
  /** Every listed visual asset key must be selected. */
  when?: string[];
  /** No listed visual asset key may be selected. */
  unless?: string[];
  /** `slot:<name>` resolves through `slots`; anything else names a material. */
  material: string;
  /** Short human label, used to build the stage's text alternative. */
  label?: string;
}

export interface BoxPart extends PartCommon {
  shape: "box";
  /** Centre of the box. */
  at: Vector3;
  /** Full extent on each axis. */
  size: Vector3;
}

export interface TubePart extends PartCommon {
  shape: "tube";
  from: Vector3;
  to: Vector3;
  radius: Expression;
}

export interface RingPart extends PartCommon {
  shape: "ring";
  at: Vector3;
  radius: Expression;
  /** Stroke thickness of the ring itself. */
  tube: Expression;
  /** Plane the circle lies in. */
  plane: "xy" | "xz" | "yz";
}

export type Part = BoxPart | TubePart | RingPart;

export interface Camera {
  /** Degrees around the vertical axis. */
  yaw: number;
  /** Degrees above the horizon. */
  pitch: number;
  /** Pixels per catalog unit. */
  scale: number;
  /** Scene point the camera is aimed at. */
  target: [number, number, number];
}

export interface VisualPack {
  schemaVersion: 1;
  key: string;
  label: string;
  camera: Camera;
  frame: { width: number; height: number };
  /** Direction the key light comes from, in the same angular terms as a camera. */
  light: { yaw: number; pitch: number };
  /**
   * Contact shadow footprint, as a multiple of the scene's own half-extent on
   * each axis. Relative rather than absolute so the shadow grows with the
   * object. `null` for a floating object; the field may be omitted in the
   * document, and the parser normalises it.
   */
  ground: { spreadX: number; spreadZ: number } | null;
  vars: Record<string, VariableDefinition>;
  slots: Record<string, SlotDefinition>;
  materials: Record<string, Material>;
  parts: Part[];
}

/** A part after visibility, dimensions and material have been resolved. */
export interface ResolvedPart {
  id: string;
  label: string | null;
  shape: Part["shape"];
  material: Material;
  /** Geometry in scene units, already numeric. */
  geometry: ResolvedGeometry;
}

export type ResolvedGeometry =
  | { shape: "box"; at: Point3; size: Point3 }
  | { shape: "tube"; from: Point3; to: Point3; radius: number }
  | {
      shape: "ring";
      at: Point3;
      radius: number;
      tube: number;
      plane: "xy" | "xz" | "yz";
    };

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface ResolvedScene {
  key: string;
  label: string;
  camera: Camera;
  frame: { width: number; height: number };
  light: { yaw: number; pitch: number };
  ground: { spreadX: number; spreadZ: number } | null;
  parts: ResolvedPart[];
  /** Variable values behind this scene, exposed so motion can interpolate them. */
  values: Record<string, number>;
}
