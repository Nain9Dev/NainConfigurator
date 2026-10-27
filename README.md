<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/banner-light.svg">
  <img src="docs/assets/banner-dark.svg" alt="NainConfigurator - Catalog-Driven B2B Product Configurator" width="100%">
</picture>

<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=flat-square)](README.md)
[![Español](https://img.shields.io/badge/Idioma-Espa%C3%B1ol-emerald?style=flat-square)](README.es.md)
[![Architecture Tests](https://img.shields.io/badge/Architecture%20Tests-NetArchTest%20enforced-80FF00?style=flat-square&logo=checkmarx&logoColor=black)](backend/tests/NainConfigurator.Architecture.Tests/CleanArchitectureFitnessTests.cs)
[![Live Demo](https://img.shields.io/badge/Demo%20Online-configurator.naindev.com-38bdf8?style=flat-square&logo=googlechrome&logoColor=white)](https://configurator.naindev.com/)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-83%20passing-80FF00?style=flat-square&logo=vitest&logoColor=white)](web)
[![Journeys](https://img.shields.io/badge/E2E-20%20cross--browser%20journeys-80FF00?style=flat-square&logo=playwright&logoColor=white)](web/e2e)
[![WCAG](https://img.shields.io/badge/WCAG%202.2-AA%20gated%20by%20axe-80FF00?style=flat-square&logo=accessibleicon&logoColor=white)](web/e2e)
[![License](https://img.shields.io/badge/License-AGPL--3.0--or--later-38bdf8?style=flat-square)](LICENSE)

</div>

**Demo online:** [configurator.naindev.com](https://configurator.naindev.com/) — the whole configurator runs in the browser against a bundled synthetic catalog. No backend, no database, no cloud resource, 0,00 € of recurring cost.

NainConfigurator is a catalog-driven B2B product configurator designed to support fundamentally different products without customer-specific code, API contracts, database columns or deployment forks.

---

## The problem it solves

A manufacturer selling configurable product usually ends up with one configurator per customer. Every new account adds columns, endpoints and a deployment of its own, so the cost of maintaining the system grows with every sale.

Here, a product is rows. Option groups, selection limits, compatibility rules, prices **and the scene the buyer looks at** are catalog data. The demo ships two unrelated products — a modular desk and an urban bicycle — that share one schema, one public contract, one renderer and one release.

| Usual pattern | This engine |
|---|---|
| A column per customer property | Products, options and rules are rows |
| An endpoint per product | One public contract for every product |
| A branch and a deployment per brand | One deployment, isolated per company |
| Price reimplemented client and server side | The server reprices before anything is saved |
| A preview component per product | One renderer interpreting a published visual pack |

---

## Architecture Overview

```mermaid
graph TB
    subgraph ClientLayer["Frontend Layer (:5180 / configurator.naindev.com)"]
        ReactShell["React 19 Commercial Shell<br/><code>Vite + TypeScript</code><br/><i>Accessible UI, WCAG 2.2 AA</i>"]
        ClientEvaluator["Browser Rule Evaluator<br/><i>Offline Deterministic Catalog &amp; Cart</i>"]
        SceneRenderer["Visual Pack Renderer<br/><i>Generic SVG scene engine, no WebGL</i>"]
        BabylonRenderer["Babylon.js 3D Viewer<br/><i>(Deferred / ARCH-019)</i>"]
    end

    subgraph AssetLayer["Published Assets"]
        VisualPacks[("Visual packs<br/><i>Declarative scenes keyed by visualAssetKey</i>")]
    end

    subgraph BackendLayer["Backend Monolith Layer (:8080)"]
        ApiHost["ASP.NET Core Public API Host<br/><code>.NET 10 + Modular Monolith</code>"]
        DomainEngine["Catalog &amp; Pricing Authority<br/><i>Invariants, Matrix Pricing &amp; Quotes</i>"]
        Migrator["SQL Database Migrator<br/><i>Deterministic Migration Engine</i>"]
    end

    subgraph PersistenceLayer["Data &amp; Persistence Layer"]
        SqlServer[("SQL Server 2025 / Azure SQL<br/><i>Multi-Company Tenant Schema</i>")]
    end

    ReactShell --> ClientEvaluator
    ReactShell --> SceneRenderer
    SceneRenderer -->|"visualAssetKey"| VisualPacks
    ReactShell -.-> BabylonRenderer
    BabylonRenderer -.-> VisualPacks
    ReactShell -->|"HTTP / REST API (Quotes &amp; Catalogs)"| ApiHost
    ApiHost --> DomainEngine
    DomainEngine --> SqlServer
    Migrator --> SqlServer

    classDef client fill:#0047AB,stroke:#38BDF8,stroke-width:2px,color:#FFFFFF;
    classDef backend fill:#002B66,stroke:#80FF00,stroke-width:2px,color:#FFFFFF;
    classDef db fill:#060D1A,stroke:#38BDF8,stroke-width:2px,color:#FFFFFF;

    class ReactShell,ClientEvaluator,SceneRenderer,BabylonRenderer client;
    class ApiHost,DomainEngine,Migrator backend;
    class SqlServer,VisualPacks db;
```

The dotted edges are deferred: `ARCH-019` keeps the Babylon.js runtime out of the MVP, and a visual pack is projection-independent, so that adapter can consume the same document when it arrives.

## Catalog-driven visuals

The preview is not a component per product. It is a **visual pack**: a declarative scene document addressed by the product's existing `visualAssetKey`, published under [`assets/visual-packs`](assets/visual-packs) and interpreted by a generic renderer in [`web/src/visual`](web/src/visual) that names no product, company or option.

```jsonc
{
  "vars": { "W": { "base": 120, "when": [{ "key": "DeskTop_160_80", "value": 160 }] } },
  "slots": { "surface": { "base": "oak", "when": [{ "key": "Material_Desk_DarkWalnut", "material": "walnut" }] } },
  "parts": [
    { "id": "top", "shape": "box", "material": "slot:surface",
      "at": ["0", "H - T/2", "0"], "size": ["W", "T", "D"] },
    { "id": "pedestal-left", "shape": "box", "material": "slot:surface",
      "when": ["Drawer_Left"], "at": ["-(W/2 - 24)", "(H - T + 20)/2", "0"],
      "size": ["40", "H - T - 20", "D - 12"] }
  ]
}
```

The only input is the set of `visualAssetKey` values the catalog already carries on the product and on each selected option. Geometry uses three primitives (`box`, `tube`, `ring`); numbers are arithmetic over the pack's own variables, evaluated by a closed parser that cannot resolve anything the pack did not declare.

- No WebGL context, no binary asset, no request beyond the pack itself.
- No change to the public API contract, the database schema or any migration.
- A missing or malformed pack degrades to the accessible fallback view; the commercial flow never depends on it.
- The visual never takes part in validation, pricing or persistence.

See `ARCH-020` in the [decision log](<docs/Proyectos Documentación/NainConfigurator/07-DecisionLog.md>) and [`specs/001-catalog-driven-visualization`](specs/001-catalog-driven-visualization).

---

Current phase: SL-000 is complete. SL-001 through SL-006 and SL-008 are implemented with automated evidence; optional SL-007 is deferred. The authorized SL-009 candidate passes its clean-checkout automated gate and now awaits the two manual gates documented below. SL-010 and later slices, cloud deployment, public exposure, real personal data, paid services, future commits and push remain unauthorized.

## Product direction

- Shared multi-company SaaS with strict company isolation.
- ASP.NET Core modular monolith for authoritative validation, pricing and persistence.
- React and TypeScript for the accessible commercial shell.
- Babylon.js for an optional lazy-loaded Web renderer.
- Blender for offline 3D asset authoring.
- Sanitized and validated glTF/GLB 2.0 packages for browser delivery.
- SQL Server 2025 Developer for local physical verification and Azure SQL Database as the future paying-customer authority.
- Complete configuration, save and quote flows when 3D is unavailable.

## Free-first boundary

The local prototype and controlled client demo target zero incremental software and cloud cost by using owned hardware, synthetic data and free/open-source tools.

This does not promise zero-cost production. A paying-customer environment may require billable hosting, independent security assessment, backups, support and legal/operational work. No paid resource, trial with automatic renewal or consumption billing may be activated without explicit owner authorization.

## Repository map

| Path | Responsibility | Current state |
|---|---|---|
| `docs/Proyectos Documentación/NainConfigurator` | Canonical product and technical documentation | Active |
| `backend` | .NET modular monolith, public API, domain authority and SQL persistence | Technical Demo candidate |
| `web` | Accessible catalog-driven React commercial shell | Technical Demo candidate |
| `renderer` | Future Babylon.js adapter and browser 3D runtime | Documentation placeholder |
| `database` | Versioned SQL Server migration and synthetic product catalogs | Technical Demo candidate |
| `tests` | Cross-stack verification and source-to-test traceability | Technical Demo candidate |
| `assets` | Published visual packs and the future glTF/GLB pipeline | Visual packs active |
| `specs` | Feature specifications, designs and task state | Active |
| `ops` | LocalDemo packaging, integrity, reset, start, smoke and recovery | Technical Demo candidate |
| `eng` | Reproducible local tools, quality gates and dependency evidence | Active |

## Canonical entrypoints

- [Project overview](<docs/Proyectos Documentación/NainConfigurator/00-ProjectOverview.md>)
- [Documentation roadmap](<docs/Proyectos Documentación/NainConfigurator/00.1-DocumentationRoadmap.md>)
- [Architecture](<docs/Proyectos Documentación/NainConfigurator/06-Architecture.md>)
- [Decision log](<docs/Proyectos Documentación/NainConfigurator/07-DecisionLog.md>)
- [Approved testing strategy](<docs/Proyectos Documentación/NainConfigurator/08-TestingStrategy.md>)
- [Approved deployment and operations](<docs/Proyectos Documentación/NainConfigurator/09-DeploymentAndOperations.md>)
- [Approved implementation plan](<docs/Proyectos Documentación/NainConfigurator/10-ImplementationPlan.md>)
- [Passing implementation-readiness review](<docs/Proyectos Documentación/NainConfigurator/11-ImplementationReadinessReview.md>)
- [Repository navigation context](<docs/Proyectos Documentación/NainConfigurator/00.3-RepositoryContext.md>)

Historical or superseded documents are context only and must not direct implementation.

## Current gates

1. Complete the manual screen-reader check and a clean controlled-machine offline run before declaring `Technical demo ready`.
2. Preserve the passing clean-checkout evidence for the authorized candidate and rerun it after any source change.
3. Keep cloud resources, public exposure, real data, paid services, future commits, pushes and deployment behind their separate explicit permissions.
4. Satisfy the documented PublicDemo, pilot and commercial-launch artifacts only when those later stages are requested.

Technical-demo implementation does not authorize SL-010 or later code, cloud infrastructure, public exposure, real data, paid services, commits, pushes or deployment.

## Technical Demo verification

The full local gate intentionally recreates only the allowlisted synthetic Integration and Demo databases:

```powershell
.\eng\scripts\Invoke-TechnicalDemoQuality.ps1 -ConfirmSyntheticDatabaseReset
```

The generated attended-demo package and runbook are under the ignored `artifacts\release\sl-009-localdemo` directory. SQL Server Developer is valid for development, testing and demonstration, not paying-customer production.

## Repository safety

- Never commit credentials, tokens, personal data, customer documents or production exports.
- Use synthetic data for local development, tests and demos.
- Record ownership and commercial-use rights for every model, texture, font, HDRI and add-on.
- Keep generated output and local editor state out of version control.
- Use Git LFS only after asset size and free-tier limits are reviewed.
- GitHub is an off-device copy and collaboration system, not the only backup.

## Running the web demo locally

```bash
cd web
npm ci
npm run start      # http://127.0.0.1:5180, offline catalog, no backend needed
```

```bash
cd web
npm test                  # 83 unit tests
npm run test:e2e:offline  # 20 journeys on Chromium, Firefox, WebKit and mobile Chromium
```

`npm run start` and `npm run build` both run `npm run catalog` first, which projects the SQL seed into the offline catalog and stages every visual pack into `web/public/visual-packs` (generated; the authored source is `assets/visual-packs`).

## Ownership and license

Copyright Nain9Dev. The source and documentation in this repository are published under the **AGPL-3.0-or-later** license in [`LICENSE`](LICENSE); third-party components retain their own licenses. Synthetic demo data is part of the repository and describes no real company, product or person.
