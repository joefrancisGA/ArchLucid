Connect-MgGraph -Identity

$applications = Get-MgApplication -All -Property 'id,appId,displayName'

$federated = foreach ($app in $applications) {
    Get-MgApplicationFederatedIdentityCredential -ApplicationId $app.Id |
        ForEach-Object {
            [pscustomobject]@{
                appId       = $app.AppId
                displayName = $app.DisplayName
                issuer      = $_.Issuer
                subject     = $_.Subject
                audiences   = $_.Audiences -join ','
            }
        }
}
