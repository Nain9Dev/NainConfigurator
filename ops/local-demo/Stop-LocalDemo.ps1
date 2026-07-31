[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$releaseRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..")
)
$pidPath = Join-Path $releaseRoot "runtime\public-host.pid"

if (-not (Test-Path -LiteralPath $pidPath)) {
    Write-Host "LocalDemo is not running."
    return
}

[int] $hostProcessId = Get-Content -LiteralPath $pidPath
$hostProcess = Get-Process `
    -Id $hostProcessId `
    -ErrorAction SilentlyContinue

if ($null -ne $hostProcess) {
    if ($hostProcess.ProcessName -ne "NainConfigurator.PublicHost") {
        throw "The recorded process is not the packaged LocalDemo host."
    }

    Stop-Process -Id $hostProcessId
    Wait-Process -Id $hostProcessId -Timeout 10 -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath $pidPath -Force
Write-Host "LocalDemo stopped."
