# SPEC-002 — Tasks

Labels: `[A]` done unattended · `[M]` mixed, needs an owner action to close ·
`[H]` owner only.

| #     | Task                                | Label | Done when                                                                                           | State |
| ----- | ----------------------------------- | ----- | --------------------------------------------------------------------------------------------------- | ----- |
| T-001 | Swatch derivation from pack slots   | `[A]` | `swatchColorsFor` returns the override colours for a key and nothing for an unbound key, with tests | Done  |
| T-002 | Stylesheet rewrite                  | `[A]` | Same tokens; hero, tiles, studio grid, dock and receipt styles; reduced motion honoured             | Done  |
| T-003 | Home page                           | `[A]` | Interactive hero scene with scenario switcher, fact tiles, image-first cards, three-step strip      | Done  |
| T-004 | Configurator studio layout          | `[A]` | Scene ≥ 50 % and sticky at ≥ 62rem; dock with estimate and both actions always visible              | Done  |
| T-005 | Option tiles with swatches          | `[A]` | Native inputs kept; swatch shown only for slot-bound keys                                           | Done  |
| T-006 | Saved configuration receipt         | `[A]` | Frozen estimate as focal point; quote form unchanged                                                | Done  |
| T-007 | Scenario manifest                   | `[A]` | Descriptions fit one line                                                                           | Done  |
| T-008 | Verification                        | `[A]` | Unit, type-check, format and offline e2e pass; screenshots at 1280 and 375 in both schemes          | Done  |
| T-009 | Docs                                | `[A]` | `web/README.md` describes the studio layout and swatches                                            | Done  |
| T-010 | Approve SPEC-002                    | `[H]` | Status moves to Approved                                                                            | Open  |
| T-011 | Review the copy on the public pages | `[H]` | Headline, fact strip and step lines are the owner's words                                           | Open  |

## Handoff

- Done and verified in this session: unit tests (87), `tsc -b`, Prettier,
  and the 20 offline Playwright journeys on Chromium, Firefox, WebKit and
  mobile Chromium, axe gate included. Screenshots were taken at 1280×800 (light
  and dark) and 375×812 (dark).
- The shared `nain-ecosystem-bar` is a fixed 38px strip. The stylesheet now
  clears it with `body:has(nain-ecosystem-bar)`; before this slice it covered the
  site header on every page.
- Not done: the full-stack Playwright config (needs SQL Server and the .NET
  host). The saved-configuration page was restyled, not restructured.
- Next: owner review of the copy (T-011) and of SPEC-002 (T-010). A follow-up
  worth considering is a short auto-orbit on the home hero while the pointer is
  idle, behind `prefers-reduced-motion`.
