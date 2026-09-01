# Security Policy

## Scope and current status

NainConfigurator is a **local technical demo**. It has never been deployed publicly, it stores only synthetic data, and it is not authorized to process real personal data. There is no hosted instance to attack and no production environment behind this repository.

That does not make the code exempt from review. The public API surface, the multi-tenant isolation model and the persistence layer are the parts of this project most worth scrutinising, and reports about them are welcome.

## Supported versions

| Version | Supported |
|---|---|
| `main` | Yes |
| Anything else | No |

There are no released versions yet. Only the current `main` branch receives fixes.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use GitHub's private vulnerability reporting on this repository:

1. Open the **Security** tab.
2. Choose **Report a vulnerability**.
3. Describe the issue, the affected file or endpoint, and the impact.

A working proof of concept, or the exact request that triggers the behaviour, makes triage much faster.

### What to expect

| Stage | Target |
|---|---|
| Acknowledgement | 5 working days |
| Initial assessment | 15 working days |
| Fix or documented mitigation for a confirmed high-severity issue | 90 days |

This is a personal project maintained outside working hours. These are honest targets, not a contractual SLA.

### Disclosure

Coordinated disclosure is preferred. Please allow a fix to land on `main` before publishing details. Reporters are credited in the release notes unless they ask not to be.

## Out of scope

The following are known and accepted properties of a local demo, not vulnerabilities:

- `TrustServerCertificate=True` in the bundled local SQL Server connection strings. The demo targets a loopback developer instance with a self-signed certificate. Any real deployment must use a validated certificate chain; see `docs/Proyectos Documentación/NainConfigurator/04.3-SecurityAndPrivacy.md`.
- The absence of authentication. The public API is deliberately anonymous by design: it exposes only published catalogs and write endpoints that create synthetic records. The administrative surface described in the architecture documents is not implemented.
- The demo-only `.invalid` email restriction. It is a data-hygiene guard against real personal data entering the demo, not a security control.
- Rate limits tuned for a single loopback client.
- Findings that require an attacker to already have local administrator rights or physical access to the machine running the demo.
- Reports generated purely by an automated scanner with no analysis of exploitability in this codebase.

## Security properties the project does claim

If you can break any of these, that is a real finding:

- **Company isolation.** A request scoped to one company must never read or write another company's catalog, configurations or quote requests. Isolation is enforced in SQL through session context and row-level security, not only in application code.
- **Authoritative server-side validation.** Prices, selection limits and compatibility rules are recomputed server-side on every write. A crafted client must not be able to persist a price or a combination the catalog does not allow.
- **Immutability of saved configurations.** A saved configuration must not change when the catalog changes.
- **Idempotency.** Replaying a configuration or quote request with the same client request identifier must not create duplicates or corrupt state.
- **No injection.** All database access is parameterised or goes through EF Core. Dynamic SQL built from user input is a defect.
- **No secrets, personal data or request bodies in logs.**
- **Response headers.** A strict Content-Security-Policy with no `unsafe-inline` or `unsafe-eval`, plus the framing, sniffing, referrer, permission and cross-origin isolation headers set by the public host.

## Automated checks

Every push and pull request runs dependency auditing, secret scanning and static analysis. See `.github/workflows/`. These are a floor, not a substitute for review.
