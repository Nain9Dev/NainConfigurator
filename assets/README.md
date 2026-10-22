# Asset boundary

This directory holds the controlled asset pipeline: everything the browser
draws that is published as data rather than compiled into the application.

## Visual packs — `visual-packs/`

A visual pack is a declarative scene document addressed by a product's
`visualAssetKey`. It is the preview source the shell uses today, and it is the
reason one renderer can draw a desk and a bicycle without a branch. See
`ARCH-020` in the decision log and `specs/001-catalog-driven-visualization`.

- One file per key, named `<visualAssetKey>.json`, declaring `schemaVersion: 1`.
- `npm run catalog` in `web` validates every pack and stages it into
  `web/public/visual-packs/`, which is generated output and is not committed.
- A pack declares dimensions, material slots, materials and parts. Part
  visibility, dimensions and material slots bind to the `visualAssetKey` values
  the catalog carries on the product and on each option. Nothing else is an
  input.
- Geometry uses three primitives only: `box`, `tube` and `ring`. Numbers may be
  arithmetic expressions over the pack's own declared variables.
- A pack is presentation. It must never be read by validation, pricing or
  persistence, and a missing or malformed pack must degrade to the accessible
  fallback view rather than block the commercial flow.
- Colours are plain hex. No external reference, no script, no remote URL.

## Source assets — 3D authoring

- Author with the pinned Blender 4.5 LTS patch and recorded export profile.
- Record ownership and commercial-use license for every model, texture, font,
  HDRI and add-on.
- Never include credentials, personal data, customer-confidential material or
  unreviewed downloads.

## Published assets — glTF/GLB

- Export sanitized glTF/GLB 2.0 packages.
- Validate with the pinned Khronos glTF Validator.
- Enforce naming, polygon, texture and compressed-transfer budgets.
- Publish immutable content-addressed packages only.

Large binary assets require a separate Git LFS/free-tier decision before they
are committed. Visual packs are small text documents and are exempt from that
decision.
