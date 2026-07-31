# Manual Technical Demo acceptance

Status: Required human evidence before `Technical demo ready`.

This checklist never authorizes public exposure, customer data, a pilot or production. Use only the generated LocalDemo package and synthetic values.

## Record

- Date and reviewer:
- Windows version:
- Browser and version:
- Screen reader and version:
- `releaseId` from `release.json`:
- `sourceRevision` from `release.json`:
- SHA-256 of `release-manifest.sha256`:
- Network disconnected during the offline section: Yes / No

## Package integrity and recovery

- [ ] `release.json` says `Technical demo candidate`, `containsRealData: false` and `externalNotification: false`.
- [ ] `scripts\Test-LocalDemoManifest.ps1` passes before startup.
- [ ] `scripts\Reset-LocalDemo.ps1 -ConfirmSyntheticReset` recreates only `NainConfigurator_Demo`.
- [ ] `scripts\Start-LocalDemo.ps1` binds only to `http://127.0.0.1:5187/`.
- [ ] `scripts\Invoke-LocalDemoSmoke.ps1` passes with `DESK-001`, `BIKE-001`, no real data and no external notification.

## Offline commercial journey

Disconnect the machine from the network before this section. Do not disable local loopback or SQL Server.

- [ ] The home page and both synthetic scenarios load without Internet access.
- [ ] The desk controls, estimate and accessible fallback work without a canvas or renderer.
- [ ] An incompatible electric-leg selection shows the authoritative rule error.
- [ ] A corrected selection validates, saves and opens an immutable configuration.
- [ ] “Edit as new” preserves the original code and a later save creates a different code.
- [ ] A quote using only an `.invalid` email is stored and explicitly says that no email was sent.
- [ ] The bicycle scenario uses the same interface and validates its own data-driven compatibility rule.
- [ ] No required runtime request targets a non-loopback host.

The policy URL uses the reserved non-resolving `.invalid` domain because this build forbids real personal data and has no approved legal notice. Its link text, focus and relationship to the checkbox must be reviewed, but the synthetic notice is not legal evidence and is not expected to resolve offline.

## Keyboard and screen reader

Use a current Edge or Chrome build with NVDA or Windows Narrator.

- [ ] The skip link is the first keyboard focus and moves to the main content.
- [ ] Headings and regions provide an understandable page outline.
- [ ] Every option group has a name; every radio button and checkbox has a usable accessible name and state.
- [ ] Focus remains visible at 200 percent zoom and the page reflows without horizontal loss at 320 CSS pixels.
- [ ] Validation errors are announced and can be associated with the affected action or selection.
- [ ] Save and quote success messages are announced once and do not claim delivery.
- [ ] Saved configuration, edit-as-new and unavailable-renderer behavior can be completed without a pointer.
- [ ] The decorative visual fallback does not duplicate or contradict commercial information.

## Closure

- [ ] The host stops through `scripts\Stop-LocalDemo.ps1`.
- [ ] Port `5187` is no longer listening.
- [ ] Runtime logs contain no contact value, request body, secret or unexpected exception.
- [ ] Every failed item is recorded with reproduction steps and blocks `Technical demo ready`.

Result: Pass / Fail

Notes:
