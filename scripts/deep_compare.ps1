# Compare registrymodifications.xcu - look for ANY link/update/security overrides
Write-Host "=== BUILD registrymodifications.xcu - ALL relevant settings ==="
$buildReg = 'd:\metacare\BTL\backend\pdf-converter-app\dist\win-unpacked\resources\libreoffice\Data\settings\user\registrymodifications.xcu'
$content = Get-Content $buildReg -Raw

$patterns = @('Link', 'Update', 'Security', 'Active', 'DDE', 'OLE', 'Macro', 'Trusted', 'Referer', 'ExternalMailer', 'UpdateDoc', 'AutoUpdate')
foreach($p in $patterns) {
    $idx = 0
    while(($idx = $content.IndexOf($p, $idx)) -ge 0) {
        # Find the start of the XML item (go back to find <item)
        $lineStart = $content.LastIndexOf('<item', $idx)
        if($lineStart -lt 0) { $lineStart = [Math]::Max(0, $idx - 100) }
        # Find end of item
        $lineEnd = $content.IndexOf('/>', $idx)
        if($lineEnd -lt 0) { $lineEnd = [Math]::Min($content.Length, $idx + 200) } else { $lineEnd += 2 }
        $snippet = $content.Substring($lineStart, [Math]::Min($lineEnd - $lineStart, 500))
        Write-Host "[$p] $snippet"
        Write-Host ""
        $idx = $idx + $p.Length
    }
}

Write-Host "=== DEV registrymodifications.xcu - ALL relevant settings ==="
$devReg = 'd:\metacare\BTL\backend\pdf-converter-app\libreoffice\Data\settings\user\registrymodifications.xcu'
$content2 = Get-Content $devReg -Raw
foreach($p in $patterns) {
    $idx = 0
    while(($idx = $content2.IndexOf($p, $idx)) -ge 0) {
        $lineStart = $content2.LastIndexOf('<item', $idx)
        if($lineStart -lt 0) { $lineStart = [Math]::Max(0, $idx - 100) }
        $lineEnd = $content2.IndexOf('/>', $idx)
        if($lineEnd -lt 0) { $lineEnd = [Math]::Min($content2.Length, $idx + 200) } else { $lineEnd += 2 }
        $snippet = $content2.Substring($lineStart, [Math]::Min($lineEnd - $lineStart, 500))
        Write-Host "[$p] $snippet"
        Write-Host ""
        $idx = $idx + $p.Length
    }
}

# Also check bootstrap.ini in both
Write-Host "=== BOOTSTRAP.INI ==="
Write-Host "DEV:"
Get-Content 'd:\metacare\BTL\backend\pdf-converter-app\libreoffice\App\libreoffice\program\bootstrap.ini'
Write-Host ""
Write-Host "BUILD:"
Get-Content 'd:\metacare\BTL\backend\pdf-converter-app\dist\win-unpacked\resources\libreoffice\App\libreoffice\program\bootstrap.ini'
