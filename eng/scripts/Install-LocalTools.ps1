[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\..")
)
$toolRoot = Join-Path $repositoryRoot ".tools"

$dotnetVersion = "10.0.302"
$dotnetArchiveName = "dotnet-sdk-$dotnetVersion-win-x64.zip"
$dotnetArchive = Join-Path $toolRoot $dotnetArchiveName
$dotnetDirectory = Join-Path $toolRoot "dotnet-sdk-$dotnetVersion-win-x64"
$dotnetUri = "https://builds.dotnet.microsoft.com/dotnet/Sdk/$dotnetVersion/$dotnetArchiveName"
$dotnetSha512 = "7d170ed75fa9af34c00646621d92011dbd71943952e2787cd15df9be78e6452b55dadef34d7eff77b802e6af4959e071a55855ac649afeac70901c3a2a258716"

$dotnet8RuntimeVersion = "8.0.29"
$dotnet8RuntimeArchiveName = "dotnet-runtime-$dotnet8RuntimeVersion-win-x64.zip"
$dotnet8RuntimeArchive = Join-Path $toolRoot $dotnet8RuntimeArchiveName
$dotnet8RuntimeDirectory = Join-Path $toolRoot "dotnet-runtime-$dotnet8RuntimeVersion-win-x64"
$dotnet8RuntimeUri = "https://builds.dotnet.microsoft.com/dotnet/Runtime/$dotnet8RuntimeVersion/$dotnet8RuntimeArchiveName"
$dotnet8RuntimeSha512 = "e3f31d298a2b674b54c7fc89fb3f06d9645fc5879a54f2ebf2ea20e9ee7ae55f1bfe3284c1f90a591d6be2d6bcd251790ddc27771d65303e7a6a56d331df4632"

$nodeVersion = "24.18.0"
$nodeArchiveName = "node-v$nodeVersion-win-x64.zip"
$nodeArchive = Join-Path $toolRoot $nodeArchiveName
$nodeDirectory = Join-Path $toolRoot "node-v$nodeVersion-win-x64"
$nodeUri = "https://nodejs.org/dist/v$nodeVersion/$nodeArchiveName"
$nodeSha256 = "0ae68406b42d7725661da979b1403ec9926da205c6770827f33aac9d8f26e821"

$gitleaksVersion = "8.30.0"
$gitleaksArchiveName = "gitleaks_$($gitleaksVersion)_windows_x64.zip"
$gitleaksArchive = Join-Path $toolRoot $gitleaksArchiveName
$gitleaksDirectory = Join-Path $toolRoot "gitleaks-$gitleaksVersion"
$gitleaksUri = "https://github.com/gitleaks/gitleaks/releases/download/v$gitleaksVersion/$gitleaksArchiveName"
$gitleaksSha256 = "54fe94f644b832dd08e8c3a5915efb3bfa862386d59fb27ca0792cb687a83573"

function Get-VerifiedArchive {
    param(
        [Parameter(Mandatory)]
        [string] $Uri,

        [Parameter(Mandatory)]
        [string] $Path,

        [Parameter(Mandatory)]
        [string] $ExpectedHash,

        [Parameter(Mandatory)]
        [ValidateSet("SHA256", "SHA512")]
        [string] $Algorithm
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "Downloading $Uri"
        Invoke-WebRequest -Uri $Uri -OutFile $Path
    }

    $actualHash = (Get-FileHash -LiteralPath $Path -Algorithm $Algorithm).Hash
    if (-not [string]::Equals(
            $actualHash,
            $ExpectedHash,
            [System.StringComparison]::OrdinalIgnoreCase
        )) {
        throw "Integrity verification failed for $Path."
    }

    return $Path
}

New-Item -ItemType Directory -Path $toolRoot -Force | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $dotnetDirectory "dotnet.exe"))) {
    Get-VerifiedArchive `
        -Uri $dotnetUri `
        -Path $dotnetArchive `
        -ExpectedHash $dotnetSha512 `
        -Algorithm "SHA512" | Out-Null
    New-Item -ItemType Directory -Path $dotnetDirectory -Force | Out-Null
    Expand-Archive -LiteralPath $dotnetArchive -DestinationPath $dotnetDirectory
}

if (-not (Test-Path -LiteralPath (Join-Path $dotnet8RuntimeDirectory "dotnet.exe"))) {
    Get-VerifiedArchive `
        -Uri $dotnet8RuntimeUri `
        -Path $dotnet8RuntimeArchive `
        -ExpectedHash $dotnet8RuntimeSha512 `
        -Algorithm "SHA512" | Out-Null
    New-Item -ItemType Directory -Path $dotnet8RuntimeDirectory -Force | Out-Null
    Expand-Archive `
        -LiteralPath $dotnet8RuntimeArchive `
        -DestinationPath $dotnet8RuntimeDirectory
}

if (-not (Test-Path -LiteralPath (Join-Path $nodeDirectory "node.exe"))) {
    Get-VerifiedArchive `
        -Uri $nodeUri `
        -Path $nodeArchive `
        -ExpectedHash $nodeSha256 `
        -Algorithm "SHA256" | Out-Null
    Expand-Archive -LiteralPath $nodeArchive -DestinationPath $toolRoot
}

if (-not (Test-Path -LiteralPath (Join-Path $gitleaksDirectory "gitleaks.exe"))) {
    Get-VerifiedArchive `
        -Uri $gitleaksUri `
        -Path $gitleaksArchive `
        -ExpectedHash $gitleaksSha256 `
        -Algorithm "SHA256" | Out-Null
    New-Item -ItemType Directory -Path $gitleaksDirectory -Force | Out-Null
    Expand-Archive -LiteralPath $gitleaksArchive -DestinationPath $gitleaksDirectory
}

$dotnetExecutable = Join-Path $dotnetDirectory "dotnet.exe"
$dotnet8RuntimeExecutable = Join-Path $dotnet8RuntimeDirectory "dotnet.exe"
$nodeExecutable = Join-Path $nodeDirectory "node.exe"
$gitleaksExecutable = Join-Path $gitleaksDirectory "gitleaks.exe"

& $dotnetExecutable --version
& $dotnet8RuntimeExecutable --list-runtimes
& $nodeExecutable --version
& $gitleaksExecutable version
