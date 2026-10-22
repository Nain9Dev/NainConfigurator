# SPEC-001 — Tasks

Labels: `[A]` done unattended · `[M]` mixed, needs an owner action to close ·
`[H]` owner only.

## Done

| # | Task | Label | Done when | State |
|---|---|---|---|---|
| T-001 | Visual pack contract (`web/src/visual/types.ts`) | `[A]` | Schema version 1 covers vars, slots, materials and three primitives | Done |
| T-002 | Closed arithmetic evaluator | `[A]` | Resolves only declared variables; rejects calls, property access and prototype members, with tests | Done |
| T-003 | Pack resolver and structural parser | `[A]` | Selected keys resolve vars, slots and part visibility; a malformed document is rejected on load, with tests | Done |
| T-004 | Projection, culling, shading and painter sort | `[A]` | Box, tube and ring project with back-face culling and deterministic shading, with tests | Done |
| T-005 | SVG stage with orbit and motion | `[A]` | Pointer and keyboard orbit, reset control, eased dimensions and colours, reduced-motion honoured | Done |
| T-006 | Lazy pack loading with fallback | `[A]` | A missing or malformed pack degrades to the plate view without breaking the flow | Done |
| T-007 | Desk visual pack | `[A]` | Size, finish, legs, pedestal side and four accessories are visible | Done |
| T-008 | Bicycle visual pack | `[A]` | Frame size, style, drive, brakes and three accessories are visible, same renderer | Done |
| T-009 | Build step stages and validates packs | `[A]` | `npm run catalog` rejects a pack whose file name and `key` disagree | Done |
| T-010 | Inline compatibility-rule feedback | `[A]` | The conflicting option and the options that resolve it are marked, in words as well as colour | Done |
| T-011 | Home page purpose, contrast and architecture flow | `[A]` | A visitor can state what the product is for before scrolling twice | Done |
| T-012 | Live catalog-driven preview on each scenario card | `[A]` | The card shows the product's default configuration from the catalog | Done |
| T-013 | Subdomain metadata | `[A]` | Title, description, canonical, favicon, Open Graph, Twitter card, robots and sitemap | Done |
| T-014 | Cross-browser journeys and axe gate updated | `[A]` | 20 offline journeys pass on Chromium, Firefox, WebKit and mobile Chromium | Done |
| T-015 | `--ink-faint` raised to WCAG 2.2 AA | `[A]` | 4.97:1 on canvas, 5.41:1 on paper; the axe gate passes | Done |
| T-016 | `ARCH-020`, architecture section and asset README | `[A]` | The decision is recorded in `Proposed` state with its rejected alternatives | Done |

## Open

| # | Task | Label | Done when |
|---|---|---|---|
| T-017 | Approve or reject `ARCH-020` | `[H]` | The decision log entry moves to `Approved` or `Superseded` |
| T-018 | Manual screen-reader pass over the configurator | `[M]` | NVDA or VoiceOver reaches and operates every control, including the stage |
| T-019 | Decide whether the public demo should be indexable | `[H]` | `robots.txt` and the page metadata match the decision |

## Notes for the next session

- The accessibility gate excludes `nain-ecosystem-bar`. That shared component,
  served from `www.naindev.com` and owned by `nain9dev.github.io`, fails AA
  contrast at narrow widths on its own "Proyectos (17)" trigger. It affects
  every site that embeds the bar and should be fixed in its own repository.
- `web/public/visual-packs/` is generated. The authored source is
  `assets/visual-packs/`.
- The full-stack Playwright config still needs SQL Server and the .NET host; only
  the offline config was exercised in this session.
