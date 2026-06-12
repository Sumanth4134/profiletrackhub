param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$TargetPath
)

$word = $null
$document = $null

try {
  $sourceResolved = (Resolve-Path -LiteralPath $SourcePath).Path
  $targetDirectory = Split-Path -Path $TargetPath -Parent

  if (-not (Test-Path -LiteralPath $targetDirectory)) {
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
  }

  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0

  $document = $word.Documents.Open($sourceResolved, $false, $true)
  $document.SaveAs([ref]$TargetPath, [ref]17)
  $document.Close()
  $word.Quit()
} catch {
  if ($document -ne $null) {
    try { $document.Close() } catch {}
  }

  if ($word -ne $null) {
    try { $word.Quit() } catch {}
  }

  throw
}
