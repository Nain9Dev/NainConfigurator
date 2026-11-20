# SPEC-003 — Tasks

Labels: `[A]` done unattended · `[M]` mixed, needs an owner action to close ·
`[H]` owner only.

| #     | Task                              | Label | Done when                                                                                          | State |
| ----- | --------------------------------- | ----- | -------------------------------------------------------------------------------------------------- | ----- |
| T-001 | Test for the sitemap contents     | `[A]` | `web/scripts/sitemap.test.mjs` fails on the current file (REQ-S-001, REQ-S-002)                    | Done  |
| T-002 | Remove the two `/configure/` URLs | `[A]` | The test passes and `npm test` is green                                                            | Done  |
| T-003 | Review and merge                  | `[H]` | Owner merges the pull request                                                                      | Open  |
| T-004 | Resubmit the sitemap              | `[M]` | After the deploy, Search Console and Bing Webmaster read `sitemap.xml` with 1 URL and no 404 error | Open  |
