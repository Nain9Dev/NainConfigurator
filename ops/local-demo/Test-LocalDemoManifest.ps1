[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$releaseRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..")
)
$releaseBoundary = $releaseRoot +
    [System.IO.Path]::DirectorySeparatorChar
$manifestPath = Join-Path $releaseRoot "release-manifest.sha256"

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "The LocalDemo release manifest is missing."
}

$entryCount = 0
foreach ($line in Get-Content -LiteralPath $manifestPath) {
    if ($line -notmatch "^([0-9a-f]{64})  (.+)$") {
        throw "The LocalDemo release manifest contains an invalid entry."
    }

    $expectedHash = $Matches[1]
    $relativePath = $Matches[2].Replace(
        "/",
        [System.IO.Path]::DirectorySeparatorChar
    )
    $targetPath = [System.IO.Path]::GetFullPath(
        (Join-Path $releaseRoot $relativePath)
    )

    if (-not $targetPath.StartsWith(
            $releaseBoundary,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        throw "The LocalDemo release manifest escapes its package boundary."
    }
    if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
        throw "The LocalDemo package file is missing: $relativePath"
    }

    $actualHash = (
        Get-FileHash -LiteralPath $targetPath -Algorithm SHA256
    ).Hash
    if (-not [string]::Equals(
            $actualHash,
            $expectedHash,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        throw "The LocalDemo package integrity check failed: $relativePath"
    }

    $entryCount++
}

if ($entryCount -eq 0) {
    throw "The LocalDemo release manifest is empty."
}

Write-Host "LocalDemo manifest verified: $entryCount files."
