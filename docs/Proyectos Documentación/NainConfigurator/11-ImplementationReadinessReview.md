# Implementation Readiness Review

Document version: 1.0  
Status: Passed for implementation; Technical Demo candidate pending two manual gates
Review date: 2026-07-28  
Implementation evidence updated: 2026-07-31
Applies to: Documentation completeness, local implementation and synthetic LocalDemo readiness boundary

## 1. Purpose and authority

This document records the final review required by IMP-012. It answers four separate questions:

1. Are the canonical product, commercial, UX, API, data, security, architecture, testing, operations and delivery sources coherent enough to implement?
2. Does the approved design preserve a data-driven second-product path without desk-specific schema, contracts, UI branches or releases?
3. Can the first implementation and attended LocalDemo use legally suitable no-license-fee tools without recurring cloud cost?
4. Which documents or evidence remain required before a public demo, customer pilot, real personal data or paying-customer production?

This review does not override any canonical source. Where a later implementation discovers a conflict affecting behavior, public contracts, persistence, tenancy, security or architecture, IMP-011 requires work to stop for an explicit decision.

No review can guarantee that a future implementation is defect-free or commercially successful. `Passed` means that no unresolved documentation decision blocks the approved local slices and that known later obligations are assigned to explicit gates.

## 2. Direct conclusion

NainConfigurator is documentation-complete for implementation eligibility through the synthetic LocalDemo path, SL-000 through SL-009. The required core implementation now has automated evidence; optional SL-007 is deferred and the final Technical Demo label remains gated as recorded in section 8.2.

The review found no blocking contradiction in the approved implementation scope. It corrected stale navigation text that still described already completed gates; those corrections do not change product behavior, public contracts, data design, architecture or commercial policy.

The product owner authorized SL-000 on 2026-07-28. This authorization does not extend to:

- Cloud or external resource creation.
- Paid usage, payment-card registration or consumption billing.
- A public Internet deployment.
- Real personal data.
- A customer pilot or production launch.
- A commit, push, pull request or deployment unless requested separately.

Public demo, pilot and commercial launch are deliberately not documentation-complete today because their missing artifacts require real provider, customer, legal, commercial and operational evidence that should not be invented before it exists.

## 3. Sources reviewed

### 3.1 Canonical authority

| Source | Review status | Authority used |
|---|---|---|
| `00-ProjectOverview.md` | Aligned | Product objective, scope and current readiness |
| `00.1-DocumentationRoadmap.md` | Aligned | Gate authority and phase boundaries |
| `00.2-CommercialStrategy.md` | Approved and aligned | Initial customer, service model, revenue structure and operating responsibilities |
| `01-ProductDefinition.md` | Approved | Initial product catalog values only |
| `02-BusinessRules.md` | Approved | Authoritative shared and initial-product behavior |
| `03-DataModel.md` | Approved | Generic logical entities and invariants |
| `03.1-UserFlows.md` | Approved | Public and operational sequence behavior |
| `03.2-UXRequirements.md` | Approved | Responsive, accessible, localized and degraded-renderer behavior |
| `04.1-ApiContracts.md` | Approved | Public routes, payloads, status behavior and stable error codes |
| `04.2-NonFunctionalRequirements.md` | Approved | Measurable quality, capacity, availability, recovery and cost targets |
| `04.3-SecurityAndPrivacy.md` | Approved technical design | Trust, company isolation, personal-data and launch controls |
| `05-DatabaseDesign.md` | Approved | Physical SQL Server/Azure SQL design |
| `06-Architecture.md` | Approved | Technology, module, process, transaction and deployment boundaries |
| `07-DecisionLog.md` | Active and aligned | Approved cross-document decisions through IMP-012 |
| `08-TestingStrategy.md` | Approved | Verification layers, tools and evidence gates |
| `09-DeploymentAndOperations.md` | Approved | Environment, deployment, recovery, support and cost boundaries |
| `10-ImplementationPlan.md` | Approved | Dependency-ordered vertical slices and stop/go gates |

### 3.2 Historical sources

`02-BusinessRules.v1.md`, `04-ApiContracts.md` and `Producto inicial.md` are visibly superseded or historical. They remain context only and cannot direct implementation.

## 4. Coherence findings

### 4.1 Product and commercial scope

- The initial offer targets configurable-furniture manufacturers and specialist retailers, but the platform model is not furniture-specific.
- The buyer, public user, platform operator and customer responsibilities are separated.
- Managed onboarding, setup fee, recurring subscription and separately priced professional services prevent unlimited customization from being hidden inside the base subscription.
- Exact prices and contract terms remain commercial artifacts, not application behavior.

### 4.2 Product-agnostic flexibility

- Products, groups, options, compatibility rules, pricing inputs, visual references, brand content and locales are catalog data.
- No approved logical entity, physical column, API property or UI route is named for a desk dimension or other first-product feature.
- The only product-specific values belong in `01-ProductDefinition.md` and controlled catalog fixtures/publication.
- IMP-006 and the test strategy require one fundamentally different synthetic product to work through data/assets only before scalability is claimed.
- A second product cannot require a schema, contract, UI-component branch, build or deployment fork.

This is the strongest useful flexibility proof for the MVP. A generic plugin engine, arbitrary expression language or speculative workflow platform would add cost without stronger current evidence and remains correctly rejected.

### 4.3 Rule and transaction authority

- The browser may improve feedback but never owns price, availability, compatibility, company scope or acceptance.
- Server validation and pricing use the same approved rule authority for validation, configuration creation and quote creation.
- Configurations and price components are immutable snapshots; editing creates a new configuration.
- Exact idempotent retries converge; changed payloads with the same request identifier return a stable conflict.
- Quote persistence does not claim email or notification delivery.
- The SQL outbox and worker boundary preserve durable asynchronous intent without introducing a broker prematurely.

### 4.4 Multi-company security and privacy

- Company scope is derived from trusted server context rather than caller-supplied tenant identifiers.
- Application filters, composite ownership constraints and SQL Row-Level Security provide layered isolation.
- Company separation also covers cache keys, assets, workers, exports, audits, retention and deletion recovery.
- Public codes are not authorization, public quote reads are absent and operations access requires managed identity controls.
- Demo and non-production defaults prohibit real personal data.

### 4.5 Architecture and delivery

- The .NET modular monolith is proportionate to one product team and the approved operating envelope.
- Modules retain clear transaction and data ownership without microservice overhead.
- Blender is an offline authoring tool; Babylon.js is a lazy, replaceable Web renderer behind a versioned adapter.
- 3D never owns commercial decisions, blocks accessibility or prevents the no-renderer journey.
- Vertical slices preserve one deployable shared release and add controls as risk is introduced.
- Public demo, pilot and production are not automatic promotions of the local build.

### 4.6 Physical persistence

- The 18-table design maps the approved logical model without desk-specific fields.
- Keys, ownership constraints, restrictive deletion, monetary precision, UTC time, rowversion, JSON bounds, RLS, idempotency, outbox and retention behavior are explicit.
- Physical acceptance uses SQL Server 2025 Developer, not SQLite or EF in-memory.
- Migrations are versioned delivery artifacts; application startup does not migrate production.

### 4.7 Verification and operations

- The testing strategy maps the 111 named acceptance scenarios and separates unit, API, physical SQL, browser, accessibility, renderer, security, recovery and performance evidence.
- The first client demo is local, synthetic, offline-capable and uses a recording notification adapter.
- CI has a zero-paid-usage boundary and can stop or fall back to trusted local verification when included allowance is exhausted.
- Production-only controls are defined but cannot be claimed until implemented, measured and exercised.

## 5. Corrections made by this review

The following stale statements were corrected:

- `10-ImplementationPlan.md` now records IMP-001 through IMP-012 as approved and the final review as passed.
- `08-TestingStrategy.md` no longer calls its approved toolchain proposed or names deployment/operations as the next gate.
- `05-DatabaseDesign.md`, `06-Architecture.md`, `09-DeploymentAndOperations.md` and the commercial strategy now point to the current readiness boundary.
- Project overview, roadmap, AI context and repository navigation identify this final review and separate implementation authorization.

No decision identifier, rule, endpoint, table, technology boundary, security control or slice scope was changed.

## 6. Free-first technology verification

Sources and plan limits were checked on 2026-07-28. SL-000 locks the exact adopted patches in deterministic manifests and records integrity, vulnerability, secret-scan and SBOM evidence. Deferred tools and provider terms must be rechecked when their owning later slice adopts or activates them.

### 6.1 Local implementation and LocalDemo

| Tool or platform | Intended use | Verified cost/license boundary | Readiness result |
|---|---|---|---|
| .NET 10, C# 14 and ASP.NET Core 10 | Backend and hosts | .NET is free/open source; .NET and ASP.NET Core source/package distributions use MIT terms, with Microsoft binary distribution terms documented separately | Approved |
| EF Core SQL Server 10 | Persistence adapter | MIT; version 10.0.10 exists for the approved .NET line | Approved |
| Visual Studio Community | Optional individual IDE | Microsoft permits an individual developer to create free or paid applications; organizational use has additional restrictions | Approved for the current individual owner; IDE is not a product dependency |
| Node.js 24 LTS | Frontend build runtime only | Open source under its published license; no hosted service required | Approved |
| React 19.2, TypeScript 6 and Vite 8.1 | Accessible Web shell/build | MIT, Apache-2.0 and MIT respectively; exact compatible patches are locked at SL-000 | Approved |
| Babylon.js 9.18 | Web renderer | Apache-2.0; no engine royalty | Approved |
| Blender 4.5 LTS | Offline asset authoring | GPL application; Blender documents that created artwork is not forced under GPL | Approved; each add-on and input asset still needs its own rights review |
| glTF/GLB 2.0 and Khronos glTF Validator | Portable 3D delivery and validation | Open specification/tooling; validator uses Apache-2.0 | Approved |
| SQL Server 2025 Developer | Local physical database, development, tests and attended demonstration | No-cost Developer edition permits design, development, testing and demonstration; production use is prohibited | Approved only for non-production |
| xUnit, Vitest, React Testing Library and Playwright | Automated verification | Apache-2.0/MIT/MIT/Apache-2.0; local use needs no paid test SaaS | Approved |
| axe-core | Automated accessibility baseline | MPL-2.0 development tooling; automation does not replace human checks | Approved with license notice obligations |
| k6 OSS | Local diagnostic load generation | AGPL-3.0; use the unmodified local CLI and do not link or ship it with the product | Approved for the documented test role |
| OWASP ZAP | Controlled local/integration DAST | Apache-2.0; no paid service required | Approved; not a penetration-test substitute |
| Git and private GitHub repository | Source control and off-device copy | GitHub Free supports private repositories; product operation cannot depend on free hosted CI | Approved within current account limits |

The recurring software/cloud invoice target for local development and the attended LocalDemo is EUR 0. This excludes the real economic cost of existing hardware, electricity, Internet access, maintenance and owner time.

### 6.2 GitHub Free boundary

Current GitHub documentation provides 2,000 standard hosted-runner minutes/month for private repositories on GitHub Free, plus limited artifact and cache storage. This is an allowance, not unlimited free CI.

No hosted workflow is enabled by SL-000. Before a later slice enables one, that slice must verify the actual account plan, configure zero paid usage or stop behavior, keep retention bounded and document the local fallback. Exhausting the allowance must pause hosted CI and must never trigger an unapproved charge.

### 6.3 Optional Azure free offers

| Offer | What it may support | Limitation | Decision |
|---|---|---|---|
| Azure SQL Database free offer | Optional development or proof-of-concept database | Monthly compute/storage/backup limits, no SLA and service stop/paid-overage choice | Not needed for LocalDemo and never a customer-pilot dependency |
| Azure Static Web Apps Free | Possible static synthetic portfolio artifact | Microsoft labels the Free plan for personal projects and provides no SLA; applicable commercial-use terms are not proven by the quota page | Not approved for commercial activation |
| Azure credits or trials | Temporary experiments | Expiry, payment upgrade and consumption-charge risk | Never an operational foundation; activation requires explicit approval |

No public-demo host is selected. A provider becomes eligible only when its current agreement explicitly permits the intended commercial demonstration, data remains synthetic/static, quotas and removal date are recorded, portability is preserved and paid overage is disabled.

### 6.4 Production cost truth

The approved production topology is intentionally not free. App Service, Azure SQL, Front Door, managed Redis, Blob Storage, Key Vault and Azure Monitor are billable when a funded pilot or production gate is reached.

`06-Architecture.md` contains a 2026-07-19 planning range of USD 570-980/month for a 20-customer workload. It is not a quote. It must be recalculated for West Europe, current prices, tax, exchange rate, actual traffic and negotiated service choices before any purchase or paid proposal.

Free-first therefore means:

- Zero recurring software/cloud invoice for local development and attended LocalDemo.
- Optional free public services only after current terms and hard cost boundaries are verified.
- The least expensive reliable paid production profile after real demand and revenue justify customer obligations.

It does not mean placing paying-customer data or reputation on unsupported free plans.

## 7. SL-000 adoption evidence

These are implementation evidence, not product decisions:

- [x] Record exact adopted .NET SDK/runtime, Node.js, SQL Server and local quality-tool versions. Blender and renderer/test-browser adoption remain owned by their later slices.
- [x] Recheck lifecycle, licenses, vulnerabilities and package integrity for the installed SL-000 dependency set.
- [x] Commit deterministic dependency manifests and lockfiles.
- [x] Select and record the smallest free secret-scanning and SBOM commands needed by the SL-000 boundary. Later analyzers remain owned by the slice that introduces the relevant code.
- [x] Generate a direct-dependency license inventory and machine-readable SBOM.
- [x] Prove clean restore, build, unit-test, audit and formatter/analyzer commands on the owner workstation.
- [x] Verify that the SL-000 toolchain requires no Docker Desktop, paid SaaS account, cloud resource or payment card.
- [ ] Verify the actual GitHub plan and allowances before enabling hosted workflows. This is not required for SL-000 because no hosted workflow is enabled.

A tool that introduces a runtime dependency, hosted account, commercial restriction, paid usage or architectural responsibility requires explicit review. A compatible patch pin inside the approved line does not create a new product gate.

## 8. Remaining documentation and evidence by stage

### 8.1 SL-000 current status

Blocking documentation: none.

Authorization was received on 2026-07-28. The repository baseline and quality pipeline are implemented and pass. SQL Server 2025 Standard Developer Edition CU7 (`17.0.4065.4`) is installed locally and the separate real-engine connectivity test passes. The SL-000 revision was previously preserved; no new commit, push, cloud resource or deployment is authorized by this review.

### 8.2 Before declaring Technical demo ready

Completed automated evidence:

- [x] Locked restore, formatting, zero-warning release build and 24 passing .NET tests.
- [x] Four component tests and 12 Playwright journeys across Chromium, Firefox, WebKit and mobile Chromium.
- [x] Automated axe checks, keyboard entry, 320-pixel reflow and complete no-renderer commercial journey.
- [x] Real SQL Server migration plus RLS, cross-company constraint, transactional rollback, idempotency and 20-request concurrency evidence.
- [x] First product and fundamentally different bicycle fixture use the same schema, contracts, evaluator, UI and release through data only.
- [x] Dependency audit, reviewed direct-dependency inventory, secret scan, SPDX 2.2 SBOM and 150-file SHA-256 package manifest.
- [x] Synthetic fixture controls, `.invalid` quote boundary, no external notification and passing packaged LocalDemo smoke.
- [x] SL-007 asset/renderer records are not applicable because the approved optional slice is explicitly deferred and the accessible fallback passes.

Remaining evidence:

- [ ] Manual NVDA or Narrator review of the critical journey.
- [ ] Offline execution of the exact package on a clean controlled machine.
- [x] Explicitly authorized source revision followed by a passing clean-checkout gate on 2026-07-31.

The two manual items block the `Technical demo ready` claim, not the implemented candidate. They cannot be replaced by automated assertions.

### 8.3 Before SL-010 or any public demo

The following small artifacts remain:

1. **Commercial experiment brief:** target list/segment, outreach count, response and meeting thresholds, required pilot signal, time box, owner and maximum spend.
2. **Public-demo activation record:** selected host, exact applicable agreement, commercial-use permission, current quotas, bandwidth stop threshold, zero-overage configuration, region/privacy review, portability/export method and removal date.
3. **Public-demo content manifest:** only synthetic products and assets with commercial redistribution rights; no contact capture, API, persistence, analytics or hidden customer data.
4. **Explicit owner authorization:** resource creation and public exposure are separate actions.

Missing numeric commercial thresholds do not block SL-000 through SL-009. They block public/cloud investment.

### 8.4 Before a customer pilot or any real personal data

Required customer/provider-specific documentation and implemented evidence:

- Signed pilot scope, success/stop criteria, duration, responsibilities and exit/offboarding terms.
- Customer-approved catalog, estimate disclaimers, brand assets and evidence of asset/content rights.
- Customer-specific privacy notice, lawful-basis decision, controller/processor roles, DPA, rights process, retention justification and subprocessor/region disclosure.
- Named quote recipients, provider selection, delivery/failure/retry/escalation workflow and customer response ownership.
- Approved cloud bill of materials, current quote, subscription owner, budgets, alerts, maximum monthly spend and recovery cost.
- Operations and security contacts, incident communications, break-glass ownership and at least one trained backup contact.
- Independent penetration-test result or explicitly approved equivalent gate, with critical/high findings closed.
- Isolated restore, deletion-reconciliation, migration, rollback/roll-forward and regional-recovery evidence.
- Production-shaped load, accessibility/browser, isolation, logging/redaction and observability evidence.

No demo success can waive these controls.

### 8.5 Before first paid proposal and commercial launch

Required commercial and launch package:

- Exact setup/onboarding price, recurring subscription, included quotas, professional-services rate, taxes and payment terms.
- Supported customization boundary and pricing for out-of-scope asset/catalog work.
- Customer agreement, DPA, privacy/subprocessor documents and approved service/support terms.
- Measured cost per company/session, onboarding effort, support effort and credible gross-margin model.
- Production readiness report with current dependency, security, restore, capacity, alert and operational evidence.
- Customer onboarding checklist, catalog publication acceptance, quote-routing acceptance and offboarding/export obligations.
- Any contractual SLA only after availability, RPO, RTO and support coverage are implemented, exercised, measured and funded.

These items depend on a concrete customer, provider, prices and measured implementation. Writing placeholders now would create false certainty.

## 9. Residual risks

| Risk | Current control | Blocks local implementation? | Blocks later stage? |
|---|---|---:|---:|
| No validated willingness to pay yet | LocalDemo-first learning loop and bounded experiment before cloud spend | No | Public/cloud investment without experiment brief |
| One-person delivery/support | WIP limit, runbooks and required backup contact | No | Paying-customer launch |
| Exact package patches can change | Approved major/minor baseline; verify and lock at SL-000 | No | Adoption if lifecycle/license/security check fails |
| Public free-host commercial terms are unclear | No provider selected; remain local | No | Public demo |
| Independent penetration testing may cost money | Free automated baseline plus later independent gate | No | Real-data pilot/production |
| Real Safari/VoiceOver and device evidence may need Apple access | Playwright/WebKit plus honest manual-device gate | No | Claimed support/launch evidence |
| Production Azure cost is modeled, not measured | No resource activation; recalculate before purchase | No | Paid pilot/production |
| Customer privacy, routing and legal details do not exist yet | Real data remains prohibited | No | Pilot/production |

## 10. Final readiness checklist

- [x] Every implementation-blocking canonical source is approved.
- [x] Historical sources are visibly non-authoritative.
- [x] IMP-001 through IMP-012 are approved and recorded.
- [x] No unresolved business-rule, API, logical-data, physical-data, tenancy, security or architecture decision blocks SL-000 through SL-009.
- [x] The initial product remains catalog data rather than schema.
- [x] A fundamentally different second-product proof is required before a scalability claim.
- [x] Server authority, idempotency, concurrency, immutable history and asynchronous recording boundaries agree.
- [x] Multi-company scope and personal-data limits agree across API, persistence, cache, asset, job and operations boundaries.
- [x] The 3D renderer is optional, accessible through fallback and commercially non-authoritative.
- [x] The local toolchain can be adopted without a recurring software/cloud invoice for the documented use.
- [x] Developer/demo-only licenses and free-tier limitations are explicit.
- [x] Public demo, pilot, real data, paid services and production retain separate gates.
- [x] Later missing artifacts have an owner, required stage and stop condition.
- [x] Product owner separately authorized SL-000 implementation on 2026-07-28.
- [x] Product owner separately authorized SL-001 through SL-009 implementation on 2026-07-30.
- [x] Required core Technical Demo automated evidence passes.
- [ ] Manual Technical Demo evidence in section 8.2 passes.

## 11. Next authority

The product owner supplied the following unambiguous authorization on 2026-07-28:

`Autorizo comenzar la implementación de SL-000.`

SL-000 is completed. On 2026-07-30 the product owner separately authorized SL-001 through SL-009 for the local synthetic Technical Demo. The core candidate is implemented, optional SL-007 is deferred, the clean-checkout automated gate passes and the remaining manual G3 evidence is listed in section 8.2. This does not permit SL-010 or later slices, cloud-resource creation, public deployment, real data, paid services, future commits or push.

## 12. Official evidence reviewed

Sources checked on 2026-07-28:

- [.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy)
- [.NET licensing information](https://github.com/dotnet/core/blob/main/license-information.md)
- [ASP.NET Core repository and MIT license](https://github.com/dotnet/aspnetcore)
- [EF Core repository and MIT license](https://github.com/dotnet/efcore)
- [EF Core SQL Server 10.0.10 package](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore.SqlServer/10.0.10)
- [Visual Studio Community pricing and individual-use boundary](https://visualstudio.microsoft.com/vs/pricing/?tab=free-tools)
- [SQL Server 2025 Developer license terms](https://www.microsoft.com/content/dam/microsoft/usetm/documents/sql-server/sql-server-2025-developer%2C-express%2C-evaluation/retail/SQL_Server_2025_Developer_Express_and_Evaluation_Edition_English.pdf)
- [SQL Server licensing guidance](https://www.microsoft.com/licensing/guidance/SQL)
- [React repository and MIT license](https://github.com/facebook/react)
- [TypeScript repository and Apache-2.0 license](https://github.com/microsoft/TypeScript)
- [TypeScript 6.0 release](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [TypeScript 7.0 transition status](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [Vite repository and MIT license](https://github.com/vitejs/vite)
- [Node.js 24.18.0 archive](https://nodejs.org/en/download/archive/v24.18.0)
- [Babylon.js repository and Apache-2.0 license](https://github.com/BabylonJS/Babylon.js)
- [Babylon.js ES module package](https://www.npmjs.com/package/@babylonjs/core)
- [Blender license and created-artwork boundary](https://docs.blender.org/manual/en/latest/getting_started/about/license.html)
- [Khronos glTF Validator and Apache-2.0 license](https://github.com/KhronosGroup/glTF-Validator)
- [xUnit repository and Apache-2.0 license](https://github.com/xunit/xunit)
- [Vitest repository and MIT license](https://github.com/vitest-dev/vitest)
- [React Testing Library repository and MIT license](https://github.com/testing-library/react-testing-library)
- [Playwright repository and Apache-2.0 license](https://github.com/microsoft/playwright)
- [axe-core repository and MPL-2.0 license](https://github.com/dequelabs/axe-core)
- [k6 repository and AGPL-3.0 license](https://github.com/grafana/k6)
- [OWASP ZAP repository and Apache-2.0 license](https://github.com/zaproxy/zaproxy)
- [GitHub private-repository behavior](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [GitHub Actions billing and included allowances](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub budgets and usage controls](https://docs.github.com/en/billing/how-tos/set-up-budgets)
- [Azure SQL Database free-offer FAQ](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer-faq?view=azuresql)
- [Azure Static Web Apps plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans)
- [Azure legal information and subscription agreements](https://azure.microsoft.com/en-us/support/legal/)
- [Avoiding charges with an Azure free account](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/avoid-charges-free-account)
