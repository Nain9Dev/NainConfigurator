# SPEC-next-pwa-install — Plan

## Modules

- **Manifest**: `web/public/manifest.webmanifest`, a static file. Vite copies
  `web/public/` unchanged to the root of `web/dist` (REQ-CFG-012, 12.1, 12.2).
- **Icons**: `web/public/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon}.png`,
  rendered from the existing mark `web/public/favicon.svg` (12.2, 12.3).
- **Head tags**: `web/index.html`, the single document of the site (12.4).
- **Guard**: `web/src/install.test.ts`, picked up by `vitest run` (12.5).

## Publishing path

`.github/workflows/pages.yml` builds in `web/` with `VITE_BASE_PATH=/`, copies
`dist/index.html` to `dist/404.html` and uploads `web/dist`. There is no copy
list that names files one by one, so the workflow is not touched. The manifest
and icons are real files and win over the 404 fallback.

## Icon command

The mark already sits on a dark rounded tile (`#0e1512`), so that colour is the
background of the maskable and Apple icons. At scale 0.8 the farthest corner of
the bars is about 30% of the width from the centre, inside the 40% safe zone.

```
node make-install-icons.mjs --source web/public/favicon.svg --out web/public/icons --bg "#0e1512" --maskable-scale 0.8
```

## Key decisions

- **Decision**: static manifest, no service worker. **Rationale**: Chrome and
  iOS install without one, and the demo is already fully client-side. Adding
  one later needs its own ADR.
- **Decision**: `theme_color` and `background_color` are `#f2f0e9`, the light
  `theme-color` the page already declares. **Rationale**: the light scheme is
  the default; the page still switches per colour scheme once loaded.
- **Decision**: status bar style `default`. **Rationale**: the default page is
  light; `black-translucent` would draw the page under the status bar.
- **Decision**: the test reads PNG sizes through Vite `?inline` imports.
  **Rationale**: the web client's TypeScript config has no Node typings and the
  change adds no dependency.

## Test strategy

- Vitest contract test: manifest members and names, icon files and their IHDR
  size, head tags of `index.html`.
- Manual, with the ecosystem checkers: install-file verifier and a Chrome
  `Page.getInstallabilityErrors` probe on the built `web/dist`.
- After the deploy: the owner's Android phone and iPhone.
