$file = 'd:\metacare\BTL\backend\pdf-converter-app\libreoffice\App\libreoffice\share\registry\main.xcd'
$content = Get-Content $file -Raw

# Find DisableActiveContent
$idx = $content.IndexOf('DisableActiveContent')
Write-Host "DisableActiveContent at char index: $idx"
if($idx -ge 0){
    $start = [Math]::Max(0, $idx - 100)
    $len = [Math]::Min(300, $content.Length - $start)
    Write-Host $content.Substring($start, $len)
    Write-Host "---"
}

# Find BlockUntrustedRefererLinks
$idx2 = $content.IndexOf('BlockUntrustedRefererLinks')
Write-Host "BlockUntrustedRefererLinks at char index: $idx2"
if($idx2 -ge 0){
    $start = [Math]::Max(0, $idx2 - 100)
    $len = [Math]::Min(300, $content.Length - $start)
    Write-Host $content.Substring($start, $len)
    Write-Host "---"
}

# Find Writer Update Link
$idx3 = $content.IndexOf('oor:name="Link"')
Write-Host "Writer Link at char index: $idx3"
if($idx3 -ge 0){
    $start = [Math]::Max(0, $idx3 - 200)
    $len = [Math]::Min(400, $content.Length - $start)
    Write-Host $content.Substring($start, $len)
    Write-Host "---"
}
