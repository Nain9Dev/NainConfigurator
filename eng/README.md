# Engineering baseline

SL-000 uses repository-local, integrity-checked tools. It does not require administrator rights, Docker Desktop, a cloud account, a payment card or a paid service.

## Prerequisites

- Windows PowerShell 5.1 or PowerShell 7.
- Git.
- Internet access only for the initial official tool and package downloads.
- SQL Server 2025 Developer is a separate non-production prerequisite for the explicit SQL connectivity check.

## Bootstrap

```powershell
.\eng\scripts\Install-LocalTools.ps1
```

The script downloads exact official archives into the ignored `.tools` directory and verifies their published hashes before extraction. The application targets .NET 10. A separate portable .NET 8 LTS runtime is present only because Microsoft SBOM Tool 4.1.5 currently targets .NET 8.

## Deterministic quality pipeline

```powershell
.\eng\scripts\Invoke-Quality.ps1
```

The pipeline restores locked dependencies, applies analyzers and formatting, builds the three hosts and Web shell, runs the implemented baseline tests, audits frontend dependencies, scans the working tree for secrets, publishes one local release boundary and generates an SBOM plus a sanitized evidence manifest under ignored `artifacts`.

The Vitest command explicitly permits no Web tests in SL-000 because no Web behavior exists yet. It must not be reported as functional coverage.

## SQL Server connectivity

Set a machine-local connection string that targets SQL Server 2025 Developer, then run:

```powershell
$env:NAINCONFIGURATOR_SQL_CONNECTION = "<machine-local connection string>"
.\eng\scripts\Invoke-SqlServerConnectivity.ps1
```

Never commit that value. This separate command ensures SQL Server evidence cannot be confused with unit evidence. SL-000 creates no database, migration or domain table.
