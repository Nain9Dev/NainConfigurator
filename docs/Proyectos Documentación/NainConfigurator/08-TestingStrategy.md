# Testing Strategy

Document version: 1.1  
Status: Proposed for product-owner approval; no test implementation is authorized yet  
Last updated: 2026-07-28  
Applies to: Local prototype, synthetic-data demo, customer pilot and production release evidence

## 1. Purpose and authority

This document defines how NainConfigurator will prove business correctness, public contracts, company isolation, physical persistence, accessibility, browser behavior, optional Babylon.js rendering, Blender-authored asset safety, performance, security, recovery and maintainability.

It implements, and does not redefine:

- `02-BusinessRules.md` for commercial truth and acceptance scenarios.
- `03.1-UserFlows.md` for user intent, retry and recovery behavior.
- `03.2-UXRequirements.md` for responsive, accessible and renderer-independent experience.
- `04.1-ApiContracts.md` for HTTP/JSON contracts and stable error behavior.
- `04.2-NonFunctionalRequirements.md` for measurable quality targets.
- `04.3-SecurityAndPrivacy.md` for security, privacy and launch verification.
- `05-DatabaseDesign.md` for physical constraints, transactions and DB-AC scenarios.
- `06-Architecture.md` for boundaries, technology and ARC-AC scenarios.

This document selects verification responsibilities and proposed tools. It contains no test code, application code, SQL, cloud deployment or billable-resource authorization.

## 2. Direct recommendation

Use a free-first test system that runs the implementation-critical suites on the owner's existing Windows computer:

- xUnit.net v3 and Microsoft .NET test/coverage tooling for backend tests.
- SQL Server 2025 Developer for real persistence tests.
- Vitest and React Testing Library for browser-shell components.
- Playwright Test for critical browser journeys and API-visible behavior.
- axe-core plus manual assistive-technology review for accessibility.
- Vitest, Playwright and Khronos glTF validation for the optional Babylon.js renderer and Blender-authored assets.
- k6 OSS locally for API load and concurrency evidence.
- ZAP plus built-in dependency audits for automated security checks.

No paid test-management service, hosted browser grid, cloud load-testing platform, Docker Desktop subscription or commercial accessibility scanner is required for the local prototype or client-presented demo.

The honest boundary is:

- The demo can have zero incremental license and cloud cost while using owned hardware, synthetic data and eligible free licenses.
- Time, electricity, hardware wear and maintenance still have real cost.
- A Windows-only run cannot certify real Safari, macOS VoiceOver or iOS behavior.
- Load generated on the same computer as the application is useful for correctness and regression, but cannot prove the production capacity envelope.
- Automated ZAP/axe scans do not replace manual accessibility review or the independent penetration test required before the first paying customer.
- Blender, Babylon.js and the Khronos validator remove mandatory renderer license fees, but third-party models, textures, fonts and add-ons still require explicit commercial-use evidence.

## 3. Readiness levels

Test evidence is interpreted by phase. Passing an earlier level never implies the next one.

| Level | Purpose | Required evidence | Explicitly not claimed |
|---|---|---|---|
| Documentation ready | Permit implementation planning | Approved canonical documents and traceable test design | Working software |
| Local prototype ready | Prove architecture and first-product behavior | Automated critical rules, API, SQL, client, Babylon.js/asset and fallback tests with synthetic data | Public reliability or customer readiness |
| Client demo ready | Show one controlled product simply and repeatedly | Local demo smoke suite, deterministic reset, supported demo browser, 3D and no-3D journey | SLA, legal compliance, production capacity or Safari certification |
| Customer pilot ready | Operate a limited real engagement | Production-shaped security, browser/device, recovery, performance and operational evidence plus legal launch gates | General production scale unless separately proven |
| Commercial launch ready | Serve paying customers under approved terms | Full release matrix, independent penetration test, restore drill, operations and support evidence | Unlimited scale or contractual SLA not separately approved |

## 4. Quality risks in priority order

1. Cross-company data exposure or mutation.
2. Incorrect price, compatibility or selection validation.
3. Partial, duplicated or non-idempotent configuration/quote persistence.
4. Personal data exposed through public reads, logs, browser storage, test artifacts or restored backups.
5. Public API contract drift.
6. A renderer failure blocking the commercial journey or changing selections.
7. Inaccessible interaction, errors or privacy acknowledgment.
8. A second product requiring desk-specific code, DTOs, tables or screens.
9. Performance or asset size making the demonstration commercially ineffective.
10. Flaky or slow tests hiding regressions and delaying delivery.

Test effort follows this order. A visual pixel difference never has priority over commercial, isolation, privacy or recovery correctness.

## 5. Test-design principles

- Test observable decisions and invariants, not private implementation shape.
- Unit tests cover deterministic domain/application decisions.
- Integration tests use the real boundary when the risk belongs to SQL, HTTP, browser, filesystem, renderer assets or identity configuration.
- No persistence acceptance test uses EF in-memory or SQLite as SQL Server evidence.
- One shared validation/pricing implementation is exercised through both validate and create use cases.
- Every critical write failure test proves the final database state, not only the returned exception.
- Concurrency tests start operations together through an explicit barrier; sequential loops are not concurrency evidence.
- Exact replay and changed-payload conflict are always separate tests.
- Negative company-isolation cases are generated for every tenant-aware read/write path.
- Synthetic fixtures contain no real name, email, phone, message, credential or customer asset.
- A test cannot be disabled to obtain a green build without a documented owner, reason and expiry.
- Retries may diagnose infrastructure instability; a retry cannot convert a deterministic product defect into a pass.
- Coverage is a guardrail, not evidence that assertions are meaningful.

## 6. Verification layers

| Layer | Primary responsibility | Real boundary | Expected speed |
|---|---|---|---|
| Domain unit | Selection limits, compatibility, pricing, normalization and policy decisions | Pure C# objects | Milliseconds |
| Application unit | Use-case ordering, authorization intent, transaction ownership and adapter outcomes | Application ports with narrow fakes | Milliseconds |
| Persistence integration | Migrations, SQL types, constraints, RLS, locking, idempotency, outbox and retention | SQL Server 2025 Developer | Seconds/minutes |
| API integration/contract | Routes, JSON, status codes, headers, limits and error mapping | ASP.NET Core pipeline plus real local SQL | Seconds/minutes |
| React component | Generic controls, state transitions, localization and accessible DOM | jsdom/browser as appropriate | Seconds |
| Browser journey | Critical flow, browser storage, responsive behavior and renderer fallback | Real browser engine plus running app | Minutes |
| Renderer/asset | Adapter mapping, lifecycle, glTF/GLB validity, asset budgets and fallback | Vitest, Khronos validator and real browser | Seconds/minutes |
| Security/recovery | Isolation, abuse, redaction, DAST, permissions and restored-deletion behavior | Running system and controlled infrastructure | Minutes/hours |
| Performance | Latency, throughput, errors, saturation, payload and browser budgets | Representative environment and load generator | Minutes/hours |

Most tests remain below the browser layer. Only behavior that needs a browser, validated 3D asset, SQL or infrastructure crosses that boundary.

## 7. Proposed free-first toolchain

Approval-time versions are reproducible starting candidates, not permission to install packages now. Exact versions and checksums are reverified and pinned at the first implementation commit. Patch upgrades inside a compatible line require the normal dependency/security suite.

| Responsibility | Proposed tool | Approval-time baseline | License/cost boundary | Reason |
|---|---|---|---|---|
| .NET unit/integration runner | xUnit.net v3 | `3.2.2` | Apache-2.0; no license fee | Native .NET ecosystem, parallelization and current v3 support |
| .NET coverage | Microsoft.Testing.Platform compatible coverage extension | Compatible .NET 10 line | Free-to-use Microsoft tooling; no hosted service | Produces local machine-readable coverage without SaaS |
| ASP.NET integration host | `Microsoft.AspNetCore.Mvc.Testing` | `10.0.10` | Part of approved Microsoft stack | `WebApplicationFactory`/TestServer for the real HTTP pipeline |
| Physical test database | SQL Server 2025 Developer | Compatibility `170` | Free for development/test; prohibited for production | Exercises target RLS, constraints, rowversion and locks |
| React unit/component runner | Vitest | `4.1.7` | MIT | Aligns with Vite and TypeScript |
| React DOM behavior | React Testing Library | Stable React 19-compatible line | MIT | Tests user-observable roles and interaction rather than component internals |
| Browser E2E | Playwright Test for TypeScript | `1.60.x` | Apache-2.0; local browsers included | Chromium, Firefox, WebKit, traces, screenshots and network control |
| Automated accessibility | axe-core through Playwright | `4.11.4` | MPL-2.0 | Detects common WCAG/ARIA defects inside real journeys |
| Babylon.js adapter | Vitest plus Playwright | Babylon.js `9.18.0` with existing approved test versions | Apache-2.0/MIT/Apache-2.0 toolchain; no license fee | Unit mapping plus real-browser renderer lifecycle and fallback |
| glTF/GLB validation | Khronos glTF Validator | Official glTF `2.0` validator build pinned by checksum before first asset publication | Apache-2.0; local execution | Rejects malformed assets and reports structural/statistical issues |
| Blender asset authoring | Blender `4.5 LTS` | Exact stable `4.5.x` patch recorded before first export | GPL tool; created artwork is not forced under GPL | Reproducible offline source/export profile without a runtime dependency |
| API load/concurrency | Grafana k6 OSS | `2.0.0` | AGPL-3.0; local unmodified tool, not shipped with product | Percentile/error thresholds and repeatable scenarios |
| Dynamic security scan | OWASP ZAP | `2.17.0` | Apache-2.0 | Free local baseline/API DAST and automation |
| .NET dependency audit | NuGet Audit during restore | .NET 10 behavior | Included in .NET tooling | Audits direct and transitive package advisories |
| JavaScript dependency audit | package-manager audit plus lockfile review | Approved Node/npm line | Included tooling | Detects known dependency advisories without paid SaaS |
| Manual Windows accessibility | Keyboard, Windows forced-colors, current NVDA and/or Narrator | Exact versions recorded per release | Free/open source or included with owned OS | Required human/assistive-technology evidence |

Tool rules:

- Testing packages are development dependencies and are not shipped in public application artifacts unless technically required and explicitly reviewed.
- k6 OSS test scripts are repository content; no Grafana Cloud account is required.
- ZAP runs only against a controlled local/integration target. Active scanning a third-party or production target requires explicit authorization.
- No test payload or report may contain real personal data or secrets.
- License and security status are rechecked before first adoption and every structural upgrade.
- A paid alternative requires a documented gap, monthly budget and explicit authorization.

## 8. Intentionally avoided dependencies

- No Fluent Assertions commercial-license dependency; xUnit/Vitest native assertions are sufficient initially.
- No paid browser grid for the prototype/demo.
- No paid visual-regression service; Playwright local screenshots are diagnostic, not a commercial source of truth.
- No Postman cloud workspace as contract authority; automated API tests and canonical examples remain authoritative.
- No Docker Desktop requirement. Local SQL Server Developer is the default persistence authority.
- No mock-heavy framework by default. Handwritten narrow fakes are preferred until repetition proves a maintained library valuable.
- No mutation-testing service, test-case management SaaS or AI-generated test platform before measured need.

## 9. Backend unit-test boundary

### 9.1 Domain decisions

The domain suite covers every branch of:

- Distinct option normalization and deterministic ordering.
- Product/group/option active-state rules.
- Minimum and maximum selection counts.
- Same-product option ownership.
- Duplicate option rejection.
- `RequiresAny` compatibility.
- Default-catalog satisfiability.
- Decimal base price, option adjustments, component ordering and exact total.
- Catalog version conflict decision.
- Visual-state separation from commercial selections/price.
- Quote privacy acknowledgment decision.
- Product availability for new quote creation.

The 34 `SC-001` through `SC-034` business scenarios are automated before local prototype readiness.

### 9.2 Application decisions

Application tests prove:

- Validation produces no persistence side effect.
- Create always revalidates authoritative current catalog state.
- Replay resolution occurs before mutable catalog/policy checks.
- Changed payload with reused request ID returns the stable conflict.
- Snapshot construction uses one accepted catalog version.
- Quote creation commits persistence intent but never claims notification delivery.
- Editing a saved configuration creates a new resource.
- Renderer state cannot alter selection, validation or price.
- Every write use case invokes exactly one owned transaction boundary.
- External provider calls occur only after the owning SQL transaction commits.

Tests assert outcomes and port interactions needed to prove the use case. They do not mirror every method call or internal class.

## 10. Persistence and migration integration tests

Persistence tests run against SQL Server 2025 Developer at compatibility level `170`.

Required database lifecycles:

1. Apply every migration to an empty database.
2. Apply migrations from every supported representative prior schema.
3. Seed deterministic synthetic fixtures through the approved data path.
4. Run integrity and permission checks.
5. Dispose the database or restore the isolated reset boundary.

The suite covers all `DB-AC-001` through `DB-AC-023`, including:

- Cross-company composite FK rejection.
- Missing, malformed and mismatched RLS context.
- Reuse of one pooled connection across companies.
- Resolver-module least privilege and bypass resistance.
- Unique code and idempotency races.
- Catalog-version consistency during publication.
- Atomic rollback after injected mid-aggregate failure.
- Immutable snapshot and policy permissions.
- Outbox lease loss/reclaim.
- Retention, legal hold, local tombstone and deletion recovery.
- Supplementary-character boundary lengths.
- Empty/prior-schema migration safety.

Database test isolation:

- A suite/collection owns a uniquely named disposable database or a proven isolated reset boundary.
- Tests cannot depend on execution order.
- Parallel tests never share mutable company/request identities.
- Cleanup failure is visible and does not silently reuse contaminated state.
- Creating or dropping local disposable test databases is implementation behavior, not production authorization.

## 11. Concurrency and idempotency tests

Concurrency evidence uses a start barrier and separate physical/logical connections.

Required cases:

- 20 identical configuration creates produce one configuration aggregate.
- The same configuration request ID with one changed option conflicts.
- The same request ID with changed visual state conflicts.
- 20 identical quote creates produce one quote and one outbox intent.
- Same quote request ID with changed contact/message/policy evidence conflicts.
- Catalog publication and configuration creation never mix versions.
- Two catalog publishers using the same expected rowversion produce one winner and one explicit conflict.
- A lost outbox lease is reclaimed without changing `NotificationIntentId`.
- A legal-hold/retention race cannot delete an actively held quote.
- Public-code collision handling retries only the named uniqueness conflict.

The final SQL state, child counts, totals and outbox rows are asserted after all tasks complete.

## 12. API integration and contract tests

The API suite starts the approved ASP.NET Core pipeline and uses real local SQL for persistence-bearing cases.

For every endpoint in `04.1-ApiContracts.md`, test:

- Method and route.
- Content type and required headers.
- Required, optional, null and unknown JSON fields.
- Logical length and body-size boundaries.
- Stable success status and response shape.
- Every documented stable error code and status.
- No stack trace, SQL, internal path or internal identifier in responses.
- `traceId` presence/format where required.
- Exact idempotent replay and changed-payload conflict.
- Uniform public not-found/existence behavior.
- Server-authoritative price and company ownership.
- Quote response never echoes contact/message or claims notification delivery.

Contract comparison is semantic JSON/schema comparison, not brittle whole-file snapshots of unstable timestamps or trace identifiers.

The OpenAPI artifact, when implemented, is generated from the running release and compared for unapproved breaking changes. A changed route, property, status or error code fails until the canonical contract and migration decision are explicitly approved.

## 13. React component tests

Vitest and React Testing Library cover:

- Catalog-generated single/multiple-selection controls.
- Selection count messages and compatibility explanations.
- Deterministic summary and price component presentation.
- Local estimate versus authoritative confirmed price state.
- Loading, empty, retry, catalog conflict and unsupported states.
- Privacy-resource presentation and acknowledgment reset.
- Quote confirmation wording and copyable reference.
- Accessible labels, groups, live regions and focus restoration.
- Keyboard behavior without testing internal hook/state shape.
- `es-ES` money/date presentation without returning formatted money as authority.
- Missing/invalid branding fallback.
- Reduced motion and renderer status behavior.
- No browser persistence of quote data or admin tokens.

Visual snapshots are used only for small stable markup where they add value. They cannot replace role/name/state assertions.

## 14. Browser end-to-end journeys

Playwright Test uses the TypeScript/Node toolchain already approved for the web application.

Critical automated journeys:

1. Load `DESK-001`, accept defaults and see `299.90 EUR`.
2. Change valid options, validate, save and retrieve the immutable configuration.
3. Recover from an outdated catalog without silent selection migration.
4. Submit a synthetic quote with explicit current-policy acknowledgment.
5. Replay configuration and quote creates after simulated lost responses.
6. Open a historical configuration whose product is unavailable.
7. Complete the commercial journey with Babylon.js disabled.
8. Force Babylon.js chunk/product-package failure and prove no commercial state changes.
9. Complete the journey at 320 CSS pixels without document horizontal scroll.
10. Use keyboard only through selection, save, privacy and quote actions.
11. Inspect URL, local/session storage, IndexedDB, cache and service-worker-visible state after quote success.
12. Load a fundamentally different product fixture through the same generic controls.

Execution projects:

- Current stable branded Edge or Chrome on Windows for the fastest demo smoke.
- Playwright Chromium/Chrome for main automated journeys.
- Playwright Firefox for cross-engine correctness.
- Playwright WebKit for early WebKit regression evidence.
- Mobile-sized/touch emulation for fast layout feedback.

Playwright WebKit is not branded Safari, and device emulation is not a physical iOS/Android device. They reduce risk but do not satisfy the approved Safari/physical-device release matrix.

## 15. Babylon.js renderer and asset tests

### 15.1 Adapter unit tests

Vitest adapter tests cover:

- Catalog visual keys resolve through generic mappings.
- Unsupported/missing keys fail to a defined presentation state.
- Adapter message serialization/schema version.
- Stale product/catalog context is ignored.
- Option visibility mapping never computes price or validation.
- glTF/GLB node, material and package keys follow approved generic conventions.
- No product code, option code or `visualAssetKey` triggers desk-specific application branches.

### 15.2 Asset pipeline validation

Every published glTF/GLB package must:

- Pass the pinned Khronos validator with zero errors and an approved disposition for warnings.
- Match the approved node/material manifest referenced by generic `visualAssetKey` values.
- Contain no script, credential, personal data, absolute workstation path or unapproved external URI.
- Use owned or commercially licensed source models, textures and fonts recorded in an asset ledger.
- Meet polygon, texture, compressed-transfer and naming budgets.
- Be reproducibly exported from the recorded Blender `4.5.x` patch and export profile.

Blender source files remain offline/restricted development assets; only sanitized browser packages and required license notices may be published.

### 15.3 Browser smoke and profiling

The renderer is tested in the supported browser path for:

- WebGL 2 capability decision and optional WebGPU fallback to WebGL 2.
- Adapter initialization and schema rejection.
- First visual and option update timing.
- Lazy chunk and glTF/GLB transfer budgets.
- Frame time and memory on reference devices.
- Initial scene readiness, reduced motion, cancellation/skip and disposal.
- Selection intent updating only shell-owned generic option codes.
- No browser/API credential or personal data entering renderer state.
- Failed/unsupported renderer leaving the complete commercial flow usable.

The demo does not pass if 3D works but the no-3D commercial journey fails.

## 16. Accessibility and browser verification

### 16.1 Automated checks

At critical UI states, Playwright plus axe-core checks automatically detectable WCAG A/AA and ARIA defects:

- Initial catalog.
- Invalid selection errors.
- Valid estimate/summary.
- Catalog conflict review.
- Saved configuration.
- Privacy acknowledgment and quote validation.
- Quote success.
- Renderer failed/unavailable.
- Historical unavailable product.

Zero unapproved automated A/AA violations are allowed.

### 16.2 Manual checks

Automation cannot prove WCAG 2.2 AA. Manual verification covers:

- Complete keyboard-only journey and visible focus.
- NVDA with current Chrome and Firefox on Windows.
- 200-percent text resize and 400-percent zoom/reflow.
- Forced colors/high contrast.
- Reduced motion.
- Error identification, focus management and live announcements.
- Touch target and orientation behavior on an available physical device.
- VoiceOver/Safari on macOS and iOS before public/pilot release.

For a controlled Windows client demo, Edge/Chrome plus keyboard/NVDA evidence is sufficient only for `Client demo ready`; it does not waive the later approved browser matrix.

If no owned supported Apple device is available, real Safari/VoiceOver verification remains a funded pilot/launch dependency. A paid device-cloud subscription is not added pre-revenue.

## 17. Security and privacy verification

### 17.1 Automated release blockers

- Every company-aware use case has company-A/company-B negative tests.
- Public quote-data reads remain absent/denied.
- Oversized bodies fail before parsing/persistence/body logging.
- Rate-limit boundaries and retry headers match contracts.
- Plain text containing HTML/script is encoded on output.
- Security headers and CSP are inspected on production-shaped responses.
- Logs/errors/browser artifacts are scanned for seeded canary personal values and secrets.
- Runtime database principals cannot update immutable records or bypass RLS.
- Resolver modules expose only approved scope.
- NuGet and JavaScript dependency audits have no unresolved critical/high advisory without an approved expiry.
- ZAP baseline/API scan has no unresolved high-risk alert and every medium alert is reviewed.

### 17.2 Manual/independent evidence

- OWASP ASVS 5.0.0 Level 2 applicability matrix.
- OWASP API Security Top 10 2023 mapping.
- Manual authorization/abuse review.
- Incident tabletop.
- Independent penetration test before the first paying customer and after material trust-boundary redesign.

ZAP is an automated aid, not an independent penetration test or compliance certification.

Active security scanning is prohibited against a customer or production system without named authorization, scope, time window and recovery contacts.

## 18. Performance and capacity testing

### 18.1 Local free baseline

k6 OSS runs locally with synthetic data for:

- Correctness under 20 concurrent replays.
- Short endpoint latency regression checks.
- 50-RPS/100-RPS feasibility experiments where the machine has capacity.
- Safe overload/error behavior.

The test scripts encode the approved endpoint-specific P95/P99/error thresholds. A threshold failure returns a failed test result.

When load generator, API and SQL share one computer, results are diagnostic only. They cannot prove the production infrastructure target.

### 18.2 Production-shaped acceptance

Before pilot/launch, a separate load generator targets a production-shaped environment with:

- 50 companies.
- 500 products.
- 100,000 configurations.
- 25,000 quotes.
- Maximum product envelope and realistic strings.
- 50 RPS for 15 minutes.
- 100 RPS for 60 seconds.
- 10 configuration creates/second.
- 5 quote creates/second.
- Two application instances without affinity.
- Cache normal, cold and unavailable scenarios.

Evidence includes API P50/P95/P99, error rate, database CPU/IO/locks, application saturation, cache metrics and correctness reconciliation.

Passing through infrastructure that exceeds the approved commercial cost guardrail is a failure.

### 18.3 Browser and Babylon.js performance

Use browser performance APIs/DevTools, Playwright measurements and Babylon.js engine instrumentation for:

- Shell transfer at or below 600 KB compressed.
- Company logo and fallback image budgets.
- LCP, INP and CLS lab gates.
- Accessible shell/catalog/action readiness.
- Renderer package and total 3D transfer.
- First meaningful visual.
- Frame rate/frame time.
- Renderer memory.

Field Core Web Vitals require enough real eligible visits. Missing field samples are `Unknown`, not `Pass`.

## 19. Recovery, retention and migration tests

Required evidence before customer pilot:

1. Restore a production-profile backup into isolated infrastructure.
2. Apply external deletion-recovery instructions before traffic.
3. Run ordinary retention and legal-hold reconciliation.
4. Verify no erased/expired-unheld quote remains.
5. Verify company FKs/RLS, unique codes, idempotency, snapshot child counts and price totals.
6. Verify application/schema compatibility and smoke journeys.
7. Record achieved RPO/RTO and compare to approved targets.

Migration verification covers empty database, representative prior database, expand coexistence, backfill restart, constraints/permissions/RLS and recovery decision.

The local prototype can simulate deletion-reconciliation correctness, but only a provider restore drill can prove the production recovery mechanism.

## 20. Synthetic test data

Required deterministic profiles:

| Profile | Purpose |
|---|---|
| `FirstProductFixture` | Exact `DESK-001` approved rules and `SC-001` through `SC-034` |
| `SecondProductFixture` | Fundamentally different non-furniture product using existing rule types |
| `TwoCompanyIsolationFixture` | Same-looking codes/resources under company A and B |
| `BoundaryContentFixture` | Maximum Unicode scalar, body, catalog and JSON sizes |
| `ConcurrencyFixture` | Frozen create intents and distinct request IDs |
| `RetentionFixture` | Expired, future, held, released and already-deleted quotes |
| `CapacityFixture` | Approved 50-company/500-product/data-volume envelope |
| `HostileInputFixture` | Encoded script, malformed codes, oversize and credential-like canaries |

Rules:

- Reserved email domains such as `example.com` only.
- Obviously fictitious names/phones/messages.
- No copied customer catalog, logo, 3D model or policy.
- Deterministic seeds and clocks where time behavior is under test.
- Randomized/property samples record their seed on failure.
- Test public codes/keys are never reused in production.

## 21. Environment and cost matrix

| Evidence | Local prototype | Client demo | Pilot/production-shaped |
|---|---|---|---|
| Unit/component/API/SQL | Required; owned hardware | Required preflight | Required in CI/release |
| Database | SQL Server Developer | SQL Server Developer or optional Azure SQL free synthetic demo | Paid/approved Azure SQL profile |
| Browser | Owned Windows browsers plus Playwright engines | Current Edge/Chrome on presentation device | Full approved real-browser/device matrix |
| 3D tools | Blender 4.5 LTS, Babylon.js and Khronos validator | Prebuilt local Web assets | Same pinned free/open-source toolchain plus asset-license review |
| Load | Local diagnostic | Smoke only | Separate generator and representative topology |
| Security | Local audits/ZAP controlled target | Passive/baseline only | Full review plus independent penetration test |
| Recovery | Logical/local simulation | Not a demo promise | Provider backup/restore/deletion drill |
| Personal data | Prohibited | Prohibited | Only after legal/security launch gates |

No Azure resource, card, consumption billing or paid test service is required for the local prototype or in-person/screen-shared demo.

The approved renderer toolchain has no mandatory editor/runtime subscription or revenue threshold. This does not make downloaded assets automatically commercial: every model, texture, font, HDRI and Blender add-on used in the product requires a recorded compatible license or proof of ownership.

The optional Azure SQL free offer:

- Uses synthetic/non-personal data only.
- Uses stop-until-next-month rather than automatic overage.
- Is not required for the demo.
- Cannot be a paid-customer dependency.
- Requires separate explicit authorization before creation even when expected cost is zero.

## 22. Zero-cost client demo profile

The lowest-risk first demonstration runs entirely on the owner's laptop and is shown in person or through ordinary screen sharing. The laptop is never exposed as public production infrastructure.

### 22.1 Demo content

- One controlled company and `DESK-001`.
- Sanitized, owned or properly licensed 3D/assets.
- Synthetic privacy notice and contact values clearly marked as demonstration content.
- Local recording notification adapter; no real email/SMS/customer notification.
- Deterministic reset to the initial state.
- Visible demo/release identifier.

### 22.2 Demonstration script

1. Load the catalog and explain that controls come from data.
2. Change options and show deterministic compatibility/price feedback.
3. Save and reopen an immutable configuration.
4. Submit a synthetic quote and explain that success means persistence only.
5. Disable/fail Babylon.js and repeat the commercial flow.
6. Load the second-product fixture to prove schema/UI flexibility.

### 22.3 Demo-ready gate

- Fast automated smoke suite passes immediately before presentation.
- Approved business scenarios for the demonstrated paths pass.
- No test/demo data contains a real person's information.
- No cloud dependency, subscription, payment card or live notification is required.
- Current presentation browser/version is recorded.
- 3D and no-3D paths pass on the presentation hardware.
- Browser console has no unexplained error.
- Reset/restart procedure is rehearsed.
- A fallback recording/screenshots may exist, but they do not replace a working demo.

This gate proves a repeatable sales demonstration, not production readiness.

## 23. Suite execution policy

| Suite | Developer feedback | Proposed review gate | Nightly/pre-release |
|---|---|---|---|
| Domain/application unit | Every change | Required | Required |
| React component | Every client change | Required | Required |
| SQL/API integration | Relevant local change | Required | Required |
| Contract | Relevant API change | Required | Required |
| Critical Playwright smoke | Before handoff/demo | Required | Full matrix pre-release |
| Renderer adapter/asset validation | Relevant renderer or asset change | Required for renderer artifact | Full browser/performance smoke pre-release |
| RLS/concurrency/migrations | Relevant backend change | Required | Repeated/race matrix |
| axe/security headers/audits | Relevant change | Required | Full scan |
| k6 smoke | Performance-sensitive change | Not every review if runtime exceeds budget | Full profile pre-release |
| Restore/recovery | Not local daily | Operations change | Scheduled drill |

Exact CI jobs, retention and promotion mechanics belong to `09-DeploymentAndOperations.md`.

## 24. Coverage, flakiness and test quality

Approved thresholds from `04.2-NonFunctionalRequirements.md` remain:

- 100-percent decision/branch coverage for pricing, selection limits, compatibility, snapshot immutability, ownership and both idempotency scopes.
- At least 85-percent branch coverage for Domain and Application projects, excluding generated code.
- All approved business acceptance scenarios automated.
- Flaky-test rate below 1 percent across 50 repeated pipeline runs.
- .NET validation/test pipeline P95 at or below 10 minutes.
- Complete pipeline including renderer build and asset validation P95 at or below 15 minutes.

Rules:

- Coverage exclusions are named and reviewed; broad namespace/folder exclusions are prohibited.
- Generated migration/designer artifacts may be excluded; custom migration/RLS logic is not automatically excluded from integration evidence.
- A test that never fails when the production behavior is deliberately broken is not useful evidence.
- Quarantine requires issue/reference, owner, failure evidence, scope, expiry no longer than 14 days and a release-risk decision.
- Critical business, isolation, privacy, contract, migration and recovery tests cannot be quarantined for release.
- Repeated retry masking counts as flakiness, not success.

## 25. Traceability

Every implemented test case carries one or more source identifiers/section references in its metadata/name/report.

| Canonical source | Required traceability |
|---|---|
| `02-BusinessRules.md` | BR-001 through BR-045 and SC-001 through SC-034 |
| `03.1-UserFlows.md` | Critical flow step and its acceptance-scenario trace |
| `03.2-UXRequirements.md` | UX-SC-001 through UX-SC-012 and UX-001 through UX-012 |
| `04.1-ApiContracts.md` | Endpoint/operation, success contract and every stable error |
| `04.2-NonFunctionalRequirements.md` | NFR-SC-001 through NFR-SC-012 and NFR-001 through NFR-014 |
| `04.3-SecurityAndPrivacy.md` | SEC-SC-001 through SEC-SC-015 and SEC-001 through SEC-017 |
| `05-DatabaseDesign.md` | DB-AC-001 through DB-AC-023 and DB-001 through DB-015 |
| `06-Architecture.md` | ARC-AC-001 through ARC-AC-015 and ARCH-001 through ARCH-018 |

There are 111 currently named acceptance scenarios across business, UX, NFR, security, database and architecture documents, plus flow and API contract cases. A later test inventory may split one scenario into several tests; no canonical scenario may remain unmapped.

A release traceability report shows `Passed`, `Failed`, `Blocked` or `Not applicable with approved reason`. Missing is not equivalent to not applicable.

## 26. Evidence and artifact rules

Machine-readable evidence should include:

- Test result XML.
- Cobertura-compatible backend/frontend coverage.
- Playwright HTML report and trace only for failures/diagnosis.
- Renderer unit/browser result and glTF/GLB validation JSON.
- k6 threshold summary and environment profile.
- ZAP machine-readable report plus reviewed disposition.
- Dependency audit and license inventory.
- Migration IDs and database invariant report.
- Browser/device/tool exact versions.
- Release identifier and source commit.

Evidence contains synthetic identifiers only. Screenshots, traces, HAR files, console logs and database dumps are treated as potentially sensitive and scanned/redacted before retention or sharing.

Artifact retention, storage access and deletion are finalized in `09-DeploymentAndOperations.md`.

## 27. Strategy acceptance scenarios

| ID | Scenario | Required result |
|---|---|---|
| TST-AC-001 | Break one pricing branch | A deterministic unit/acceptance test fails |
| TST-AC-002 | Remove company scoping from one query | Negative isolation/API or SQL test fails |
| TST-AC-003 | Replace SQL persistence with EF in-memory for acceptance | Review/gate rejects the evidence |
| TST-AC-004 | Run 20 simultaneous exact creates | One resource exists and all exact results converge |
| TST-AC-005 | Fail after partial snapshot insert | Transaction rolls back and database reconciliation passes |
| TST-AC-006 | Change a documented API property/status | Contract comparison fails until explicitly approved |
| TST-AC-007 | Disable Babylon.js | Critical commercial Playwright journey still passes |
| TST-AC-008 | Inject an axe-detectable A/AA defect | Accessibility gate fails |
| TST-AC-009 | Pass axe but fail keyboard/manual behavior | Manual gate blocks release |
| TST-AC-010 | Run WebKit only and claim Safari support | Review rejects the claim pending real Safari evidence |
| TST-AC-011 | Run load generator and SUT on one laptop | Result is labeled diagnostic, not production capacity evidence |
| TST-AC-012 | Put a real contact in a fixture/report | Security/privacy gate fails and artifact is removed safely |
| TST-AC-013 | Restore data preceding deletion | Reconciliation removes the erased quote before traffic |
| TST-AC-014 | Add a non-furniture product | Existing schema, DTOs, validation and generic UI/tests pass unchanged |
| TST-AC-015 | Exhaust Azure SQL free allowance | Optional demo stops; no charge or customer dependency exists |
| TST-AC-016 | Show the local demo without network access | First-product and no-renderer commercial journeys remain demonstrable |
| TST-AC-017 | Publish a glTF/GLB asset without ownership/license or validator evidence | Asset gate rejects publication |
| TST-AC-018 | ZAP reports no high alerts | Result is accepted only as automated evidence, never called a penetration test |

## 28. Proposed testing decisions

These decisions remain `Proposed` until the product owner explicitly approves this document.

| ID | Proposed decision | Benefit now | Cost/risk | Reconsider when |
|---|---|---|---|---|
| TST-001 | Separate documentation, prototype, demo, pilot and commercial-launch evidence gates | Prevents a working demo being misrepresented as customer-ready | More explicit gate tracking | Readiness model is replaced |
| TST-002 | Use xUnit.net v3 and .NET test/coverage tooling for backend verification | Current supported stack and no SaaS cost | Package/version maintenance | Approved .NET test platform changes materially |
| TST-003 | Use real SQL Server 2025 Developer for physical acceptance | Proves target SQL semantics without recurring cost | Local setup and disposable DB effort | A target-compatible free runtime replaces it |
| TST-004 | Use Vitest plus React Testing Library for shell components | Fast user-centered tests aligned with Vite/React | jsdom cannot prove browsers | Frontend stack changes |
| TST-005 | Use Playwright Test plus axe-core for cross-engine journeys/accessibility automation | One free local browser framework with trace evidence | WebKit/emulation do not certify real Apple devices | Browser stack or support matrix changes |
| TST-006 | Use Vitest, Playwright and Khronos validation for Babylon.js plus Blender-authored assets; 3D never gates commercial correctness | Protects the replaceable renderer and commercial asset rights with the existing Web toolchain | Real GPU/device behavior still requires browser evidence | Renderer or asset format is replaced |
| TST-007 | Keep manual keyboard, screen-reader, zoom, forced-colors and real Safari/iOS checks | Automated accessibility is incomplete | Requires skill and Apple access later | Approved accessibility/browser policy changes |
| TST-008 | Use local k6 OSS for diagnostic load and a separate generator/environment for production claims | Free early evidence without false capacity claims | Full proof may later cost money | Target/load topology changes |
| TST-009 | Use ZAP and built-in dependency audits, while retaining independent pre-customer penetration testing | Strong free baseline without false certification | Independent test likely costs money | Security gate changes |
| TST-010 | Use deterministic synthetic first-product, second-product, isolation, boundary and capacity fixtures | Repeatability, privacy and flexibility proof | Fixture maintenance | Approved domain/capacity changes |
| TST-011 | Enforce approved critical 100-percent and domain/application 85-percent branch thresholds | Protects high-risk decisions | Coverage can be gamed without review | NFR decision changes |
| TST-012 | Permit quarantine only with owner, reason and maximum 14-day expiry; never for critical gates | Makes flakiness visible | Short-term release friction | Measured pipeline policy proves a better rule |
| TST-013 | Make the first client demo local/offline-capable with synthetic data and a recording notification adapter | Zero cloud cost, simple/reliable sales demonstration | Not self-service/public | Validated sales require an unattended public demo |
| TST-014 | Maintain source-to-test traceability for all 111 named scenarios plus API/flow cases | Prevents silent coverage gaps | Report maintenance | Canonical source structure changes |

## 29. Rejected alternatives

| Alternative | Reason rejected | Revisit trigger |
|---|---|---|
| Paid test-management platform | No team/process need that Markdown plus machine reports cannot meet | Team size/regulated audit need proves value |
| Hosted browser grid now | Windows/Playwright cover demo needs; recurring spend precedes evidence | Pilot requires real devices not otherwise available |
| Docker Desktop as mandatory test runtime | Adds licensing/runtime dependency when direct SQL Developer suffices | Team standardizes an eligible container runtime for measured benefit |
| EF in-memory or SQLite as persistence authority | Cannot prove SQL Server behavior | Never for physical acceptance |
| Cypress beside Playwright | Duplicate E2E stack and no measured advantage for the approved .NET/React/Babylon.js boundaries | Playwright fails a measured requirement |
| Selenium grid now | Operational complexity and no current advantage over Playwright | Branded Safari/device automation requires it later |
| Commercial accessibility scanner | axe/manual work meets prototype needs | Accessibility workload/contract justifies licensed tooling |
| Cloud k6 | Local OSS covers early evidence and cloud consumption can cost money | Distributed scale exceeds owned generator capacity |
| ZAP as penetration-test replacement | Automated scan cannot exercise all trust/business paths | Never |
| Pixel-perfect renderer snapshots | GPU/browser nondeterminism and low commercial signal | A stable visual invariant with proven value appears |
| Full production test matrix before first local demo | Delays customer learning without reducing demo risk proportionally | Demo scope begins processing real data or making customer commitments |

## 30. Approval checklist

- [x] All approved canonical rule/flow/UX/API/NFR/security/database/architecture sources have a test owner.
- [x] The 111 named acceptance scenarios are included in traceability.
- [x] Physical SQL, RLS, migration, concurrency and recovery evidence uses the real target engine.
- [x] Unit, integration, contract, component, browser, Babylon.js/asset, accessibility, security and performance boundaries are explicit.
- [x] Free-first tools have current license/cost boundaries and no mandatory paid service.
- [x] The local demo is independent from cloud availability and real personal data.
- [x] Real Safari/device, representative load and independent penetration-test limits are stated honestly.
- [x] Coverage, quarantine, flakiness and evidence rules are measurable.
- [x] Second-product verification prohibits product-specific schema/contract/UI branches.
- [ ] Product owner has approved TST-001 through TST-014.

## 31. Next documentation gate

After explicit approval:

1. Change this document to `Approved for implementation planning`.
2. Record TST-001 through TST-014 in `07-DecisionLog.md`.
3. Draft `09-DeploymentAndOperations.md`, including the zero-cost local demo runbook and the decision boundary for any public demo.
4. Draft `10-ImplementationPlan.md` only after operations is approved.
5. Do not start application code until all implementation-blocking documents are approved.

## 32. Official evidence reviewed

Sources were checked on 2026-07-28:

- [xUnit.net repository, v3 and Apache-2.0 license](https://github.com/xunit/xunit)
- [ASP.NET Core integration testing and `WebApplicationFactory`](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)
- [Microsoft.Testing.Platform code coverage](https://learn.microsoft.com/en-us/dotnet/core/testing/microsoft-testing-platform-code-coverage)
- [.NET 10 transitive NuGet audit behavior](https://learn.microsoft.com/en-us/dotnet/core/compatibility/sdk/10.0/nugetaudit-transitive-packages)
- [Vitest repository and MIT license](https://github.com/vitest-dev/vitest)
- [React Testing Library and MIT license](https://github.com/testing-library/react-testing-library)
- [Playwright Test, browser engines and Apache-2.0 license](https://github.com/microsoft/playwright)
- [Playwright browser policy, including WebKit versus branded Safari](https://playwright.dev/docs/browsers)
- [Playwright accessibility testing and automation limits](https://playwright.dev/docs/accessibility-testing)
- [axe-core repository and MPL-2.0 license](https://github.com/dequelabs/axe-core)
- [Babylon.js repository and Apache-2.0 license](https://github.com/BabylonJS/Babylon.js)
- [Babylon.js ES module package](https://www.npmjs.com/package/@babylonjs/core)
- [Blender license and created-artwork boundary](https://docs.blender.org/manual/en/latest/getting_started/about/license.html)
- [Khronos glTF 2.0 specification and tools](https://github.com/KhronosGroup/glTF)
- [Khronos glTF Validator and Apache-2.0 license](https://github.com/KhronosGroup/glTF-Validator)
- [Grafana k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Grafana k6 repository and AGPL-3.0 license](https://github.com/grafana/k6)
- [OWASP ZAP repository and Apache-2.0 license](https://github.com/zaproxy/zaproxy)
- [OWASP ZAP Automation Framework](https://www.zaproxy.org/docs/automate/automation-framework/)
- [Apple Safari WebDriver testing](https://developer.apple.com/documentation/webkit/testing-with-webdriver-in-safari)
