# Check dev user config
Write-Host "=== DEV registrymodifications.xcu ==="
$devFile = 'd:\metacare\BTL\backend\pdf-converter-app\libreoffice\Data\settings\user\registrymodifications.xcu'
if(Test-Path $devFile) {
    $content = Get-Content $devFile -Raw
    $linkIdx = $content.IndexOf('Update/Link')
    if($linkIdx -ge 0) {
        $start = [Math]::Max(0, $linkIdx - 50)
        $len = [Math]::Min(200, $content.Length - $start)
        Write-Host "Found Link setting in user config:"
        Write-Host $content.Substring($start, $len)
    } else {
        Write-Host "No Link setting in user config (using main.xcd default)"
    }

    $blockIdx = $content.IndexOf('BlockUntrusted')
    if($blockIdx -ge 0) {
        $start = [Math]::Max(0, $blockIdx - 50)
        $len = [Math]::Min(200, $content.Length - $start)
        Write-Host "Found BlockUntrusted in user config:"
        Write-Host $content.Substring($start, $len)
    }
} else { Write-Host "File not found" }

# Check build user config
Write-Host ""
Write-Host "=== BUILD registrymodifications.xcu ==="
$buildFile = 'd:\metacare\BTL\backend\pdf-converter-app\dist\win-unpacked\resources\libreoffice\Data\settings\user\registrymodifications.xcu'
if(Test-Path $buildFile) {
    $content = Get-Content $buildFile -Raw
    $linkIdx = $content.IndexOf('Update/Link')
    if($linkIdx -ge 0) {
        $start = [Math]::Max(0, $linkIdx - 50)
        $len = [Math]::Min(200, $content.Length - $start)
        Write-Host "Found Link setting in user config:"
        Write-Host $content.Substring($start, $len)
    } else {
        Write-Host "No Link setting in user config (using main.xcd default)"
    }

    $blockIdx = $content.IndexOf('BlockUntrusted')
    if($blockIdx -ge 0) {
        $start = [Math]::Max(0, $blockIdx - 50)
        $len = [Math]::Min(200, $content.Length - $start)
        Write-Host "Found BlockUntrusted in user config:"
        Write-Host $content.Substring($start, $len)
    }

    # Also check for LinkUpdateMode
    $linkUpdate = $content.IndexOf('LinkUpdateMode')
    if($linkUpdate -ge 0) {
        $start = [Math]::Max(0, $linkUpdate - 50)
        $len = [Math]::Min(200, $content.Length - $start)
        Write-Host "Found LinkUpdateMode in user config:"
        Write-Host $content.Substring($start, $len)
    }
} else { Write-Host "File not found" }
