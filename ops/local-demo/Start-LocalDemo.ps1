[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$releaseRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..")
)
$hostDirectory = Join-Path $releaseRoot "host"
$hostExecutable = Join-Path $hostDirectory `
    "NainConfigurator.PublicHost.exe"
$runtimeDirectory = Join-Path $releaseRoot "runtime"
$pidPath = Join-Path $runtimeDirectory "public-host.pid"
$stdoutPath = Join-Path $runtimeDirectory "public-host.stdout.log"
$stderrPath = Join-Path $runtimeDirectory "public-host.stderr.log"

if (-not (Test-Path -LiteralPath $hostExecutable)) {
    throw "The packaged public host is missing."
}

& (Join-Path $PSScriptRoot "Test-LocalDemoManifest.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "The packaged LocalDemo integrity verification failed."
}

New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null

if (Test-Path -LiteralPath $pidPath) {
    [int] $existingProcessId = Get-Content -LiteralPath $pidPath
    if (Get-Process -Id $existingProcessId -ErrorAction SilentlyContinue) {
        throw "The LocalDemo host is already running."
    }
    Remove-Item -LiteralPath $pidPath -Force
}

$previousEnvironment = [Environment]::GetEnvironmentVariable(
    "DOTNET_ENVIRONMENT",
    "Process"
)
$previousUrls = [Environment]::GetEnvironmentVariable(
    "ASPNETCORE_URLS",
    "Process"
)

try {
    [Environment]::SetEnvironmentVariable(
        "DOTNET_ENVIRONMENT",
        "LocalDemo",
        "Process"
    )
    [Environment]::SetEnvironmentVariable(
        "ASPNETCORE_URLS",
        "http://127.0.0.1:5187",
        "Process"
    )

    $hostProcess = Start-Process `
        -FilePath $hostExecutable `
        -WorkingDirectory $hostDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -PassThru
}
finally {
    [Environment]::SetEnvironmentVariable(
        "DOTNET_ENVIRONMENT",
        $previousEnvironment,
        "Process"
    )
    [Environment]::SetEnvironmentVariable(
        "ASPNETCORE_URLS",
        $previousUrls,
        "Process"
    )
}

$hostProcess.Id |
    Set-Content -LiteralPath $pidPath -Encoding ascii

$ready = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        $response = Invoke-WebRequest `
            -Uri "http://127.0.0.1:5187/health/ready" `
            -UseBasicParsing `
            -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    }
    catch {
        Start-Sleep -Milliseconds 250
    }
}

if (-not $ready) {
    Stop-Process -Id $hostProcess.Id -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
    throw "The LocalDemo host did not become ready. Review the runtime logs."
}

Write-Host "LocalDemo is ready at http://127.0.0.1:5187/"
