# SPEC-001 — Design

## The contract

A visual pack is a JSON document under `assets/visual-packs/<key>.json`, where
`<key>` is a product's `visualAssetKey`. The build step copies the directory
into `web/public/visual-packs/` so a static host serves it, and the shell loads
it lazily — the configuration flow is already interactive before it arrives.

```jsonc
{
  "schemaVersion": 1,
  "key": "Product_Desk_Modular",
  "label": "Escritorio modular",
  "camera": { "yaw": 34, "pitch": 24, "scale": 2.6, "target": [0, 38, 0] },
  "frame": { "width": 720, "height": 560 },
  "light": { "yaw": -40, "pitch": 58 },
  "vars": {
    "W": { "base": 120, "when": [{ "key": "DeskTop_160_80", "value": 160 }] }
  },
  "slots": {
    "surface": {
      "base": "oak",
      "when": [{ "key": "Material_Desk_DarkWalnut", "material": "walnut" }]
    }
  },
  "materials": { "oak": { "color": "#c08b4e", "sheen": 0.1 } },
  "parts": [
    {
      "id": "top",
      "shape": "box",
      "at": ["0", "H", "0"],
      "size": ["W", "3.6", "D"],
      "material": "slot:surface"
    }
  ]
}
```

### Binding model

The only input a pack reads is the set of `visualAssetKey` values carried by the
product and by the options currently selected. `catalog.selectedVisualKeys`
already produces that set.

| Element | Binding |
|---|---|
| `vars[*].when[*]` | first matching key wins, else `base` |
| `slots[*].when[*]` | first matching key wins, else `base` |
| `parts[*].when` | every listed key must be present |
| `parts[*].unless` | no listed key may be present |

A part with neither `when` nor `unless` is always drawn.

### Geometry vocabulary

Three primitives cover furniture and vehicles without growing into a modelling
format:

| Shape | Fields | Drawn as |
|---|---|---|
| `box` | `at`, `size` | up to three visible faces, back-face culled, Lambert-shaded |
| `tube` | `from`, `to`, `radius` | projected capsule with a highlight pass |
| `ring` | `at`, `radius`, `tube`, `plane` | 48-point sampled circle stroked at `tube` width |

Numbers in `at`, `size`, `from`, `to`, `radius` and `tube` are arithmetic
expressions over the resolved variables: `"W/2 - 6"`, `"-D/2"`, `"H"`. The
evaluator supports numbers, variable names, `+ - * /`, parentheses and unary
minus. Nothing else — no identifiers resolve to functions, no property access,
no call syntax.

### Projection

An axonometric camera with yaw and pitch, resolved per frame:

```
yaw:    x₁ = x·cos θ + z·sin θ          z₁ = z·cos θ − x·sin θ
pitch:  screenX = x₁                     screenY = z₁·sin φ − y·cos φ
depth:  z₁·cos φ + y·sin φ
```

`depth` orders every primitive back-to-front (painter's algorithm) after box
faces are split out, so a drawer behind a leg is occluded correctly without a
z-buffer.

Shading is Lambert against a declared light direction, applied by moving the
material colour along its own lightness axis. `sheen` adds a specular pass on
near-light-facing faces, which is what reads as metal on a bicycle frame.

### Motion

Resolved variables and material colours are numbers, so the transition between
two selections is a numeric interpolation, not a path morph. An animation loop
eases the live values toward the resolved target over 320 ms, and
`prefers-reduced-motion: reduce` collapses that to an immediate assignment.

## Layering

```
web/src/visual/
  types.ts        pack contract
  expression.ts   arithmetic evaluator
  resolve.ts      pack + selected keys -> concrete scene (pure)
  projection.ts   camera, projection, shading, primitive -> SVG path (pure)
  useVisualPack.ts  lazy load + cache + validation
  Stage.tsx       SVG renderer, orbit controls, motion
  ProductVisual.tsx  pack view with plate-stack fallback
```

`resolve.ts` and `projection.ts` are pure and unit-tested. `Stage.tsx` holds the
only state (camera, animated values).

## Risks

- **Pack authoring is modelling work.** Mitigated by keeping the vocabulary to
  three primitives and treating packs as data under review, not code.
- **A pack can misdescribe a product.** It cannot misprice one: REQ-V-008 keeps
  the visual outside validation, pricing and persistence, which the existing
  tests already assert.
- **Lazy load adds a failure mode.** REQ-V-009 degrades to the current view.
