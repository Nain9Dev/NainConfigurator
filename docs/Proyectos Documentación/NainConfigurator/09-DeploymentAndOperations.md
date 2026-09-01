# Deployment and Operations

Document version: 1.1  
Status: Approved for implementation planning; no deployment, cloud resource or paid-service activation is authorized  
Last updated: 2026-07-28  
Applies to: Local development, controlled client demo, optional public synthetic demo, customer pilot and paying-customer production

## 1. Purpose and authority

This document defines how NainConfigurator will be built, promoted, configured, monitored, recovered, supported and operated without weakening its approved product, security or commercial boundaries.

It implements, and does not redefine:

- `00.2-CommercialStrategy.md` for the shared SaaS, managed onboarding and support responsibilities.
- `02-BusinessRules.md` for commercial invariants and lifecycle behavior.
- `03.1-UserFlows.md` for user intent, retry and recovery.
- `03.2-UXRequirements.md` for the responsive, accessible and renderer-independent experience.
- `04.1-ApiContracts.md` for public HTTP/JSON behavior.
- `04.2-NonFunctionalRequirements.md` for capacity, performance, availability, recovery, support and cost targets.
- `04.3-SecurityAndPrivacy.md` for trust, identity, privacy, retention, audit and incident requirements.
- `05-DatabaseDesign.md` for physical persistence, migrations, deletion reconciliation and recovery integrity.
- `06-Architecture.md` for approved deployables, Azure topology, workload identities, delivery and regional recovery.
- `08-TestingStrategy.md` for release evidence and readiness gates.

This document selects approved operating procedures and decision boundaries. It contains no application code, executable infrastructure, SQL, workflow or resource-creation authorization. Product-owner approval authorizes implementation planning only.

## 2. Direct recommendation

Use the cheapest operating profile that is safe for the current commercial evidence:

1. Build and verify on the owner's existing computer with synthetic data.
2. Demonstrate the complete product locally and offline-capable before paying for public infrastructure.
3. If unattended access becomes commercially useful, publish only a clearly labelled, static, synthetic and read-only experience on a currently eligible free plan.
4. Do not accept real contact data, promise availability or depend on a free tier for a customer pilot.
5. Activate the approved paid Azure topology only after a pilot/customer decision, legal readiness, recovery evidence and an explicit budget authorization.

Free-first means avoiding unnecessary cost. It does not permit unsafe production, unrecoverable customer data or an unmeasured support promise.

## 3. Readiness and authority levels

| Level | Allowed outcome | Data | Availability/support claim | Explicitly prohibited |
|---|---|---|---|---|
| Local development | Build, test and diagnose | Deterministic synthetic only | None | Public ingress, customer dependency, real contact data |
| Controlled client demo | Attended demonstration on owner-controlled hardware | Synthetic only | Demo-session best effort | Real quote submission, cloud dependency, customer SLA |
| Optional public synthetic demo | Unattended marketing/portfolio exploration | Static synthetic catalog and assets only | No SLA; may stop at free limits | API writes, persistence, admin, contact capture, customer data |
| Customer pilot | Limited real use under written scope | Approved pilot data only | Written pilot targets, not general SLA | Free-tier dependency, untested recovery, undefined support |
| Paying-customer production | Shared SaaS commercial service | Approved customer and quote data | Measured internal SLO; contractual SLA only if separately sold | Personal computer hosting, single untested backup, customer fork |
| Recovery | Isolated restoration and verification | Protected copy of the affected environment | No traffic before acceptance | Public access before deletion reconciliation and isolation checks |

Promotion between levels requires the exit criteria of the target level. A technical demo cannot be renamed a pilot or production environment to bypass legal, security, recovery or cost gates.

## 4. Environment model

| Environment/profile | Runtime and hosting | Persistence | External access | Lifecycle |
|---|---|---|---|---|
| `Local` | Owner's Windows workstation; future .NET, Web and renderer processes | SQL Server 2025 Developer | Loopback/local network only when explicitly controlled | Recreated from migrations and synthetic fixtures |
| `CI` | Standard GitHub-hosted Linux runners where the included private-repository allowance permits | Disposable target-compatible test database | No inbound public service | Created per run and destroyed after evidence capture |
| `LocalDemo` | Versioned local release package on owner-controlled hardware | Disposable SQL Server Developer database | No required internet connection | Reset before each demonstration |
| `PublicDemo` | Approved-at-activation zero-cost static host; Azure Static Web Apps Free is only a candidate pending applicable commercial-use terms | No database and no write API | Public HTTPS | Replaceable and removable; no customer dependency |
| `Integration` | Local or explicitly authorized short-lived Azure resources | Synthetic data only | Restricted | Created for release/recovery exercises and removed when idle |
| `Staging` | Production-shaped Azure resources started when required | Synthetic or approved masked operational test data; never copied production contact fields | Restricted operations access | Used for release and recovery gates, not an always-on duplicate |
| `Pilot` | Approved minimum paid Azure production profile | Approved pilot data | Public commercial flow plus restricted operations | Time-bounded contract and exit review |
| `Production` | Approved West Europe primary topology | Customer data | Public and private trust surfaces | Continuous commercial operation |
| `Recovery` | Recreated North Europe topology | Geo-restored protected data | Deny public traffic until verification | Removed or retained according to the incident decision |

Environment names, resource tags and telemetry always include `Environment`, `Service`, `DataClass` and `CostOwner`. Company-specific environments are prohibited in the shared SaaS unless a separately approved commercial and architecture decision creates a funded dedicated edition.

## 5. Data policy by environment

- `Local`, `CI`, `LocalDemo`, `PublicDemo`, `Integration` and default `Staging` use synthetic data only.
- Production personal data is never downloaded to a workstation, CI runner, developer database or demo.
- A staging investigation uses minimal generated reproduction data. A production-derived dataset requires a separate privacy/security decision and is not an MVP default.
- Public demo assets must be owned by NainConfigurator or have documented commercial redistribution rights; customer assets are not published before written authorization.
- Secrets, tokens, customer documents, mailbox exports, support messages and production backups never become test artifacts.
- Every environment has distinct identities, endpoints, data stores, keys and configuration. A lower environment cannot authenticate to a higher one.

## 6. Zero-cost control policy

### 6.1 Local prototype and controlled demo

- Recurring software and cloud cost target: EUR 0.
- Use existing hardware, SQL Server 2025 Developer and the approved open-source toolchain.
- No trial with automatic renewal, consumption resource, payment method change or paid add-on may be activated without explicit owner authorization.
- The complete no-renderer journey remains demonstrable without Internet access.
- Local compute, electricity, maintenance and owner time are real operating costs even when no invoice is generated.

### 6.2 GitHub private-repository allowance

Current official evidence for GitHub Free includes 2,000 standard hosted-runner minutes/month, 500 MB pooled artifact storage and 10 GB cache per repository. These are vendor limits, not permanent product requirements.

Before CI is enabled:

- Confirm the actual `Nain9Dev` account plan and current included allowance.
- Configure GitHub Actions paid usage to stop before any paid spend. If the billing UI cannot enforce a zero-spend threshold, disable paid Actions consumption and verify that workflows stop at the included allowance.
- Enable included-usage notifications at 90/100 percent and budget notifications at 75/90/100 percent where available.
- Use standard Linux runners by default; larger, macOS and paid runner SKUs are prohibited without approval.
- Retain ordinary PR diagnostics for 7 days and only approved release evidence for the longer documented period.
- Keep caches bounded and disposable; cache loss may slow CI but cannot block recovery.
- If included minutes are exhausted, CI waits until reset or the required suites run manually on the trusted local workstation. It does not silently incur charges.

An unattended self-hosted GitHub runner on the owner's personal workstation is prohibited. It would expose the machine to repository workflow execution and create availability/maintenance obligations that are not justified.

### 6.3 Azure spending boundary

- No Azure resource is created from this document.
- Every future subscription/resource group receives an owner, environment, expiry where applicable, budget and anomaly notification before workload deployment.
- Free resources select the provider option that stops service rather than bills beyond the free allowance.
- Azure budgets provide delayed notification, not a guaranteed hard spending cap; production cannot rely on a budget alert to prevent charges.
- Production cost is approved separately against the architecture planning envelope and the private recurring-infrastructure guardrail.

## 7. Controlled local demo runbook

### 7.1 Preconditions

- The demonstrated commit and release identifier are recorded.
- The `Technical demo ready` gate in `08-TestingStrategy.md` passes.
- The demo database contains only the deterministic first-product and second-product synthetic fixtures.
- The recording notification adapter is selected; no email, webhook or customer system is called.
- The renderer assets pass hash, ownership/license, malware/type and Khronos validation gates.
- The owner has an offline copy of the release package, fixture package and demonstration script.
- The browser cache has been tested both cold and warm.

### 7.2 Start procedure

1. Confirm the workstation has sufficient battery/power, disk space and the approved browser versions.
2. Disconnect or disable unnecessary external integrations.
3. Restore the clean synthetic demo database or recreate it from migrations and fixtures.
4. Start the approved release processes with `LocalDemo` configuration.
5. Run automated smoke checks for catalog load, validation, save, retrieve, quote persistence recording and no-renderer fallback.
6. Confirm no process is listening on an unintended public network interface.
7. Record the release hash, fixture version, browser and smoke result in the demo evidence.

### 7.3 Demonstration boundary

- Show the accessible commercial shell before the renderer.
- Demonstrate configuration, authoritative validation, immutable save, shareable retrieval and a synthetic quote request.
- State visibly that prices are estimates and the customer supplies the final commercial offer.
- Use clearly fictitious contact values; never invite the prospect to enter personal data.
- Demonstrate renderer failure/fallback and the fundamentally different second-product fixture when commercial time permits.
- Notification evidence shows an internal recorded event, not a claim that an email was delivered.

### 7.4 Stop and reset

1. Export only non-sensitive demo evidence.
2. Stop all local processes and confirm no port remains exposed.
3. Delete temporary browser profiles, recordings and diagnostics according to the test artifact schedule.
4. Reset the synthetic database before the next prospect.
5. Record defects and commercial feedback separately; do not change approved business rules during the meeting.

Local demo failure is not a production incident. It is recorded as product/demo evidence and repaired through the normal implementation process.

## 8. Optional public synthetic demo

### 8.1 Decision boundary

The public demo is not required for implementation or the first sales conversations. It may be proposed only when at least one of these is true:

- Five qualified prospects request unattended access.
- A validated outreach experiment needs a shareable experience to measure conversion.
- One customer requests a time-bounded evaluation before a paid pilot.

Creation still requires explicit owner authorization, current license/free-plan verification and a named removal date.

### 8.2 Proposed profile

Use only a zero-cost static host whose current offer and applicable subscription agreement explicitly permit the intended commercial demonstration. Azure Static Web Apps Free is a technical candidate, not an approved provider: Microsoft currently labels it for personal projects and the general Azure legal page delegates permitted use to the specific subscription agreement. If that commercial-use boundary is not confirmed, remain with the local demo or approve another provider after the same license, privacy, cost and portability review.

The static React/Babylon.js experience uses synthetic embedded catalog data:

- No NainConfigurator API, Azure SQL, Redis, Key Vault or worker.
- No quote/contact form, persistence, public configuration code or administration.
- No third-party analytics, advertising, session replay or support widget.
- A persistent `Demo` label explains that data is synthetic, nothing is submitted and availability is not promised.
- One synthetic product package stays inside the current 250 MB per-app limit and approved renderer transfer budgets.
- Current free-plan bandwidth is checked automatically or manually; access is disabled before 80 percent of the current monthly limit.
- Preview environments are removed after review; no environment becomes a hidden customer fork.
- The free plan has no SLA and is documented by Microsoft for personal projects, so it is never a pilot or production tier.

For capacity planning only, the current Azure Static Web Apps Free documentation lists 100 GB bandwidth/month, 250 MB per app, 500 MB total storage and three preview environments. These limits do not prove commercial-use eligibility and are reverified before any resource decision and quarterly while a demo exists.

### 8.3 Stop or upgrade triggers

Stop the public demo when:

- A free limit reaches 80 percent or current terms become unsuitable.
- A vulnerability, asset-rights issue or misleading commercial behavior is found.
- The owner cannot monitor it for more than seven days.
- The validation experiment ends without enough commercial evidence.

Move to a paid pilot profile, never a more complex free workaround, when real contact capture, authoritative persistence, access restrictions, an SLA, customer branding or reliable availability is required.

## 9. Source-control and branch policy

- `main` represents the latest approved, reviewable project state.
- Work is performed on short-lived topic branches after implementation begins.
- Pull requests identify the applicable documentation decision, acceptance scenarios, migration impact and recovery path.
- Direct production deployment from an unreviewed workstation commit is prohibited.
- Required checks cannot be bypassed for convenience. An emergency bypass needs an incident reference, owner approval and immediate follow-up review.
- Force-push and history rewrite on `main` are prohibited.
- Customer-specific permanent branches, repositories and release lines are prohibited.
- GitHub is an off-device copy and collaboration system, not the only source backup.

Until a second maintainer exists, the owner performs a documented self-review after the automated checks and a deliberate time-separated release review. A paying-customer launch must name a backup operational contact or explicitly record and price the single-person continuity risk.

## 10. CI quality flow

### 10.1 Pull-request gates

Every implementation pull request will run the applicable subset of:

- Repository formatting, compiler warnings and configured analyzers.
- .NET build, unit tests and risk-based branch coverage.
- Vitest component/renderer adapter tests.
- Public API contract and serialization checks.
- Secret, dependency, license and static security scans.
- Migration generation drift and prohibited startup-migration checks.
- glTF/GLB validator, asset manifest, hash and license-ledger checks for asset changes.
- Fast Playwright commercial-shell and accessibility smoke journeys.
- Documentation links, decision IDs and scenario-traceability checks.

No workflow receives production credentials on pull-request events.

### 10.2 Main/release-candidate gates

- Full backend and SQL Server integration suites.
- RLS negative isolation, idempotency, concurrency and migration acceptance.
- Full supported Playwright engine matrix and axe-core checks.
- Babylon.js asset/browser smoke and approved performance budgets.
- ZAP automated baseline against a controlled release environment.
- k6 diagnostic or production-shaped load according to the target gate.
- SBOM, dependency inventory, immutable artifact hashes and release manifest.
- Bicep validation/what-if against the target environment.
- Restore/recovery evidence when the release changes persistence, retention, identity or regional recovery.

### 10.3 Pipeline time and failure

- .NET validation/test P95 target: at most 10 minutes.
- Complete build plus renderer/asset validation P95 target: at most 15 minutes.
- Slow full browser/load/recovery suites may be scheduled or manually gated but must finish before the relevant release.
- A failed required check blocks promotion. A missing runner/service is a blocked verification, not a pass.
- Quarantine follows TST-012 and never hides a critical release gate.

## 11. Immutable build and promotion

Build once and promote the same immutable artifacts:

- Public host package.
- Operations host package.
- Worker package.
- Web/renderer static package and content manifest.
- Reviewed database migration artifact.
- Versioned Bicep modules and resolved parameter manifest without secrets.
- SBOM, dependency/asset inventory and cryptographic hashes.

The release identifier includes the source commit and a unique release version. Rebuilding the same version for another company or environment is prohibited. Environment differences are configuration and catalog data, not different binaries.

Ordinary CI diagnostics expire after 7 days. Exact deployable packages and migration artifacts for the current and previous approved production releases remain in the protected release store until at least 42 days after replacement. Release manifests, SBOMs, hashes, migration records and deployment/audit references remain available for at least 400 days. Retention must fit the current included storage or use the approved protected production evidence store; it cannot silently enable paid GitHub overage.

## 12. Deployment identity and infrastructure as code

- GitHub Actions uses OIDC federation to Azure; no long-lived Azure client secret is stored in GitHub.
- Federation is restricted to the immutable repository identity, approved environment and branch/tag conditions.
- Workflow permissions default to read-only; `id-token: write` exists only on the deployment job that needs it.
- Third-party actions are pinned to reviewed full commit SHAs and recorded in the dependency inventory.
- Bicep is authoritative for Azure resource configuration. Portal changes require either an incident action followed by reconciliation or an approved change reflected in Bicep.
- Separate least-privilege deployment identities exist for non-production and production.
- The application workload identity cannot deploy infrastructure or apply migrations.
- The migration identity cannot modify unrelated infrastructure or read Key Vault secrets beyond its exact responsibility.

## 13. Configuration and secret handling

### 13.1 Configuration

- Non-secret defaults are versioned.
- Environment-specific values are supplied through reviewed deployment parameters and platform settings.
- Company catalog, branding, locale and policy content are operational data, never application settings.
- Configuration schema is validated before deployment; unknown, missing or malformed critical values block startup or readiness.
- Production and recovery share the same configuration schema but have distinct endpoints and identities.
- Feature flags cannot change pricing, authorization, retention or an approved public contract without the corresponding documented decision and tests.

### 13.2 Secrets

- Local development uses .NET user secrets or process-scoped environment values outside the repository.
- Production uses managed identity first and Key Vault only for secrets that cannot be removed.
- Key Vaults are separated by environment and use RBAC, soft delete, purge protection and audit logs.
- Long-lived secrets rotate within 90 days and immediately after suspected exposure.
- A secret exposure disables/rotates the credential within four hours, faster when actively exploited.
- Deployment output, test artifacts, logs, Blender files and glTF/GLB packages are scanned for credentials.

### 13.3 Break-glass access

One emergency production access path may exist only when:

- It is disabled or inaccessible during normal operation.
- Activation requires strong MFA, a named incident, minimal scope and a maximum four-hour expiry.
- Use and revocation are audited.
- Credentials are rotated or access is revalidated immediately after use.

## 14. Database migration runbook

### 14.1 Release prerequisites

- Migration is immutable, reviewed and linked to its source commit.
- Empty-database, current-version and representative-data tests pass on SQL Server 2025 Developer and the required Azure SQL profile.
- RLS, permissions, indexes, invariants, query plans and retention/deletion behavior pass.
- Expand/migrate/contract compatibility proves the current and new application versions can coexist during slot deployment.
- The release decision states `roll-forward`, `application rollback` or `database restore`; a destructive down migration is not assumed.
- Latest valid backup/restore point is inside the approved RPO and recovery capacity is available.

### 14.2 Execution

1. Announce the approved maintenance/release window when required.
2. Confirm database identity, environment, schema version and expected migration list.
3. Stop if the target differs from the approved release manifest.
4. Apply the migration once through the dedicated delivery identity.
5. Record start/end time, migration IDs, outcome and non-sensitive trace/audit reference.
6. Run structural, RLS, ownership, snapshot, idempotency and outbox smoke checks.
7. Continue application promotion only after database acceptance passes.

### 14.3 Failure

- No application node starts or retries migrations automatically.
- A failed migration stops promotion and preserves evidence.
- If no unsafe data change occurred, correct and roll forward with a new migration artifact.
- If integrity may be compromised, isolate the environment and execute the recovery decision.
- Manual production SQL is prohibited outside an approved incident procedure with preview, transaction, precise scope, row-count validation, verification and recovery.

## 15. Application deployment runbook

### 15.1 Pre-deployment

- All target-gate tests pass and exceptions are explicitly approved.
- Artifact hashes match the release manifest.
- Bicep what-if contains only intended changes.
- Database and application compatibility is proven.
- Health, alert, cost and support contacts are active.
- No unresolved critical/high vulnerability, isolation failure or backup alert exists.

### 15.2 Staging slot

1. Deploy the immutable packages to the appropriate staging slots.
2. Apply slot-specific configuration and workload identity.
3. Warm the public and operations hosts.
4. Run readiness, catalog, validation, save, retrieve, quote/outbox-recording and no-renderer smoke checks.
5. Verify security headers, CSP, origin restrictions, telemetry redaction and no secret leakage.
6. Validate worker lease, outbox and retention behavior without sending a real notification.
7. Compare latency/error/saturation with the approved baseline.

### 15.3 Production promotion

1. Obtain explicit production approval against the release manifest.
2. Swap the validated slots; do not rebuild.
3. Run post-swap smoke checks through Front Door and direct protected origin monitoring.
4. Observe errors, latency, SQL, cache, outbox and renderer fallback for at least 30 minutes.
5. Close the release only after the observation window passes.

Application release/configuration rollback or replacement must remain within 30 minutes.

## 16. Rollback, roll-forward and emergency change

- Application-only regression with a compatible database: swap back to the last approved package.
- Forward-compatible database defect: disable the affected release path if safe and apply a reviewed roll-forward migration.
- Suspected corruption, cross-company access or personal-data exposure: stop affected traffic, preserve minimal evidence and invoke the security incident/recovery runbook.
- Destructive database rollback is prohibited unless restore/reconciliation evidence proves required data preservation.
- Catalog/asset defect: revert the active published pointer to the previous immutable validated version; historical configurations do not change.
- Emergency changes still require a source-controlled artifact, hash, audit event and retrospective review within one business day.

If safe recovery exceeds the approved target, declare the applicable incident severity instead of continuing an unbounded deployment.

## 17. Health and readiness

Each deployable exposes separate protected operational health signals:

- **Liveness:** The process is running and not irrecoverably deadlocked. It does not call remote dependencies.
- **Readiness:** The instance is warmed and can reach the dependencies required for its responsibility with safe bounded checks.
- **Startup:** Migration/schema compatibility and critical configuration are valid; the application does not apply a migration.

Health responses contain no version secrets, connection details, tenant data, dependency names unnecessary to the caller or exception text.

App Service health checking uses the readiness path and at least two production instances to reroute away from an unhealthy worker. Front Door checks only the public-origin readiness boundary. Internal operations/worker state is monitored separately and is never exposed as public diagnostics.

## 18. Observability model

### 18.1 Required correlation

- Every public response carries `traceId`.
- Request, dependency, SQL, cache, worker, outbox, retention, publication and deployment evidence correlate without recording request bodies.
- UTC is used for all operational timestamps.
- Stable event names and technical fields use English.
- Successful high-volume traces may be sampled; errors, security audit, quote-create outcomes, outbox failures and retention evidence are not sampled away.

### 18.2 Minimum dashboards

| Dashboard | Required views |
|---|---|
| Public service | Request volume, P50/P95/P99 latency, 4xx/5xx, availability, saturation and top stable error codes |
| Commercial writes | Configuration/quote creates, exact replays, conflicts, rollbacks and persistence failure sequence |
| Catalog/cache | Publication time, propagation age, cache hit/miss/invalidation, stale pointer and asset errors |
| Worker | Lease ownership, batch duration, outbox pending/oldest/retry/dead-letter outcome and retention backlog |
| Data | SQL CPU/data IO/log IO/storage/connections/deadlocks, slow approved query families and RLS failures |
| Renderer/Web | Core Web Vitals, renderer states, load time, transfer budget, fallback and supported-browser split without personal tracking |
| Recovery | Backup age, restore/drill result, deletion-reconciliation result and artifact reproducibility |
| Security/privacy | Authentication anomalies, denied privileged actions, support elevation, secret expiry, deletion failure and incident status |
| Cost | Actual/forecast by environment/service, 3D egress, telemetry ingestion and cost per active company/session where safe |

### 18.3 Telemetry privacy

- No contact name, email, phone, free text, privacy content, full request/response body, token, secret or unrestricted visual state.
- Raw source IP appears only in the restricted security path and is deleted within 30 days unless attached to an active incident.
- Administrative/security audit remains 400 days.
- Aggregate non-personal metrics remain 13 months.
- Support and access to telemetry follow least privilege and are audited where required.

## 19. Alert catalog and routing

| Alert | Condition | Required detection | Initial route |
|---|---|---:|---|
| `PublicErrorRateHigh` | Unexpected errors at least 2% with at least 50 eligible requests in 5 minutes | 10 minutes | Technical S1/S2 owner |
| `CommercialWriteFailureSequence` | Three consecutive configuration or quote persistence failures | 5 minutes | Technical S1 owner |
| `ApiLatencyHigh` | Operation P95 exceeds its approved target by 50% for 15 minutes | 20 minutes | Technical S2 owner |
| `AvailabilityProbeFailed` | Public shell/API unavailable from at least three of five approved production probe locations | 10 minutes | Technical S1 owner |
| `BackupOutsideRpo` | No successful backup inside the applicable RPO | 15 minutes | Technical S1 owner |
| `CatalogPropagationLate` | Published/deactivated version is not visible after 60 seconds | 5 minutes | Technical S2 owner |
| `OutboxBacklogOld` | Oldest pending notification intent exceeds 15 minutes or retry trend rises | 5 minutes | Technical S2 owner |
| `RetentionDeletionFailed` | Any due deletion fails or overdue age approaches 24 hours | 15 minutes | Privacy operator and SecurityOwner |
| `RecoveryReconciliationFailed` | Restored deletion replay or isolation check fails | Immediate | Security S1; keep traffic blocked |
| `SecretOrCertificateExpiring` | Required credential/certificate has fewer than 30 days remaining | 24 hours | Security administrator |
| `SqlCapacityHigh` | Sustained CPU/data IO/log IO/storage threshold threatens the tested envelope | 20 minutes | Technical S2 owner |
| `CostActualOrForecastHigh` | Approved budget threshold reached or anomaly detected | Provider evaluation plus one business hour | Product/technical owner |
| `SecurityIsolationSuspected` | Cross-company access signal or confirmed authorization defect | Immediate | Security S1, 24/7 narrow escalation |
| `AzureServiceHealthRelevant` | Incident/advisory affects selected services/regions | Provider notification plus 15 minutes | Technical owner |

Alert messages contain environment, service, severity, UTC time, stable condition, dashboard/runbook link and non-sensitive correlation data. They never include customer contact values or secrets.

Alert rules and action groups are deployed through Bicep and tested at least quarterly. Maintenance suppression has an owner and expiry and never hides security, backup, deletion or cost alerts.

## 20. SLO and error-budget operation

- Internal public availability target: 99.5 percent monthly.
- Planned maintenance exclusion requires at least 72 hours' notice and no more than two hours/month.
- The SLO is not sold as an SLA until two consecutive representative months pass and support/cost are approved.
- At 50 percent monthly error-budget consumption, pause risky changes and review the dominant cause.
- At 100 percent consumption, freeze non-remediation production releases until a documented recovery plan exists.
- Expected client/business `4xx` responses are not downtime; NainConfigurator `5xx`, timeouts and owned dependency failures are.
- Public demo availability is excluded because it has no SLA and is not a customer service.

## 21. Backup and restore policy

### 21.1 Local and demo

- Synthetic databases are recreated from migrations and fixtures; they have no customer-data RPO.
- Source control is mirrored to GitHub and backed up monthly, plus before the first public/pilot release, as an encrypted Git bundle outside the working directory.
- Approved Blender source, texture/license ledger and release packages have a second encrypted copy before a client demonstration.
- A local demo can be canceled if recovery fails; it cannot substitute unrecoverable customer work.

### 21.2 Pilot and production

- Azure SQL automated backups use the approved geo-zone-redundant profile and retention no longer than 35 days for quote personal data.
- SQL commercial/quote RPO is at most 15 minutes and support-window RTO at most four hours.
- Catalog/branding RPO is at most one hour and RTO at most four support hours.
- Reproducible static/3D asset RPO is at most 24 hours and RTO at most one business day.
- Application/configuration recovery uses the last approved immutable release within 30 minutes.
- Public asset storage uses GZRS and immutable content hashes.
- Approved Blender source, license evidence and non-public asset inputs have a protected private copy separate from the public optimized packages.
- The private deletion-recovery journal retains protected non-personal HMAC lookup evidence for at least 42 days.
- Key versions required to decrypt retained backups remain recoverable for the full retention window.

### 21.3 Restore acceptance

At least quarterly:

1. Restore the selected point into an isolated non-production environment.
2. Keep all public ingress disabled.
3. Apply the exact schema/version compatibility check.
4. Reapply deletion/expiry reconciliation from the protected journal.
5. Verify company isolation, public-code uniqueness, idempotency, immutable snapshots and price totals.
6. Verify configuration/asset hashes and application smoke checks.
7. Record achieved RPO/RTO, gaps, cost and cleanup.
8. Destroy or sanitize the restore environment after evidence retention.

A full regional recovery exercise runs at least twice per year before commercial scale expands.

## 22. Regional recovery runbook

1. Declare the incident and record the recovery point decision.
2. Freeze production deployment and catalog publication.
3. Recreate the approved North Europe compute, identity, network, Key Vault references and monitoring through Bicep.
4. Geo-restore Azure SQL into the recovery logical server.
5. Restore/verify protected configuration, Data Protection keys and required asset access.
6. Run schema/version checks and deletion reconciliation before traffic.
7. Run RLS isolation, idempotency, commercial-flow, outbox, retention and asset smoke checks.
8. Confirm observed RPO and forecast RTO; communicate uncertainty honestly.
9. Switch Front Door only after the incident commander and SecurityOwner accept the evidence.
10. Monitor the recovered service and plan return/failback as a separate change.

Geo-restore is asynchronous and does not guarantee zero data loss or reserved recovery-region capacity. If two consecutive drills exceed three hours, or a funded contract requires a shorter RTO, reconsider a failover group and pre-provisioned recovery compute through architecture approval.

## 23. Retention and deletion operation

- Quote expiry runs at least daily and must complete deletion within 24 hours of `RetentionUntilUtc`.
- Rights-request deletion is company-scoped, idempotent and linked to the verified controller instruction.
- A protected deletion-recovery entry is committed before SQL deletion.
- Local tombstones and external recovery evidence contain no contact value, raw quote code, client request ID or message.
- Legal holds include owner, reason, scope, review date and expiry/condition and are reviewed at least every 90 days.
- Deletion failure alerts immediately and remains open until the aggregate, outbox and applicable recovery evidence are reconciled.
- A restored environment cannot become ready until expired/erased quote data is absent.
- Customer termination does not stop scheduled retention.

## 24. Incident management

### 24.1 Roles

Before a pilot:

- `IncidentCommander`: coordinates facts, decisions and status.
- `TechnicalOwner`: diagnoses application/infrastructure and executes recovery.
- `SecurityOwner`: owns security containment and evidence.
- `PrivacyCoordinator`: coordinates controller/data-subject obligations.
- `CustomerContact`: receives agreed commercial communication.

One person may initially hold several roles, but every decision remains explicit. Paying-customer operation requires a backup contact or a documented customer-accepted continuity limitation.

### 24.2 Severity

| Severity | Example | Acknowledgment | Target |
|---|---|---:|---:|
| Security S1 | Suspected cross-company access, personal-data disclosure, active credential compromise | 30 minutes, narrow 24/7 escalation | Containment within 4 hours |
| Technical S1 | Public journey unavailable or configuration/quote writes failing | 1 support hour | Restore/workaround within 4 support hours |
| S2 | Major degradation, supported-browser block or exploitable high-risk weakness without compromise | 4 support hours | Workaround within 2 business days |
| S3 | Minor defect, visual issue with fallback or documentation question | 1 business day | Planned and communicated |

### 24.3 Lifecycle

1. Detect and create a timestamped incident record.
2. Classify severity and affected environments/companies/data categories.
3. Contain without destroying evidence or widening data copies.
4. Recover through an approved runbook.
5. Communicate verified facts, impact, workaround and next update time.
6. Close only after monitoring and affected controls are stable.
7. Complete review and tracked corrective actions within 10 business days after containment.

The processor informs an affected controller without undue delay and targets an initial notice within 24 hours after reasonably confirming a personal-data breach. The controller owns regulatory/data-subject notification decisions.

## 25. Support workflow

### 25.1 Standard service

- Window: Monday-Friday, 09:00-18:00 Europe/Madrid, excluding Spanish national holidays.
- Public end-user product questions, sales and final quotes remain the customer's responsibility.
- NainConfigurator supports platform operation, catalog publication, defects, security/privacy execution and agreed integrations.
- General 24/7 human support is not included.

### 25.2 Intake and triage

- Use one dedicated business support channel selected before the pilot.
- Record a non-sensitive `SupportTicketId`, company, category, severity, timestamps, owner and status.
- Do not copy contact values, request bodies, production exports or secrets into GitHub issues.
- Begin diagnosis with `traceId`, release, company scope and redacted telemetry.
- Request the minimum additional information and provide a secure transfer path only when necessary.

### 25.3 Production access

- Routine direct SQL and bulk browsing are prohibited.
- Quote personal-data access requires a valid ticket, exact company/record scope, reason and elevation no longer than four hours.
- Access and export are audited; temporary exports are encrypted and deleted within seven days.
- The support record closes with cause, action, customer communication and follow-up decision.

The support/mail provider, notification vendor and customer communication templates remain commercial-launch selections because their regions, subprocessors, retention and cost require review.

## 26. Company onboarding runbook

### 26.1 Commercial and legal preconditions

- Signed scope, setup fee, recurring-service terms and separately priced asset/integration work.
- Named controller, commercial, security, rights and lead-delivery contacts.
- Executed data-processing agreement before real quote data.
- Approved privacy notice, lawful-basis position, retention and subprocessor/region disclosure.
- Written ownership/license evidence for logos, fonts, models, textures, HDRIs and source data.
- Support window, pilot exit criteria and no-SLA/free-demo boundaries understood.

### 26.2 Technical onboarding

1. Allocate the company identity/code through the controlled administration process.
2. Validate locale, currency, brand profile and accessibility contrast.
3. Import catalog data through generic product/group/option/rule contracts.
4. Reject values beyond approved content/capacity limits.
5. Prepare assets through the managed Blender/glTF pipeline and license ledger.
6. Publish immutable privacy content and record its version/hash.
7. Run company-isolation, catalog, pricing, renderer fallback and quote-routing tests in staging.
8. Obtain customer approval of catalog, estimate wording, assets and privacy presentation.
9. Publish the version and verify propagation within 60 seconds.
10. Handover support, incident, quote-recipient and change-request procedures.

Adding a fundamentally different second product must change data, assets and tests only. A required schema field, public DTO property, validator branch, screen, deployment or repository fork fails onboarding and returns to product/architecture decision review.

## 27. Catalog and asset publication

- Customer-supplied content is untrusted until validation succeeds.
- Publication validates schema, logical limits, code uniqueness, rule graph, default selections, prices, locale and active privacy resource.
- Asset publication validates declared/actual type, malware scan, metadata, size/budget, Khronos result, content hash and license ledger.
- Publish immutable versioned packages first, then atomically move the active catalog pointer.
- Verify cache/CDN convergence within 60 seconds.
- On defect, deactivate or revert the pointer; never mutate saved configurations or published privacy content.
- Production publication requires an authenticated capability and audit event.
- Bulk customer self-service publication remains outside the MVP.

## 28. Company termination and offboarding

1. Verify the controller instruction, contract date, scope and legal holds.
2. Stop new catalog publication and deactivate new public commercial actions at the approved time.
3. Export only the approved data/content through a secure expiring path.
4. Revoke workforce roles, support elevation, integration credentials and quote recipients.
5. Continue quote retention/deletion and rights execution.
6. Remove public assets when commercial/legal retention permits without breaking immutable historical snapshots.
7. Delete remaining personal data within 30 days of the approved termination instruction, subject to legal hold and backup expiry.
8. Record completion, unresolved obligations and final cost/support closure.

Offboarding never deletes shared application code, schema or another company's data.

## 29. Cost management and commercial guardrail

### 29.1 Demo

- Local demo recurring target: EUR 0.
- Public synthetic demo recurring target: EUR 0 and automatic stop/removal at limits.
- No free resource is upgraded to billable use without explicit owner approval.
- Free-plan terms, limits, commercial suitability and portability are reviewed quarterly.

### 29.2 Pilot and production

- Regenerate the Azure Pricing Calculator estimate for West Europe before every paid proposal and scale change.
- Configure actual and forecast budgets at 50, 75, 90 and 100 percent of the approved monthly amount.
- Enable daily anomaly and monthly cost review.
- Tag and report cost by environment/service and attribute company/product/asset egress where safe.
- Compare direct recurring infrastructure with recurring service revenue monthly against the private guardrail.
- When the guardrail is exceeded for two representative months, stop unfunded scale and customization, and change pricing, packaging or the capacity plan.
- Never remove backup, isolation, security or privacy controls to preserve an underpriced offer.

Azure budget evaluation can lag usage and does not stop production automatically. Cost safety requires quotas, resource limits, reviewed scale settings and human ownership in addition to alerts.

## 30. Capacity and scaling operation

The initial production profile remains the approved architecture baseline: two zone-redundant App Service workers, Azure SQL serverless, Azure Managed Redis B0 HA, Front Door Standard and GZRS asset storage.

Proposed initial App Service policy:

- Minimum two workers in production.
- Scale-out evaluation when average CPU is at least 70 percent, memory at least 75 percent or operation P95 breaches its target for 10 minutes with application saturation evidence.
- Scale-in only after at least 30 minutes below 35 percent CPU/memory and no latency, queue or deployment event.
- Initial maximum four workers until load evidence, SQL capacity and cost guardrail approve a higher value.
- Worker/outbox scaling preserves leases and at-least-once behavior.

These numbers must be calibrated in production-shaped load testing before activation. Do not scale compute to hide a query, asset, cache-key, retry or business-rule defect.

Revisit service/database split only when a module has independently measured scale/availability, clear ownership and a funded operational benefit.

## 31. Dependency, platform and lifecycle review

Monthly during active implementation/pilot and quarterly otherwise:

- Review .NET, Node, React, TypeScript, Vite, Babylon.js, Blender and SQL support/lifecycle.
- Review critical/high dependency and container/base-image advisories.
- Review Azure and GitHub service retirement/security advisories.
- Review free-tier limits, billing configuration and data-region changes.
- Review domain/certificate, secret and workload federation expiry.
- Review asset/add-on licenses and SBOM changes.

No framework, hosting tier or structural dependency is upgraded solely because a newer version exists. A supported security/lifecycle need or measured value must justify the change and its migration evidence.

## 32. Operational evidence and runbook ownership

Every runbook has:

- Owner and backup owner where commercially required.
- Scope, prerequisites, exact stop conditions and recovery path.
- Last review and last exercise date.
- Links to dashboards, alerts and non-sensitive evidence.
- Maximum execution/acknowledgment target.
- Follow-up issue/decision references.

Minimum exercise schedule:

| Procedure | Minimum frequency |
|---|---:|
| Local demo reset and offline execution | Before each client demonstration |
| Alert/action-group test | Quarterly and after routing changes |
| Secret rotation | Before pilot and at least every 90 days for remaining long-lived secrets |
| SQL isolated restore | Quarterly |
| Full regional recovery | Twice per year before commercial scale expands |
| Security/personal-data incident exercise | Twice per year |
| Company onboarding dry run | Before first pilot and after material catalog pipeline changes |
| Company offboarding/rights deletion dry run | Before first real data and annually |
| Cost/free-tier review | Monthly while resources exist |

## 33. Operations acceptance scenarios

| ID | Scenario | Required outcome |
|---|---|---|
| OPS-AC-001 | Demonstrate with no Internet connection | Commercial first/second-product and no-renderer journeys pass with synthetic data |
| OPS-AC-002 | Attempt real contact data in `LocalDemo` | Demo policy blocks the action and no personal data persists |
| OPS-AC-003 | GitHub Actions included usage is exhausted | Pipelines stop/wait or run locally; no paid overage occurs |
| OPS-AC-004 | Public demo reaches 80% of a free limit | Publishing/access stops or the resource is removed before billable dependency |
| OPS-AC-005 | Public demo visitor tries to submit a quote | No form/API/persistence exists and the demo boundary is visible |
| OPS-AC-006 | Pull request requests a production credential | Workflow has no credential path and the security gate fails |
| OPS-AC-007 | Deploy the same release to two companies | Identical artifacts run with data-driven catalogs; no rebuild or fork occurs |
| OPS-AC-008 | Migration target/version differs from manifest | Delivery stops before SQL changes |
| OPS-AC-009 | New slot fails readiness | No swap occurs; current production remains active |
| OPS-AC-010 | Application regression after compatible swap | Previous approved package is restored inside 30 minutes |
| OPS-AC-011 | Backup is older than the RPO | Alert fires within 15 minutes and release/incident policy blocks unsafe claims |
| OPS-AC-012 | Restore a backup predating erasure | Deletion reconciliation removes erased data before readiness/public traffic |
| OPS-AC-013 | Simulate West Europe outage | North Europe recovery passes RPO/RTO, isolation, deletion and smoke gates before routing |
| OPS-AC-014 | Outbox provider is unavailable | Quote remains committed, retry evidence is visible and API never claims delivery |
| OPS-AC-015 | Catalog asset contains no license evidence | Publication fails before public storage/cache update |
| OPS-AC-016 | One company requests a custom field/deployment | Onboarding stops and requires a shared data-driven decision; no fork is created |
| OPS-AC-017 | Telemetry fails on a quote error | Public response retains safe `traceId`; no contact/body appears in logs |
| OPS-AC-018 | Cost forecast exceeds the 25% guardrail | Pricing/packaging/capacity review blocks unfunded expansion |
| OPS-AC-019 | Support needs quote personal data | Exact ticket/company/record elevation expires within four hours and is audited |
| OPS-AC-020 | Critical secret is exposed | Credential is disabled/rotated within four hours and incident evidence remains |
| OPS-AC-021 | Production catalog pointer is defective | Previous immutable version is reactivated without changing saved configurations |
| OPS-AC-022 | Production release consumes the monthly error budget | Non-remediation releases freeze and a recovery plan is recorded |
| OPS-AC-023 | Customer terminates service | Access is revoked, exports/deletion follow instruction and other companies remain unaffected |
| OPS-AC-024 | Free-plan terms or limits change | Demo is stopped or migrated through explicit approval; production remains independent |

## 34. Approved operations decisions

The product owner explicitly approved OPS-001 through OPS-016 on 2026-07-28.

| ID | Approved decision | Benefit now | Cost/risk | Reconsider when |
|---|---|---|---|---|
| OPS-001 | Separate Local, LocalDemo, PublicDemo, Integration, Staging, Pilot, Production and Recovery authority/data profiles | Prevents unsafe promotion and false readiness claims | More environment discipline | Approved readiness model changes |
| OPS-002 | Make the first complete client demo local, offline-capable and synthetic with recorded notifications | Zero recurring cost and reliable sales conversation | Attended rather than self-service | Validated prospects need unattended access |
| OPS-003 | Permit only a static synthetic public demo with no API, writes, personal data or SLA; select a zero-cost host only after its current commercial-use terms are verified | Shareable portfolio path without backend cost | Provider remains an activation-time decision and free limits can change | Public demo needs persistence, access control or reliability |
| OPS-004 | Build once and promote immutable shared artifacts; prohibit customer builds/forks | Consistent releases and scalable SaaS operations | Requires disciplined configuration/catalog separation | Never for shared SaaS |
| OPS-005 | Use private GitHub Actions within verified included allowance, zero paid-usage budget and short artifact retention | Automated free-first gates without surprise billing | Pipelines can pause at limits | Revenue justifies approved paid CI |
| OPS-006 | Use GitHub Actions OIDC, pinned actions and Bicep with separate least-privilege delivery identities | Removes long-lived deployment secrets and portal drift | Federation/IaC setup effort | Delivery platform changes through architecture approval |
| OPS-007 | Use explicit expand/migrate/contract delivery with one migration identity and roll-forward/restore recovery | Protects data and slot compatibility | Slower schema evolution | Never replace with startup/ad hoc production migration |
| OPS-008 | Use slot deployment, readiness gates, 30-minute observation and application rollback target | Reduces release downtime/regression risk | Temporary slot capacity and procedure | Hosting topology changes |
| OPS-009 | Operate OpenTelemetry/Azure Monitor dashboards and the named alert catalog with redacted data | Actionable evidence for SLO, recovery and cost | Telemetry ingestion and maintenance cost | Approved provider changes |
| OPS-010 | Enforce quarterly isolated restore, twice-yearly regional recovery and deletion reconciliation before traffic | Proves RPO/RTO and prevents erased-data resurrection | Drill time and temporary resource cost | Contract or measured drills require stronger recovery |
| OPS-011 | Use standard business-hours technical support plus narrow 24/7 Security S1 escalation | Honest affordable MVP support | Single-person continuity risk until backup contact exists | Premium support is funded |
| OPS-012 | Apply GitHub/Azure budgets, anomaly alerts and the private infrastructure/revenue guardrail without treating budgets as hard stops | Protects cash and margin | Requires monthly review | Measured business model changes |
| OPS-013 | Use controlled company/catalog/asset onboarding and offboarding with no product-specific schema, code or deployment | Keeps onboarding repeatable and profitable | Managed manual work during MVP | Self-service is validated and approved |
| OPS-014 | Retain release manifests/SBOM/hashes/deployment evidence for at least 400 days and ordinary CI artifacts for 7 days | Traceability without exhausting free storage | Protected evidence store may cost in production | Legal/audit requirement changes |
| OPS-015 | Keep real personal data out of every demo/non-production default and require legal/security/operations gates before pilot | Reduces privacy and reputation risk | Less realistic support reproduction | A separately approved masked-data process is necessary |
| OPS-016 | Scale the approved PaaS topology on measured latency/saturation/cost before splitting services or tenant databases | Simple operations and preserved margin | Requires measurement discipline | Independent scale/availability boundary is proven and funded |

## 35. Rejected alternatives

| Alternative | Reason rejected | Revisit trigger |
|---|---|---|
| Host the client demo on the owner's computer over the public Internet | Personal workstation is not secure, available or supportable customer infrastructure | Never for customers; use approved hosting |
| Deploy a full public backend before customer evidence | Creates attack, privacy, recovery and cost obligations before value is validated | Paid pilot and launch gates are ready |
| Use Azure Static Web Apps Free as production | Microsoft positions it for personal projects and it has no SLA/private endpoint | Never for paying-customer data |
| Assume a free static-host plan permits commercial lead generation | A feature/quota page is not a commercial-use license; the applicable service agreement controls use | Verify the exact offer terms before activation |
| Capture demo leads in a fake/static form | Creates misleading behavior and data obligations without authoritative API/notification | Approved pilot/production quote flow |
| Depend on Azure SQL free offer for a pilot | It may auto-pause, has no SLA and restricted recovery | Use approved paid Azure SQL |
| Leave cloud billing uncapped because resources are currently free | Terms/usage can change and budgets can lag | Never |
| Self-host GitHub Actions continuously on the personal workstation | Expands attack surface and creates maintenance/availability dependency | A dedicated hardened runner is funded and justified |
| Store Azure credentials as long-lived GitHub secrets | OIDC supplies short-lived scoped access | Provider cannot support secure federation |
| Apply migrations on application startup | Multiple instances and failures create uncontrolled schema writes | Never |
| Destructive automatic database rollback | Can lose committed customer data and bypass reconciliation | Verified restore/roll-forward decision only |
| One dashboard/alert for every metric | Noise hides actionable incidents and increases cost | Add alerts only with owner and runbook |
| Promise 24/7 general support or contractual 99.5% immediately | Unmeasured, unfunded and incompatible with the owner model | Two measured months plus funded support agreement |
| Database/repository/deployment per ordinary customer | Breaks margin, upgrades and operational scalability | Separately approved funded dedicated edition |
| Kubernetes, broker or hot multi-region now | No measured scale/availability/team need | Approved architecture revisit trigger |

## 36. Approval checklist

- [x] Local demo has a zero-recurring-cost, offline-capable and synthetic runbook.
- [x] Public demo has an explicit evidence trigger, static-only profile, free-limit stop rule and no data capture.
- [x] Public-demo hosting remains unselected until the applicable free offer explicitly permits the intended commercial demonstration.
- [x] Pilot/production cannot depend on a free plan or personal computer.
- [x] Environment, data, identity and promotion boundaries are explicit.
- [x] CI/CD gates, immutable artifacts, OIDC, Bicep and migration ownership align with architecture.
- [x] Deployment, rollback/roll-forward and catalog/asset recovery are defined.
- [x] Health, dashboards, alerts, SLO/error budget and telemetry retention are measurable.
- [x] Backup, deletion reconciliation and regional recovery prove the approved RPO/RTO.
- [x] Support, incident, onboarding, offboarding and privileged-access workflows have clear ownership.
- [x] Cost budgets, free-tier limits and the revenue guardrail are explicit and owned.
- [x] Adding a second product or company cannot create a code/schema/build/deployment fork.
- [x] Product owner approved OPS-001 through OPS-016 on 2026-07-28.
- [ ] Before any public demo: owner revalidates the current free plan and explicitly authorizes resource creation.
- [ ] Before any pilot: legal, notification, support, penetration, backup/restore and budget gates are satisfied.

## 37. Current implementation-readiness boundary

OPS-001 through OPS-016 are approved and recorded in `07-DecisionLog.md`.

IMP-001 through IMP-012 are also approved. The passing final review is recorded in `11-ImplementationReadinessReview.md`. SL-000 was separately authorized and is completed; application work for every later slice requires separate explicit authorization.

Approval of this document does not authorize a public demo, Azure resource, paid service, customer pilot, real personal data, production launch or application code. Each remains a separate execution/commercial gate.

## 38. Official evidence reviewed

Sources were checked on 2026-07-28. Vendor limits and prices must be rechecked before activation:

- [GitHub Actions billing and included private-repository allowances](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub budgets and stopping metered usage](https://docs.github.com/en/billing/concepts/budgets-and-alerts)
- [GitHub Actions artifact retention](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts)
- [GitHub OIDC federation with Azure](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure)
- [Azure Static Web Apps hosting plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans)
- [Azure Static Web Apps quotas](https://learn.microsoft.com/en-us/azure/static-web-apps/quotas)
- [Microsoft Azure legal information and applicable subscription agreements](https://azure.microsoft.com/en-us/support/legal/)
- [Azure SQL Database free-offer limits and stop behavior](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer-faq)
- [Azure SQL backup restore and geo-restore](https://learn.microsoft.com/en-us/azure/azure-sql/database/recovery-using-backups)
- [Azure App Service instance health checks](https://learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check)
- [Azure App Service deployment slots](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/app-service-slots)
- [Azure Monitor action groups](https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/action-groups)
- [Application Insights availability tests and pricing warning](https://learn.microsoft.com/en-us/azure/azure-monitor/app/availability)
- [Azure Service Health alerts](https://learn.microsoft.com/en-us/azure/service-health/service-health-alert-overview)
- [Azure Cost Management budgets and alerts](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets)
