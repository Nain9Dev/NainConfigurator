# AI Context

Last updated: 2026-07-28  
Purpose: Navigation summary only; this file is not an independent source of truth.

## Project

NainConfigurator is a reusable B2B platform for configuring products in 3D, calculating estimated prices, saving immutable configurations and generating quote requests for the company that owns the product catalog.

The initial MVP publishes one escritorio gaming modular (`DESK-001`) in company locale `es-ES`. The platform must nevertheless support future companies and fundamentally different products through data, without desk-specific database columns, request properties or validation branches.

## Current technology direction

- Modular monolith on .NET `10.0.10` LTS, C# 14, ASP.NET Core 10 and EF Core 10.
- React `19.2.7`, TypeScript 6 and Vite 8.1 for the accessible web shell; Node 24 LTS is build-time only.
- Babylon.js `9.18.0` for the optional lazy-loaded Web renderer, Blender `4.5 LTS` for offline asset authoring and validated glTF/GLB `2.0` delivery.
- Azure App Service, Azure SQL Database compatibility level 170, Azure Managed Redis, Blob Storage and Front Door Standard.
- Microsoft Entra ID, managed identities, Key Vault and OpenTelemetry with regional Azure Monitor.
- GitHub Actions OIDC and Bicep for delivery and infrastructure.

The logical domain and public contracts are client- and persistence-agnostic.

`05-DatabaseDesign.md` and `06-Architecture.md` are approved and authoritative for physical persistence, exact technology baselines, topology, alternatives and revisit triggers. They permit a synthetic-only optional demo that has no SLA or customer dependency. DB-001 through DB-015 and the 42-day deletion-recovery container were approved on 2026-07-28. `08-TestingStrategy.md` is proposed; TST-001 through TST-014 require product-owner approval. Code remains unauthorized.

## Canonical documentation

| Document | Authority |
|---|---|
| `00-ProjectOverview.md` | Product vision, scope and documentation map |
| `00.1-DocumentationRoadmap.md` | Remaining approval gates and implementation-readiness sequence |
| `00.2-CommercialStrategy.md` | Approved customer segment, SaaS model, revenue boundaries, onboarding and operating responsibilities |
| `01-ProductDefinition.md` | Approved `DESK-001` catalog values |
| `02-BusinessRules.md` | Business invariants, validation and lifecycle behavior |
| `03-DataModel.md` | Logical entities, ownership, relationships and persistence requirements |
| `03.1-UserFlows.md` | Public user, client, API and recovery flows |
| `03.2-UXRequirements.md` | Responsive, accessible, degraded-rendering, branding, localization and public-state behavior |
| `04.1-ApiContracts.md` | Public routes, payloads, responses and error representation |
| `04.2-NonFunctionalRequirements.md` | Approved performance, capacity, browser, 3D, availability, recovery, observability, support and quality targets |
| `04.3-SecurityAndPrivacy.md` | Approved threat, isolation, identity, abuse, encryption, privacy, retention, audit and incident requirements |
| `05-DatabaseDesign.md` | Approved physical tables, keys, constraints, RLS, indexes, transactions, retention and free-first database profiles |
| `06-Architecture.md` | Approved technologies, modular boundaries, transaction ownership, hosting, caching, Babylon.js/Blender asset integration, telemetry and recovery topology |
| `07-DecisionLog.md` | Approved and superseded cross-document decisions |
| `08-TestingStrategy.md` | Proposed free-first test layers, tools, traceability and client-demo evidence; not yet authoritative |

`04-ApiContracts.md`, `02-BusinessRules.v1.md` and `Producto inicial.md` are historical only.

## MVP public flow

1. Load the active product catalog for a company.
2. Build the configurable UI from option groups, options and compatibility rules.
3. Update the 3D presentation and show a local non-authoritative estimate.
4. Validate selections and obtain the authoritative API price.
5. Save an immutable configuration with a commercial snapshot.
6. Submit an idempotent quote request with active privacy-notice acknowledgment and a server retention deadline.

## Approved commercial model

- Initial market: Spanish small and mid-sized configurable-furniture manufacturers and specialist retailers.
- Service: one shared, strictly company-scoped multi-company SaaS release.
- Revenue: paid setup/onboarding plus recurring subscription; material extra work is separately scoped.
- Operations: NainConfigurator manages validated catalog publication during the MVP; customer self-service administration is deferred.
- Branding: constrained data-driven co-branding, with premium white-label later only without forks.
- Responsibility: customers own catalog/legal accuracy, asset rights, lead response and final offers; NainConfigurator owns technical validation and platform operation.
- Future billing accounts, memberships and administration must remain separate from the public `Company` catalog domain.

## Non-negotiable design principles

- Company and product ownership is derived from persisted relationships.
- Selection limits and compatibility are driven by catalog data.
- The API validates and calculates authoritative prices.
- Public clients never send internal database identifiers or authoritative prices.
- Published catalog codes are stable.
- Catalog version conflicts prevent validation and creation.
- Saved configurations remain unchanged after catalog changes.
- Configuration and quote creation are idempotent.
- Historical configurations remain viewable after product deactivation, but new quote requests require the current product to be active and published.
- `visualState` is optional presentation data and cannot contain commercial truth.
- A second product must be addable through data without changing the logical schema.
- No customer may require a private code, schema, repository or permanent release fork.
- The commercial flow remains usable when 3D is loading, reduced, unavailable or failed.
- The full public experience targets WCAG 2.2 Level AA and reflows from 320 CSS pixels.
- The MVP locale is the company's `es-ES` default and saved snapshots retain their BCP 47 content locale.
- Company branding is constrained, accessible, versioned separately and falls back without changing commercial state.
- Quote data has no public read route, expires by policy and is never treated as marketing consent.
- Public, administrative and service trust surfaces remain separate.
- Every tenant boundary, cache, asset, job, export and deletion operation carries trusted company scope.

## MVP boundaries

Public customer accounts, payments, product administration, multiple-product discovery, inventory, shipping, promotions, marketing consent, public file upload and quote status workflows beyond `New` are outside the MVP.

Security/privacy requirements, application architecture and physical Azure SQL design are approved. Testing, operations and implementation planning still block code. Before processing real customer data, the project also requires customer-specific legal notice/lawful basis, an executed data-processing agreement, subprocessor/region disclosure, named operational contacts, implemented and tested controls, penetration-test evidence and a commercial notification workflow.

## Approved quality envelope

- 50 companies, 500 published products and 500 concurrent public sessions.
- 50 sustained API requests/second and 100 requests/second for a 60-second burst.
- Endpoint-specific API P95/P99 targets and less than 0.5 percent unexpected errors under normal load.
- Core Web Vitals at good P75 thresholds; commercial controls ready at P75 within 3 seconds on the reference desktop profile.
- Initial compressed renderer plus product package at most 30 MB; 3D failure never blocks commercial operation.
- Internal 99.5 percent monthly availability SLO; SQL RPO at most 15 minutes and support-window RTO at most 4 hours.
- Current/previous supported browser policy, multi-instance correctness and publication propagation within 60 seconds.
- Direct recurring infrastructure-cost target at most 25 percent of subscription revenue at the planned operating point.

## Future implementation baseline supplied by the owner

- NainConfigurator is a personal product project. Avalisto-specific C# 7.3, naming, `void`, Unit of Work, log-template, scoring and `UploadDocument` rules do not apply.
- Approved runtime and service baselines live in `06-Architecture.md`; unsupported or obsolete technology is prohibited without a recorded exception.
- Apply SOLID, Clean Code and Clean Architecture pragmatically. Use DDD boundaries where business complexity benefits, not as ceremony.
- Transaction ownership must be explicit for every write use case. Whether that uses an explicit Unit of Work abstraction or the persistence technology's native unit of work is an architecture decision.
- Code identifiers, JSON properties, stable error codes, technical log templates and commits use English. Localized customer-facing catalog and UI content follows the company locale.
- API tests show raw request and response JSON.
