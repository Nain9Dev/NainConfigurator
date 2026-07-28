[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:NAINCONFIGURATOR_SQL_CONNECTION)) {
    throw "NAINCONFIGURATOR_SQL_CONNECTION must target SQL Server 2025 Developer."
}

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..")
)
$dotnetExecutable = Join-Path $repositoryRoot ".tools\dotnet-sdk-10.0.302-win-x64\dotnet.exe"
$env:DOTNET_ROOT = Split-Path -Parent $dotnetExecutable
$env:DOTNET_CLI_HOME = Join-Path $repositoryRoot ".tools\dotnet-home"
$env:NUGET_PACKAGES = Join-Path $repositoryRoot ".tools\nuget-packages"
$env:APPDATA = Join-Path $repositoryRoot ".tools\appdata"
$env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"

if (-not (Test-Path -LiteralPath $dotnetExecutable)) {
    throw "Run eng/scripts/Install-LocalTools.ps1 first."
}

Push-Location $repositoryRoot
try {
    & $dotnetExecutable test `
        --project "backend/tests/NainConfigurator.Database.IntegrationTests/NainConfigurator.Database.IntegrationTests.csproj" `
        --configuration Release `
        --no-restore `
        --filter-trait "Category=SqlServer" `
        --minimum-expected-tests 1 `
        --report-xunit-trx `
        --report-xunit-trx-filename "sql-server-connectivity.trx" `
        --results-directory "artifacts/test-results/sql-server"

    $testExitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($testExitCode -ne 0) {
    throw "SQL Server connectivity verification failed."
}
