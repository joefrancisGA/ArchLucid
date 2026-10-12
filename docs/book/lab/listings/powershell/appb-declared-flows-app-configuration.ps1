$response = Invoke-AzRestMethod -Method GET -Path "$($site.id)/config/web?api-version=2023-12-01"
$web = ($response.Content | ConvertFrom-Json).properties

[pscustomobject]@{
    siteId                           = $site.id
    publicNetworkAccess              = $web.publicNetworkAccess
    ipSecurityRestrictions           = $web.ipSecurityRestrictions
    scmIpSecurityRestrictions        = $web.scmIpSecurityRestrictions
    scmIpSecurityRestrictionsUseMain = $web.scmIpSecurityRestrictionsUseMain
}
