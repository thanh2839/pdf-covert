$file = 'd:\metacare\BTL\backend\pdf-converter-app\libreoffice\App\libreoffice\share\registry\main.xcd'
$content = Get-Content $file -Raw

# Change BlockUntrustedRefererLinks from false to true
$old = 'oor:name="BlockUntrustedRefererLinks" oor:type="xs:boolean" oor:nillable="false"><value>false</value>'
$new = 'oor:name="BlockUntrustedRefererLinks" oor:type="xs:boolean" oor:nillable="false"><value>true</value>'

if($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($file, $content)
    Write-Host "BlockUntrustedRefererLinks changed to true"
} else {
    Write-Host "BlockUntrustedRefererLinks already true or not found"
}

# Verify Link=2 is still set
if($content.Contains('oor:name="Link" oor:type="xs:int"><value>2</value>')) {
    Write-Host "Writer Link update = 2 (Never) - OK"
} else {
    Write-Host "WARNING: Writer Link setting not found or not set to 2!"
}
