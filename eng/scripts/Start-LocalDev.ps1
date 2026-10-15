<#
.SYNOPSIS
    Starts the development shell on this repository's reserved ports.

.DESCRIPTION
    Checks the reserved ports first, then starts Vite bound to the port declared
    in eng/local-development.json with strict binding, so it fails loudly rather
    than drifting onto a port another project is using.

    Open the printed *.localhost address rather than plain localhost. Browsers
    resolve any *.localhost name to the loopback address, and using a distinct
    name gives this project its own browser origin: its localStorage,
    sessionStorage, service workers and cookies can never be read or overwritten
    by another project running at the same time.

.PARAMETER WithApi
    Also starts the ASP.NET Core public host, so the shell runs against real
    SQL-backed validation instead of the in-browser offline backend. Requires a
    local SQL Server 2025 Developer instance named NAINCONFIGURATOR.

.PARAMETER SkipPortCheck
    Starts without checking for conflicts first.

.EXAMPLE
    .\eng\scripts\Start-LocalDev.ps1
.EXAMPLE
    .\eng\scripts\Start-LocalDev.ps1 -WithApi
#>
[CmdletBinding()]
param(
    [switch] $WithApi,
    [switch] $SkipPortCheck
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..")
)
$manifest = Get-Content -LiteralPath (
    Join-Path $repositoryRoot "eng\local-development.json"
) -Raw | ConvertFrom-Json

function Get-ServicePort {
    param([string] $Name)

    $service = $manifest.services | Where-Object { $_.name -eq $Name }

    if ($null -eq $service) {
        throw "Unknown service '$Name' in eng/local-development.json."
    }

    $overridden = [Environment]::GetEnvironmentVariable(
        $service.environmentVariable
    )

    if ([string]::IsNullOrWhiteSpace($overridden)) {
        return [int] $service.port
    }

    return [int] $overridden
}

if (-not $SkipPortCheck) {
    & (Join-Path $PSScriptRoot "Test-LocalPorts.ps1")

    if ($LASTEXITCODE -ne 0) {
        throw "Free the ports above, or override them, before starting."
    }
}

$webPort = Get-ServicePort -Name "web-dev"
$apiPort = Get-ServicePort -Name "public-api"
$hostname = $manifest.hostname

$apiProcess = $null

if ($WithApi) {
    Write-Host "Starting the public API on port $apiPort..." -ForegroundColor Cyan

    $apiProcess = Start-Process -PassThru -NoNewWindow -FilePath "dotnet" `
        -ArgumentList @(
            "run",
            "--project",
            (Join-Path $repositoryRoot `
                "backend\src\NainConfigurator.PublicHost\NainConfigurator.PublicHost.csproj"),
            "--no-launch-profile"
        ) `
        -Environment @{
            ASPNETCORE_URLS   = "http://127.0.0.1:$apiPort"
            DOTNET_ENVIRONMENT = "Development"
        }
}

Write-Host ""
Write-Host "NainConfigurator development shell" -ForegroundColor Cyan
Write-Host "  http://$hostname`:$webPort/    <- open this one"
Write-Host "  http://127.0.0.1:$webPort/"

if ($WithApi) {
    Write-Host "  API      http://127.0.0.1:$apiPort/health/ready"
} else {
    Write-Host "  No API: the shell runs in offline mode against the bundled catalog."
}

Write-Host ""

try {
    Push-Location (Join-Path $repositoryRoot "web")
    try {
        & npm run dev
    }
    finally {
        Pop-Location
    }
}
finally {
    if ($null -ne $apiProcess -and -not $apiProcess.HasExited) {
        Write-Host "Stopping the public API..."
        Stop-Process -Id $apiProcess.Id -ErrorAction SilentlyContinue
    }
}
