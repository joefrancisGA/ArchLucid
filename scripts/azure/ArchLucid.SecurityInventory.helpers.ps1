Set-StrictMode -Version Latest

function New-ArchLucidCollectedArmResourceRecord([object] $AzResource)
{
    if ($null -eq $AzResource) { throw [System.ArgumentNullException]::new("AzResource") }

    $props = @{
        provisioningState = $AzResource.Properties.provisioningState
    }

    if ([string]::Equals($AzResource.ResourceType, "Microsoft.Compute/virtualMachines",
            [System.StringComparison]::OrdinalIgnoreCase))
    {

        try
        {

            [string]$vs = "$( $AzResource.Properties.hardwareProfile.vmSize )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($vs)))
            {

                $props["vmSize"] = $vs

            }

        }

        catch
        {

        }

    }

    Add-ArchLucidSecurityInventoryResourceProperties -Properties $props -AzResource $AzResource

    return [ordered]@{
        resourceType = $AzResource.ResourceType
        resourceId = $AzResource.ResourceId
        name = $AzResource.Name
        location = $AzResource.Location
        sku = $AzResource.Sku
        tags = $AzResource.Tags
        properties = $props
    }

}

function Add-ArchLucidSecurityInventoryResourceProperties
{
    param(
        [Parameter(Mandatory = $true)]
        [hashtable] $Properties,

        [Parameter(Mandatory = $true)]
        [object] $AzResource
    )

    if ($AzResource.PSObject.Properties.Match('Identity').Count -gt 0 -and $null -ne $AzResource.Identity)
    {
        try
        {
            $Properties["identity"] = ($AzResource.Identity | ConvertTo-Json -Depth 12 -Compress)
        }
        catch
        {
        }
    }

    if ($AzResource.ResourceType -like "*networkInterfaces*")
    {
        try
        {
            [string]$subnetId = "$( $AzResource.Properties.ipConfigurations[0].properties.subnet.id )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
            {
                $Properties["ipConfiguration.subnet.id"] = $subnetId
            }
        }
        catch
        {
        }
    }

    if ($AzResource.ResourceType -like "*publicIPAddresses*")
    {
        try
        {
            [string]$ipConfigurationId = "$( $AzResource.Properties.ipConfiguration.id )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($ipConfigurationId)))
            {
                $Properties["ipConfiguration.id"] = $ipConfigurationId
            }
        }
        catch
        {
        }
    }

    if ($AzResource.ResourceType -like "*privateEndpoints*")
    {
        try
        {
            [string]$targetId = "$( $AzResource.Properties.privateLinkServiceConnections[0].properties.privateLinkServiceId )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($targetId)))
            {
                $Properties["privateLinkServiceId"] = $targetId
            }
        }
        catch
        {
        }
    }
}

function Get-ArchLucidAzureRoleAssignmentCompanionRows
{
    param(
        [string] $SubscriptionId,

        [string] $ResourceGroupScope,

        [string] $ManagementGroupId
    )

    if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
    {
        return @()
    }

    if (-not (Get-Command Get-AzRoleAssignment -ErrorAction SilentlyContinue))
    {
        return @()
    }

    try
    {
        if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
        {
            $assignments = @(Get-AzRoleAssignment -ResourceGroupName $ResourceGroupScope -ErrorAction Stop)
        }
        elseif (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
        {
            $scope = "/subscriptions/$SubscriptionId"
            $assignments = @(Get-AzRoleAssignment -Scope $scope -ErrorAction Stop)
        }
        else
        {
            return @()
        }
    }
    catch
    {
        return @()
    }

    $rows = @()

    foreach ($assignment in @($assignments))
    {
        if ([string]::IsNullOrWhiteSpace($assignment.ObjectId)) { continue }
        if ([string]::IsNullOrWhiteSpace($assignment.RoleDefinitionId)) { continue }
        if ([string]::IsNullOrWhiteSpace($assignment.Scope)) { continue }

        $rows += [ordered]@{
            scope = $assignment.Scope
            principalId = $assignment.ObjectId
            principalType = $assignment.ObjectType
            roleDefinitionId = $assignment.RoleDefinitionId
        }
    }

    return @($rows)
}

function Get-ArchLucidAzureNetworkAssociationCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceId = "$( $resource.resourceId )".Trim()
        [string]$resourceType = "$( $resource.resourceType )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }
        if ([string]::IsNullOrWhiteSpace($resourceType)) { continue }

        if ($resourceType -like "*networkInterfaces*")
        {
            [string]$subnetId = "$( $resource.properties.'ipConfiguration.subnet.id' )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
            {
                Add-ArchLucidNetworkAssociationRow `
                    -Rows $rows `
                    -Seen $seen `
                    -FromResourceId $resourceId `
                    -ToResourceId $subnetId `
                    -AssociationType "nicToSubnet"
            }
        }

        if ($resourceType -like "*publicIPAddresses*")
        {
            [string]$ipConfigurationId = "$( $resource.properties.'ipConfiguration.id' )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($ipConfigurationId)))
            {
                [string]$associatedResourceId = Resolve-ArchLucidAssociatedResourceFromIpConfiguration -IpConfigurationId $ipConfigurationId

                if (-not ([string]::IsNullOrWhiteSpace($associatedResourceId)))
                {
                    Add-ArchLucidNetworkAssociationRow `
                        -Rows $rows `
                        -Seen $seen `
                        -FromResourceId $resourceId `
                        -ToResourceId $associatedResourceId `
                        -AssociationType "publicIpToNic"
                }
            }
        }

        if ($resourceType -like "*privateEndpoints*")
        {
            [string]$targetResourceId = "$( $resource.properties.privateLinkServiceId )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($targetResourceId)))
            {
                Add-ArchLucidNetworkAssociationRow `
                    -Rows $rows `
                    -Seen $seen `
                    -FromResourceId $resourceId `
                    -ToResourceId $targetResourceId `
                    -AssociationType "privateEndpointTarget"
            }
        }
    }

    return @($rows.ToArray())
}

function Add-ArchLucidNetworkAssociationRow
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $FromResourceId,
        [string] $ToResourceId,
        [string] $AssociationType,
        [string] $RuleName = $null
    )

    [string]$key = "$FromResourceId|$AssociationType|$ToResourceId|$RuleName"

    if ($Seen.ContainsKey($key))
    {
        return
    }

    $Seen[$key] = $true

    $row = [ordered]@{
        fromResourceId = $FromResourceId
        toResourceId = $ToResourceId
        associationType = $AssociationType
    }

    if (-not ([string]::IsNullOrWhiteSpace($RuleName)))
    {
        $row["ruleName"] = $RuleName
    }

    [void]$Rows.Add($row)
}

function Resolve-ArchLucidAssociatedResourceFromIpConfiguration([string] $IpConfigurationId)
{
    if ([string]::IsNullOrWhiteSpace($IpConfigurationId)) { return $null }

    [string]$normalized = $IpConfigurationId.Trim()
    [int]$index = $normalized.IndexOf("/ipConfigurations/", [System.StringComparison]::OrdinalIgnoreCase)

    if ($index -le 0) { return $null }

    return $normalized.Substring(0, $index)
}
