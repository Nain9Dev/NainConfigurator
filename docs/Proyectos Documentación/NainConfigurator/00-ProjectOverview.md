# NainConfigurator

Document version: 2.8  
Status: Architecture and physical database approved; testing strategy proposed; implementation and real-data launch not ready  
Last updated: 2026-07-28

## 1. Product vision

NainConfigurator is a reusable B2B platform for presenting configurable products through an interactive 3D experience, calculating estimated prices, preserving customer configurations and generating quote requests for the business that owns the catalog.

The commercial objective is to create a foundation that can onboard multiple client businesses and fundamentally different product catalogs without rebuilding the application for each customer.

The MVP proves this model with one modular gaming desk. Supporting multiple simultaneously published products is outside the MVP user experience, but the domain and data model must not contain desk-specific structures that prevent that future expansion.

## 2. Initial product and target businesses

Initial product: Escritorio gaming modular (`DESK-001`).

The initial paying-customer segment is Spanish small and mid-sized manufacturers and specialist retailers of configurable furniture, beginning with custom, office and gaming furniture. Good first customers have a limited set of priority configurable products, use human commercial confirmation and can supply accurate catalog and asset-source information.

Future target businesses may include:

- Custom furniture manufacturers
- Office and gaming furniture stores
- Carpenters
- Interior design businesses
- Other businesses that sell products assembled from catalog-driven options

Furniture is the first go-to-market segment, not a platform boundary. Expansion to another industry must use the same generic catalog, validation, pricing, snapshot and quote model.

## 3. Approved commercial operating model

- One shared multi-company SaaS service with strict company-scoped isolation.
- One-time paid onboarding/setup plus a recurring hosted-service subscription.
- Separately scoped professional services for additional products, substantial asset work or approved integrations.
- Managed and versioned catalog publication during the MVP; customer self-service administration is deferred.
- Configurable co-branding through data, with future premium white-label only on the same product release.
- Customer ownership of product/legal accuracy, asset rights, lead response and final commercial offers.
- NainConfigurator ownership of technical validation, platform operation and B2B technical support.
- No customer-specific code, schema, repository or permanent deployment forks.

Exact prices, quotas, service levels and legal terms remain required before a paid proposal or commercial launch. See `00.2-CommercialStrategy.md`.

## 4. MVP outcome

A public user can:

1. Load the active published product catalog for a company.
2. Select valid options in a 3D client generated from catalog data.
3. See an immediate non-authoritative estimated price.
4. Ask the API to validate the selection and calculate the authoritative price.
5. Save an immutable configuration and receive a public configuration code.
6. Submit an idempotent quote request after acknowledging the active immutable company privacy notice.

## 5. Platform model

The reusable platform is expressed through generic concepts:

- Company
- Privacy policy version
- Product
- Option group
- Product option
- Compatibility rule
- Configuration and commercial snapshot
- Quote request

New products must be introduced through catalog data. Product-specific database columns, request fields or validation branches such as `DeskSize`, `DeskColor` or `DeskLeg` are prohibited.

## 6. Design principles

- Company-scoped ownership with globally stable public resource codes
- Catalog-driven clients and validation
- Product-agnostic domain and persistence model
- Versioned published catalog behavior
- API authority for validation and price calculation
- Immutable historical configuration snapshots
- Idempotent public create operations
- Explicit privacy-notice acknowledgment, content identity and retention evidence without treating it as marketing consent or lawful basis
- Clear separation between commercial data and optional visual state
- Technology-independent logical design before physical database design
- Shared product evolution without customer-specific code, schema or release forks
- Separation of the public company/catalog domain from future billing, membership and administration concerns
- Complete commercial operation without depending on 3D availability
- WCAG 2.2 Level AA target for the complete public experience
- Company locale and accessible branding through generic data, never client forks
- Measurable quality through explicit percentiles, supported load, internal SLO, recovery objectives and cost guardrails
- Privacy by design, strict company isolation, least privilege, finite personal-data retention and verifiable deletion

## 7. Technology direction

- .NET 10 LTS, C# 14, ASP.NET Core 10 and EF Core 10 for a pragmatic modular monolith.
- React 19.2 and TypeScript 6 for the accessible public document interface; Node.js is build-time only.
- Babylon.js `9.18.0` for the optional lazy-loaded Web renderer, with Blender `4.5 LTS` authoring and validated glTF/GLB `2.0` assets behind a replaceable bridge.
- Azure App Service in West Europe with separate Public, Operations and Worker processes on one zone-redundant plan.
- Azure SQL Database General Purpose serverless, compatibility level 170, as the sole commercial authority.
- Azure Managed Redis for disposable catalog cache, distributed rate limits and administrative session state.
- Azure Front Door Standard, Blob Storage, Entra ID, managed identities, Key Vault and regional Azure Monitor/OpenTelemetry.
- GitHub Actions with OIDC and Azure Bicep for deterministic delivery and infrastructure.

These are approved architecture choices, not permission to implement. `06-Architecture.md` owns exact baselines, alternatives and revisit triggers. Public contracts and the logical domain remain usable by another renderer or persistence adapter.

## 8. Explicitly outside the MVP

- Public customer accounts and customer self-service authentication
- Online payments
- Product administration panel
- Multiple-product listing and discovery experience
- Inventory, shipping and installation calculation
- Discount and promotion engine
- Quote status management beyond `New`
- Free room-object placement
- Virtual and augmented reality
- Customer self-service catalog administration
- Billing, invoicing and subscription-account implementation
- Dedicated customer deployments and contractual 24/7 support

## 9. Documentation map

| Document | Purpose |
|---|---|
| `00.1-DocumentationRoadmap.md` | Documentation gates from product foundation to commercial launch |
| `00.2-CommercialStrategy.md` | Approved target market, service, revenue, onboarding, branding and operating responsibilities |
| `01-ProductDefinition.md` | Approved catalog values for `DESK-001` |
| `02-BusinessRules.md` | Authoritative business invariants and lifecycle behavior |
| `03-DataModel.md` | Technology-independent logical data model |
| `03.1-UserFlows.md` | Public user, client, API and recovery flows |
| `03.2-UXRequirements.md` | Responsive, accessibility, degraded 3D, branding, locale, money and public-state requirements |
| `04.1-ApiContracts.md` | Authoritative public HTTP and JSON contracts |
| `04.2-NonFunctionalRequirements.md` | Measurable performance, scale, browser, renderer, availability, recovery, support and maintainability targets |
| `04.3-SecurityAndPrivacy.md` | Approved threat, isolation, identity, abuse, encryption, privacy, retention, audit and incident requirements |
| `05-DatabaseDesign.md` | Approved physical design: zero-cost local SQL prototype and production-compatible Azure SQL schema |
| `06-Architecture.md` | Approved application, technology and deployment architecture |
| `07-DecisionLog.md` | Cross-document architectural and product decisions |
| `08-TestingStrategy.md` | Proposed free-first verification strategy and local client-demo evidence gate |
| `AI_CONTEXT.md` | Short navigation summary; never an independent source of truth |

`04-ApiContracts.md`, `02-BusinessRules.v1.md` and `Producto inicial.md` are historical inputs and are not authoritative.

The product foundation, commercial operating model, quality, security/privacy, application architecture and physical persistence are approved. Testing is proposed; operations and implementation planning remain required before code. Customer-specific legal artifacts and operational evidence remain required before real personal data or a paying-customer launch.
