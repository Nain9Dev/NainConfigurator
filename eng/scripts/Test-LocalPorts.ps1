<#
.SYNOPSIS
    Reports whether this repository's reserved local ports are free.

.DESCRIPTION
    Two checkouts that both grab Vite's default 5173 do not just collide on the
    socket. They share a browser origin, which means they share localStorage,
    sessionStorage, service workers and cookies, and one project silently
    overwrites the other's state.

    This project therefore reserves a contiguous port block and a dedicated
    *.localhost hostname, both declared in eng/local-development.json. Run this
    before starting anything to see what is already listening, and which process
    owns it.

.PARAMETER Fix
    Prints the command that would stop each conflicting process. It never stops
    anything by itself.

.EXAMPLE
    .\eng\scripts\Test-LocalPorts.ps1
.EXAMPLE
    .\eng\scripts\Test-LocalPorts.ps1 -Fix
#>
[CmdletBinding()]
param(
    [switch] $Fix
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..")
)
$manifestPath = Join-Path $repositoryRoot "eng\local-development.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Missing $manifestPath."
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

Write-Host ""
Write-Host "$($manifest.project) - reserved local ports" -ForegroundColor Cyan
Write-Host "Block $($manifest.portBlock.start)-$($manifest.portBlock.end) on $($manifest.hostname) ($($manifest.loopbackAddress))"
Write-Host ""

function Get-PortOwner {
    param([int] $Port)

    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen `
        -ErrorAction SilentlyContinue

    if ($null -eq $connections) {
        return $null
    }

    $owningProcessId = @($connections)[0].OwningProcess
    $process = Get-Process -Id $owningProcessId -ErrorAction SilentlyContinue

    return [pscustomobject]@{
        ProcessId = $owningProcessId
        Name      = if ($process) { $process.ProcessName } else { "unknown" }
        Path      = if ($process) { $process.Path } else { $null }
    }
}

$conflicts = @()

foreach ($service in $manifest.services) {
    $overridden = [Environment]::GetEnvironmentVariable(
        $service.environmentVariable
    )
    $port = if ([string]::IsNullOrWhiteSpace($overridden)) {
        [int] $service.port
    } else {
        [int] $overridden
    }

    $owner = Get-PortOwner -Port $port

    if ($null -eq $owner) {
        Write-Host ("  {0,-5} {1,-16} free" -f $port, $service.name) `
            -ForegroundColor Green
        continue
    }

    $conflicts += [pscustomobject]@{
        Port      = $port
        Service   = $service.name
        ProcessId = $owner.ProcessId
        Name      = $owner.Name
        Path      = $owner.Path
    }

    Write-Host (
        "  {0,-5} {1,-16} IN USE by {2} (pid {3})" -f
        $port, $service.name, $owner.Name, $owner.ProcessId
    ) -ForegroundColor Yellow
}

Write-Host ""

if ($conflicts.Count -eq 0) {
    Write-Host "Every reserved port is free." -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "$($conflicts.Count) port(s) already in use." -ForegroundColor Yellow

foreach ($conflict in $conflicts) {
    if ($conflict.Path) {
        Write-Host "  $($conflict.Port): $($conflict.Path)"
    }
}

if ($Fix) {
    Write-Host ""
    Write-Host "To free them, review each process first, then run:"
    foreach ($conflict in $conflicts) {
        Write-Host "  Stop-Process -Id $($conflict.ProcessId)  # $($conflict.Name) on $($conflict.Port)"
    }
    Write-Host ""
    Write-Host "Alternatively, override the port for this shell only:"
    foreach ($conflict in $conflicts) {
        $service = $manifest.services |
            Where-Object { $_.name -eq $conflict.Service }
        Write-Host "  `$env:$($service.environmentVariable) = '<free port>'"
    }
} else {
    Write-Host "Re-run with -Fix to see how to free or override them."
}

Write-Host ""
exit 1
