# SPEC-next-pwa-install — Installable public demo

Status: Implemented (pending owner approval)
Owner: naindev
Scope: `web/index.html`, `web/public`, `web/src/install.test.ts`, `docs`

## Problem

`configurator.naindev.com` publishes no web app manifest, so a phone offers no
install entry and a home-screen shortcut opens in a browser tab with a generic
icon. The owner wants every public product site of the ecosystem to install
like an app: its own icon and name, and a window with no browser bar.

The shared contract and the verified browser criteria (Chrome on Android,
Safari on iOS) live in the portfolio repository, `specs/next-pwa-install`
(`www.naindev.com`). This spec applies them to this site and does not restate
them.

## Solution

Installable only. No service worker, no cache, no offline page and no install
button (owner decision of 2026-11-13).

- `web/public/manifest.webmanifest` and `web/public/icons/` are copied by Vite
  to the root of `web/dist`, which `pages.yml` uploads unchanged.
- `web/index.html`, the only document the site serves (`404.html` is a copy of
  it), links the manifest and carries the iOS tags.
- The names are fixed by the owner: `short_name` `NainConfig`, `name`
  `NainConfigurator`.

## Requirements (EARS)

- **REQ-CFG-012 (Installable Public Demo)**: When a visitor opens the public
  demo on a phone, the site shall be installable from Chrome on Android and
  Safari on iOS, as defined by the sub-requirements below.
  - **12.1**: The site shall publish `/manifest.webmanifest` declaring `id`,
    `start_url` and `scope` as `/`, `display` as `standalone`, `lang` as `es`,
    `dir` as `ltr`, `name` as `NainConfigurator`, `short_name` as `NainConfig`,
    the page's meta description as `description`, and `theme_color` and
    `background_color` as `#f2f0e9`. It shall not declare
    `prefer_related_applications`.
  - **12.2**: The manifest shall declare three PNG icons that exist at the
    declared size: 192 px and 512 px with purpose `any`, and 512 px with
    purpose `maskable`, one purpose per entry.
  - **12.3**: The maskable icon shall be opaque edge to edge with the mark
    inside the centred circle whose radius is 40% of the width, and
    `/icons/apple-touch-icon.png` shall be a 180 px opaque PNG.
  - **12.4**: The served document shall link the manifest and
    `apple-touch-icon`, set `mobile-web-app-capable` and
    `apple-mobile-web-app-capable` to `yes`, set `apple-mobile-web-app-title`
    to the manifest `short_name` and `apple-mobile-web-app-status-bar-style` to
    `default`.
  - **12.5**: `npm test` in `web/` shall fail if 12.1, 12.2 or 12.4 regress.

## Edge cases and error handling

- The SPA fallback `404.html` is a copy of `index.html`, so it carries the same
  tags. The manifest and icons are real files and are never rewritten by it.
- The page keeps its own `theme-color` per colour scheme; the manifest value
  only paints the splash screen and the window before the first page loads.
- The site sets no Content-Security-Policy, so no `manifest-src` is needed.
- Icons live in `/icons/`, outside the hashed `/assets/`.
- Without a service worker, an installed window offline shows the browser's own
  offline screen. No stale copy can be served.

## Out of scope

- A service worker, offline shell or cache; an in-page install button;
  screenshots for the richer Android dialog; a store package.
- Opacity and safe-zone checks of the PNG files: verified once with the
  ecosystem's install checker, not in the unit test.

## Acceptance criteria

- `npm run format:check`, `npm run build` and `npm test` pass in `web/`.
- Chrome reports no installability error for the built `web/dist`.
- After the deploy, the live manifest answers 200 and the owner installs the
  site on an Android phone and an iPhone: icon uncropped, label `NainConfig`,
  no browser bar.

## Session state

- Last updated: 2026-11-14
- Done: T-001 to T-004. Verified: unit tests, build, install checker, Chrome
  probe on the offline build.
- Next: T-005 after the merge. Blocked: nothing; T-005 needs the owner's phones.
