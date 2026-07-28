# NainConfigurator

NainConfigurator is a catalog-driven B2B product configurator designed to support fundamentally different products without customer-specific code, API contracts, database columns or deployment forks.

Current phase: SL-000 engineering baseline is implemented and locally verified, including real connectivity to SQL Server 2025 Standard Developer Edition CU7. It intentionally contains no catalog, configuration, pricing, persistence schema or other domain behavior, so it is not yet a functional product demo. SL-001 and every later slice require separate authorization. Executable domain migrations, cloud deployment, public exposure, real personal data and paid services remain unauthorized.

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
| `backend` | .NET modular-monolith boundary and deployable hosts | SL-000 baseline |
| `web` | Accessible React commercial shell | SL-000 baseline without product behavior |
| `renderer` | Future Babylon.js adapter and browser 3D runtime | Documentation placeholder |
| `database` | Future versioned database migration artifacts | Documentation placeholder |
| `tests` | Cross-stack verification and traceability | SL-000 baseline |
| `assets` | Future controlled source/published 3D asset pipeline | Documentation placeholder |
| `ops` | Future deployment, monitoring, backup and support artifacts | Documentation placeholder |
| `eng` | Reproducible local tools, quality pipeline and dependency evidence | SL-000 baseline |

## Canonical entrypoints

- [Project overview](<docs/Proyectos Documentación/NainConfigurator/00-ProjectOverview.md>)
- [Documentation roadmap](<docs/Proyectos Documentación/NainConfigurator/00.1-DocumentationRoadmap.md>)
- [Architecture](<docs/Proyectos Documentación/NainConfigurator/06-Architecture.md>)
- [Decision log](<docs/Proyectos Documentación/NainConfigurator/07-DecisionLog.md>)
- [Approved testing strategy](<docs/Proyectos Documentación/NainConfigurator/08-TestingStrategy.md>)
- [Approved deployment and operations](<docs/Proyectos Documentación/NainConfigurator/09-DeploymentAndOperations.md>)
- [Approved implementation plan](<docs/Proyectos Documentación/NainConfigurator/10-ImplementationPlan.md>)
- [Passing implementation-readiness review](<docs/Proyectos Documentación/NainConfigurator/11-ImplementationReadinessReview.md>)
- [AI navigation context](<docs/Proyectos Documentación/NainConfigurator/AI_CONTEXT.md>)

Historical or superseded documents are context only and must not direct implementation.

## Current gates

1. Preserve the completed SL-000 baseline and its reproducible quality evidence.
2. Do not start SL-001 until the product owner separately authorizes the catalog-foundation slice.
3. Keep cloud resources, public exposure, real data, paid services, future commits, pushes and deployment behind their separate explicit permissions.
4. Satisfy the documented PublicDemo, pilot and commercial-launch artifacts only when those later stages are requested.

Documentation completion and SL-000 completion do not authorize later code, domain SQL, infrastructure, public exposure, real data, paid services, future commits, pushes or deployment.

## Repository safety

- Never commit credentials, tokens, personal data, customer documents or production exports.
- Use synthetic data for local development, tests and demos.
- Record ownership and commercial-use rights for every model, texture, font, HDRI and add-on.
- Keep generated output and local editor state out of version control.
- Use Git LFS only after asset size and free-tier limits are reviewed.
- GitHub is an off-device copy and collaboration system, not the only backup.

## Ownership

Private commercial project owned by Nain9Dev. No license to use, copy or distribute the project source or documentation is granted by repository access alone. Third-party components retain their own licenses.
