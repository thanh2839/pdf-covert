$buildXcd = 'd:\metacare\BTL\backend\pdf-converter-app\dist\win-unpacked\resources\libreoffice\App\libreoffice\share\registry\main.xcd'
$devXcd = 'd:\metacare\BTL\backend\pdf-converter-app\libreoffice\App\libreoffice\share\registry\main.xcd'

Write-Host "DEV main.xcd hash:" (Get-FileHash $devXcd -Algorithm MD5).Hash
Write-Host "BUILD main.xcd hash:" (Get-FileHash $buildXcd -Algorithm MD5).Hash

$content = Get-Content $buildXcd -Raw
# Check Link setting
$linkIdx = $content.IndexOf('oor:name="Link" oor:type="xs:int"')
if($linkIdx -ge 0) {
    Write-Host "BUILD Link:" $content.Substring($linkIdx, 80)
}
# Check BlockUntrustedRefererLinks
$blockIdx = $content.IndexOf('BlockUntrustedRefererLinks')
if($blockIdx -ge 0) {
    Write-Host "BUILD BlockUntrusted:" $content.Substring($blockIdx, 100)
}
