# SPEC-next-pwa-install — Tasks

Labels: `[A]` done unattended · `[M]` mixed, needs an owner action to close ·
`[H]` owner only.

| #     | Task                                  | Label | Done when                                                                                      | State |
| ----- | ------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- | ----- |
| T-001 | Contract test `web/src/install.test.ts` | `[A]` | Fails on the tree without manifest, icons and tags (ENOENT on the icon glob)                   | Done  |
| T-002 | Render the install icons              | `[A]` | Four PNGs in `web/public/icons` from `favicon.svg`; command recorded in `plan.md`              | Done  |
| T-003 | Manifest and head tags                | `[A]` | `npm test`, `npm run build` and `npm run format:check` pass in `web/`                          | Done  |
| T-004 | Chrome installability probe           | `[A]` | No installability error on the offline build of `web/dist`                                     | Done  |
| T-005 | Verify the live site                  | `[M]` | Live manifest answers 200 and the owner installs it on Android and iOS                         | Open  |
| T-006 | Approve SPEC-next-pwa-install         | `[H]` | Status moves to Approved                                                                       | Open  |

## Handoff

- Verified: `npm test` (98 tests, 9 files), `npm run build`, `npm run format:check`,
  the install-file verifier and the Chrome probe on `web/dist` built with
  `VITE_BASE_PATH=/` and `VITE_FORCE_OFFLINE=true`.
- Not run: the Playwright journeys and the .NET jobs (the change touches neither).
- Needs from owner: merge, then install from Chrome on Android and Safari on an
  iPhone and confirm icon, label and window.
