# Web configurator

The React shell renders every control from the public catalog contract. It does not contain product-specific field names or pricing branches.

The browser owns only transient selection state and a non-authoritative local estimate. SQL-backed API validation remains authoritative before configuration or quote persistence.

Technical-demo forms accept synthetic data only. The local API rejects quote email addresses that do not end in `.invalid`.

## Scripts

| Command                    | What it does                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run start`            | Dev server on `http://127.0.0.1:5180`, offline catalog, no backend required                                          |
| `npm run catalog`          | Projects the SQL seed into `public/offline-catalog.json` and stages `assets/visual-packs` into `public/visual-packs` |
| `npm test`                 | Unit tests                                                                                                           |
| `npm run test:e2e:offline` | Journeys on Chromium, Firefox, WebKit and mobile Chromium, with an axe gate                                          |
| `npm run build`            | Runs `catalog`, type-checks, then builds                                                                             |

`public/offline-catalog.json` and `public/visual-packs/` are generated. Edit the sources instead: `database/demo/technical-demo-catalogs.json` and `assets/visual-packs/`.

## `src/visual` — the scene renderer

A generic interpreter for **visual packs**: declarative scene documents addressed by a product's `visualAssetKey` (`ARCH-020`, `specs/001-catalog-driven-visualization`). Nothing in this directory may name a product, a company or an option.

| File               | Responsibility                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `types.ts`         | The pack contract, schema version 1                                                               |
| `expression.ts`    | Closed arithmetic over a pack's own variables — no `eval`, no identifier the pack did not declare |
| `resolve.ts`       | Pure: pack + selected visual keys → a concrete scene; also the structural parser                  |
| `projection.ts`    | Pure: axonometric camera, back-face culling, Lambert and Blinn shading, painter sort, framing     |
| `useVisualPack.ts` | Lazy load, memoise, validate; a failure resolves to "absent"                                      |
| `useEased.ts`      | Interpolates dimensions and slot colours; honours `prefers-reduced-motion`                        |
| `Stage.tsx`        | The SVG surface, orbit controls and the only state in the directory                               |
| `swatches.ts`      | Pure: the colours a visual asset key binds through slot overrides, for option tiles               |

## Presentation

The shell is laid out as a studio (`specs/002-visual-presentation`): the scene is the largest element on the configurator page and stays pinned beside the option tiles on wide viewports, and the local estimate with the validate and save actions sits in a dock that is always on screen. The home page leads with the same scene, rotatable, before any explanation.

Option tiles are native radios and checkboxes. When a product's pack binds an option's visual asset key to a material slot, the tile shows that material's colour, read from pack data alone.

`resolve.ts` and `projection.ts` are pure and unit-tested, which is where the behaviour that matters lives.

The panel falls back to the accessible plate view when a product has no pack, when the pack cannot be fetched, or when it fails validation. That fallback is also the SL-002 view the optional Babylon.js renderer from SL-007 may replace through the approved adapter. Neither view takes part in validation, pricing or persistence.
