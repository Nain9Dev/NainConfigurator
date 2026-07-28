# Backend boundary

This directory contains the SL-000 .NET modular-monolith release boundary.

The implementation must follow the approved architecture:

- Product-agnostic Domain and Application behavior.
- Explicit use-case and transaction ownership.
- Public, Operations and Worker deployable hosts from one versioned codebase.
- No generic repository, speculative microservices or customer-specific forks.
- `NainConfigurator.PublicHost`, `NainConfigurator.OperationsHost` and `NainConfigurator.Worker` are separate compositions in one release.
- `NainConfigurator.Hosting` owns only shared host configuration and safe structured telemetry.
- No catalog, customer, product, persistence or public API behavior exists in SL-000.
