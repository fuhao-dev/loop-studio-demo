param(
    [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$OutputRoot = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$repoPath = [IO.Path]::GetFullPath($RepoRoot)
$package = Get-Content -LiteralPath (Join-Path $repoPath 'package.json') -Raw -Encoding utf8 | ConvertFrom-Json
$version = [string]$package.version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Version must use major.minor.patch.' }
if (-not $OutputRoot) {
    $OutputRoot = Join-Path (Split-Path -Parent $repoPath) "taptap-h5-v$version"
}
$outPath = [IO.Path]::GetFullPath($OutputRoot)
$folder = 'genius-programmer'
$stagePath = Join-Path $outPath "payload/$folder"
$verifyRoot = Join-Path $outPath 'verified-extraction'
$archivePath = Join-Path $outPath "genius-programmer-v$version-taptap-h5.zip"
$manifestPath = Join-Path $outPath 'manifest.json'
foreach ($existing in @($archivePath, $stagePath, $verifyRoot, $manifestPath)) {
    if (Test-Path -LiteralPath $existing) {
        throw 'Output already exists; use a new OutputRoot to preserve the previous build.'
    }
}

& node (Join-Path $repoPath 'build-offline.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Offline build failed.' }
$html = Get-Content -LiteralPath (Join-Path $repoPath 'index.html') -Raw -Encoding utf8
if ($html -notmatch "v$([regex]::Escape($version)) DEMO") { throw 'Built page version does not match package.json.' }
if ($html -match '<script\b[^>]*\bsrc\s*=' -or $html -match '<link\b[^>]*\brel=["'']stylesheet["'']') {
    throw 'Offline page still references external scripts or stylesheets.'
}

$runtimeFiles = @('index.html', 'LICENSE')
New-Item -ItemType Directory -Path $stagePath -Force | Out-Null
$files = @()
foreach ($relativePath in $runtimeFiles) {
    $source = Join-Path $repoPath $relativePath
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing file: $relativePath" }
    $target = Join-Path $stagePath $relativePath
    Copy-Item -LiteralPath $source -Destination $target
    $files += [ordered]@{
        path = "$folder/$relativePath"
        bytes = (Get-Item -LiteralPath $target).Length
        sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$archive = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
try {
    $null = $archive.CreateEntry("$folder/")
    foreach ($relativePath in $runtimeFiles) {
        $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, (Join-Path $stagePath $relativePath), "$folder/$relativePath",
            [IO.Compression.CompressionLevel]::Optimal
        )
    }
} finally { $archive.Dispose() }

$archiveInfo = Get-Item -LiteralPath $archivePath
if ($archiveInfo.Length -gt 300000000) { throw 'ZIP exceeds the 300 MB limit.' }
$archive = [IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
    $topFolders = @($entryNames | ForEach-Object { ($_ -split '/')[0] } | Select-Object -Unique)
    if ($topFolders.Count -ne 1 -or $topFolders[0] -ne $folder) { throw 'ZIP must contain exactly one top-level game folder.' }
    if ($entryNames -notcontains "$folder/index.html") { throw 'Missing entry point.' }
    if ($entryNames.Count -ne $runtimeFiles.Count + 1) { throw 'Unexpected ZIP entry count.' }
    foreach ($entry in $entryNames) {
        if ($entry.Contains('\') -or $entry.Contains('..') -or $entry.StartsWith('/')) { throw "Unsafe ZIP path: $entry" }
    }
} finally { $archive.Dispose() }

[IO.Compression.ZipFile]::ExtractToDirectory($archivePath, $verifyRoot)
foreach ($file in $files) {
    $actualHash = (Get-FileHash -LiteralPath (Join-Path $verifyRoot $file.path) -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $file.sha256) { throw "Extracted file mismatch: $($file.path)" }
}
$gitCommit = (& git -c "safe.directory=$($repoPath.Replace('\','/'))" -C $repoPath rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Could not determine source commit.' }
$sourceChanges = @(& git -c "safe.directory=$($repoPath.Replace('\','/'))" -C $repoPath status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Could not determine source worktree status.' }
$manifest = [ordered]@{
    title = '天才程序员带我做游戏'
    version = $version
    sourceCommit = $gitCommit
    sourceDirty = $sourceChanges.Count -gt 0
    platform = 'TapTap H5'
    orientationSetting = 'landscape / 横屏（在 TapTap 上传界面选择）'
    archive = $archiveInfo.Name
    archiveBytes = $archiveInfo.Length
    archiveSha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    topLevelFolder = $folder
    entryPoint = "$folder/index.html"
    fileCount = $files.Count
    extractedFileHashesVerified = $true
    containsOnlyRuntimeFilesAndLicense = $true
    storage = 'browser localStorage; no TapTap SDK or cloud save'
    files = $files
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8NoBOM
[pscustomobject]$manifest | Select-Object title,version,sourceCommit,sourceDirty,archive,archiveBytes,archiveSha256,entryPoint,fileCount,extractedFileHashesVerified | ConvertTo-Json
