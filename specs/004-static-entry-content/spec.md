# SPEC-004 — Static entry content for crawlers

Status: Proposed
Owner: naindev
Scope: `web/index.html`, `web/scripts`

## Problem

The demo is a single-page app. The HTML that a crawler receives before any
script runs holds a title, a description and an empty `<div id="root">`: about 60
characters of text and no heading. Google renders JavaScript, but it had not
crawled the entry page at all when this was written, and several other search
engines and AI answer engines read only the raw HTML.

## Requirements

Notation: EARS.

- **REQ-S-004** — The entry page shall embed `SoftwareApplication` JSON-LD with
  its URL and application category. (Already true; the test keeps it from
  regressing.)
- **REQ-S-005** — The entry page shall contain a `<noscript>` fallback with one
  `<h1>`, the same description as the meta tag and a link to the repository, so
  the raw HTML carries the page's meaning.
- **REQ-S-006** — The canonical URL shall stay `https://configurator.naindev.com/`.

## Out of scope

- Server-side rendering or prerendering the app.
- Any change to the visible interface.
