# Contributing

Thanks for looking at NainConfigurator. This document explains what the project is, what it is not, and how a change gets accepted.

## What this project is

A catalog-driven B2B product configurator built to prove one thesis: that fundamentally different products can share one schema, one API contract, one validation engine, one user interface and one release, with no customer-specific code, columns or deployment forks.

Two demo products ship with it — a modular desk and a bicycle. They share every line of code. That is the point.

## What this project is not

It is not a general-purpose e-commerce platform, and it is not accepting feature requests that would require product-specific fields, branches or forks. A request that cannot be expressed as catalog data is, by design, out of scope. If you think a genuinely new *capability* is needed — a new compatibility rule type, for example — open a discussion first; that is a platform change and needs a decision record.

## Ground rules

### Language

- **Code, identifiers, JSON properties, error codes, log templates and commit messages: English.**
- **Customer-facing UI strings: the company locale** (`es-ES` for the bundled demo companies).
- Documentation in `docs/` is English and follows the existing approved structure.

### Data

Never commit real personal data, customer documents, production exports, credentials or tokens. Demo and test fixtures use synthetic values and reserved domains (`example.com`, `example.invalid`, `demo.invalid`). The public API rejects quote emails that do not end in `.invalid` while the demo guard is enabled.

### Architecture boundaries

The dependency direction is enforced and non-negotiable:

```
Domain  ←  Application  ←  Infrastructure
                       ↖   Hosting  ←  PublicHost / OperationsHost / Worker
```

- `Domain` has no dependencies. Pure rules, no I/O, no framework types.
- `Application` depends only on `Domain`. It defines persistence contracts; it does not implement them.
- `Infrastructure` implements those contracts. SQL Server lives here and nowhere else.
- Hosts compose. They contain no business rules.

A pull request that inverts one of these arrows will be rejected regardless of how well it works.

### Authority

Selection limits, compatibility and prices come from catalog data and are recomputed server-side. The browser owns a non-authoritative estimate and transient selection state — nothing else. Do not move a rule into the client to make the UI feel faster.

## Getting set up

### The web shell alone — no backend, no database

```bash
cd web && npm install && npm run dev
```

The shell detects that no API is reachable and runs in **offline demo mode** against the bundled catalog, evaluating rules in the browser. Every price is labelled as a non-authoritative estimate. This is enough to work on anything in `web/`.

### The full stack

Requires Windows, SQL Server 2025 Developer on a local instance named `NAINCONFIGURATOR`, and the .NET 10 SDK.

```powershell
.\eng\scripts\Install-LocalTools.ps1
.\eng\scripts\Invoke-TechnicalDemoQuality.ps1 -ConfirmSyntheticDatabaseReset
```

That script is the full gate. It restores locked dependencies, verifies formatting, builds, recreates only the two allowlisted synthetic databases, applies migrations and fixtures, runs every .NET and frontend test, executes Chromium, Firefox, WebKit and mobile journeys with axe, audits dependencies, scans for secrets, packages the demo, generates an SBOM and runs a smoke test.

## Before you open a pull request

Run what CI runs:

```bash
cd web && npm run format:check && npm run build && npm test
```

```bash
dotnet format NainConfigurator.slnx --verify-no-changes && dotnet build NainConfigurator.slnx -c Release && dotnet test NainConfigurator.slnx -c Release
```

Warnings are errors. Nullable reference types are enabled. Central package management is on — add versions to `Directory.Packages.props`, not to individual project files, and regenerate `packages.lock.json`.

### Tests

- A domain rule change needs a test in `NainConfigurator.Domain.Tests`.
- An API contract change needs a test in `NainConfigurator.Api.IntegrationTests` showing raw request and response JSON.
- A user-visible frontend change needs a test in `web/src/*.test.tsx` or a journey in `web/e2e/`.
- New dependencies must be added to `eng/third-party/approved-direct-dependencies.json` with their licence.

### Accessibility

The public experience targets **WCAG 2.2 Level AA** and must reflow from 320 CSS pixels. Interactive changes need keyboard operation, visible focus, correct roles and names, and a live-region announcement where state changes without navigation. `npm run test:e2e` runs axe on every page state; automated checks catch roughly a third of real problems, so think about the rest.

## Commit and pull request format

Commits follow Conventional Commits with a scope:

```
feat(web): mostrar el desglose de precio autoritativo
fix(domain): tratar MaxSelections nulo como ilimitado
docs(security): documentar el límite del modo offline
```

Keep pull requests focused. One concern per branch. Describe what changed, why, and how you verified it. Link the issue.

## Licence

By contributing you agree that your contribution is licensed under the **GNU Affero General Public License v3.0 or later**, the same licence as the project. See [LICENSE](LICENSE).

Because AGPL-3.0 is a strong copyleft licence, anyone who runs a modified version of this software as a network service must offer the corresponding source to its users. Contribute only code you have the right to license this way.

## Security

Do not report vulnerabilities in a public issue. See [SECURITY.md](SECURITY.md).
