# LocalDemo runbook

Status: Technical-demo candidate. This package is synthetic, local, attended and zero-recurring-cost. It is not a public demo, pilot or production service.

## Prerequisites

- Windows with SQL Server 2025 Developer instance `.\NAINCONFIGURATOR`.
- .NET 10.0.10 runtime or the approved .NET SDK already installed.
- A current supported Edge or Chrome browser.
- No payment card, Azure resource, external notification provider or Internet connection is required while demonstrating the built package.

SQL Server Developer is licensed only for development, testing and demonstration. It must never host paying-customer production data.

## Build the candidate

From the repository:

```powershell
.\ops\local-demo\Build-LocalDemo.ps1
```

The generated package is `artifacts\release\sl-009-localdemo`. `release-manifest.sha256` protects every packaged file. A dirty source tree is recorded honestly in `release.json`; create an authorized source commit before calling the candidate immutable and final.

The package also contains an SPDX 2.2 SBOM, its vendor-generated hash and the reviewed direct-dependency inventory.

Complete `Manual-AcceptanceChecklist.md` on the presentation machine before changing the candidate label.

## Reset and start

From the generated package:

```powershell
.\scripts\Reset-LocalDemo.ps1 -ConfirmSyntheticReset
.\scripts\Test-LocalDemoManifest.ps1
.\scripts\Start-LocalDemo.ps1
.\scripts\Invoke-LocalDemoSmoke.ps1
```

Open `http://127.0.0.1:5187/`. The host binds only to loopback.

The reset deletes and recreates only `NainConfigurator_Demo`. It contains synthetic fixtures and can be recovered completely from the packaged migration and catalog.

## Demonstration script

1. State that this is a technical demo using fictional data, not a final quote or production service.
2. Open the desk scenario, change options and show that the visible price is an estimate.
3. Create an incompatible combination, validate it and show the server rule.
4. Correct it, save the immutable configuration and retrieve it by its random public code.
5. Show “Edit as new”; the original configuration is not modified.
6. Submit only the provided `.invalid`-style fictional contact and state that the outbox was recorded but no email was sent.
7. Open the bicycle scenario to prove that another product uses the same schema, API, validation engine, UI and release.
8. Show the accessible visual fallback. Optional SL-007 3D is deliberately deferred and does not block any commercial action.

Do not type a prospect’s name, email, phone, message or customer data into this build.

## Stop and recover

```powershell
.\scripts\Stop-LocalDemo.ps1
```

If the demo becomes inconsistent, stop it and run the confirmed synthetic reset again. Do not repair demo rows manually.

Runtime logs and the PID file are generated under the ignored package `runtime` folder. They contain technical events only; no request bodies or contact values should appear.

## Honest limitations

- No real email, CRM, authentication, Operations UI, worker delivery, cloud hosting, SLA or production backup.
- Optional Blender/Babylon.js SL-007 is deferred; no 3D support is claimed.
- Automated Chromium, Firefox, WebKit and mobile-emulation evidence does not certify branded Safari, iOS, Android or a physical device.
- NVDA/manual assistive-technology review remains human evidence and cannot be replaced by axe automation.
- A final offline run must be repeated from a clean controlled machine and an authorized immutable source revision.
- The privacy-policy URL intentionally uses the reserved `.invalid` domain and does not resolve; it is a synthetic interaction boundary, not a legal notice or real-data permission.
- Customer/pilot use remains blocked until the later legal, privacy, recovery, support, security and budget gates are explicitly authorized and passed.
