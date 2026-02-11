Write-Host "DEV converter.js hash:" (Get-FileHash 'd:\metacare\BTL\backend\pdf-converter-app\src\main\converter.js' -Algorithm MD5).Hash

$buildConverter = Get-ChildItem -Path 'd:\metacare\BTL\backend\pdf-converter-app\dist' -Recurse -Filter 'converter.js' -ErrorAction SilentlyContinue | Select-Object -First 1
if($buildConverter) {
    Write-Host "BUILD converter.js:" $buildConverter.FullName
    Write-Host "BUILD converter.js hash:" (Get-FileHash $buildConverter.FullName -Algorithm MD5).Hash
} else {
    Write-Host "No converter.js in build"
}

# Also compare the full libreoffice Data/settings
Write-Host ""
Write-Host "DEV registrymodifications.xcu hash:" (Get-FileHash 'd:\metacare\BTL\backend\pdf-converter-app\libreoffice\Data\settings\user\registrymodifications.xcu' -Algorithm MD5).Hash
$buildReg = 'd:\metacare\BTL\backend\pdf-converter-app\dist\win-unpacked\resources\libreoffice\Data\settings\user\registrymodifications.xcu'
if(Test-Path $buildReg) {
    Write-Host "BUILD registrymodifications.xcu hash:" (Get-FileHash $buildReg -Algorithm MD5).Hash
} else {
    Write-Host "No registrymodifications.xcu in build"
}
