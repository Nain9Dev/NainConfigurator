[CmdletBinding()]
param(
    [switch] $ConfirmSyntheticDatabaseReset
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..")
)
$toolRoot = Join-Path $repositoryRoot ".tools"
$dotnetDirectory = Join-Path $toolRoot "dotnet-sdk-10.0.302-win-x64"
$nodeDirectory = Join-Path $toolRoot "node-v24.18.0-win-x64"
$gitleaksDirectory = Join-Path $toolRoot "gitleaks-8.30.0"
$dotnetExecutable = Join-Path $dotnetDirectory "dotnet.exe"
$npmExecutable = Join-Path $nodeDirectory "npm.cmd"
$gitleaksExecutable = Join-Path $gitleaksDirectory "gitleaks.exe"
$solution = Join-Path $repositoryRoot "NainConfigurator.slnx"
$migratorProject = Join-Path $repositoryRoot `
    "backend\src\NainConfigurator.DatabaseMigrator\NainConfigurator.DatabaseMigrator.csproj"
$catalogPath = Join-Path $repositoryRoot `
    "database\demo\technical-demo-catalogs.json"
$releaseRoot = Join-Path $repositoryRoot `
    "artifacts\release\sl-009-localdemo"
$evidenceDirectory = Join-Path $repositoryRoot "artifacts\evidence"
$evidencePath = Join-Path $evidenceDirectory `
    "sl-009-technical-demo-candidate.json"
$integrationConnection =
    "Server=.\NAINCONFIGURATOR;" +
    "Database=NainConfigurator_Integration;" +
    "Integrated Security=True;" +
    "Encrypt=True;" +
    "TrustServerCertificate=True;" +
    "Application Name=NainConfigurator.TechnicalDemoQuality;" +
    "Connect Timeout=15;"
$startedAt = [DateTimeOffset]::UtcNow

foreach ($requiredTool in @(
        $dotnetExecutable,
        $npmExecutable,
        $gitleaksExecutable
    )) {
    if (-not (Test-Path -LiteralPath $requiredTool)) {
        throw "Run eng/scripts/Install-LocalTools.ps1 first. Missing $requiredTool."
    }
}

if (-not $ConfirmSyntheticDatabaseReset) {
    throw (
        "Pass -ConfirmSyntheticDatabaseReset to recreate only " +
        "NainConfigurator_Integration and NainConfigurator_Demo."
    )
}

$env:DOTNET_ROOT = $dotnetDirectory
$env:DOTNET_CLI_HOME = Join-Path $toolRoot "dotnet-home"
$env:NUGET_PACKAGES = Join-Path $toolRoot "nuget-packages"
$env:APPDATA = Join-Path $toolRoot "appdata"
$env:NPM_CONFIG_CACHE = Join-Path $toolRoot "npm-cache"
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $toolRoot `
    "playwright-browsers"
$env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
$env:NAINCONFIGURATOR_SQL_CONNECTION = $integrationConnection
$env:NAINCONFIGURATOR_ALLOW_DATABASE_RESET = "true"
$env:PATH = "$nodeDirectory;$dotnetDirectory;$env:PATH"

New-Item -ItemType Directory -Path $evidenceDirectory -Force |
    Out-Null
New-Item -ItemType Directory -Path (
    Join-Path $repositoryRoot "artifacts\security"
) -Force |
    Out-Null
New-Item -ItemType Directory -Path $env:APPDATA -Force |
    Out-Null
New-Item -ItemType Directory -Path $env:NPM_CONFIG_CACHE -Force |
    Out-Null

$sourceRevision = (& git -C $repositoryRoot rev-parse HEAD).Trim()
$sourceStatus = (
    & git -C $repositoryRoot status --porcelain --untracked-files=all
) -join "`n"
$sourceTree = if ([string]::IsNullOrWhiteSpace($sourceStatus)) {
    "Clean"
} else {
    "Dirty"
}

function Invoke-QualityStep {
    param(
        [Parameter(Mandatory)]
        [string] $Name,

        [Parameter(Mandatory)]
        [scriptblock] $Action
    )

    Write-Host "Running $Name"
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

Push-Location $repositoryRoot
try {
    Invoke-QualityStep "dotnet tool restore" {
        & $dotnetExecutable tool restore `
            --configfile (Join-Path $repositoryRoot "NuGet.Config")
    }
    Invoke-QualityStep "dotnet locked restore" {
        & $dotnetExecutable restore $solution `
            --locked-mode `
            --configfile (Join-Path $repositoryRoot "NuGet.Config")
    }
    Invoke-QualityStep "dotnet format verification" {
        & $dotnetExecutable format $solution `
            --verify-no-changes `
            --no-restore
    }
    Invoke-QualityStep "release build" {
        & $dotnetExecutable build $solution `
            --configuration Release `
            --no-restore
    }
    Invoke-QualityStep "integration database reset and seed" {
        & $dotnetExecutable run `
            --project $migratorProject `
            --configuration Release `
            --no-build `
            --no-restore `
            -- `
            --reset `
            --catalog $catalogPath
    }
    Invoke-QualityStep "complete .NET test suite" {
        & $dotnetExecutable test $solution `
            --configuration Release `
            --no-build `
            --no-restore
    }

    Push-Location (Join-Path $repositoryRoot "web")
    try {
        Invoke-QualityStep "npm clean install" {
            & $npmExecutable ci
        }
        Invoke-QualityStep "frontend formatting" {
            & $npmExecutable run format:check
        }
        Invoke-QualityStep "frontend production build" {
            & $npmExecutable run build
        }
        Invoke-QualityStep "frontend component tests" {
            & $npmExecutable run test
        }
        Invoke-QualityStep "frontend dependency audit" {
            & $npmExecutable run audit
        }
        Invoke-QualityStep "cross-browser technical-demo journeys" {
            & $npmExecutable run test:e2e
        }
    }
    finally {
        Pop-Location
    }

    Invoke-QualityStep "secret scan" {
        & $gitleaksExecutable dir . `
            --config ".gitleaks.toml" `
            --no-banner `
            --redact `
            --report-format "sarif" `
            --report-path "artifacts/security/gitleaks-sl009.sarif"
    }

    Invoke-QualityStep "LocalDemo candidate build" {
        & (Join-Path $repositoryRoot `
            "ops\local-demo\Build-LocalDemo.ps1")
    }
    Invoke-QualityStep "LocalDemo synthetic reset" {
        & (Join-Path $releaseRoot `
            "scripts\Reset-LocalDemo.ps1") `
            -ConfirmSyntheticReset
    }

    $localDemoStarted = $false
    try {
        Invoke-QualityStep "LocalDemo start" {
            & (Join-Path $releaseRoot `
                "scripts\Start-LocalDemo.ps1")
        }
        $localDemoStarted = $true
        Invoke-QualityStep "LocalDemo end-to-end smoke" {
            & (Join-Path $releaseRoot `
                "scripts\Invoke-LocalDemoSmoke.ps1")
        }
    }
    finally {
        if ($localDemoStarted) {
            & (Join-Path $releaseRoot `
                "scripts\Stop-LocalDemo.ps1")
        }
    }

    Invoke-QualityStep "release manifest verification" {
        & (Join-Path $releaseRoot `
            "scripts\Test-LocalDemoManifest.ps1")
    }

    $releaseManifestHash = (
        Get-FileHash `
            -LiteralPath (
                Join-Path $releaseRoot "release-manifest.sha256"
            ) `
            -Algorithm SHA256
    ).Hash.ToLowerInvariant()

    $evidence = [ordered]@{
        schemaVersion = 1
        sliceRange = "SL-001 through SL-009"
        readiness = "Technical demo candidate"
        startedAtUtc = $startedAt.ToString("O")
        completedAtUtc = [DateTimeOffset]::UtcNow.ToString("O")
        sourceRevision = $sourceRevision
        sourceTree = $sourceTree
        dotnetSdk = (& $dotnetExecutable --version).Trim()
        node = (& (Join-Path $nodeDirectory "node.exe") `
            --version).Trim()
        npm = (& $npmExecutable --version).Trim()
        sqlServerTarget = "SQL Server 2025 Developer"
        lockedRestore = "Passed"
        format = "Passed"
        build = "Passed"
        dotnetTests = "Passed"
        frontendComponentTests = "Passed"
        crossBrowserJourneys = "Passed"
        automatedAccessibility = "Passed"
        dependencyAudit = "Passed"
        secretScan = "Passed"
        localDemoSmoke = "Passed"
        releaseManifest = "Passed"
        releaseManifestSha256 = $releaseManifestHash
        secondProductThroughDataOnly = "Passed"
        containsRealData = $false
        externalNotification = $false
        recurringSoftwareOrCloudCostEur = 0
        manualScreenReaderReview = "Pending"
        cleanControlledMachineOfflineRun = "Pending"
        immutableCommittedSource = if ($sourceTree -eq "Clean") {
            "Verified"
        } else {
            "Pending authorized commit and clean-checkout rerun"
        }
    }

    $evidence |
        ConvertTo-Json -Depth 5 |
        Set-Content -LiteralPath $evidencePath -Encoding utf8

    Write-Host "Technical-demo evidence written to $evidencePath"
}
finally {
    Pop-Location
}
