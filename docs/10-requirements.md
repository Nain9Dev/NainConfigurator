# Requirements Specification — NainConfigurator

All requirements adhere to the Easy Approach to Requirements Syntax (EARS).

## 1. Domain & Evaluation Requirements

- **REQ-CFG-001 (Deterministic Evaluation)**: When a set of option codes is evaluated against a `ProductDefinition`, the domain engine shall evaluate all rules deterministically, sorting normalized selections and producing an identical `EstimatedPrice` and `PriceBreakdown` regardless of input order.
- **REQ-CFG-002 (Required Group Enforcement)**: When a selection omits an option from a required option group, the evaluation engine shall flag the configuration as invalid and return an explicit missing group error.
- **REQ-CFG-003 (Selection Cardinality Guard)**: When a selection violates min/max selection bounds for any option group, the evaluation engine shall return a cardinality violation error.
- **REQ-CFG-004 (Incompatibility Rule Enforcement)**: When two options designated as incompatible are selected together, the engine shall invalidate the configuration and identify the conflicting pair.

## 2. Architectural Fitness Requirements

- **REQ-CFG-005 (Domain Isolation)**: When automated architecture tests execute, the test suite shall assert that `NainConfigurator.Domain` has zero dependencies on `NainConfigurator.Application`, `NainConfigurator.Infrastructure`, `NainConfigurator.PublicHost`, `Microsoft.EntityFrameworkCore`, or `Microsoft.Data.SqlClient`.
- **REQ-CFG-006 (Application Layer Decoupling)**: When automated architecture tests execute, the test suite shall assert that `NainConfigurator.Application` has zero dependencies on `NainConfigurator.Infrastructure`, `NainConfigurator.PublicHost`, or hosting packages.
- **REQ-CFG-007 (Infrastructure Boundary Guard)**: When automated architecture tests execute, the test suite shall assert that `NainConfigurator.Infrastructure` has zero dependencies on `NainConfigurator.PublicHost` or presentation projects.

## 3. Web & Operational Requirements

- **REQ-CFG-008 (Offline Demo Resilience)**: When running without an active backend API, the client application in `web/` shall load the bundled synthetic catalog (`offline-catalog.json`), supporting real-time option selection, visual pack rendering, and local pricing.
- **REQ-CFG-009 (Strict Port Governance)**: When running in local development mode, the web client shall bind strictly to port `5180` with `strictPort: true` to prevent collision with other suite applications.
- **REQ-CFG-010 (Accessibility Conformance)**: The web client shall conform to WCAG 2.2 AA standards, validated by automated axe checks in E2E journeys.
