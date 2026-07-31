[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..")
)
$toolRoot = Join-Path $repositoryRoot ".tools"
$dotnetDirectory = Join-Path $toolRoot "dotnet-sdk-10.0.302-win-x64"
$dotnet8RuntimeDirectory = Join-Path $toolRoot "dotnet-runtime-8.0.29-win-x64"
$nodeDirectory = Join-Path $toolRoot "node-v24.18.0-win-x64"
$gitleaksDirectory = Join-Path $toolRoot "gitleaks-8.30.0"
$dotnetExecutable = Join-Path $dotnetDirectory "dotnet.exe"
$dotnet8RuntimeExecutable = Join-Path $dotnet8RuntimeDirectory "dotnet.exe"
$npmExecutable = Join-Path $nodeDirectory "npm.cmd"
$gitleaksExecutable = Join-Path $gitleaksDirectory "gitleaks.exe"
$solution = Join-Path $repositoryRoot "NainConfigurator.slnx"
$artifactRoot = Join-Path $repositoryRoot "artifacts"
$releaseRoot = Join-Path $artifactRoot "release\sl-000-local"
$evidenceDirectory = Join-Path $artifactRoot "evidence"
$evidencePath = Join-Path $evidenceDirectory "sl-000-evidence.json"
$startedAt = [DateTimeOffset]::UtcNow

foreach ($requiredTool in @(
        $dotnetExecutable,
        $dotnet8RuntimeExecutable,
        $npmExecutable,
        $gitleaksExecutable
    )) {
    if (-not (Test-Path -LiteralPath $requiredTool)) {
        throw "Run eng/scripts/Install-LocalTools.ps1 first. Missing $requiredTool."
    }
}

$env:DOTNET_ROOT = $dotnetDirectory
$env:DOTNET_CLI_HOME = Join-Path $toolRoot "dotnet-home"
$env:NUGET_PACKAGES = Join-Path $toolRoot "nuget-packages"
$env:APPDATA = Join-Path $toolRoot "appdata"
$env:NPM_CONFIG_CACHE = Join-Path $toolRoot "npm-cache"
$env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
$env:PATH = "$nodeDirectory;$dotnetDirectory;$env:PATH"

New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
New-Item -ItemType Directory -Path $evidenceDirectory -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $artifactRoot "security") -Force | Out-Null
New-Item -ItemType Directory -Path $env:APPDATA -Force | Out-Null
New-Item -ItemType Directory -Path $env:NPM_CONFIG_CACHE -Force | Out-Null

$sourceRevision = (& git -C $repositoryRoot rev-parse HEAD).Trim()
$sourceStatus = (& git -C $repositoryRoot status --porcelain --untracked-files=all) -join "`n"
$cleanCheckout = if ([string]::IsNullOrWhiteSpace($sourceStatus)) {
    "Verified"
} else {
    "Not verified; tracked or untracked source changes were present"
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
    Invoke-QualityStep "dotnet format" {
        & $dotnetExecutable format $solution --verify-no-changes --no-restore
    }
    Invoke-QualityStep "dotnet build" {
        & $dotnetExecutable build $solution --configuration Release --no-restore
    }
    Invoke-QualityStep "baseline tests" {
        & $dotnetExecutable test `
            --project "backend/tests/NainConfigurator.Baseline.Tests/NainConfigurator.Baseline.Tests.csproj" `
            --configuration Release `
            --no-build `
            --no-restore `
            --results-directory "artifacts/test-results/baseline" `
            --minimum-expected-tests 2 `
            --report-xunit-trx `
            --report-xunit-trx-filename "baseline.trx"
    }

    Push-Location (Join-Path $repositoryRoot "web")
    try {
        Invoke-QualityStep "npm clean install" {
            & $npmExecutable ci
        }
        Invoke-QualityStep "frontend formatting" {
            & $npmExecutable run format:check
        }
        Invoke-QualityStep "frontend build" {
            & $npmExecutable run build
        }
        Invoke-QualityStep "frontend tests" {
            & $npmExecutable run test
        }
        Invoke-QualityStep "frontend vulnerability audit" {
            & $npmExecutable run audit
        }
    }
    finally {
        Pop-Location
    }

    foreach ($hostName in @(
            "NainConfigurator.PublicHost",
            "NainConfigurator.OperationsHost",
            "NainConfigurator.Worker"
        )) {
        Invoke-QualityStep "publish $hostName" {
            & $dotnetExecutable publish `
                "backend/src/$hostName/$hostName.csproj" `
                --configuration Release `
                --no-restore `
                --output (Join-Path $releaseRoot $hostName)
        }
    }

    Copy-Item `
        -Path (Join-Path $repositoryRoot "web\dist\*") `
        -Destination (New-Item -ItemType Directory -Path (Join-Path $releaseRoot "web") -Force) `
        -Recurse `
        -Force

    Invoke-QualityStep "secret scan" {
        & $gitleaksExecutable dir . `
            --config ".gitleaks.toml" `
            --no-banner `
            --redact `
            --report-format "sarif" `
            --report-path "artifacts/security/gitleaks.sarif"
    }

    Invoke-QualityStep "SBOM generation" {
        $sbomToolAssembly = Join-Path `
            $env:NUGET_PACKAGES `
            "microsoft.sbom.dotnettool\4.1.5\tools\net8.0\any\Microsoft.Sbom.DotNetTool.dll"
        $env:DeleteManifestDirIfPresent = "true"

        & $dotnet8RuntimeExecutable $sbomToolAssembly generate `
            -b $releaseRoot `
            -bc $repositoryRoot `
            -pn "NainConfigurator" `
            -pv "0.1.0-sl000" `
            -ps "Nain9Dev" `
            -nsb "https://github.com/Nain9Dev/NainConfigurator"

        $sbomPath = Join-Path $releaseRoot "_manifest\spdx_2.2\manifest.spdx.json"
        $sbomHashPath = "$sbomPath.sha256"

        if (-not (Test-Path -LiteralPath $sbomPath) -or
            -not (Test-Path -LiteralPath $sbomHashPath)) {
            throw "SBOM generation did not produce a manifest and hash."
        }

        $expectedSbomHash = (Get-Content -LiteralPath $sbomHashPath -Raw).Trim()
        $actualSbomHash = (Get-FileHash -LiteralPath $sbomPath -Algorithm SHA256).Hash

        if (-not [string]::Equals(
                $actualSbomHash,
                $expectedSbomHash,
                [System.StringComparison]::OrdinalIgnoreCase
            )) {
            throw "SBOM integrity verification failed."
        }
    }

    $evidence = [ordered]@{
        schemaVersion = 1
        sliceId = "SL-000"
        startedAtUtc = $startedAt.ToString("O")
        completedAtUtc = [DateTimeOffset]::UtcNow.ToString("O")
        releaseId = "0.1.0-sl000"
        sourceRevision = $sourceRevision
        cleanCheckout = $cleanCheckout
        dotnetSdk = (& $dotnetExecutable --version).Trim()
        node = (& (Join-Path $nodeDirectory "node.exe") --version).Trim()
        npm = (& $npmExecutable --version).Trim()
        gitleaks = (& $gitleaksExecutable version).Trim()
        build = "Passed"
        baselineTests = "Passed"
        frontendBuild = "Passed"
        frontendTestRunner = "Passed current frontend test suite"
        dependencyAudit = "Passed"
        secretScan = "Passed"
        sbom = "Generated"
        sqlServerConnectivity = "Not executed by the unit pipeline"
        containsRealData = $false
        recurringSoftwareOrCloudCostEur = 0
    }

    $evidence |
        ConvertTo-Json -Depth 4 |
        Set-Content -LiteralPath $evidencePath -Encoding utf8

    Write-Host "Quality evidence written to $evidencePath"
}
finally {
    Pop-Location
}
