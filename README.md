# NainConfigurator

NainConfigurator is a catalog-driven B2B product configurator designed to support fundamentally different products without customer-specific code, API contracts, database columns or deployment forks.

Current phase: documentation and implementation planning. Application code, executable database migrations, cloud deployment and real personal-data processing are not authorized yet.

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
| `backend` | Future .NET modular monolith and deployable hosts | Documentation placeholder |
| `web` | Future accessible React commercial shell | Documentation placeholder |
| `renderer` | Future Babylon.js adapter and browser 3D runtime | Documentation placeholder |
| `database` | Future versioned database migration artifacts | Documentation placeholder |
| `tests` | Future cross-stack verification suites and evidence | Documentation placeholder |
| `assets` | Future controlled source/published 3D asset pipeline | Documentation placeholder |
| `ops` | Future deployment, monitoring, backup and support artifacts | Documentation placeholder |

## Canonical entrypoints

- [Project overview](<docs/Proyectos Documentación/NainConfigurator/00-ProjectOverview.md>)
- [Documentation roadmap](<docs/Proyectos Documentación/NainConfigurator/00.1-DocumentationRoadmap.md>)
- [Architecture](<docs/Proyectos Documentación/NainConfigurator/06-Architecture.md>)
- [Decision log](<docs/Proyectos Documentación/NainConfigurator/07-DecisionLog.md>)
- [Proposed testing strategy](<docs/Proyectos Documentación/NainConfigurator/08-TestingStrategy.md>)
- [AI navigation context](<docs/Proyectos Documentación/NainConfigurator/AI_CONTEXT.md>)

Historical or superseded documents are context only and must not direct implementation.

## Current gates

1. Approve TST-001 through TST-014 in the testing strategy.
2. Draft and approve `09-DeploymentAndOperations.md`.
3. Draft and approve `10-ImplementationPlan.md`.
4. Complete the implementation-readiness review.
5. Start code only after all implementation-blocking documents are approved.

## Repository safety

- Never commit credentials, tokens, personal data, customer documents or production exports.
- Use synthetic data for local development, tests and demos.
- Record ownership and commercial-use rights for every model, texture, font, HDRI and add-on.
- Keep generated output and local editor state out of version control.
- Use Git LFS only after asset size and free-tier limits are reviewed.
- GitHub is an off-device copy and collaboration system, not the only backup.

## Ownership

Private commercial project owned by Nain9Dev. No license to use, copy or distribute the project source or documentation is granted by repository access alone. Third-party components retain their own licenses.
