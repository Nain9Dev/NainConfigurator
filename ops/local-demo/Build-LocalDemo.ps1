[CmdletBinding()]
param(
    [string] $ReleaseId = "0.1.0-sl009-candidate"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..")
)
$releaseRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $repositoryRoot "artifacts\release\sl-009-localdemo")
)
$artifactBoundary = [System.IO.Path]::GetFullPath(
    (Join-Path $repositoryRoot "artifacts")
) + [System.IO.Path]::DirectorySeparatorChar

if (-not $releaseRoot.StartsWith(
        $artifactBoundary,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
    throw "The release target is outside the repository artifact boundary."
}

$dotnetExecutable = Join-Path $repositoryRoot `
    ".tools\dotnet-sdk-10.0.302-win-x64\dotnet.exe"
$dotnet8RuntimeExecutable = Join-Path $repositoryRoot `
    ".tools\dotnet-runtime-8.0.29-win-x64\dotnet.exe"
$nodeDirectory = Join-Path $repositoryRoot `
    ".tools\node-v24.18.0-win-x64"
$npmExecutable = Join-Path $nodeDirectory "npm.cmd"

foreach ($requiredTool in @(
        $dotnetExecutable,
        $dotnet8RuntimeExecutable,
        $npmExecutable
    )) {
    if (-not (Test-Path -LiteralPath $requiredTool)) {
        throw "Missing required local tool: $requiredTool"
    }
}

if (Test-Path -LiteralPath $releaseRoot) {
    Remove-Item -LiteralPath $releaseRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
$toolRoot = Join-Path $repositoryRoot ".tools"
$env:DOTNET_ROOT = Split-Path -Parent $dotnetExecutable
$env:DOTNET_CLI_HOME = Join-Path $toolRoot "dotnet-home"
$env:NUGET_PACKAGES = Join-Path $toolRoot "nuget-packages"
$env:APPDATA = Join-Path $toolRoot "appdata"
$env:NPM_CONFIG_CACHE = Join-Path $toolRoot "npm-cache"
$env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
$env:PATH = "$nodeDirectory;$env:DOTNET_ROOT;$env:PATH"

New-Item -ItemType Directory -Path $env:APPDATA -Force | Out-Null
New-Item -ItemType Directory -Path $env:NPM_CONFIG_CACHE -Force |
    Out-Null

& $dotnetExecutable tool restore `
    --configfile (Join-Path $repositoryRoot "NuGet.Config")
if ($LASTEXITCODE -ne 0) {
    throw ".NET tool restore failed."
}

Push-Location (Join-Path $repositoryRoot "web")
try {
    & $npmExecutable ci
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend locked restore failed."
    }

    & $npmExecutable run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend production build failed."
    }
}
finally {
    Pop-Location
}

& $dotnetExecutable restore `
    (Join-Path $repositoryRoot "NainConfigurator.slnx") `
    --locked-mode `
    --configfile (Join-Path $repositoryRoot "NuGet.Config")
if ($LASTEXITCODE -ne 0) {
    throw ".NET locked restore failed."
}

& $dotnetExecutable publish `
    (Join-Path $repositoryRoot `
        "backend\src\NainConfigurator.PublicHost\NainConfigurator.PublicHost.csproj") `
    --configuration Release `
    --no-restore `
    --output (Join-Path $releaseRoot "host")
if ($LASTEXITCODE -ne 0) {
    throw "Public host publish failed."
}

& $dotnetExecutable publish `
    (Join-Path $repositoryRoot `
        "backend\src\NainConfigurator.DatabaseMigrator\NainConfigurator.DatabaseMigrator.csproj") `
    --configuration Release `
    --no-restore `
    --output (Join-Path $releaseRoot "database")
if ($LASTEXITCODE -ne 0) {
    throw "Database migrator publish failed."
}

$scriptTarget = New-Item -ItemType Directory `
    -Path (Join-Path $releaseRoot "scripts") `
    -Force

foreach ($scriptName in @(
        "Reset-LocalDemo.ps1",
        "Start-LocalDemo.ps1",
        "Stop-LocalDemo.ps1",
        "Invoke-LocalDemoSmoke.ps1",
        "Test-LocalDemoManifest.ps1"
    )) {
    Copy-Item `
        -LiteralPath (Join-Path $PSScriptRoot $scriptName) `
        -Destination $scriptTarget.FullName
}

Copy-Item `
    -LiteralPath (Join-Path $PSScriptRoot "README.md") `
    -Destination (Join-Path $releaseRoot "README.md")
Copy-Item `
    -LiteralPath (Join-Path $PSScriptRoot `
        "Manual-AcceptanceChecklist.md") `
    -Destination (Join-Path $releaseRoot `
        "Manual-AcceptanceChecklist.md")
Copy-Item `
    -LiteralPath (Join-Path $repositoryRoot `
        "eng\third-party\approved-direct-dependencies.json") `
    -Destination (Join-Path $releaseRoot "approved-direct-dependencies.json")

$sourceRevision = (& git -C $repositoryRoot rev-parse HEAD).Trim()
$sourceStatus = (& git -C $repositoryRoot status --porcelain) -join "`n"
$releaseMetadata = [ordered]@{
    schemaVersion = 1
    releaseId = $ReleaseId
    profile = "LocalDemo"
    readiness = "Technical demo candidate"
    generatedAtUtc = [DateTimeOffset]::UtcNow.ToString("O")
    sourceRevision = $sourceRevision
    sourceTree = if ([string]::IsNullOrWhiteSpace($sourceStatus)) {
        "Clean"
    } else {
        "Dirty"
    }
    containsRealData = $false
    externalNotification = $false
    recurringSoftwareOrCloudCostEur = 0
    renderer = "Deferred optional SL-007; accessible fallback included"
}
$releaseMetadata |
    ConvertTo-Json -Depth 4 |
    Set-Content `
        -LiteralPath (Join-Path $releaseRoot "release.json") `
        -Encoding utf8

$sbomToolAssembly = Join-Path `
    $env:NUGET_PACKAGES `
    "microsoft.sbom.dotnettool\4.1.5\tools\net8.0\any\Microsoft.Sbom.DotNetTool.dll"
$env:DeleteManifestDirIfPresent = "true"

& $dotnet8RuntimeExecutable $sbomToolAssembly generate `
    -b $releaseRoot `
    -bc $repositoryRoot `
    -pn "NainConfigurator LocalDemo" `
    -pv $ReleaseId `
    -ps "Nain9Dev" `
    -nsb "https://github.com/Nain9Dev/NainConfigurator"
if ($LASTEXITCODE -ne 0) {
    throw "LocalDemo SBOM generation failed."
}

$sbomPath = Join-Path $releaseRoot `
    "_manifest\spdx_2.2\manifest.spdx.json"
$sbomHashPath = "$sbomPath.sha256"
if (-not (Test-Path -LiteralPath $sbomPath) -or
    -not (Test-Path -LiteralPath $sbomHashPath)) {
    throw "LocalDemo SBOM generation produced no verifiable manifest."
}

$expectedSbomHash = (
    Get-Content -LiteralPath $sbomHashPath -Raw
).Trim()
$actualSbomHash = (
    Get-FileHash -LiteralPath $sbomPath -Algorithm SHA256
).Hash
if (-not [string]::Equals(
        $actualSbomHash,
        $expectedSbomHash,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
    throw "LocalDemo SBOM integrity verification failed."
}

$manifestPath = Join-Path $releaseRoot "release-manifest.sha256"
$manifestLines = Get-ChildItem -LiteralPath $releaseRoot -Recurse -File |
    Where-Object { $_.FullName -ne $manifestPath } |
    Sort-Object FullName |
    ForEach-Object {
        $relativePath = (
            $_.FullName.Substring($releaseRoot.Length + 1)
        ).Replace("\", "/")
        $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
        "$($hash.ToLowerInvariant())  $relativePath"
    }
$manifestLines |
    Set-Content -LiteralPath $manifestPath -Encoding ascii

Write-Host "LocalDemo candidate created at $releaseRoot"
