$targets = @(
    $account.id,
    "$($account.id)/blobServices/default"
)

$settings = foreach ($target in $targets) {
    Get-AzDiagnosticSetting -ResourceId $target |
        ForEach-Object {
            [pscustomobject]@{
                target      = $target
                name        = $_.Name
                workspaceId = $_.WorkspaceId
                logs        = ($_.Log | Where-Object Enabled |
                    ForEach-Object { $_.Category ?? $_.CategoryGroup }) -join ','
            }
        }
}
