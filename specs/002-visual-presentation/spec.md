# SPEC-002 — Visual presentation of the public demo

Status: Implemented (pending owner approval)
Owner: naindev
Scope: `web/src`, `web/public/demo-scenarios.json`, `docs`

## Problem

The public demo at `configurator.naindev.com` has to sell the engine to a
buyer in the first screen. Today it explains the engine instead: the home page
is four sections of prose, the configurator shows the product in a small panel
to the right of five groups of radio cards, and the price lives in a header
block that scrolls out of view. A visitor reads before they see, and what they
see is a form.

The engine's strength is that the picture, the controls and the price all come
from the catalog. The presentation should make that visible without saying it.

## Solution

Rebuild the presentation layer only. No catalog contract, API contract, route,
validation rule or price computation changes.

- The home page leads with the product itself: a large interactive scene the
  visitor can rotate, one headline, one sentence, one call to action. Scenario
  cards are image-first with catalog-derived facts instead of paragraphs. The
  explanation shrinks to one strip of three steps and one strip of four facts.
- The configurator becomes a studio: the scene is the largest element on the
  page, the controls are compact tiles beside it, and the price with its two
  actions sits in a dock that is always on screen.
- Options that bind a material slot in the product's visual pack show that
  material's colour as a swatch, derived from pack data, so a finish or a paint
  reads as a colour before it reads as a word.
- Every text string that explains the architecture is cut or shortened. Any
  string an automated journey asserts on is kept verbatim.

## Requirements

Notation: EARS.

- **REQ-P-001** — When the home page loads, the shell shall show an interactive
  catalog-driven scene of a demo product above the fold, together with one
  headline, at most one sentence of copy and one primary call to action.
- **REQ-P-002** — When scenario cards render, each card shall show the
  product's default scene and facts derived from its catalog (option groups,
  options, compatibility rules) rather than hand-written descriptions longer
  than one line.
- **REQ-P-003** — When the configurator page renders at a width of 62rem or
  more, the scene shall occupy at least half of the content width and shall
  stay in view while the option list scrolls.
- **REQ-P-004** — While the configurator page is open, the local estimate and
  the validate and save actions shall remain visible without scrolling, at
  every supported viewport width from 320 CSS pixels.
- **REQ-P-005** — When an option's `visualAssetKey` appears in a slot override
  of the product's visual pack, the option control shall show the override
  material's colour as a decorative swatch; otherwise it shall show no swatch.
- **REQ-P-006** — The swatch derivation shall contain no identifier specific to
  any product, company, option or material.
- **REQ-P-007** — Every option control shall remain a native radio or checkbox
  input whose accessible name starts with the option name, so the existing
  journeys and assistive technology keep working.
- **REQ-P-008** — The redesign shall keep every interactive target at 44 by 44
  CSS pixels or more, keep text contrast at WCAG 2.2 AA in both colour schemes,
  and pass the existing axe gate on every page it touches.
- **REQ-P-009** — The redesign shall honour `prefers-reduced-motion` for every
  animation it adds.
- **REQ-P-010** — The redesign shall add no runtime dependency, no external
  font and no network call beyond those the shell already makes.

## Non-goals

- Changing the catalog contract, the API contract, the routes or the pricing
  and validation logic in `catalog.ts`.
- Changing the visual pack format or the renderer in `web/src/visual`, beyond
  reading pack data that already exists.
- Translating the interface or adding a locale.
- Replacing the shared `nain-ecosystem-bar`.

## Acceptance

- `npm test` passes, including a unit test for the swatch derivation.
- `npm run test:e2e:offline` passes on every configured project.
- `tsc -b` and `prettier --check` report nothing.
- At 1280 and 375 CSS pixels wide, in light and dark schemes, the configurator
  shows the scene, the price and both actions without scrolling.
