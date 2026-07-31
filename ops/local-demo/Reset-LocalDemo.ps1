[CmdletBinding()]
param(
    [switch] $ConfirmSyntheticReset
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $ConfirmSyntheticReset) {
    throw "Pass -ConfirmSyntheticReset to recreate only NainConfigurator_Demo."
}

$releaseRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..")
)
$migrator = Join-Path $releaseRoot `
    "database\NainConfigurator.DatabaseMigrator.exe"

if (-not (Test-Path -LiteralPath $migrator)) {
    throw "The packaged database migrator is missing."
}

$connectionString =
    "Server=.\NAINCONFIGURATOR;" +
    "Database=NainConfigurator_Demo;" +
    "Integrated Security=True;" +
    "Encrypt=True;" +
    "TrustServerCertificate=True;" +
    "Application Name=NainConfigurator.LocalDemo.Reset;" +
    "Connect Timeout=15;"
$previousConnection = [Environment]::GetEnvironmentVariable(
    "NAINCONFIGURATOR_SQL_CONNECTION",
    "Process"
)
$previousAuthorization = [Environment]::GetEnvironmentVariable(
    "NAINCONFIGURATOR_ALLOW_DATABASE_RESET",
    "Process"
)

try {
    [Environment]::SetEnvironmentVariable(
        "NAINCONFIGURATOR_SQL_CONNECTION",
        $connectionString,
        "Process"
    )
    [Environment]::SetEnvironmentVariable(
        "NAINCONFIGURATOR_ALLOW_DATABASE_RESET",
        "true",
        "Process"
    )

    & $migrator --reset
    if ($LASTEXITCODE -ne 0) {
        throw "The synthetic LocalDemo database reset failed."
    }
}
finally {
    [Environment]::SetEnvironmentVariable(
        "NAINCONFIGURATOR_SQL_CONNECTION",
        $previousConnection,
        "Process"
    )
    [Environment]::SetEnvironmentVariable(
        "NAINCONFIGURATOR_ALLOW_DATABASE_RESET",
        $previousAuthorization,
        "Process"
    )
}
