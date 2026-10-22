# SPEC-001 — Catalog-driven product visualization

Status: Implemented (pending owner approval)
Owner: naindev
Scope: `web`, `assets/visual-packs`, `docs`

## Problem

The commercial shell renders any product from catalog data alone, which is the
architectural claim the repository exists to prove. The preview panel, however,
draws an abstract stack of coloured isometric plates: one plate per selected
`visualAssetKey`. It is product-agnostic and accessible, but it does not look
like the product being configured.

A buyer evaluating a configurator does not read the option list to picture the
result. They look at the picture. A preview that shows neither a desk nor a
bicycle makes the demo read as an unfinished prototype, which hides the part
that is actually finished: the catalog-driven engine behind it.

The obvious fix — draw a desk in `DeskPreview.tsx` and a bicycle in
`BikePreview.tsx` — destroys the claim. Per-product rendering code is exactly
the customer fork the product promises to avoid.

## Solution

Move the drawing *instructions* into catalog-resolved data and keep the
renderer generic.

A **visual pack** is a declarative scene recipe addressed by the product's
existing `visualAssetKey`. It declares named dimensions, material slots,
materials and parts. Part visibility, dimension values and material slots are
bound to the `visualAssetKey` values the catalog already carries on every
option, so the selection the user makes drives the drawing without the renderer
knowing what it is drawing.

Nothing in `web/src/visual` names a desk, a bicycle, a drawer or a wheel.

## Requirements

Notation: EARS.

- **REQ-V-001** — When a product catalog declares a `visualAssetKey` for which a
  visual pack exists, the shell shall render that pack instead of the abstract
  plate stack.
- **REQ-V-002** — When no pack exists for the product, the shell shall fall back
  to the existing accessible plate view without error.
- **REQ-V-003** — When the user changes a selection, the shell shall re-resolve
  part visibility, dimensions and materials from the pack and the resulting set
  of selected visual asset keys only.
- **REQ-V-004** — The renderer shall contain no identifier, branch or constant
  specific to any product, company or option.
- **REQ-V-005** — While resolved dimensions or material colours change, the
  shell shall interpolate between the previous and next values over a bounded
  duration, unless the user has requested reduced motion, in which case it shall
  apply them immediately.
- **REQ-V-006** — The user shall be able to orbit the scene with pointer drag,
  with the keyboard while the stage has focus, and to restore the pack's
  declared camera.
- **REQ-V-007** — The stage shall expose a text alternative naming the product
  and the parts currently visible, and shall remain operable from the keyboard
  alone.
- **REQ-V-008** — The visual state shall never participate in validation,
  pricing or persistence.
- **REQ-V-009** — A pack that fails to load or fails validation shall degrade to
  REQ-V-002 and shall not block configuration, validation, saving or quoting.
- **REQ-V-010** — Rendering shall require no WebGL context, no binary asset and
  no network call beyond the pack document itself.

## Non-goals

- Photorealism. The pack format describes massing, proportion and material
  colour, not materials in the physically-based sense.
- Replacing the deferred Babylon.js runtime. A pack is a projection-independent
  scene description; a future WebGL adapter may consume the same document.
- Moving the pack into SQL Server. Packs are published assets addressed by
  `visualAssetKey`, exactly as a GLB would be. The public API contract, the
  database schema and the migrations are unchanged by this slice.

## Acceptance

- `web` unit tests cover expression evaluation, pack resolution against selected
  keys, projection and the fallback path.
- The desk pack visibly changes width when the board size changes, changes
  colour when the finish changes, gains a drawer on the declared side, and gains
  a lift column when electric legs are selected.
- The bicycle pack renders a recognisable bicycle from the same renderer with no
  code change.
- Axe reports no violation on the configurator page in both colour schemes.
