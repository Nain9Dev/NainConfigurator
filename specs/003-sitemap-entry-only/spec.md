# SPEC-003 — Sitemap lists the entry point only

Status: Proposed
Owner: naindev
Scope: `web/public/sitemap.xml`, `web/scripts`

## Problem

`sitemap.xml` lists two `/configure/...` URLs next to the entry point. The demo
is a single-page app on GitHub Pages: those paths are resolved in the browser,
so the host answers them with HTTP 404. Google Search Console reports both as
"Not found (404)" and the sitemap comment itself says that only the entry point
is listed.

## Requirements

Notation: EARS.

- **REQ-S-001** — The sitemap shall list `https://configurator.naindev.com/`
  and no other URL.
- **REQ-S-002** — The sitemap shall not list any `/configure/` route, because
  the host cannot serve it with a 200 status.

## Out of scope

- Prerendering `/configure/...` pages so they could be indexed. That would be a
  product decision, not a fix.
