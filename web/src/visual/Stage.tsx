/**
 * The SVG stage.
 *
 * It owns exactly two pieces of state — the orbit offset and the eased values —
 * and no knowledge of any product. Everything on screen comes from the pack and
 * from the set of selected visual asset keys.
 */

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildPrimitives,
  createProjector,
  fitHalfExtent,
  formatColor,
  lightVector,
  parseColor,
  sceneExtent,
  type Primitive,
  type SceneExtent,
} from "./projection";
import { resolveScene, resolveSlots, resolveVariables } from "./resolve";
import type { Point3, VisualPack } from "./types";
import { useEasedRecord } from "./useEased";

const MIN_PITCH = -8;
const MAX_PITCH = 78;
const KEYBOARD_YAW_STEP = 7;
const KEYBOARD_PITCH_STEP = 5;
const FIT_MARGIN = 1.06;

interface Orbit {
  yaw: number;
  pitch: number;
}

const NO_ORBIT: Orbit = { yaw: 0, pitch: 0 };

export function Stage({
  pack,
  selectedVisualKeys,
  productName,
  interactive = true,
  aspect,
}: {
  pack: VisualPack;
  selectedVisualKeys: readonly string[];
  productName: string;
  /** A preview embedded in a card is a picture, not a control. */
  interactive?: boolean;
  /** Width over height, when the host needs a shape the pack did not declare. */
  aspect?: number;
}) {
  const frameAspect = aspect ?? pack.frame.width / pack.frame.height;
  const [orbit, setOrbit] = useState<Orbit>(NO_ORBIT);
  const [isDragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const gradientId = useId();

  const selected = useMemo(
    () => new Set(selectedVisualKeys),
    [selectedVisualKeys],
  );

  const targetValues = useMemo(
    () => resolveVariables(pack, selected),
    [pack, selected],
  );

  const targetChannels = useMemo(
    () => slotChannels(pack, selected),
    [pack, selected],
  );

  const values = useEasedRecord(targetValues);
  const channels = useEasedRecord(targetChannels);

  const scene = useMemo(
    () =>
      resolveScene(pack, selectedVisualKeys, {
        values,
        slotColors: channelsToColors(channels),
      }),
    [pack, selectedVisualKeys, values, channels],
  );

  const extent = useMemo(() => sceneExtent(scene.parts), [scene.parts]);

  const projector = useMemo(
    () =>
      createProjector({
        yaw: pack.camera.yaw + orbit.yaw,
        pitch: clamp(pack.camera.pitch + orbit.pitch, MIN_PITCH, MAX_PITCH),
        // Scene units are the drawing units; the viewBox does the scaling.
        scale: 1,
        target: [
          extent.center.x + pack.camera.target[0],
          extent.center.y + pack.camera.target[1],
          extent.center.z + pack.camera.target[2],
        ],
      }),
    [pack.camera, orbit, extent.center],
  );

  // Keeping the key light at a fixed angle to the camera means the object is
  // still readable after the viewer has orbited behind it.
  const light = useMemo(
    () =>
      lightVector({
        yaw: pack.camera.yaw + orbit.yaw + pack.light.yaw,
        pitch: pack.light.pitch,
      }),
    [pack.camera.yaw, pack.light, orbit.yaw],
  );

  const drawing = useMemo(
    () => buildPrimitives(scene.parts, projector, light),
    [scene.parts, projector, light],
  );

  // The contact shadow may bleed past the frame; the object never does.
  const fit = fitHalfExtent(extent, projector, frameAspect);
  const zoom = (pack.camera.scale || 1) / FIT_MARGIN;
  const half = { x: fit.x / zoom, y: fit.y / zoom };

  const shadow = useMemo(
    () =>
      pack.ground === null ? null : groundPath(pack.ground, extent, projector),
    [pack.ground, extent, projector],
  );

  const visibleLabels = scene.parts
    .map((part) => part.label)
    .filter((label): label is string => label !== null);

  const hintId = `${gradientId}-hint`;

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") {
      return;
    }

    drag.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current;

    if (start === null) {
      return;
    }

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    drag.current = { x: event.clientX, y: event.clientY };

    setOrbit((current) => ({
      yaw: current.yaw - dx * 0.4,
      pitch: clamp(
        current.pitch + dy * 0.3,
        MIN_PITCH - pack.camera.pitch,
        MAX_PITCH - pack.camera.pitch,
      ),
    }));
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = null;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, Orbit> = {
      ArrowLeft: { yaw: -KEYBOARD_YAW_STEP, pitch: 0 },
      ArrowRight: { yaw: KEYBOARD_YAW_STEP, pitch: 0 },
      ArrowUp: { yaw: 0, pitch: -KEYBOARD_PITCH_STEP },
      ArrowDown: { yaw: 0, pitch: KEYBOARD_PITCH_STEP },
    };

    if (event.key === "Home" || event.key === "Escape") {
      event.preventDefault();
      setOrbit(NO_ORBIT);
      return;
    }

    const move = moves[event.key];

    if (move === undefined) {
      return;
    }

    event.preventDefault();
    setOrbit((current) => ({
      yaw: current.yaw + move.yaw,
      pitch: clamp(
        current.pitch + move.pitch,
        MIN_PITCH - pack.camera.pitch,
        MAX_PITCH - pack.camera.pitch,
      ),
    }));
  }

  const isRotated = orbit.yaw !== 0 || orbit.pitch !== 0;

  const label = `${productName}. Vista tridimensional generada desde el catálogo${
    visibleLabels.length > 0 ? `: ${visibleLabels.join(", ")}.` : "."
  }`;

  const controls = interactive
    ? {
        "aria-describedby": hintId,
        onKeyDown,
        onPointerCancel: endDrag,
        onPointerDown: beginDrag,
        onPointerMove: moveDrag,
        onPointerUp: endDrag,
        tabIndex: 0,
      }
    : {};

  return (
    <div className={`stage${interactive ? "" : " is-static"}`}>
      <div
        {...controls}
        aria-label={label}
        className={`stage-surface${isDragging ? " is-dragging" : ""}`}
        role="img"
        style={{ aspectRatio: `${frameAspect}` }}
      >
        <svg
          aria-hidden="true"
          className="stage-svg"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`${-half.x} ${-half.y} ${half.x * 2} ${half.y * 2}`}
        >
          <defs>
            <radialGradient id={`${gradientId}-shadow`}>
              <stop
                offset="0%"
                stopColor="var(--stage-shadow)"
                stopOpacity="0.55"
              />
              <stop
                offset="62%"
                stopColor="var(--stage-shadow)"
                stopOpacity="0.22"
              />
              <stop
                offset="100%"
                stopColor="var(--stage-shadow)"
                stopOpacity="0"
              />
            </radialGradient>
          </defs>

          {shadow !== null && (
            <path d={shadow} fill={`url(#${gradientId}-shadow)`} />
          )}

          {drawing.primitives.map((primitive, index) => (
            <PrimitiveShape
              key={`${primitive.id}-${index}`}
              primitive={primitive}
            />
          ))}
        </svg>
      </div>

      {interactive && (
        <div className="stage-controls">
          <p className="stage-hint" id={hintId}>
            Arrastra para girar. Con el foco puesto, usa las flechas.
          </p>
          <button
            className="stage-reset"
            disabled={!isRotated}
            onClick={() => setOrbit(NO_ORBIT)}
            type="button"
          >
            Restablecer vista
          </button>
        </div>
      )}
    </div>
  );
}

function PrimitiveShape({ primitive }: { primitive: Primitive }) {
  return (
    <g className="stage-part" opacity={primitive.opacity}>
      <path
        d={primitive.path}
        fill={primitive.fill ?? "none"}
        stroke={primitive.stroke ?? "none"}
        strokeLinecap={primitive.kind === "stroke" ? "round" : "round"}
        strokeLinejoin="round"
        strokeWidth={primitive.strokeWidth}
      />
      {primitive.highlight !== null && (
        <path
          d={primitive.highlight.path}
          fill="none"
          opacity={0.75}
          stroke={primitive.highlight.stroke}
          strokeLinecap="round"
          strokeWidth={primitive.highlight.strokeWidth}
        />
      )}
    </g>
  );
}

/** The contact shadow: the scene's own footprint, spread and laid on the floor. */
function groundPath(
  ground: { spreadX: number; spreadZ: number },
  extent: SceneExtent,
  projector: ReturnType<typeof createProjector>,
): string {
  const segments = 40;
  const points: string[] = [];
  const radiusX = ((extent.max.x - extent.min.x) / 2) * ground.spreadX;
  const radiusZ = ((extent.max.z - extent.min.z) / 2) * ground.spreadZ;

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const projected = projector.point({
      x: extent.center.x + Math.cos(angle) * radiusX,
      y: extent.floor,
      z: extent.center.z + Math.sin(angle) * radiusZ,
    });

    points.push(
      `${index === 0 ? "M" : "L"} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`,
    );
  }

  return `${points.join(" ")} Z`;
}

/**
 * Slot colours as plain numbers, so the easing hook can interpolate them the
 * same way it interpolates a dimension.
 */
function slotChannels(
  pack: VisualPack,
  selected: ReadonlySet<string>,
): Record<string, number> {
  const slots = resolveSlots(pack, selected);
  const channels: Record<string, number> = {};

  for (const [slot, materialName] of Object.entries(slots)) {
    const material = pack.materials[materialName];
    const rgb = parseColor(material?.color ?? "#9aa5ad");

    channels[`${slot}.r`] = rgb.r;
    channels[`${slot}.g`] = rgb.g;
    channels[`${slot}.b`] = rgb.b;
  }

  return channels;
}

function channelsToColors(
  channels: Readonly<Record<string, number>>,
): Record<string, string> {
  const colors: Record<string, string> = {};

  for (const key of Object.keys(channels)) {
    if (!key.endsWith(".r")) {
      continue;
    }

    const slot = key.slice(0, -2);

    colors[slot] = formatColor({
      r: channels[`${slot}.r`] ?? 0,
      g: channels[`${slot}.g`] ?? 0,
      b: channels[`${slot}.b`] ?? 0,
    });
  }

  return colors;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}
