$graph = @{
    Api    = 'Microsoft Graph v1.0'
    Module = 'Microsoft.Graph.Applications'
    Scope  = 'tenant'
}

$queriedAt = Get-UtcStamp
# Section 3.4's snippet runs here and fills $applications and $federated.
Save-SnapshotFile -Name 'federated-credentials' -Rows $federated -QueriedAtUtc $queriedAt `
    -Source 'graph:applications/federatedIdentityCredentials' @graph

$queriedAt = Get-UtcStamp
$servicePrincipals = Get-MgServicePrincipal -All -Property 'id,appId,displayName' |
    Select-Object Id, AppId, DisplayName
Save-SnapshotFile -Name 'service-principals' -Rows $servicePrincipals -QueriedAtUtc $queriedAt `
    -Source 'graph:servicePrincipals' @graph
