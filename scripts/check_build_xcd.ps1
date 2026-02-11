$file = 'd:\metacare\BTL\backend\pdf-converter-app\dist\win-unpacked\resources\libreoffice\App\libreoffice\share\registry\main.xcd'
$content = Get-Content $file -Raw

$idx = $content.IndexOf('oor:name="Link" oor:type="xs:int"')
if($idx -ge 0) {
    $start = [Math]::Max(0, $idx)
    $len = [Math]::Min(100, $content.Length - $start)
    Write-Host "BUILD main.xcd - Link setting:"
    Write-Host $content.Substring($start, $len)
}

$idx2 = $content.IndexOf('BlockUntrustedRefererLinks')
if($idx2 -ge 0) {
    $start = [Math]::Max(0, $idx2)
    $len = [Math]::Min(120, $content.Length - $start)
    Write-Host "BUILD main.xcd - BlockUntrustedRefererLinks:"
    Write-Host $content.Substring($start, $len)
}
