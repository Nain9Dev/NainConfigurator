# Decision Log

Status: Active  
Last updated: 2026-07-28

This document records approved product, commercial, UX, quality, security, privacy, domain, data, architecture, testing, operations and implementation decisions that affect more than one canonical document. Draft proposals remain in their design document until approved.

## Entry template

```text
Decision ID:
Date:
Status: Proposed | Approved | Superseded
Context:
Decision:
Consequences:
Affected documents:
```

## DM-001 - Versioned company privacy policies

Date: 2026-07-19  
Status: Approved

**Context:** Quote requests must validate the active company policy while preserving exact historical acknowledgment evidence.

**Decision:** Privacy policies are immutable versioned company records with managed content, SHA-256 identity, publication time and retention value. Each public quote-enabled company designates one active version, and each quote references and snapshots the acknowledged version and content hash.

**Consequences:** Activating a new policy does not rewrite old quote evidence. Policy and quote retention follow `04.3-SecurityAndPrivacy.md`; acknowledgment is not represented as marketing consent or lawful-basis selection.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md`.

## DM-002 - Relational compatibility-rule participants

Date: 2026-07-19  
Status: Approved

**Context:** Compatibility rules may contain multiple source and target options and must remain product-agnostic.

**Decision:** Compatibility rules use separate source and target relationships to product options. Encoded lists and product-specific compatibility columns are prohibited.

**Consequences:** New products can publish supported compatibility data without schema changes. New executable rule types still require business-rule, API and client approval.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md`.

## DM-003 - Current catalog plus immutable configuration history

Date: 2026-07-19  
Status: Approved

**Context:** The public API requires a current catalog version, while saved configurations must survive later catalog changes.

**Decision:** The MVP retains the current published catalog state and version. Historical commercial truth is stored in immutable configuration snapshots instead of complete temporal copies of every catalog version.

**Consequences:** Drafts, scheduled publication, rollback and full catalog history are deferred to a future administration design. Saved configurations never depend on current catalog values.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md`.

## DM-004 - Persisted ordered price components

Date: 2026-07-19  
Status: Approved

**Context:** Saved-configuration retrieval must reproduce the authoritative price breakdown without current catalog data.

**Decision:** Each saved configuration persists an ordered base-price component and one ordered option-adjustment component per normalized selection.

**Consequences:** The saved total is auditable and reproducible. Any future component type requires an explicit rule and contract change.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md`.

## DM-005 - Resource-owned idempotency data

Date: 2026-07-19  
Status: Approved

**Context:** Configuration and quote creation require exact replay handling and separate concurrency-safe request scopes.

**Decision:** The created configuration or quote stores its client request ID and canonical request identity. Configuration and quote request IDs use separate unique scopes.

**Consequences:** Exact replays resolve the existing resource, different payloads conflict, and a polymorphic idempotency-resource table is not required for the MVP.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md` and `06-Architecture.md`.

## FD-001 - Catalog-generated commercial interface

Date: 2026-07-19  
Status: Approved

**Context:** Fundamentally different products must use one public interaction model without product-specific commercial controls.

**Decision:** The public client generates commercial controls from catalog groups, limits, defaults, order and supported rules. Product-specific commercial branches are prohibited.

**Consequences:** Different products reuse the same flow engine; only visual mappings and catalog data vary.

**Affected documents:** `02-BusinessRules.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md` and `06-Architecture.md`.

## FD-002 - Pre-save validation is a UX step

Date: 2026-07-19  
Status: Approved

**Context:** Validation before saving improves feedback, but it cannot become a prerequisite that weakens create-operation authority.

**Decision:** The client normally calls validation before saving for feedback, while configuration creation always repeats authoritative validation and remains correct without a prior validation call.

**Consequences:** User experience and security authority remain separate, and validation logic must be reused by both use cases.

**Affected documents:** `02-BusinessRules.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md` and `06-Architecture.md`.

## FD-003 - Explicit review after catalog conflict

Date: 2026-07-19  
Status: Approved

**Context:** A product catalog may change while a user is configuring, removing or changing previously selected choices.

**Decision:** A catalog version conflict reloads the catalog, compares previous option codes and requires user review before validation or saving against the new version.

**Consequences:** Removed or changed selections are never silently replaced, preserving customer intent.

**Affected documents:** `02-BusinessRules.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md`.

## FD-004 - Request ID follows one immutable create intent

Date: 2026-07-19  
Status: Approved

**Context:** Network uncertainty requires safe retries, while a corrected payload represents a different business intent.

**Decision:** An exact uncertain retry reuses its client request ID. Any canonical payload change creates a new intent and request ID.

**Consequences:** Network recovery does not create duplicates, and changed payloads do not produce idempotency conflicts.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md`.

## FD-005 - Editing after save creates a new configuration

Date: 2026-07-19  
Status: Approved

**Context:** Saved configurations are immutable snapshots, but users still need to continue experimenting after a save.

**Decision:** A change after saving becomes a dirty draft. Saving it creates a new immutable configuration, and a quote must clearly reference the intended saved snapshot.

**Consequences:** Historical configurations remain unchanged and quote intent cannot silently diverge from the displayed product state.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `03.1-UserFlows.md`.

## FD-006 - Privacy changes clear acknowledgment

Date: 2026-07-19  
Status: Approved

**Context:** Acknowledgment of one privacy-policy version cannot serve as evidence that different content activated later was presented.

**Decision:** A privacy version conflict clears acknowledgment, presents the new immutable resource and requires a new explicit acknowledgment before submission.

**Consequences:** Acknowledgment is never transferred between policy versions; the changed quote payload uses a new request ID.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md`.

## FD-007 - Quote success means persistence only

Date: 2026-07-19  
Status: Approved

**Context:** The public MVP persists quote requests but has not yet approved or implemented notification and sales-routing operations.

**Decision:** A successful public quote flow confirms that a `New` quote request was persisted. It does not claim that email, CRM or staff notification occurred.

**Consequences:** Notification and sales operations remain explicit future integrations and cannot fail invisibly behind the public success response.

**Affected documents:** `00-ProjectOverview.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md` and `06-Architecture.md`.

## FD-008 - Visual problems never change commercial state

Date: 2026-07-19  
Status: Approved

**Context:** Visual assets and renderers can fail independently from valid catalog selections and authoritative pricing.

**Decision:** Missing assets, unsupported local rendering or invalid optional visual state do not add, remove or replace commercial selections.

**Consequences:** Renderers remain replaceable and the API catalog and configuration snapshot remain commercial authority.

**Affected documents:** `02-BusinessRules.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md`.

## FD-009 - Unavailable product blocks new quotes only

Date: 2026-07-19  
Status: Approved

**Context:** Historical configurations remain readable after product deactivation, but creating a new quote could imply commercial availability that no longer exists.

**Decision:** A historical configuration remains viewable, but an inactive or unpublished current product blocks new quote requests with `PRODUCT_NOT_AVAILABLE`. An exact replay of a quote created successfully before deactivation still returns the existing resource.

**Consequences:** The platform avoids accepting new demand for unavailable products while preserving history and idempotency. Independent company contact would require a future explicit contract.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `03.1-UserFlows.md`, `04.1-ApiContracts.md`.

## DM-006 - Normalized configuration selection snapshots

Date: 2026-07-19  
Status: Approved

**Context:** Selections must remain generic, deterministic and independent from later option changes.

**Decision:** Each selected option is persisted as an ordered snapshot row containing group, option, price and visual values used at creation.

**Consequences:** Products with different option groups use the same schema, and historical retrieval does not join to current option values.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md`.

## DM-007 - Deactivation before destructive catalog deletion

Date: 2026-07-19  
Status: Approved

**Context:** Published codes are stable and historical configurations must remain valid.

**Decision:** Referenced published catalog data is deactivated rather than destructively deleted in the MVP.

**Consequences:** Physical foreign keys must use restrictive deletion behavior until retention and administration rules explicitly authorize deletion.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `05-DatabaseDesign.md`.

## DM-008 - Multiple quote requests per configuration

Date: 2026-07-19  
Status: Approved

**Context:** Current rules prevent replay duplicates but do not define one commercial request per configuration.

**Decision:** One configuration may receive multiple quote requests when each represents a distinct create intent with a different client request ID.

**Consequences:** Idempotency prevents accidental duplicates without adding an unapproved uniqueness restriction on configuration. Rate limiting and abuse controls remain required before real launch.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md` and `06-Architecture.md`.

## CM-001 - Initial configurable-furniture customer segment

Date: 2026-07-19  
Status: Approved

**Context:** The platform must reach paying customers without pretending to serve every configurable-product market at once.

**Decision:** Initial sales target Spanish small and mid-sized manufacturers and specialist retailers of configurable furniture. Furniture is a go-to-market focus, not a schema or contract boundary.

**Consequences:** Product qualification and messaging can be specific while the platform must still pass the fundamentally different second-product test.

**Affected documents:** `00-ProjectOverview.md`, `00.2-CommercialStrategy.md`, future UX, quality and implementation planning documents.

## CM-002 - Shared multi-company SaaS as the MVP service

Date: 2026-07-19  
Status: Approved

**Context:** Separate customer installations would increase cost, slow releases and encourage divergent behavior.

**Decision:** The MVP is one shared SaaS service and supported application release with strict company-scoped data and operations.

**Consequences:** Architecture, caching, assets, background work, logs and security must preserve company isolation. Capacity and isolation targets must be measurable before implementation.

**Affected documents:** `00.2-CommercialStrategy.md`, `03-DataModel.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md` and `06-Architecture.md`.

## CM-003 - Commercial account is separate from public Company

Date: 2026-07-19  
Status: Approved

**Context:** A future paying customer may own multiple brands, companies, subscriptions or administrator memberships.

**Decision:** `Company` remains the public catalog and quote-owning domain concept. Billing, subscription, membership and administrative access require a separate future authenticated control-plane model.

**Consequences:** The public product model is not distorted by future billing or organization structure, and one commercial account may later manage multiple company contexts.

**Affected documents:** `00.2-CommercialStrategy.md`, `03-DataModel.md`, future control-plane, security, architecture and billing designs.

## CM-004 - Setup fee plus recurring subscription

Date: 2026-07-19  
Status: Approved

**Context:** Catalog normalization, onboarding and 3D asset work create material upfront cost, while hosting and support create recurring cost.

**Decision:** Require a paid onboarding/setup engagement and a recurring hosted-service subscription. Additional products, substantial asset work and approved integrations are separately scoped professional services. The MVP has no per-lead commission or primary metered-usage charge.

**Consequences:** Pricing can protect onboarding margin without coupling invoices to the public configurator domain. Exact rates, quotas and terms require validation before the first paid proposal.

**Affected documents:** `00.2-CommercialStrategy.md`, future operations, capacity and commercial rate-card artifacts.

## CM-005 - Managed validated catalog publication

Date: 2026-07-19  
Status: Approved

**Context:** A self-service administration product would expand MVP scope, but uncontrolled production edits would be unsafe and expensive.

**Decision:** NainConfigurator manages catalog and asset onboarding during the MVP through a repeatable, validated, auditable and version-aware staging and publication process. Customer self-service administration is deferred.

**Consequences:** Architecture must provide a controlled publication boundary that a later admin UI can reuse; direct untracked production database editing is not an acceptable operating model.

**Affected documents:** `00.2-CommercialStrategy.md`, `06-Architecture.md`, future `09-DeploymentAndOperations.md` and administration design.

## CM-006 - Customer content accountability and platform technical accountability

Date: 2026-07-19  
Status: Approved

**Context:** Commercial accuracy, asset rights, legal content and platform correctness have different owners.

**Decision:** The customer supplies and approves product, price, compatibility, brand and legal accuracy and confirms asset rights. NainConfigurator owns contracted preparation, technical validation, controlled publication and operation of the supported platform.

**Consequences:** Onboarding requires explicit inputs and customer acceptance. Bespoke asset production and data cleanup are scoped rather than silently included.

**Affected documents:** `00.2-CommercialStrategy.md`, future UX, security, testing and operations documents and customer agreements.

## CM-007 - Data-driven co-branding and future white-label

Date: 2026-07-19  
Status: Approved

**Context:** Customers need recognizable branding, but arbitrary themes or bespoke clients undermine accessibility and maintainability.

**Decision:** The MVP provides constrained data-driven company identity, logo and semantic colors. Full white-label may later be a premium offer only through supported configuration on the same release.

**Consequences:** UX must define accessible tokens and fallbacks before data/API fields are finalized. Branding never authorizes customer-specific UI or deployment forks.

**Affected documents:** `00.2-CommercialStrategy.md`, `03.2-UXRequirements.md`, `03-DataModel.md`, `04.1-ApiContracts.md` and `06-Architecture.md`.

## CM-008 - Customer-owned lead response

Date: 2026-07-19  
Status: Approved

**Context:** NainConfigurator captures a quote request but is not the seller of the configured product.

**Decision:** The customer owns quote recipients, response, qualification, final price and commercial follow-up. NainConfigurator owns reliable persistence and the later approved routing mechanism, but a successful public response does not claim notification or follow-up.

**Consequences:** A secure monitored delivery or work-queue process is required before commercial launch, without prematurely selecting an email or CRM vendor.

**Affected documents:** `00.2-CommercialStrategy.md`, `03.1-UserFlows.md`, `04.3-SecurityAndPrivacy.md`, future architecture and operations documents.

## CM-009 - Standard B2B support and no MVP deployment forks

Date: 2026-07-19  
Status: Approved

**Context:** Contractual 24/7 support and dedicated deployments carry costs that an MVP subscription cannot safely assume.

**Decision:** The initial offer provides business-hours B2B technical support to named customer contacts. Dedicated deployment or enhanced support may be a separately costed future offer, but any deployment must use the same supported artifact, contracts and migration path.

**Consequences:** Public end-user product and sales support remains the customer's responsibility. Exact service targets are deferred to measurable requirements and commercial terms.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, `06-Architecture.md` and `09-DeploymentAndOperations.md`.

## DM-009 - Independently versioned company brand profile

Date: 2026-07-19  
Status: Approved

**Context:** Customer identity must be configurable without turning presentation changes into commercial catalog conflicts or code forks.

**Decision:** Each company may have one current `CompanyBrandProfile` with an independent positive version, MVP `CoBranded` mode, optional managed logo key and validated primary/foreground colors.

**Consequences:** Branding changes do not increment product catalog versions or alter saved configurations. Missing or invalid runtime branding uses the accessible platform fallback.

**Affected documents:** `00.2-CommercialStrategy.md`, `03-DataModel.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future architecture and physical design.

## DM-010 - Company default locale and historical content locale

Date: 2026-07-19  
Status: Approved

**Context:** Public text and money need a deterministic locale, while historical snapshots must remain understandable after company settings change.

**Decision:** Each public company has one supported BCP 47 `DefaultLocale` in the MVP, initially `es-ES`. Every saved configuration persists the `ContentLocale` used for its human-readable snapshot.

**Consequences:** A default-locale change is published with aligned catalog text and product-version changes. Per-language schema columns are prohibited; same-company simultaneous multilingual content remains a future generic extension.

**Affected documents:** `01-ProductDefinition.md`, `03-DataModel.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future architecture and physical design.

## UX-001 - Commercial operation without 3D

Date: 2026-07-19  
Status: Approved

**Context:** WebGL capability, asset or runtime failure must not eliminate a valid sales journey.

**Decision:** Catalog selection, textual summary, validation, saving, historical retrieval and quote submission remain operable without the 3D renderer.

**Consequences:** The renderer is progressive presentation state and never owns commercial selections or price.

**Affected documents:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, future quality, architecture and testing documents.

## UX-002 - Responsive commercial reflow

Date: 2026-07-19  
Status: Approved

**Context:** Public users may use narrow viewports, zoom, portrait or landscape presentation.

**Decision:** Commercial content reflows from 320 CSS pixels, tolerates 200 percent text resizing and 400 percent page zoom, and never requires one device orientation.

**Consequences:** Layout may change visual placement but must preserve reading order, focus and state without document-level horizontal scrolling.

**Affected documents:** `03.2-UXRequirements.md`, future quality, architecture and testing documents.

## UX-003 - WCAG 2.2 Level AA target

Date: 2026-07-19  
Status: Approved

**Context:** Accessibility needs a testable standard that covers every responsive and degraded state.

**Decision:** The complete public page targets WCAG 2.2 Level AA. Automated checks alone cannot establish conformance.

**Consequences:** Semantic structure, keyboard operation, focus, contrast, forms, dynamic messages and equivalent visual presentation require manual and assistive-technology verification.

**Affected documents:** `03.2-UXRequirements.md`, future quality, security, architecture and testing documents.

## UX-004 - Equivalent input and enlarged primary targets

Date: 2026-07-19  
Status: Approved

**Context:** Drag, hover, touch or fine pointer control cannot be assumed for public commercial actions.

**Decision:** Keyboard, touch and pointer have equivalent commercial paths, and primary actions and selection controls target at least 44 by 44 CSS pixels.

**Consequences:** Drag-only and gesture-only commercial interaction is prohibited; camera gestures require an equivalent or non-3D path.

**Affected documents:** `03.2-UXRequirements.md`, future architecture and testing documents.

## UX-005 - Independent progressive rendering states

Date: 2026-07-19  
Status: Approved

**Context:** Renderer loading and quality vary independently from catalog validity.

**Decision:** The visual region uses explicit `NotStarted`, `Loading`, `Ready`, `Reduced`, `Unavailable` and `Failed` states and honors reduced-motion preferences.

**Consequences:** Renderer state can degrade, stop or retry without changing draft, validation, save or quote state.

**Affected documents:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, future quality and architecture documents.

## UX-006 - Catalog-generated product interaction

Date: 2026-07-19  
Status: Approved

**Context:** A second product may use entirely different group names and selection limits.

**Decision:** Product groups, order, labels, control multiplicity, selection limits and compatibility guidance are generated from catalog data.

**Consequences:** A product name or business dimension never selects a special screen or form component.

**Affected documents:** `02-BusinessRules.md`, `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future architecture.

## UX-007 - Spanish company-default MVP locale

Date: 2026-07-19  
Status: Approved

**Context:** The first commercial market is Spain, but language must not become an application constant or language-specific schema.

**Decision:** The public MVP supports company default locale `es-ES`; application copy uses locale resources and language identifiers use BCP 47.

**Consequences:** Browser language does not silently override published company content. Another single-locale company later uses supported resources and data, not `NameEs` or `NameEn` columns.

**Affected documents:** `00.2-CommercialStrategy.md`, `01-ProductDefinition.md`, `03-DataModel.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future architecture.

## UX-008 - Locale-aware presentation without monetary authority

Date: 2026-07-19  
Status: Approved

**Context:** Human-readable snapshots and money must retain their meaning independently from current settings.

**Decision:** Configurations persist their content locale; clients format decimal amounts and ISO currency codes for that locale but never parse formatted display text as authoritative money.

**Consequences:** Historical language remains explicit and pricing calculations remain server-authoritative and locale-neutral.

**Affected documents:** `03-DataModel.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future physical design.

## UX-009 - Constrained accessible company co-branding

Date: 2026-07-19  
Status: Approved

**Context:** Customer identity is commercially valuable, while arbitrary styling threatens accessibility, security and maintainability.

**Decision:** MVP co-branding is a versioned data profile with optional managed logo and validated semantic colors. Arbitrary CSS, JavaScript, HTML, fonts, layouts and per-product themes are prohibited.

**Consequences:** Invalid presentation falls back safely; premium white-label can later change only supported data-driven surfaces on the same release.

**Affected documents:** `00.2-CommercialStrategy.md`, `03-DataModel.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future architecture.

## UX-010 - Explicit recoverable client states

Date: 2026-07-19  
Status: Approved

**Context:** Network uncertainty, validation errors and catalog changes can otherwise lose intent or create silent substitutions.

**Decision:** Loading, error, version-conflict and uncertain-retry states provide localized next actions, retain safe input and use stable API codes; catalog replacement requires review.

**Consequences:** Corrected payloads receive new request IDs, exact uncertain retries retain their ID and unknown errors expose only safe support context such as `traceId`.

**Affected documents:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future testing.

## UX-011 - Persistence-bounded confirmations

Date: 2026-07-19  
Status: Approved

**Context:** A successful save or quote response proves persistence but not downstream delivery or a final commercial offer.

**Decision:** Confirmations present copyable public references and claim only the persistence outcome proven by the API.

**Consequences:** Quote success cannot claim email, notification, response time or a binding quote; share content contains no contact data.

**Affected documents:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and future operations.

## UX-012 - Public-client personal-data minimization

Date: 2026-07-19  
Status: Approved

**Context:** Quote contact data is required only for one submission and must not leak through browser conveniences.

**Decision:** Contact and privacy-acknowledgment data stay out of URLs, share payloads, general local storage and analytics; successful submission clears public-client form values.

**Consequences:** Correctable errors may retain values in memory, while persistence and operational access follow the approved security/privacy design.

**Affected documents:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.3-SecurityAndPrivacy.md`, future architecture and testing documents.

## NFR-001 - Percentile-based quality acceptance

Date: 2026-07-19  
Status: Approved

**Context:** Words such as fast, scalable and reliable cannot be tested or priced without measurement boundaries.

**Decision:** Quality acceptance uses explicit reference profiles, production-equivalent release builds, defined load and P50/P75/P95/P99 measurements.

**Consequences:** A result from empty data, debug builds, different caching or unrepresentative infrastructure cannot prove readiness.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, future architecture, testing and operations documents.

## NFR-002 - Supported MVP scale envelope

Date: 2026-07-19  
Status: Approved

**Context:** Unlimited scale is not credible, while an envelope limited to one demo product cannot support paying customers.

**Decision:** The MVP supports 50 companies, 500 published products, 500 concurrent sessions, 50 sustained requests/second and the documented per-product catalog limits.

**Consequences:** Capacity tests use substantial historical data. Catalogs beyond the envelope require a new decision rather than untested publication.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `04.2-NonFunctionalRequirements.md` and future physical design/testing.

## NFR-003 - Good Core Web Vitals and commercial readiness targets

Date: 2026-07-19  
Status: Approved

**Context:** The configurator must convert users before a large 3D runtime finishes loading.

**Decision:** Supported mobile and desktop visits target P75 LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds and CLS ≤ 0.10, plus explicit shell/catalog/action readiness targets.

**Consequences:** Renderer loading and third-party code cannot consume the commercial-shell quality budget or block accessible controls.

**Affected documents:** `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, future architecture, testing and operations documents.

## NFR-004 - Endpoint-specific API SLOs

Date: 2026-07-19  
Status: Approved

**Context:** Reads, validation and transactional writes have different realistic cost and risk.

**Decision:** Each public endpoint has approved P95/P99 latency targets under reference load, with unexpected API errors below 0.5 percent in normal-load windows.

**Consequences:** Architecture and database indexes are justified against real operations; one global average cannot hide slow writes or tail latency.

**Affected documents:** `04.1-ApiContracts.md`, `04.2-NonFunctionalRequirements.md`, future architecture, database, testing and operations documents.

## NFR-005 - Bounded 3D delivery with mandatory fallback

Date: 2026-07-19  
Status: Approved

**Context:** Browser 3D delivery has material transfer, memory and device variability that cannot become a prerequisite for sales.

**Decision:** Initial compressed renderer plus product assets are limited to 30 MB, normal session 3D transfer to 50 MB and renderer quality/readiness to explicit lab targets; misses degrade to the commercial fallback.

**Consequences:** Asset optimization is an onboarding gate. A device can lose 3D quality but never catalog, validation, save or quote capability.

**Affected documents:** `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, future architecture, testing and operations documents.

## NFR-006 - Rolling browser policy and capability-gated 3D

Date: 2026-07-19  
Status: Approved

**Context:** Permanent browser version numbers become stale, and nominal browser support does not prove one device can run WebGL safely.

**Decision:** The commercial shell supports current and previous stable major browser versions on supported operating systems. Full 3D additionally requires support from the pinned Babylon.js line and runtime WebGL 2/capability success.

**Consequences:** Every release records exact tested versions. Unsupported or weak renderers receive a safe degraded path rather than incorrect behavior.

**Affected documents:** `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, future architecture and testing documents.

## NFR-007 - Honest 99.5 percent internal availability SLO

Date: 2026-07-19  
Status: Approved

**Context:** A higher unmeasured promise would add cost and contractual risk inconsistent with the initial SMB MVP.

**Decision:** NainConfigurator targets 99.5 percent monthly availability internally, with tightly limited announced maintenance. It is not sold contractually until measured and costed.

**Consequences:** All controlled dependencies share one error budget; moving failure to assets or database does not improve service availability.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, future architecture, operations and customer agreements.

## NFR-008 - Recovery objectives require restore evidence

Date: 2026-07-19  
Status: Approved

**Context:** Creating backups does not prove that commercial snapshots, idempotency and quote data can be recovered.

**Decision:** SQL data targets RPO ≤ 15 minutes and support-window RTO ≤ 4 hours; isolated restores are evidenced quarterly and full service recovery is exercised twice yearly.

**Consequences:** Backup age and restore integrity are monitored. Retention, encryption, deletion and restored-data reconciliation follow the approved Gate D requirements.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, future architecture, database, testing and operations documents.

## NFR-009 - Multi-instance correctness and bounded cache propagation

Date: 2026-07-19  
Status: Approved

**Context:** Shared SaaS cannot rely on one process, sticky sessions or stale cache for correctness.

**Decision:** Two instances must produce identical ownership, pricing, version and idempotency outcomes without affinity; publication, deactivation and branding changes propagate within 60 seconds.

**Consequences:** Caches are disposable accelerators, never authority. Horizontal growth cannot require product-specific schema or code.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, future architecture, database, testing and operations documents.

## NFR-010 - Trace-correlated and PII-redacted observability

Date: 2026-07-19  
Status: Approved

**Context:** Paying-customer support and SLO enforcement require diagnosis without leaking quote personal data.

**Decision:** Operations expose endpoint percentiles, failures, dependency/cache/write/renderer/backup/cost metrics and correlated `traceId` telemetry while excluding contact data and unrestricted bodies.

**Consequences:** Minimum alerts and detection windows are testable. Retention and access permissions follow the approved Gate D requirements.

**Affected documents:** `02-BusinessRules.md`, `04.1-ApiContracts.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, future architecture and operations documents.

## NFR-011 - Business-hours standard support

Date: 2026-07-19  
Status: Approved

**Context:** The initial subscription cannot honestly fund standard 24/7 human support.

**Decision:** Standard support is Monday–Friday 09:00–18:00 Europe/Madrid excluding national holidays, with explicit S1/S2/S3 acknowledgement and restoration objectives.

**Consequences:** Monitoring and automated recovery may operate continuously, but general human out-of-hours restoration or contractual 24/7 support requires a premium agreement. The narrow Security S1 confidentiality/integrity escalation in `04.3-SecurityAndPrivacy.md` remains mandatory.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, future operations and customer agreements.

## NFR-012 - Quantitative maintainability and delivery gates

Date: 2026-07-19  
Status: Approved

**Context:** SOLID and Clean Architecture slogans do not prevent duplicated rules, partial writes or untestable product forks by themselves.

**Decision:** Enforce boundary independence, one explicit atomic transaction owner per write use case, 100 percent critical-rule branch coverage, at least 85 percent Domain/Application branch coverage, zero release warnings and measurable pipeline/regression gates.

**Consequences:** Shared rules have one implementation, every approved scenario is automated and releases cannot trade correctness for apparent speed.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, future architecture, testing, operations and implementation plan.

## NFR-013 - Direct recurring cost guardrail

Date: 2026-07-19  
Status: Approved

**Context:** A technically fast platform that costs more to operate than it earns is not commercially scalable.

**Decision:** Direct recurring infrastructure and managed-service cost target at most 25 percent of recurring subscription revenue at the planned 20-customer point, producing at least 75 percent direct gross margin before onboarding and overhead.

**Consequences:** Architecture requires a monthly cost model and attributable cost telemetry; overprovisioning cannot be hidden as performance success.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, future architecture and operations documents and commercial rate card.

## NFR-014 - One immutable release for every customer

Date: 2026-07-19  
Status: Approved

**Context:** Customer-specific builds and permanent branches destroy supportability, margins and safe deployment frequency.

**Decision:** One immutable supported artifact is promoted across environments and customers. Product, branding or dedicated deployment needs cannot create code, schema, build or release forks.

**Consequences:** New capabilities must be generic, configured through approved data and tested for every tenant; premium deployment still uses the same artifact and migrations.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, future architecture, testing, operations and implementation plan.

## SEC-001 - Customer controller and platform processor for quote data

Date: 2026-07-19  
Status: Approved

**Context:** The platform processes lead contact data for the company receiving the quote request, but software cannot invent that company's lawful basis.

**Decision:** The customer is controller and NainConfigurator is processor for quote personal data under a data-processing agreement. The customer approves purpose, lawful basis, notice and retention.

**Consequences:** Real data remains blocked until customer legal artifacts exist; platform technical validation does not constitute legal approval.

**Affected documents:** `00-ProjectOverview.md`, `00.2-CommercialStrategy.md`, `02-BusinessRules.md`, `04.3-SecurityAndPrivacy.md` and customer agreements.

## SEC-002 - Three separate trust surfaces

Date: 2026-07-19  
Status: Approved

**Context:** Public configuration, private administration and service credentials have fundamentally different trust assumptions.

**Decision:** Public commercial, private control-plane and service/delivery surfaces are separate security boundaries with independent authentication and authorization behavior.

**Consequences:** Public codes never grant administration or quote-data access; architecture cannot collapse private capabilities into the anonymous API.

**Affected documents:** `04.1-ApiContracts.md`, `04.3-SecurityAndPrivacy.md` and future architecture/testing documents.

## SEC-003 - Trusted company scope across every tenant boundary

Date: 2026-07-19  
Status: Approved

**Context:** SQL filtering alone does not prevent cross-company leaks through caches, assets, jobs, exports, logs or deletion.

**Decision:** Persistence, caches, assets, jobs, audits, exports and retention operations carry trusted internal `CompanyId` scope by construction and require 100-percent negative isolation tests.

**Consequences:** Unscoped application repositories and incomplete cache/storage keys are prohibited; any isolation-test failure blocks release.

**Affected documents:** `03-DataModel.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md` and future architecture/database/testing documents.

## SEC-004 - Cryptographically random public codes and no public quote read

Date: 2026-07-19  
Status: Approved

**Context:** Public identifiers are internet attack inputs and a quote code is associated with restricted contact data.

**Decision:** Configuration and quote codes contain at least 96 bits of cryptographic randomness. Configurations are unlisted non-personal shares; quote codes never authorize a public detail endpoint.

**Consequences:** Sequential/predictable codes are prohibited and a future quote-detail endpoint must be authenticated and company-scoped.

**Affected documents:** `02-BusinessRules.md`, `04.1-ApiContracts.md`, `04.3-SecurityAndPrivacy.md` and future architecture/testing documents.

## SEC-005 - Distributed layered abuse protection

Date: 2026-07-19  
Status: Approved

**Context:** Anonymous validation and quote flows can be automated to create spam, denial of service or direct third-party cost.

**Decision:** Apply the approved route/IP/company distributed limits, return `429` plus `Retry-After`, monitor abuse and use accessible adaptive challenges only when risk justifies them; no mandatory MVP CAPTCHA.

**Consequences:** Limits are data/configuration and load-test inputs rather than customer code forks; rate limiting is not misrepresented as complete DDoS protection.

**Affected documents:** `03.1-UserFlows.md`, `04.1-ApiContracts.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md` and future architecture/testing documents.

## SEC-006 - Strict public request and output boundary

Date: 2026-07-19  
Status: Approved

**Context:** Unbounded or silently accepted JSON creates resource-exhaustion, mass-assignment and injection risk.

**Decision:** Enforce JSON-only media type, 128-KB configuration and 8-KB quote body limits, depth 16, known properties, bounded collections, plain text and contextual output encoding.

**Consequences:** Public compressed bodies are disabled; oversized/unsupported requests return stable `413`/`415` errors before persistence or body logging.

**Affected documents:** `02-BusinessRules.md`, `04.1-ApiContracts.md`, `04.3-SecurityAndPrivacy.md` and future architecture/testing documents.

## SEC-007 - Managed administrative identity and least privilege

Date: 2026-07-19  
Status: Approved

**Context:** Building passwords or using shared/direct SQL accounts would create avoidable high-risk security work.

**Decision:** Private administration uses managed OIDC, Authorization Code with PKCE, server-side sessions, MFA, individual accounts, capability-based least privilege, recent reauthentication and audited time-bounded elevation.

**Consequences:** The application stores no workforce passwords or browser-local administrative tokens; architecture selects the exact supported provider.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.3-SecurityAndPrivacy.md` and future architecture/operations/testing documents.

## SEC-008 - Encryption and managed secret lifecycle

Date: 2026-07-19  
Status: Approved

**Context:** Personal data, backups and service credentials require protection independent from application correctness.

**Decision:** Require TLS 1.2 minimum/TLS 1.3 preferred, encrypted database/storage/backups, keys separate from data, workload identity where possible and managed auditable secret rotation.

**Consequences:** TDE does not replace authorization; secrets are prohibited in source, clients, logs and artifacts, and suspected exposure triggers rotation within four hours.

**Affected documents:** `04.3-SecurityAndPrivacy.md` and future architecture/database/operations/testing documents.

## SEC-009 - Data-minimal public client and no non-essential tracking

Date: 2026-07-19  
Status: Approved

**Context:** Quote contact data is required for one submission, while advertising, session replay and browser persistence add risk without MVP necessity.

**Decision:** Keep quote values in memory only, clear them after success and ship without behavioral profiling, non-essential analytics cookies, public upload or personal data in renderer/share/analytics state.

**Consequences:** Any future third-party script, analytics, CAPTCHA or notification provider requires a new data-flow, legal, CSP, retention and performance review.

**Affected documents:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.3-SecurityAndPrivacy.md` and future architecture/testing documents.

## SEC-010 - Immutable privacy notice and acknowledgment semantics

Date: 2026-07-19  
Status: Approved

**Context:** A mutable URL cannot prove which notice was shown, and an acceptance checkbox must not be misrepresented as the lawful basis or marketing consent.

**Decision:** Each policy version has an immutable managed content snapshot, SHA-256 identity, publication time and retention value. The public action is `privacyPolicy.acknowledged` and records presentation only.

**Consequences:** Replacing content under one version is prohibited; API, model, flow and UX terminology use acknowledgment consistently.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md` and `04.3-SecurityAndPrivacy.md`.

## SEC-011 - Finite quote and backup retention

Date: 2026-07-19  
Status: Approved

**Context:** Indefinite leads and backups violate data minimization and make customer termination or erasure unverifiable.

**Decision:** Quote retention defaults to 365 days within a 30-to-1,825-day approved range; expired quote aggregates are deleted within 24 hours, and personal-data backups expire within 35 days.

**Consequences:** Legal holds are explicit and reviewed; restored backups reapply deletions before serving traffic; configuration snapshots remain unchanged.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.3-SecurityAndPrivacy.md` and future architecture/database/testing/operations documents.

## SEC-012 - Controller-instructed rights assistance

Date: 2026-07-19  
Status: Approved

**Context:** The controller must answer data-subject rights while the processor holds quote data.

**Decision:** The platform provides verified company-scoped export, rectification, restriction and erasure assistance within 10 business days of controller instruction; temporary exports expire within seven days.

**Consequences:** There is no anonymous search-by-email or self-service quote lookup; request evidence is audited without duplicating exported personal values.

**Affected documents:** `04.3-SecurityAndPrivacy.md` and future architecture/database/operations/testing documents and customer agreements.

## SEC-013 - Redacted telemetry and audited support access

Date: 2026-07-19  
Status: Approved

**Context:** Diagnostics are necessary, but bodies, contact values and informal SQL would create a second uncontrolled personal-data store.

**Decision:** Logs remain body-free and redacted, security/admin audit is tamper-evident and retained 400 days, and quote-data support access requires one ticket/scope with elevation no longer than four hours.

**Consequences:** Audit access is audited; temporary support exports are encrypted and deleted within seven days.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md` and future architecture/operations/testing documents.

## SEC-014 - Managed asset and software supply chain

Date: 2026-07-19  
Status: Approved

**Context:** Customer assets, Blender source/add-ons, browser 3D packages and build dependencies can introduce unlicensed, executable or compromised content.

**Decision:** Assets use managed type/size/hash/malware validation; dependencies are pinned where supported; CI runs secret/dependency/static scanning; releases produce SBOM and artifact hashes.

**Consequences:** Public upload is excluded, active asset formats require proven sanitization, and penetration testing is required before first paying customer and annually.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md` and future architecture/testing/operations documents.

## SEC-015 - Critical security incident duty

Date: 2026-07-19  
Status: Approved

**Context:** General business-hours support cannot excuse delayed response to an active cross-company or personal-data exposure.

**Decision:** Security S1 uses continuous alerting, 30-minute 24/7 acknowledgment, four-hour containment target and controller notice without undue delay with a 24-hour confirmation target.

**Consequences:** This is a narrow confidentiality/integrity duty, not contractual 24/7 general support; the controller retains legal notification responsibility.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, future operations and customer agreements.

## SEC-016 - EU/EEA personal-data residency by default

Date: 2026-07-19  
Status: Approved

**Context:** Regions and subprocessors affect customer risk, contracts and international-transfer obligations.

**Decision:** Quote data, personal-data backups and telemetry remain in the EU/EEA by default. Any external transfer requires controller authorization, documented safeguards and updated disclosure.

**Consequences:** Architecture must choose eligible regional services and maintain a subprocessor inventory; global public assets may contain no personal data.

**Affected documents:** `04.3-SecurityAndPrivacy.md`, future architecture/operations documents and customer agreements.

## SEC-017 - ASVS Level 2 and API security launch verification

Date: 2026-07-19  
Status: Approved

**Context:** Saying secure is meaningless without a pinned verification baseline and independent evidence.

**Decision:** Applicable OWASP ASVS 5.0.0 Level 2 and API Security Top 10 2023 controls must be mapped and pass before paying-customer launch, alongside restore/deletion, incident and penetration tests.

**Consequences:** No OWASP certification or compliance claim is made; evidence and exceptions are versioned, owned and time-bounded.

**Affected documents:** `04.3-SecurityAndPrivacy.md` and future architecture/testing/operations/implementation documents.

## ARCH-001 - .NET modular monolith baseline

Date: 2026-07-19  
Status: Approved

**Context:** The MVP needs strong business consistency and one small-team release, not independent service ownership.

**Decision:** Use one modular monolith on .NET 10 LTS, C# 14, ASP.NET Core 10 and EF Core 10. Modules call explicit in-process application boundaries and ship as one release.

**Consequences:** Microservices, broker-mediated internal calls and generic CQRS ceremony are excluded until a measured independent boundary exists.

**Affected documents:** `00-ProjectOverview.md`, `00.1-DocumentationRoadmap.md`, `06-Architecture.md`, `AI_CONTEXT.md` and future implementation documents.

## ARCH-002 - React accessible commercial shell

Date: 2026-07-19  
Status: Approved

**Context:** The commercial interface must remain small, accessible and independent from any optional renderer while supporting rich catalog-driven interaction.

**Decision:** Use React 19.2.7, TypeScript 6 and Vite 8.1 for a client-rendered document shell; Node 24 LTS is build-time only.

**Consequences:** Blazor WebAssembly and Blazor Server are excluded from the public MVP; the React shell and approved Babylon.js adapter share one TypeScript/browser toolchain.

**Affected documents:** `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, `06-Architecture.md` and future testing/implementation documents.

## ARCH-003 - Unity is a replaceable optional renderer

Date: 2026-07-19  
Status: Superseded on 2026-07-28 by ARCH-019

**Context:** Unity provides commercial differentiation but cannot be the accessibility, validation or price authority.

**Decision:** Use Unity 6.3 LTS editor 6000.3.20f1 with URP and released Addressables behind a versioned TypeScript renderer bridge, loaded only after the commercial shell is ready.

**Consequences:** Unity receives catalog codes/visual keys only, owns no business rule or personal data and may later be replaced without changing public contracts.

**Affected documents:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md`, `04.2-NonFunctionalRequirements.md` and `06-Architecture.md`.

## ARCH-004 - Separate trust processes on one App Service plan

Date: 2026-07-19  
Status: Approved

**Context:** Public, operations and background surfaces require different permissions, while three dedicated production platforms would waste early revenue.

**Decision:** Deploy separate Public, Operations and Worker applications with separate managed identities on one zone-redundant Linux App Service P1v3 plan with at least two workers.

**Consequences:** Trust and process failures are isolated without service sprawl; a process moves to a separate plan only after contention or contractual isolation evidence.

**Affected documents:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future operations documents.

## ARCH-005 - Azure SQL is the commercial authority

Date: 2026-07-19  
Status: Approved

**Context:** The domain depends on relational ownership, atomic snapshots, constraints, idempotency and auditable retention.

**Decision:** Use Azure SQL Database General Purpose serverless on Gen5, compatibility level 170, 0.5-4 vCores, production auto-pause disabled, zone redundancy and GZRS backups.

**Consequences:** Cosmos DB, Managed Instance, Business Critical and Hyperscale are excluded until measured access, compatibility, IO or size needs justify them.

**Affected documents:** `03-DataModel.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md` and `06-Architecture.md`.

## ARCH-006 - Layered shared-schema company isolation

Date: 2026-07-19  
Status: Approved

**Context:** Shared SaaS economics require one database, but application filters alone are not sufficient defense for company data and quotes.

**Decision:** Enforce trusted company execution context, default application/EF scoping, company-safe relational constraints and Azure SQL Row-Level Security for company-owned data; privileged cross-company work uses the separate audited operations identity.

**Consequences:** `05-DatabaseDesign.md` must make RLS/session context safe with connection pooling and fail closed when scope is absent.

**Affected documents:** `00.2-CommercialStrategy.md`, `03-DataModel.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing documents.

## ARCH-007 - Explicit transaction ownership with EF native unit of work

Date: 2026-07-19  
Status: Approved

**Context:** Each write must be atomic without hiding ownership behind a generic persistence abstraction.

**Decision:** Each application write use case owns one explicit SQL transaction; EF Core DbContext is Infrastructure's native unit of work.

**Consequences:** No generic repository or Unit of Work wrapper is added without a demonstrated guarantee, and external calls never participate in the SQL transaction.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future implementation/testing documents.

## ARCH-008 - SQL-owned idempotency and canonical SHA-256 identity

Date: 2026-07-19  
Status: Approved

**Context:** Exact replay must survive cache loss, restarts, concurrency and later catalog/policy changes.

**Decision:** Persist resource-owned client request IDs and SHA-256 fingerprints of typed canonical UTF-8 projections, resolve concurrency with unique SQL constraints and confirm equality against persisted normalized fields.

**Consequences:** Redis is not an idempotency authority; hash collision cannot accept a changed request; fingerprint-version changes must preserve retained replay behavior.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md` and `06-Architecture.md`.

## ARCH-009 - Narrow SQL outbox and leased worker

Date: 2026-07-19  
Status: Approved

**Context:** Quote persistence must not falsely imply notification, and retention/external side effects must survive process failure.

**Decision:** Commit provider-neutral quote delivery intent in the quote transaction and process it, retention and maintenance through an idempotent SQL-leased worker.

**Consequences:** No Service Bus is used for MVP; a broker requires multiple independent consumers or measured SQL polling limits.

**Affected documents:** `00.2-CommercialStrategy.md`, `02-BusinessRules.md`, `03.1-UserFlows.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future operations documents.

## ARCH-010 - HybridCache and Azure Managed Redis

Date: 2026-07-19  
Status: Approved

**Context:** Catalog reads and multi-instance abuse limits need shared low-latency state, but caches cannot become commercial truth.

**Decision:** Use ASP.NET Core HybridCache with Azure Managed Redis Balanced B0 HA for versioned catalog acceleration, distributed rate limits and operations session state.

**Consequences:** SQL remains authoritative; quote personal data/idempotency is not cached; Redis persistence and geo-replication are disabled.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future testing/operations documents.

## ARCH-011 - Fail-closed distributed-limit outage policy

Date: 2026-07-19  
Status: Approved

**Context:** Continuing anonymous creates without exact distributed limits would make a cache outage an abuse bypass.

**Decision:** Catalog/saved reads may fall back to SQL/local cache, while anonymous validation and create operations return retryable service unavailability when Redis cannot make a trustworthy limit decision.

**Consequences:** Degraded mode preserves read availability without accepting unmetered writes; the behavior requires explicit chaos and API tests.

**Affected documents:** `03.1-UserFlows.md`, `04.1-ApiContracts.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md` and `06-Architecture.md`.

## ARCH-012 - Cost-controlled Azure edge

Date: 2026-07-19  
Status: Approved

**Context:** The MVP needs TLS, CDN, routing and rate/WAF rules but cannot justify Front Door Premium's fixed fee before revenue.

**Decision:** Use Azure Front Door Standard with custom WAF/rate rules and restrict App Service origins to the expected Front Door instance.

**Consequences:** Upgrade to Premium only for managed WAF, bot management, Private Link or demonstrated attacks/contracts; application security remains authoritative.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future operations documents.

## ARCH-013 - Sensitivity-separated Blob storage

Date: 2026-07-19  
Status: Approved

**Context:** Public immutable 3D/legal assets and temporary personal-data exports have incompatible access and lifecycle requirements.

**Decision:** Use GZRS StorageV2 for sanitized content-addressed public assets and a separate private account with seven-day maximum lifecycle for restricted exports.

**Consequences:** Personal data never enters public/CDN containers; published asset bytes are immutable and version/hash addressed.

**Affected documents:** `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future operations documents.

## ARCH-014 - Managed workforce and workload identity

Date: 2026-07-19  
Status: Approved

**Context:** Custom passwords, browser admin tokens and shared Azure credentials create avoidable security and support work.

**Decision:** Use Microsoft Entra ID OIDC/PKCE/MFA through an Operations BFF, separate managed identities for deployables and Key Vault/Data Protection for unavoidable secret/key material.

**Consequences:** The application stores no workforce password; admin tickets/tokens remain server-side; browser and source artifacts contain no Azure secret.

**Affected documents:** `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future testing/operations documents.

## ARCH-015 - Portable telemetry with regional Azure Monitor

Date: 2026-07-19  
Status: Approved

**Context:** The NFRs require correlated evidence without creating an uncontrolled personal-data copy or hard-coding application instrumentation to one exporter.

**Decision:** Instrument with OpenTelemetry and export through the Azure Monitor OpenTelemetry Distro to EU-region workspace-based Application Insights/Log Analytics.

**Consequences:** Logs remain body-free/redacted, critical evidence is unsampled and an exporter can be changed without rewriting domain/application code.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future operations/testing documents.

## ARCH-016 - EU zonal primary and tested geo-restore

Date: 2026-07-19  
Status: Approved

**Context:** The MVP has a four-support-hour RTO and 15-minute RPO but cannot fund a hot second region before revenue.

**Decision:** Use West Europe primary, North Europe recovery, zonal compute/SQL, GZRS backups and a tested Bicep plus geo-restore runbook.

**Consequences:** No zero-RPO promise is made; two restore drills over three hours or a tighter contract trigger a SQL failover group and recovery compute review.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future operations/customer agreements.

## ARCH-017 - Secretless deterministic delivery

Date: 2026-07-19  
Status: Approved

**Context:** Repeatable environments and releases need controlled identity, artifacts and schema change without long-lived CI credentials.

**Decision:** Use Bicep and GitHub Actions OIDC with locked dependencies, scans, SBOM, artifact hashes, App Service slots and explicit expand/migrate/contract database delivery.

**Consequences:** Production migrations never run concurrently at application startup; releases share one identifier and rollback assumes database compatibility rather than destructive reversal.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md` and future operations/implementation documents.

## ARCH-018 - Measure-first scaling and margin gate

Date: 2026-07-19  
Status: Approved

**Context:** Premature distributed infrastructure would consume margin, while underpricing a secure production baseline would make the business nonviable.

**Decision:** Optimize and scale selected PaaS resources before splitting services/tenant databases; use the approval-time USD 570-980 monthly planning envelope and keep direct recurring infrastructure at or below 25 percent of recurring revenue.

**Consequences:** At 20 customers the modeled infrastructure-only recurring-revenue floor is approximately USD 114-196 per company/month; measured Azure actuals replace the model after representative operation.

**Affected documents:** `00-ProjectOverview.md`, `00.1-DocumentationRoadmap.md`, `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, `06-Architecture.md` and future operations/commercial rate card.

## ARCH-019 - Blender-authored Babylon.js renderer

Date: 2026-07-28  
Status: Approved

**Context:** Unity remained technically replaceable, but its client/service and Industry eligibility rules can introduce paid licensing or legal uncertainty before the product has revenue. The MVP needs a commercially usable, zero-license-cost Web renderer that shares the approved React/TypeScript runtime and preserves the renderer-independent commercial flow.

**Decision:** Use Blender `4.5 LTS` only for offline asset authoring and Babylon.js `9.18.0` (`@babylonjs/core` and `@babylonjs/loaders`) for the optional lazy-loaded browser renderer. Publish only sanitized, optimized and Khronos-validated glTF/GLB `2.0` packages through the existing versioned renderer adapter. Pin the exact stable Blender `4.5.x` patch before the first asset export and pin Babylon.js packages in the npm lock file.

**Consequences and trade-offs:** The MVP removes Unity subscription eligibility and WebAssembly-build dependencies, reuses TypeScript testing/build skills and can run locally without cloud services. The team must learn Blender asset preparation and Babylon.js scene lifecycle, and it receives no paid vendor SLA. Blender files, third-party assets and textures still require ownership/license evidence. Business rules, public API contracts, persisted data and quote behavior remain unchanged.

**Rejected alternatives:** Unity Web was rejected for the zero-budget MVP because compliant commercial use may require a paid plan and its runtime/build pipeline adds cost. Godot 4 was rejected because C# projects cannot currently export to Web and GDScript would add another language/runtime. Three.js remains a viable fallback but requires more renderer infrastructure to be assembled manually.

**Affected documents and components:** `00-ProjectOverview.md`, `00.1-DocumentationRoadmap.md`, `02-BusinessRules.md`, `03-DataModel.md`, `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.1-ApiContracts.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md`, `08-TestingStrategy.md`, `AI_CONTEXT.md` and the future `renderer`/asset pipeline.

**Migration impact:** No application or data migration exists because implementation has not begun. The empty `unity` placeholder is replaced by a generic future `renderer` boundary before the first implementation commit.

**Trigger for reconsideration:** Revisit only if Babylon.js fails an approved browser, payload, maintainability or visual requirement in a measured prototype, or a funded customer pays for and requires a capability available only in another compliant renderer.

## DB-001 - Shared-schema physical database

Date: 2026-07-28  
Status: Approved

**Context:** The shared SaaS needs low-cost physical persistence without weakening company isolation.

**Decision:** Use one shared-schema database per environment with company-safe composite foreign keys and Row-Level Security.

**Consequences:** One schema and migration stream serve every company; isolation depends on trusted context, least privilege and mandatory negative tests.

**Rejected alternatives:** Database-per-company is deferred because its onboarding, migration and operational cost is not justified by the current segment.

**Migration impact:** All company-owned tables and future relationships must carry the approved ownership key shape.

**Trigger for reconsideration:** A funded contractual isolation requirement or measured noisy-neighbor problem justifies a dedicated tier.

**Affected documents:** `03-DataModel.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing/operations documents.

## DB-002 - Free-first compatible database profiles

Date: 2026-07-28  
Status: Approved

**Context:** The first product needs a zero-recurring-cost local prototype and a simple synthetic-data demo without creating a database rewrite.

**Decision:** Use SQL Server 2025 Developer locally and optionally the Azure SQL free offer with stop-until-next-month behavior for a non-customer demo; paid Azure SQL remains the pilot/production profile.

**Consequences:** Local and demo environments exercise the production SQL dialect, but neither provides a customer SLA or authorizes real personal data.

**Rejected alternatives:** SQLite, EF in-memory persistence and PostgreSQL are not physical acceptance authorities; SQL Server Developer and the Azure free offer are not production tiers.

**Migration impact:** The same versioned schema migrations must pass locally and against an Azure SQL compatibility environment.

**Trigger for reconsideration:** A paying pilot, real personal data, required availability/recovery or exhausted free limits requires the approved paid profile.

**Affected documents:** `00-ProjectOverview.md`, `00.1-DocumentationRoadmap.md`, `05-DatabaseDesign.md`, `06-Architecture.md`, `08-TestingStrategy.md` and future operations documents.

## DB-003 - Internal and public identifier strategy

Date: 2026-07-28  
Status: Approved

**Context:** Relational joins need compact keys while public resources need non-enumerable identifiers.

**Decision:** Use `bigint IDENTITY` for internal keys and fixed cryptographically random public codes for configurations and quotes.

**Consequences:** Internal identifiers stay server-only; public-code collision handling uses named unique constraints and bounded regeneration.

**Rejected alternatives:** GUID clustered primary keys add width and fragmentation without a current independent-writer requirement.

**Migration impact:** Public contracts never expose or derive values from internal identity keys.

**Trigger for reconsideration:** Independent multi-writer databases or offline merge become approved requirements.

**Affected documents:** `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md` and future implementation/testing documents.

## DB-004 - Company key on every owned row

Date: 2026-07-28  
Status: Approved

**Context:** RLS alone cannot prevent a defective relationship from connecting records owned by different companies.

**Decision:** Persist `CompanyId` on every company-owned table and relationship and include it in tenant-safe foreign keys.

**Consequences:** The repeated key increases index width but enables fail-closed RLS, tenant-leading queries and structural ownership enforcement.

**Rejected alternatives:** Deriving ownership only through joins leaves gaps in constraints, workers and deletion paths.

**Migration impact:** New company-owned tables cannot be introduced without company scope, RLS and ownership-key review.

**Trigger for reconsideration:** Never while shared tenancy exists.

**Affected documents:** `03-DataModel.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing documents.

## DB-005 - Unicode and ordinal code storage

Date: 2026-07-28  
Status: Approved

**Context:** Human text needs international Unicode support while technical codes need stable case-sensitive comparison.

**Decision:** Use supplementary-character-aware Unicode storage for human text and binary ASCII collations for codes and discriminators.

**Consequences:** Logical scalar limits require explicit checks; code equality remains ordinal and deterministic.

**Rejected alternatives:** Database-default comparison for every field would make technical identifiers locale-dependent.

**Migration impact:** Every new text/code column must declare its approved length and comparison behavior.

**Trigger for reconsideration:** An approved simultaneous multi-locale content model requires a wider localization design.

**Affected documents:** `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md` and future testing documents.

## DB-006 - Core SQL value semantics

Date: 2026-07-28  
Status: Approved

**Context:** Money, UTC time, fingerprints and concurrency need exact, portable storage semantics.

**Decision:** Use `decimal(19,2)`, `datetime2(3)`, `binary(32)` and `rowversion` for the approved responsibilities.

**Consequences:** Prices avoid floating point, timestamps are UTC millisecond values, hashes are compact bytes and mutable records support optimistic concurrency.

**Rejected alternatives:** Floating-point money, local timestamps, textual hashes and client timestamps are not authoritative.

**Migration impact:** Type changes require compatibility and representative-data migration evidence.

**Trigger for reconsideration:** Approved currencies require a different monetary scale or a new concurrency model is proven necessary.

**Affected documents:** `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md` and future implementation/testing documents.

## DB-007 - Non-preview visual-state JSON storage

Date: 2026-07-28  
Status: Approved

**Context:** Visual state is canonical JSON, but the native SQL `json` type is not generally available across every required database profile.

**Decision:** Store canonical visual state in `nvarchar(max)` with JSON/null/size checks.

**Consequences:** Local SQL Server and Azure SQL use one non-preview schema; application canonicalization remains authoritative.

**Rejected alternatives:** Native `json` is deferred and queryable commercial data is not hidden in JSON.

**Migration impact:** A future type conversion requires dual-read/write compatibility and fingerprint-equivalence tests.

**Trigger for reconsideration:** Native `json` is GA in every required profile and migration evidence proves equivalent behavior.

**Affected documents:** `03-DataModel.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing documents.

## DB-008 - Physical idempotency scopes

Date: 2026-07-28  
Status: Approved

**Context:** Concurrent retries need one database-enforced winner without merging different create intents.

**Decision:** Scope configuration idempotency by company/product/request and quote idempotency by company/request.

**Consequences:** Unique constraints arbitrate races; fingerprints accelerate comparison but exact persisted fields decide replay versus conflict.

**Rejected alternatives:** Pre-checks without uniqueness and fingerprint-only equality are insufficient.

**Migration impact:** Index and canonicalization versions must remain compatible while persisted resources are replayable.

**Trigger for reconsideration:** The approved public contract explicitly changes an idempotency namespace.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing documents.

## DB-009 - RCSI with targeted write locks

Date: 2026-07-28  
Status: Approved

**Context:** Catalog reads should avoid unnecessary blocking while commercial writes must validate one coherent catalog state.

**Decision:** Enable RCSI and snapshot support, using targeted product/company update locks in short explicit write transactions.

**Consequences:** Reads scale without a database-wide serializable policy; write lock order and concurrency tests are mandatory.

**Rejected alternatives:** Global serializable isolation creates unjustified contention; unlocked split reads can mix catalog versions.

**Migration impact:** Database options and required indexes are migration-owned and verified per environment.

**Trigger for reconsideration:** Measured contention or correctness evidence proves the approved lock design inadequate.

**Affected documents:** `04.2-NonFunctionalRequirements.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing/operations documents.

## DB-010 - Database-backed immutable history

Date: 2026-07-28  
Status: Approved

**Context:** Saved configurations and published privacy evidence must not change with the current catalog or routine correction flows.

**Decision:** Deny normal updates to configurations, selection/price snapshots and published privacy-policy content.

**Consequences:** Historical corrections create new records or approved operational actions instead of silent mutation.

**Rejected alternatives:** Application convention alone is not sufficient protection for immutable commercial evidence.

**Migration impact:** Runtime grants and negative permission tests are migration artifacts.

**Trigger for reconsideration:** An approved lifecycle introduces an auditable versioned replacement process.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md` and future testing documents.

## DB-011 - Narrow SQL quote outbox

Date: 2026-07-28  
Status: Approved

**Context:** Quote persistence and notification intent must commit atomically without introducing a broker before it is justified.

**Decision:** Use one narrow SQL outbox row per quote with no contact data or provider payload.

**Consequences:** Delivery is at least once, leased and retriable; provider integration must use the stable notification identity or document duplicate risk.

**Rejected alternatives:** Direct in-transaction notification is non-atomic; a message broker adds cost and operations without current throughput evidence.

**Migration impact:** Quote and outbox schema changes must preserve atomic creation and retention deletion.

**Trigger for reconsideration:** Multiple consumers, throughput or delivery requirements measurably exceed the SQL worker design.

**Affected documents:** `02-BusinessRules.md`, `03-DataModel.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing/operations documents.

## DB-012 - Deletion-aware backup recovery

Date: 2026-07-28  
Status: Approved

**Context:** Restoring a backup taken before a lawful quote deletion could otherwise resurrect personal data.

**Decision:** Persist an encrypted external deletion instruction with an HMAC lookup identity before SQL deletion, then retain a local tombstone; use a private `deletion-recovery` container with a minimum 42-day lifecycle.

**Consequences:** Restore reconciliation must run before traffic; the journal contains no contact data, raw quote code, client request ID or message.

**Rejected alternatives:** SQL-only tombstones disappear when restoring an earlier backup; raw identifiers or unkeyed hashes expose avoidable lookup material.

**Migration impact:** Adds protected storage configuration, least-privilege worker access, tombstone schema and mandatory restore-reconciliation tests.

**Trigger for reconsideration:** A provider supplies an equivalent deletion-aware restore mechanism proven against the approved RPO/RTO.

**Affected documents:** `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md`, `06-Architecture.md` and future testing/operations documents.

## DB-013 - Restrictive relational deletes

Date: 2026-07-28  
Status: Approved

**Context:** Cascades can silently erase published catalog or immutable history outside an approved lifecycle.

**Decision:** Use restrictive deletes throughout the model except the proven quote-to-outbox owned cascade.

**Consequences:** Destructive operations are explicit and reviewable; quote aggregate deletion still removes its narrow outbox atomically.

**Rejected alternatives:** Broad cascade delete is convenient but unsafe for historical and multi-company data.

**Migration impact:** Every new cascade requires documented aggregate ownership and retention evidence.

**Trigger for reconsideration:** A new approved aggregate lifecycle proves a bounded cascade safe.

**Affected documents:** `03-DataModel.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md` and future testing documents.

## DB-014 - Controlled expand/migrate/contract delivery

Date: 2026-07-28  
Status: Approved

**Context:** Schema, RLS and permission changes must be repeatable without concurrent startup migration or destructive rollback assumptions.

**Decision:** Use EF Core migrations plus reviewed migration SQL for unsupported security/database artifacts and follow expand/migrate/contract.

**Consequences:** One delivery identity applies an immutable migration artifact; roll-forward or verified restore is preferred to data-losing down migrations.

**Rejected alternatives:** Runtime startup migration and ad hoc production SQL create uncontrolled concurrency and recovery risk.

**Migration impact:** Every migration requires empty/current-schema validation, invariant checks and a recovery decision.

**Trigger for reconsideration:** Never replace controlled migrations with ad hoc production changes.

**Affected documents:** `05-DatabaseDesign.md`, `06-Architecture.md` and future testing/operations/implementation documents.

## DB-015 - Operational catalog and seed data

Date: 2026-07-28  
Status: Approved

**Context:** Customer catalogs and demo fixtures are operational content, not database schema.

**Decision:** Keep seed/catalog data outside schema migrations and create deterministic synthetic fixtures through approved publication rules.

**Consequences:** Clean environments contain schema/security only until controlled onboarding or test-data setup runs.

**Rejected alternatives:** Embedding customer/demo rows in migrations risks accidental promotion and couples content to schema release.

**Migration impact:** Test fixtures and onboarding tools version independently while respecting the same contracts.

**Trigger for reconsideration:** None; customer content remains operational data.

**Affected documents:** `00.2-CommercialStrategy.md`, `05-DatabaseDesign.md` and future testing/operations/implementation documents.

## TST-001 - Separate readiness evidence gates

Date: 2026-07-28  
Status: Approved

**Context:** Passing development tests does not prove that a demo, pilot or commercial service is safe and operable.

**Decision:** Maintain separate evidence gates for documentation, implementation, technical demo, customer pilot and commercial launch.

**Consequences and trade-offs:** Readiness claims remain honest and reviewable, at the cost of explicit gate administration.

**Rejected alternatives:** One generic definition of done was rejected because it would mix code correctness with privacy, recovery, support and commercial readiness.

**Affected documents and components:** `00.1-DocumentationRoadmap.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md` and future implementation/release evidence.

**Migration impact:** None; every future milestone and release report must identify the gate it proves.

**Trigger for reconsideration:** Revisit only if an approved readiness model preserves the same separation of evidence and authority.

## TST-002 - Supported .NET backend test platform

Date: 2026-07-28  
Status: Approved

**Context:** Backend rules and contracts need a supported, automation-friendly and zero-license-cost test platform aligned with .NET 10.

**Decision:** Use xUnit.net v3 with Microsoft .NET test and coverage tooling for backend verification.

**Consequences and trade-offs:** The stack remains familiar and free, while package and SDK compatibility must be pinned and maintained.

**Rejected alternatives:** Adding a second backend unit-test framework was rejected because it would duplicate conventions and tooling without evidence of value.

**Affected documents and components:** `08-TestingStrategy.md`, future backend test projects, CI pipelines and release evidence.

**Migration impact:** No test code exists; a future replacement requires an explicit suite migration with equivalent evidence.

**Trigger for reconsideration:** The approved .NET test platform changes materially or cannot meet a measured requirement.

## TST-003 - Real SQL Server physical acceptance

Date: 2026-07-28  
Status: Approved

**Context:** RLS, filtered indexes, `rowversion`, locking and SQL Server migrations cannot be proven by an in-memory substitute.

**Decision:** Run physical persistence and migration acceptance against SQL Server 2025 Developer locally and a target-compatible Azure SQL profile where required.

**Consequences and trade-offs:** Database evidence uses the real engine without recurring local license cost, but disposable database setup is heavier than an in-memory test.

**Rejected alternatives:** EF in-memory persistence and SQLite were rejected as physical acceptance authorities.

**Affected documents and components:** `05-DatabaseDesign.md`, `08-TestingStrategy.md`, database test fixtures and migration pipelines.

**Migration impact:** Every schema change must pass empty, current-version and representative-data paths on the approved engine.

**Trigger for reconsideration:** A production-compatible, commercially usable and free runtime proves every required SQL behavior.

## TST-004 - React component verification

Date: 2026-07-28  
Status: Approved

**Context:** Catalog-driven UI behavior needs fast component feedback without treating a simulated DOM as browser proof.

**Decision:** Use Vitest and React Testing Library for shell component behavior.

**Consequences and trade-offs:** Tests remain fast and user-oriented; jsdom limitations require browser coverage for real navigation, layout and platform behavior.

**Rejected alternatives:** Snapshot-heavy or implementation-detail component tests were rejected because they are brittle and weak evidence of user behavior.

**Affected documents and components:** `03.2-UXRequirements.md`, `08-TestingStrategy.md`, future Web components and CI.

**Migration impact:** None before implementation; replacement requires equivalent accessible-behavior coverage.

**Trigger for reconsideration:** The approved frontend stack changes or the tools fail a measured requirement.

## TST-005 - Cross-engine browser and automated accessibility testing

Date: 2026-07-28  
Status: Approved

**Context:** The public journey must work across supported browser engines and catch common accessibility defects without paying for an early hosted device grid.

**Decision:** Use Playwright Test across its supported engines and axe-core for automated accessibility checks.

**Consequences and trade-offs:** One local framework supplies traces and cross-engine coverage, but WebKit emulation does not certify branded Safari or real Apple hardware.

**Rejected alternatives:** Cypress or Selenium beside Playwright and a paid browser grid were rejected until a measured gap justifies them.

**Affected documents and components:** `03.1-UserFlows.md`, `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, `08-TestingStrategy.md` and browser CI.

**Migration impact:** Browser evidence must retain equivalent journeys, engines and trace artifacts through any tool migration.

**Trigger for reconsideration:** The browser support matrix or a funded real-device requirement cannot be met.

## TST-006 - Replaceable Babylon.js and controlled asset verification

Date: 2026-07-28  
Status: Approved

**Context:** Optional 3D must remain replaceable and cannot weaken commercial correctness or introduce unlicensed/malformed assets.

**Decision:** Use Vitest and Playwright for the Babylon.js adapter and Khronos validation plus ownership/license evidence for Blender-authored glTF/GLB assets; 3D never gates the commercial flow.

**Consequences and trade-offs:** Renderer defects are isolated from business truth, while real GPU/device behavior still needs browser evidence and manual profiling.

**Rejected alternatives:** Pixel-perfect GPU snapshots and renderer-owned business decisions were rejected as unstable and architecturally unsafe.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md`, `08-TestingStrategy.md`, future renderer and asset pipeline.

**Migration impact:** A renderer or asset-format change must preserve the adapter contract, asset ledger and fallback tests.

**Trigger for reconsideration:** Babylon.js or glTF/GLB is replaced through an approved architecture decision.

## TST-007 - Mandatory manual accessibility and real-device evidence

Date: 2026-07-28  
Status: Approved

**Context:** Automated scanners cannot prove keyboard usability, screen-reader meaning, zoom/reflow, forced colors or branded Safari behavior.

**Decision:** Retain manual keyboard, screen-reader, zoom, forced-colors and real Safari/iOS checks at the release gates defined by the strategy.

**Consequences and trade-offs:** Accessibility claims are more credible but require time, skill and eventual access to real Apple devices.

**Rejected alternatives:** Automated accessibility results alone were rejected as incomplete evidence.

**Affected documents and components:** `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, `08-TestingStrategy.md` and release reports.

**Migration impact:** None; release planning must reserve the required manual evidence.

**Trigger for reconsideration:** Only an approved accessibility/browser policy may change the matrix, never convenience alone.

## TST-008 - Local diagnostic load with separate production proof

Date: 2026-07-28  
Status: Approved

**Context:** Early load evidence must be affordable without presenting one workstation as proof of production capacity.

**Decision:** Use k6 OSS locally for diagnostic load and require a separate generator/environment for production capacity claims.

**Consequences and trade-offs:** Early testing has no SaaS charge; representative distributed proof may require later infrastructure cost.

**Rejected alternatives:** Cloud load testing before evidence and laptop-only production claims were rejected.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md` and performance reports.

**Migration impact:** Load scripts remain portable; baseline comparisons require controlled profiles through any tool change.

**Trigger for reconsideration:** The approved target/load topology changes or local generation cannot exercise the diagnostic envelope.

## TST-009 - Free automated security baseline without false certification

Date: 2026-07-28  
Status: Approved

**Context:** Automated security checks provide useful release evidence but cannot replace an independent adversarial assessment.

**Decision:** Use OWASP ZAP, built-in dependency audits, secret scanning and static checks while retaining an independent penetration test before paying-customer launch.

**Consequences and trade-offs:** The technical baseline stays free-first; independent testing may be a justified commercial-launch cost.

**Rejected alternatives:** Treating a zero-alert ZAP result as a penetration test was rejected.

**Affected documents and components:** `04.3-SecurityAndPrivacy.md`, `08-TestingStrategy.md`, CI security gates and commercial-launch evidence.

**Migration impact:** Tool replacement must preserve the covered threat classes and historical findings.

**Trigger for reconsideration:** The approved security gate or independent-assessment requirement changes.

## TST-010 - Deterministic synthetic test products and boundaries

Date: 2026-07-28  
Status: Approved

**Context:** Repeatable verification must prove flexibility and isolation without using real customer or personal data.

**Decision:** Maintain deterministic synthetic first-product, fundamentally different second-product, company-isolation, boundary and capacity fixtures.

**Consequences and trade-offs:** Tests remain private, repeatable and product-agnostic, at the cost of fixture maintenance as approved limits evolve.

**Rejected alternatives:** Customer exports and desk-only fixtures were rejected because they create privacy risk and do not prove platform flexibility.

**Affected documents and components:** `01-ProductDefinition.md`, `03-DataModel.md`, `05-DatabaseDesign.md`, `08-TestingStrategy.md` and future test-data tooling.

**Migration impact:** Fixture versions must migrate through the same published contracts without product-specific schema or DTO branches.

**Trigger for reconsideration:** Approved domain or capacity boundaries change.

## TST-011 - Risk-based branch coverage thresholds

Date: 2026-07-28  
Status: Approved

**Context:** Critical decisions require complete branch evidence, while one global coverage percentage can reward low-value tests.

**Decision:** Require 100-percent decision/branch coverage for approved critical rules and at least 85-percent branch coverage for domain/application code, excluding generated code.

**Consequences and trade-offs:** High-risk behavior receives measurable protection; review is still required because coverage can be gamed.

**Rejected alternatives:** A single repository-wide line-coverage target was rejected as weak evidence.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `08-TestingStrategy.md`, future quality configuration and CI.

**Migration impact:** Baselines may rise but cannot be reduced without an approved NFR/testing decision.

**Trigger for reconsideration:** Measured quality evidence supports a different risk-based threshold.

## TST-012 - Bounded flaky-test quarantine

Date: 2026-07-28  
Status: Approved

**Context:** Silently ignored flaky tests erode release trust, while an absolute no-quarantine rule can block diagnosis.

**Decision:** Allow quarantine only with owner, reason and a maximum 14-day expiry; critical gates are never quarantined.

**Consequences and trade-offs:** Flakiness remains visible and time-bounded, with short-term release friction when ownership is weak.

**Rejected alternatives:** Permanent skips, retries that conceal failures and quarantine of critical suites were rejected.

**Affected documents and components:** `08-TestingStrategy.md`, CI policy, issue tracking and release evidence.

**Migration impact:** Existing quarantines must retain original failure history and expiry through pipeline changes.

**Trigger for reconsideration:** Measured pipeline data proves a stricter rule is practical without hiding failures.

## TST-013 - Zero-cost local client demo

Date: 2026-07-28  
Status: Approved

**Context:** The first commercial conversations need a reliable demonstration before public-hosting cost or real-data obligations are justified.

**Decision:** Make the first client demo local and offline-capable using synthetic data and a recording notification adapter.

**Consequences and trade-offs:** The owner can demonstrate the complete commercial journey without recurring cloud cost; the experience is attended rather than public self-service.

**Rejected alternatives:** A public customer-facing backend, real contact data or paid infrastructure before validation was rejected.

**Affected documents and components:** `00.2-CommercialStrategy.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md` and future demo packaging.

**Migration impact:** Public demo or pilot promotion requires a separate approved data, hosting, security and cost gate.

**Trigger for reconsideration:** Validated sales activity creates a measured need for unattended access.

## TST-014 - Canonical source-to-test traceability

Date: 2026-07-28  
Status: Approved

**Context:** Rules can disappear silently when tests are organized only around implementation files.

**Decision:** Maintain source-to-test traceability for all 111 named canonical scenarios plus API and user-flow cases.

**Consequences and trade-offs:** Coverage gaps are visible before release; the traceability report requires maintenance as canonical sources change.

**Rejected alternatives:** Relying on coverage percentage or test naming alone was rejected.

**Affected documents and components:** All canonical rule/flow/UX/API/NFR/security/database/architecture sources, `08-TestingStrategy.md` and future test evidence.

**Migration impact:** A source rename or replacement must update mappings without losing historical decision identity.

**Trigger for reconsideration:** The canonical scenario structure changes through an approved documentation decision.

## OPS-001 - Separate readiness environments and data authority

Date: 2026-07-28  
Status: Approved

**Context:** A local prototype, public demo, customer pilot and paying production service carry fundamentally different data, availability, legal and cost obligations.

**Decision:** Maintain separate Local, LocalDemo, PublicDemo, Integration, Staging, Pilot, Production and Recovery authority/data profiles. Promotion requires the target profile's evidence and approval gate.

**Consequences and trade-offs:** Readiness cannot be upgraded by renaming an environment, at the cost of explicit configuration and promotion discipline.

**Rejected alternatives:** One shared environment and informal environment labels were rejected because they permit synthetic, test and customer authority to be mixed.

**Affected documents and components:** `00.1-DocumentationRoadmap.md`, `04.3-SecurityAndPrivacy.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md` and future environment configuration.

**Migration impact:** Every future runtime, data set, release manifest and operational procedure must declare its authority profile.

**Trigger for reconsideration:** Revisit only if a replacement readiness model preserves equivalent separation of data and authority.

## OPS-002 - Local offline-capable first client demo

Date: 2026-07-28  
Status: Approved

**Context:** Commercial validation needs a reliable complete demonstration before recurring infrastructure cost or public attack surface is justified.

**Decision:** Make the first complete client demo local, attended, offline-capable and synthetic, with external notifications handled by a recording adapter.

**Consequences and trade-offs:** The core journey can be sold and tested at zero recurring software/cloud cost; unattended prospect access is deferred.

**Rejected alternatives:** A cloud backend, real contact data and a notification provider for the first demo were rejected as premature cost and risk.

**Affected documents and components:** `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md` and future LocalDemo packaging.

**Migration impact:** Public access or real customer use requires a separately approved environment, data and operations transition.

**Trigger for reconsideration:** Validated prospects require unattended evaluation and the public-demo or pilot gate is satisfied.

## OPS-003 - Static-only optional public synthetic demo

Date: 2026-07-28  
Status: Approved

**Context:** A shareable portfolio experience may improve commercial validation, but a public write-capable service would create security, privacy, reliability and cost duties before revenue.

**Decision:** Permit only a static synthetic public demo with no API, writes, personal data, administrative access or SLA. Select a zero-cost host only after verifying current commercial-use terms for the exact offer.

**Consequences and trade-offs:** Prospects may explore a safe bounded sample; saving, quote capture and authoritative persistence remain unavailable online.

**Rejected alternatives:** Assuming that any free hosting plan permits commercial lead generation, or publishing a full backend before a funded pilot, was rejected.

**Affected documents and components:** `04.3-SecurityAndPrivacy.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md` and future static demo artifacts.

**Migration impact:** Provider selection, resource creation and publication require fresh terms/limit verification and explicit authorization.

**Trigger for reconsideration:** Unattended use requires persistence, access control, customer branding, reliable availability or real contact capture.

## OPS-004 - Immutable shared artifacts without customer forks

Date: 2026-07-28  
Status: Approved

**Context:** Per-customer builds or release branches would make upgrades, support and security fixes unprofitable.

**Decision:** Build once and promote immutable shared artifacts. Company, product, branding and catalog variation must remain data-driven; customer-specific builds, code forks and ordinary dedicated releases are prohibited.

**Consequences and trade-offs:** Every customer receives the same tested product release; configuration and publication controls require discipline.

**Rejected alternatives:** Customer branches, customer repositories and rebuild-on-deploy were rejected.

**Affected documents and components:** `00.2-CommercialStrategy.md`, `06-Architecture.md`, `09-DeploymentAndOperations.md`, release manifests and all future deployables.

**Migration impact:** Existing or proposed customer variation must be represented by approved shared schema/contracts or rejected as unsupported.

**Trigger for reconsideration:** Never for the shared SaaS; a separately priced product edition requires new commercial and architecture approval.

## OPS-005 - Cost-bounded private GitHub Actions

Date: 2026-07-28  
Status: Approved

**Context:** Automated verification is valuable before revenue, but private hosted-runner and artifact usage can exhaust included allowances or create unapproved spend.

**Decision:** Use private GitHub Actions only within the account's currently verified included allowance, with standard runners, zero paid-usage authorization, budget alerts and short ordinary artifact retention.

**Consequences and trade-offs:** Quality gates can run without recurring CI cost; workflows may pause and fall back to local verification when allowance is exhausted.

**Rejected alternatives:** Uncapped hosted usage, larger paid runners and a continuously self-hosted runner on the owner's workstation were rejected.

**Affected documents and components:** `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, future CI workflows, artifact retention and cost monitoring.

**Migration impact:** Account plan, included limits and stop behavior must be checked before workflows are enabled and periodically thereafter.

**Trigger for reconsideration:** Revenue and measured pipeline demand justify an explicitly approved paid CI budget.

## OPS-006 - Federated delivery identity and declarative infrastructure

Date: 2026-07-28  
Status: Approved

**Context:** Long-lived cloud credentials and manual portal configuration create avoidable secret leakage and environment drift.

**Decision:** Use GitHub Actions OIDC, pinned actions and Bicep with separate least-privilege delivery identities for application, migration and infrastructure responsibilities.

**Consequences and trade-offs:** Delivery uses short-lived scoped credentials and reviewable infrastructure; federation and IaC require initial setup and maintenance.

**Rejected alternatives:** Long-lived Azure credentials in GitHub secrets and routine portal-only changes were rejected.

**Affected documents and components:** `06-Architecture.md`, `09-DeploymentAndOperations.md`, future workflows, Bicep modules, identities and release evidence.

**Migration impact:** Existing manual resources must be imported, reconciled or recreated through an approved non-destructive transition before automated management.

**Trigger for reconsideration:** The approved delivery provider or cloud platform changes and an equivalent secure federation/IaC mechanism is selected.

## OPS-007 - Explicit expand/migrate/contract database delivery

Date: 2026-07-28  
Status: Approved

**Context:** Startup migrations, incompatible schema/application releases and destructive rollback can corrupt or lose customer data.

**Decision:** Deliver schema changes through explicit expand/migrate/contract stages using one migration identity, preflight checks, immutable migration artifacts and roll-forward or verified restore recovery.

**Consequences and trade-offs:** Old and new application versions can coexist during promotion; schema evolution takes more planning and may span releases.

**Rejected alternatives:** Application-startup migration, multiple migration writers and automatic destructive down migration were rejected.

**Affected documents and components:** `05-DatabaseDesign.md`, `06-Architecture.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md` and future migration/release artifacts.

**Migration impact:** Every physical change needs compatibility, backup, verification and recovery evidence before promotion.

**Trigger for reconsideration:** Never replace with ad hoc production migration; only an approved database platform change may replace the mechanism.

## OPS-008 - Slot deployment with readiness and observation gates

Date: 2026-07-28  
Status: Approved

**Context:** A deployment should not direct customer traffic to an unready process or hide regressions immediately after promotion.

**Decision:** Use deployment slots, readiness checks, manifest verification, controlled swap and at least 30 minutes of post-promotion observation with an application rollback target.

**Consequences and trade-offs:** Release downtime and regression exposure are reduced; temporary slot capacity and disciplined observation are required.

**Rejected alternatives:** In-place overwrite, traffic before readiness and immediate release closure after swap were rejected.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `06-Architecture.md`, `09-DeploymentAndOperations.md` and future deployment workflows/runbooks.

**Migration impact:** Release design must keep application and schema versions compatible across the observation/rollback window.

**Trigger for reconsideration:** The approved hosting topology changes and provides an equivalent or stronger safe-promotion mechanism.

## OPS-009 - Redacted operational telemetry and actionable alerts

Date: 2026-07-28  
Status: Approved

**Context:** Availability, performance, security, retention and cost claims require evidence, while telemetry must not become a copy of personal or secret data.

**Decision:** Operate OpenTelemetry/Azure Monitor dashboards and the named alert catalog with correlation identifiers, structured outcomes, approved retention and redacted/body-free telemetry.

**Consequences and trade-offs:** Incidents and SLOs become diagnosable; telemetry ingestion, alert ownership and noise control require ongoing work and cost review.

**Rejected alternatives:** No telemetry, payload logging and alerting on every metric were rejected.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `06-Architecture.md`, `09-DeploymentAndOperations.md` and future instrumentation.

**Migration impact:** Every deployable and critical workflow must adopt the approved telemetry schema without exposing customer payloads.

**Trigger for reconsideration:** An approved observability provider change preserves required evidence, privacy and operational ownership.

## OPS-010 - Tested restore, regional recovery and deletion reconciliation

Date: 2026-07-28  
Status: Approved

**Context:** Backups are not recovery evidence, and restoring an older backup can resurrect data that was already erased.

**Decision:** Perform quarterly isolated restore tests, twice-yearly regional recovery exercises and deletion-journal reconciliation before restored traffic is allowed.

**Consequences and trade-offs:** RPO/RTO and deletion integrity become measurable; drills need owner time and temporary funded resources in customer profiles.

**Rejected alternatives:** Untested backups, restore directly into service and hot multi-region infrastructure before evidence were rejected.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `05-DatabaseDesign.md`, `09-DeploymentAndOperations.md` and recovery evidence.

**Migration impact:** Recovery procedures and restored databases must process the external deletion-recovery evidence before readiness.

**Trigger for reconsideration:** Two consecutive drills exceed three hours or a funded contract requires stronger measured recovery.

## OPS-011 - Honest bounded support model

Date: 2026-07-28  
Status: Approved

**Context:** A single-owner MVP cannot honestly or profitably promise general 24/7 support.

**Decision:** Provide standard business-hours B2B technical support to named customer contacts, plus a narrow 24/7 Security S1 confidentiality/integrity escalation.

**Consequences and trade-offs:** The initial offer remains supportable and cost-aware; continuity risk remains until a trained backup contact exists.

**Rejected alternatives:** General 24/7 support, direct public-user sales support and an unmeasured contractual SLA were rejected.

**Affected documents and components:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `09-DeploymentAndOperations.md` and future customer agreements/runbooks.

**Migration impact:** Support channels, named owners, severity definitions and escalation evidence are required before a pilot.

**Trigger for reconsideration:** A funded premium support offer and sufficient staffing are approved.

## OPS-012 - Budget alerts and infrastructure-to-revenue guardrail

Date: 2026-07-28  
Status: Approved

**Context:** Free allowances, consumption billing and customer customization can create costs faster than early revenue.

**Decision:** Apply GitHub/Azure budgets, anomaly alerts, explicit capacity limits and a 25-percent infrastructure-to-recurring-revenue guardrail; do not treat provider budgets as guaranteed hard stops.

**Consequences and trade-offs:** Cost and margin problems are surfaced early; monthly human review and conservative resource limits remain necessary.

**Rejected alternatives:** Uncapped billing, free-tier assumptions and growth without unit-cost measurement were rejected.

**Affected documents and components:** `00.2-CommercialStrategy.md`, `04.2-NonFunctionalRequirements.md`, `09-DeploymentAndOperations.md`, cost dashboards and future commercial review.

**Migration impact:** Every activated provider must have current limits, owners, alerts and an approved spend boundary recorded.

**Trigger for reconsideration:** Measured pricing, workload or margin changes justify an approved replacement threshold.

## OPS-013 - Managed generic onboarding and offboarding

Date: 2026-07-28  
Status: Approved

**Context:** Early customers need controlled catalog, branding, privacy and asset setup, but unlimited customization or self-service would add risk before demand is proven.

**Decision:** Use managed company/catalog/asset onboarding, publication and offboarding without product-specific schema, code, build or deployment changes.

**Consequences and trade-offs:** Quality and commercial accuracy are reviewed through a repeatable process; the MVP retains bounded manual operational work.

**Rejected alternatives:** Customer-specific forks, direct database edits and premature self-service administration were rejected.

**Affected documents and components:** `00.2-CommercialStrategy.md`, `03-DataModel.md`, `05-DatabaseDesign.md`, `06-Architecture.md`, `09-DeploymentAndOperations.md` and future Operations workflows.

**Migration impact:** Every company/product package must pass the same validation, publication, rollback and rights-evidence process.

**Trigger for reconsideration:** Measured onboarding volume and customer demand justify a shared self-service capability.

## OPS-014 - Bounded operational evidence retention

Date: 2026-07-28  
Status: Approved

**Context:** Release and security traceability needs durable evidence, while retaining every ordinary CI artifact would exhaust storage and increase cost.

**Decision:** Retain release manifests, SBOMs, hashes and deployment evidence for at least 400 days; retain ordinary CI diagnostics for 7 days unless an incident/legal hold requires protected preservation.

**Consequences and trade-offs:** Releases remain auditable without uncontrolled artifact growth; protected production evidence may incur storage cost.

**Rejected alternatives:** Indefinite retention of all artifacts and deletion of release evidence with short-lived CI output were rejected.

**Affected documents and components:** `04.3-SecurityAndPrivacy.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, future CI, evidence storage and incident handling.

**Migration impact:** Pipelines and evidence stores must classify artifacts and apply the corresponding retention policy.

**Trigger for reconsideration:** Legal, contractual, audit or cost requirements change through approval.

## OPS-015 - No real personal data in demo/non-production by default

Date: 2026-07-28  
Status: Approved

**Context:** A convincing demo does not justify collecting or copying personal data before legal, security and operational controls are ready.

**Decision:** Keep real personal data out of every demo and non-production default. Require legal, notification, support, security, recovery and cost gates before a customer pilot.

**Consequences and trade-offs:** Privacy and reputation exposure remain low; some support reproduction must use synthetic cases.

**Rejected alternatives:** Real contact fixtures, production copies in test and informal pilot data collection were rejected.

**Affected documents and components:** `04.3-SecurityAndPrivacy.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md` and all future test/demo environments.

**Migration impact:** Any exceptional masked-data process requires separate approval, documented minimization and deletion.

**Trigger for reconsideration:** A verified support need cannot be reproduced synthetically and an approved masked-data process is necessary.

## OPS-016 - Measure before topology or tenancy splitting

Date: 2026-07-28  
Status: Approved

**Context:** Microservices, database-per-company and complex orchestration would increase fixed cost and operational burden without current scale evidence.

**Decision:** Scale the approved PaaS modular-monolith topology vertically or horizontally using measured latency, saturation, availability and cost before splitting services or tenant databases.

**Consequences and trade-offs:** The system remains simple and margin-aware; observability and capacity review must detect genuine boundaries.

**Rejected alternatives:** Preventive microservices, Kubernetes, broker-first processing, database-per-company and hot multi-region operation were rejected.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `05-DatabaseDesign.md`, `06-Architecture.md`, `09-DeploymentAndOperations.md` and future capacity evidence.

**Migration impact:** New topology boundaries require explicit data ownership, migration, deployment and recovery design.

**Trigger for reconsideration:** A module has independently measured scale, availability or ownership needs and the change is funded.

## IMP-001 - Dependency-ordered vertical slices

Date: 2026-07-28  
Status: Approved

**Context:** Horizontal layer-by-layer delivery and a big-bang MVP would delay usable evidence and hide cross-boundary mistakes.

**Decision:** Implement dependency-ordered end-to-end vertical slices rather than horizontal layers or a big-bang MVP.

**Consequences and trade-offs:** Each completed slice produces demonstrable value and exposes integration risk early; the team must keep every slice narrowly scoped.

**Rejected alternatives:** Completing all persistence, then all APIs and then all UI, or building the entire MVP before verification, were rejected.

**Affected documents and components:** `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md` and every future application slice.

**Migration impact:** Shared prerequisites may be introduced incrementally, but each slice must remain compatible with the previous deployable state.

**Trigger for reconsideration:** Team or release structure changes with measured evidence that another sequence reduces risk.

## IMP-002 - Deployable and evidenced state after every slice

Date: 2026-07-28  
Status: Approved

**Context:** Long unstable branches and partially integrated work create hidden delivery and recovery risk.

**Decision:** Require every slice to leave one shared release buildable, testable, evidenced and safely evolvable.

**Consequences and trade-offs:** Verification, documentation and recovery work are performed continuously; each slice carries more Definition-of-Done effort.

**Rejected alternatives:** Deferred integration, test-later branches and environment-specific rebuilds were rejected.

**Affected documents and components:** `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md`, CI and release evidence.

**Migration impact:** Database and contract changes must use compatible expand/migrate/contract sequencing.

**Trigger for reconsideration:** Never remove equivalent build, verification and recovery evidence.

## IMP-003 - Accessible commercial core before 3D dependency

Date: 2026-07-28  
Status: Approved

**Context:** The renderer is commercially useful but must not own rules, pricing or accessibility, and visual progress must not hide an incomplete core journey.

**Decision:** Complete the accessible commercial shell and authoritative server behavior before allowing 3D to become a schedule dependency.

**Consequences and trade-offs:** The sellable flow and fallback remain usable if 3D is unavailable; 3D may appear later in demonstrations.

**Rejected alternatives:** Building the 3D scene first or making WebGL mandatory for configuration were rejected.

**Affected documents and components:** `03.2-UXRequirements.md`, `04.2-NonFunctionalRequirements.md`, `06-Architecture.md`, `08-TestingStrategy.md` and SL-001 through SL-007.

**Migration impact:** Renderer integration must remain behind the approved versioned adapter and consume the same authoritative configuration state.

**Trigger for reconsideration:** Validated buyers prove that 3D is the primary purchase condition.

## IMP-004 - Quality and operational controls per slice

Date: 2026-07-28  
Status: Approved

**Context:** Deferring security, privacy, accessibility, observability and cost work until the end creates expensive unsafe rework.

**Decision:** Treat those controls as per-slice work, with later system-level closure only.

**Consequences and trade-offs:** Applicable risks are handled when introduced; every slice takes longer than feature-only delivery.

**Rejected alternatives:** A final hardening phase and separate accessibility/security clean-up projects were rejected.

**Affected documents and components:** `04.2-NonFunctionalRequirements.md`, `04.3-SecurityAndPrivacy.md`, `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md` and all slices.

**Migration impact:** Existing slices cannot be promoted while applicable controls or evidence are missing.

**Trigger for reconsideration:** Never defer applicable controls; only replace them with approved equivalent evidence.

## IMP-005 - Real SQL Server acceptance

Date: 2026-07-28  
Status: Approved

**Context:** SQLite and EF in-memory cannot prove approved SQL Server RLS, constraints, locking, rowversion, JSON or migration behavior.

**Decision:** Verify persistence slices with SQL Server 2025 Developer and approved migrations; reject SQLite and EF in-memory as database acceptance evidence.

**Consequences and trade-offs:** Target-engine behavior is proven without a license fee for development, test and demonstration; local SQL setup and runtime effort remain.

**Rejected alternatives:** Using SQLite, EF in-memory or mocked repositories as physical database acceptance evidence was rejected.

**Affected documents and components:** `05-DatabaseDesign.md`, `08-TestingStrategy.md`, `10-ImplementationPlan.md`, future persistence tests and migrations.

**Migration impact:** Every physical change requires a versioned migration and representative target-engine verification.

**Trigger for reconsideration:** The approved database platform changes or an equivalent target-compatible free runtime is approved.

## IMP-006 - Second-product proof before scalability claim

Date: 2026-07-28  
Status: Approved

**Context:** A generic schema and UI are only credible if a fundamentally different product can be added without product-specific structure.

**Decision:** Require a fundamentally different second synthetic product to pass through data and assets only before technical-demo scalability is claimed.

**Consequences and trade-offs:** Flexibility is demonstrated rather than assumed; fixture, test and asset effort increases.

**Rejected alternatives:** Desk-specific fields, customer branches and abstract plugin engines without a second-product test were rejected.

**Affected documents and components:** `02-BusinessRules.md`, `03-DataModel.md`, `04.1-ApiContracts.md`, `05-DatabaseDesign.md`, `08-TestingStrategy.md`, `10-ImplementationPlan.md` and LocalDemo evidence.

**Migration impact:** No schema, public contract, component branch, build or deployment may be added solely for the second product.

**Trigger for reconsideration:** Never remove an equivalent product-portability proof.

## IMP-007 - Zero-recurring-cost local technical demo first

Date: 2026-07-28  
Status: Approved

**Context:** Customer learning is needed before cloud, privacy and production spending is justified.

**Decision:** Make the first complete technical demo local, offline-capable, synthetic and zero-recurring-cost.

**Consequences and trade-offs:** The project reaches safe customer conversations cheaply; the first demo is attended rather than public and self-service.

**Rejected alternatives:** Production Azure infrastructure or an Internet-exposed personal workstation before commercial evidence were rejected.

**Affected documents and components:** `08-TestingStrategy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md`, SL-000 through SL-009.

**Migration impact:** The local profile must use portable configuration and the same application artifacts without becoming customer production infrastructure.

**Trigger for reconsideration:** Measured commercial evidence justifies a separately approved later environment.

## IMP-008 - Separate public-demo, pilot and production gates

Date: 2026-07-28  
Status: Approved

**Context:** A successful LocalDemo does not satisfy hosting, privacy, support, recovery or commercial obligations.

**Decision:** Keep public demo, pilot and production as optional separately approved slices; never auto-promote LocalDemo.

**Consequences and trade-offs:** Premature cost, personal-data and SLA exposure is prevented; later progression requires explicit evidence and approvals.

**Rejected alternatives:** Reusing the local workstation publicly or treating a technical demo as a customer-ready release were rejected.

**Affected documents and components:** `00.1-DocumentationRoadmap.md`, `04.3-SecurityAndPrivacy.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md`, SL-010 and SL-013 through SL-015.

**Migration impact:** Each environment must use its approved data, identity, cost and recovery profile.

**Trigger for reconsideration:** The readiness model is explicitly replaced with equivalent controls.

## IMP-009 - No customer forks or speculative platform work

Date: 2026-07-28  
Status: Approved

**Context:** Per-customer branches and premature distributed/platform features would destroy shared-SaaS margin and maintainability without proven demand.

**Decision:** Prohibit per-customer or per-product forks and speculative microservices, brokers, billing, self-service administration or enterprise features.

**Consequences and trade-offs:** The shared product stays simple and profitable to operate; some requests remain manual, rejected or deferred.

**Rejected alternatives:** Dedicated ordinary-customer builds, schema branches, generic engines and preventive enterprise infrastructure were rejected.

**Affected documents and components:** `00.2-CommercialStrategy.md`, `03-DataModel.md`, `05-DatabaseDesign.md`, `06-Architecture.md`, `09-DeploymentAndOperations.md`, `10-ImplementationPlan.md` and all future scope decisions.

**Migration impact:** New shared capabilities require evidence, common contracts and a migration path rather than a fork.

**Trigger for reconsideration:** Multiple real customers require the same extension and an approved business case funds it.

## IMP-010 - Relative evidence-based estimation

Date: 2026-07-28  
Status: Approved

**Context:** Calendar estimates before a verified baseline and measured velocity would create false precision.

**Decision:** Use relative effort bands with at least plus or minus 50 percent initial uncertainty and re-estimate from measured delivery evidence.

**Consequences and trade-offs:** Planning remains honest and adaptable; early calendar certainty is intentionally limited.

**Rejected alternatives:** A fixed launch date derived only from document scope or optimistic feature counting was rejected.

**Affected documents and components:** `10-ImplementationPlan.md`, slice planning and commercial checkpoints.

**Migration impact:** Re-estimation occurs after SL-000 and the first database-backed slice without silently expanding scope.

**Trigger for reconsideration:** Stable measured velocity and a decomposed backlog justify narrower ranges.

## IMP-011 - Stop on canonical conflicts

Date: 2026-07-28  
Status: Approved

**Context:** Silent interpretation of conflicts can change business rules, contracts, persisted data, tenancy, security or architecture irreversibly.

**Decision:** Stop implementation for conflicts affecting those authorities and resolve them through source or decision approval.

**Consequences and trade-offs:** Irreversible drift is prevented; delivery may pause for an explicit decision.

**Rejected alternatives:** Choosing the newest filename, implementation convenience or developer preference as implicit precedence was rejected.

**Affected documents and components:** `00.1-DocumentationRoadmap.md`, `07-DecisionLog.md`, `10-ImplementationPlan.md` and every implementation slice.

**Migration impact:** Conflicting work cannot be migrated or deployed until authority and compatibility are resolved.

**Trigger for reconsideration:** Never remove the approval control; only replace it with an equivalent governance rule.

## IMP-012 - Separate implementation authorization

Date: 2026-07-28  
Status: Approved

**Context:** Approving a delivery plan is not the same action as authorizing source code, packages, SQL, migrations or infrastructure.

**Decision:** Require plan approval, a passing final implementation-readiness review and separate explicit product-owner authorization before code starts.

**Execution record:** The product owner explicitly authorized SL-000 on 2026-07-28. The engineering and verification baseline, including real SQL Server 2025 Standard Developer Edition CU7 connectivity, was completed on 2026-07-28. The current task separately authorizes one reviewed commit and push after clean-checkout verification; later slices and other external actions remain separately gated.

**Consequences and trade-offs:** Documentation approval remains distinct from execution authority; one final explicit gate is required.

**Rejected alternatives:** Treating plan approval as automatic code authorization or beginning SL-000 while readiness blockers remain were rejected.

**Affected documents and components:** `00-ProjectOverview.md`, `00.1-DocumentationRoadmap.md`, `10-ImplementationPlan.md`, `11-ImplementationReadinessReview.md` and future implementation work.

**Migration impact:** No application repository structure, package installation, SQL migration or implementation artifact may be created before the separate start authorization.

**Trigger for reconsideration:** The product owner explicitly replaces the readiness process with an equivalent approved authority model.
