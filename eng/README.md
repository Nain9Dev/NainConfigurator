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

## Engineering-baseline pipeline

```powershell
.\eng\scripts\Invoke-Quality.ps1
```

This preserves the original SL-000 engineering-baseline evidence. It is not the release gate for the implemented Technical Demo.

## Technical Demo quality gate

```powershell
.\eng\scripts\Invoke-TechnicalDemoQuality.ps1 -ConfirmSyntheticDatabaseReset
```

The command restores locked dependencies, verifies formatting, builds the complete solution, recreates only the allowlisted synthetic Integration and Demo databases, applies the real SQL Server migration and fixtures, runs all .NET and frontend tests, executes Chromium/Firefox/WebKit/mobile journeys with axe, audits dependencies, scans secrets, packages LocalDemo, generates its SBOM and hashes, and runs its end-to-end smoke test.

The generated evidence remains a `Technical demo candidate` while the source tree is dirty or the manual screen-reader and clean controlled-machine offline checks are pending.

## SQL Server connectivity

Set a machine-local connection string that targets SQL Server 2025 Developer, then run:

```powershell
$env:NAINCONFIGURATOR_SQL_CONNECTION = "<machine-local connection string>"
.\eng\scripts\Invoke-SqlServerConnectivity.ps1
```

Never commit that value. This separate command ensures SQL Server evidence cannot be confused with unit evidence. SL-000 creates no database, migration or domain table.
