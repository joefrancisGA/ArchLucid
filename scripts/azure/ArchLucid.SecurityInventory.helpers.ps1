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
            [int]$ipConfigIndex = 0

            foreach ($ipConfig in @($AzResource.Properties.ipConfigurations))
            {
                [string]$subnetId = "$( $ipConfig.properties.subnet.id )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
                {
                    if ($ipConfigIndex -eq 0)
                    {
                        $Properties["ipConfiguration.subnet.id"] = $subnetId
                    }

                    $Properties["ipConfiguration.subnet.id[$ipConfigIndex]"] = $subnetId
                }

                [string]$publicIpId = "$( $ipConfig.properties.publicIPAddress.id )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($publicIpId)))
                {
                    $Properties["ipConfiguration.publicIPAddress.id[$ipConfigIndex]"] = $publicIpId
                }

                $ipConfigIndex++
            }

            [string]$nsgId = "$( $AzResource.Properties.networkSecurityGroup.id )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($nsgId)))
            {
                $Properties["networkSecurityGroup.id"] = $nsgId
            }

            [string]$privateEndpointId = "$( $AzResource.Properties.privateEndpoint.id )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($privateEndpointId)))
            {
                $Properties["privateEndpoint.id"] = $privateEndpointId
            }
        }
        catch
        {
        }
    }

    if ($AzResource.ResourceType -like "*virtualMachines*")
    {
        try
        {
            [int]$nicIndex = 0

            foreach ($nic in @($AzResource.Properties.networkProfile.networkInterfaces))
            {
                [string]$nicId = "$( $nic.id )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($nicId)))
                {
                    $Properties["networkProfile.networkInterfaces[$nicIndex]"] = $nicId
                    $nicIndex++
                }
            }

            if ($nicIndex -gt 0)
            {
                $Properties["networkProfile.networkInterfaces"] = (
                    @($Properties.Keys |
                        Where-Object { $_ -like 'networkProfile.networkInterfaces[*]' } |
                        Sort-Object |
                        ForEach-Object { $Properties[$_] }) -join '|'
                )
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
            [int]$connectionIndex = 0

            foreach ($connection in @($AzResource.Properties.privateLinkServiceConnections))
            {
                [string]$targetId = "$( $connection.properties.privateLinkServiceId )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($targetId)))
                {
                    if ($connectionIndex -eq 0)
                    {
                        $Properties["privateLinkServiceId"] = $targetId
                    }

                    $Properties["privateLinkServiceId[$connectionIndex]"] = $targetId
                    $connectionIndex++
                }
            }

            foreach ($connection in @($AzResource.Properties.manualPrivateLinkServiceConnections))
            {
                [string]$targetId = "$( $connection.properties.privateLinkServiceId )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($targetId)))
                {
                    $Properties["privateLinkServiceId[$connectionIndex]"] = $targetId
                    $connectionIndex++
                }
            }

            [string]$subnetId = "$( $AzResource.Properties.subnet.id )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
            {
                $Properties["subnet.id"] = $subnetId
            }

            [int]$nicIndex = 0

            foreach ($networkInterface in @($AzResource.Properties.networkInterfaces))
            {
                [string]$nicId = "$( $networkInterface.id )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($nicId)))
                {
                    $Properties["networkInterfaces[$nicIndex]"] = $nicId
                    $nicIndex++
                }
            }

            if ($nicIndex -gt 0)
            {
                $Properties["networkInterfaces"] = (
                    @($Properties.Keys |
                        Where-Object { $_ -like 'networkInterfaces[*]' } |
                        Sort-Object |
                        ForEach-Object { $Properties[$_] }) -join '|'
                )
            }
        }
        catch
        {
        }
    }

    if ($AzResource.ResourceType -like "*userAssignedIdentities*")
    {
        try
        {
            [string]$principalId = "$( $AzResource.Properties.principalId )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($principalId)))
            {
                $Properties["principalId"] = $principalId
            }

            [string]$clientId = "$( $AzResource.Properties.clientId )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($clientId)))
            {
                $Properties["clientId"] = $clientId
            }
        }
        catch
        {
        }
    }

    if ($AzResource.ResourceType -like "*networkSecurityGroups*")
    {
        try
        {
            if ($null -ne $AzResource.Properties.securityRules)
            {
                $Properties["securityRules"] = ($AzResource.Properties.securityRules | ConvertTo-Json -Depth 20 -Compress)
            }
        }
        catch
        {
        }
    }

    if ($AzResource.ResourceType -like "*virtualNetworks*")
    {
        try
        {
            if ($null -ne $AzResource.Properties.subnets)
            {
                $Properties["subnets"] = ($AzResource.Properties.subnets | ConvertTo-Json -Depth 20 -Compress)
            }

            if ($null -ne $AzResource.Properties.virtualNetworkPeerings)
            {
                $Properties["virtualNetworkPeerings"] = ($AzResource.Properties.virtualNetworkPeerings | ConvertTo-Json -Depth 20 -Compress)
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

    if (-not (Get-Command Get-AzRoleAssignment -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
    {
        [string]$managementGroupScope = "/providers/Microsoft.Management/managementGroups/$($ManagementGroupId.Trim())"

        Add-ArchLucidAzureRoleAssignmentRowsFromGetAzRoleAssignment `
            -Rows $rows `
            -Seen $seen `
            -Scope $managementGroupScope

        if (Get-Command Get-ArchLucidManagementGroupSubscriptionIds -ErrorAction SilentlyContinue)
        {
            foreach ($subId in @(Get-ArchLucidManagementGroupSubscriptionIds -ManagementGroupId $ManagementGroupId))
            {
                if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
                {
                    Add-ArchLucidAzureRoleAssignmentRowsFromGetAzRoleAssignment `
                        -Rows $rows `
                        -Seen $seen `
                        -ResourceGroupName $ResourceGroupScope
                }
                else
                {
                    Add-ArchLucidAzureRoleAssignmentRowsFromGetAzRoleAssignment `
                        -Rows $rows `
                        -Seen $seen `
                        -Scope "/subscriptions/$subId"
                }
            }
        }
    }
    else
    {
        try
        {
            if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
            {
                Add-ArchLucidAzureRoleAssignmentRowsFromGetAzRoleAssignment `
                    -Rows $rows `
                    -Seen $seen `
                    -ResourceGroupName $ResourceGroupScope
            }
            elseif (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
            {
                Add-ArchLucidAzureRoleAssignmentRowsFromGetAzRoleAssignment `
                    -Rows $rows `
                    -Seen $seen `
                    -Scope "/subscriptions/$SubscriptionId"
            }
        }
        catch
        {
            return @()
        }
    }

    foreach ($eligibleRow in @(Get-ArchLucidAzureRoleEligibilityScheduleCompanionRows `
            -SubscriptionId $SubscriptionId `
            -ResourceGroupScope $ResourceGroupScope `
            -ManagementGroupId $ManagementGroupId))
    {
        [string]$eligibleKey = "$( $eligibleRow.scope )|$( $eligibleRow.principalId )|$( $eligibleRow.roleDefinitionId )"

        if ($seen.ContainsKey($eligibleKey))
        {
            continue
        }

        $seen[$eligibleKey] = $true
        [void]$rows.Add($eligibleRow)
    }

    return @($rows.ToArray())
}

function Add-ArchLucidAzureRoleAssignmentRowsFromGetAzRoleAssignment
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $Scope = $null,
        [string] $ResourceGroupName = $null
    )

    try
    {
        if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupName)))
        {
            $assignments = @(Get-AzRoleAssignment -ResourceGroupName $ResourceGroupName -ErrorAction Stop)
        }
        elseif (-not ([string]::IsNullOrWhiteSpace($Scope)))
        {
            $assignments = @(Get-AzRoleAssignment -Scope $Scope -ErrorAction Stop)
        }
        else
        {
            return
        }
    }
    catch
    {
        return
    }

    foreach ($assignment in @($assignments))
    {
        if ([string]::IsNullOrWhiteSpace($assignment.ObjectId)) { continue }
        if ([string]::IsNullOrWhiteSpace($assignment.RoleDefinitionId)) { continue }
        if ([string]::IsNullOrWhiteSpace($assignment.Scope)) { continue }

        [string]$key = "$( $assignment.Scope )|$( $assignment.ObjectId )|$( $assignment.RoleDefinitionId )"

        if ($Seen.ContainsKey($key))
        {
            continue
        }

        $Seen[$key] = $true

        [void]$Rows.Add([ordered]@{
            scope = $assignment.Scope
            principalId = $assignment.ObjectId
            principalType = $assignment.ObjectType
            roleDefinitionId = $assignment.RoleDefinitionId
            pimEligibilityKind = "standing"
        })
    }
}

function Get-ArchLucidAzureRoleEligibilityScheduleCompanionRows
{
    param(
        [string] $SubscriptionId,

        [string] $ResourceGroupScope,

        [string] $ManagementGroupId
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()

    if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
    {
        [string]$managementGroupPath = "/providers/Microsoft.Management/managementGroups/$($ManagementGroupId.Trim())/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version=2020-10-01&`$filter=asTarget()"

        Add-ArchLucidAzureRoleEligibilityScheduleRowsFromRestPath `
            -Rows $rows `
            -RestPath $managementGroupPath `
            -ResourceGroupScope $ResourceGroupScope

        if (Get-Command Get-ArchLucidManagementGroupSubscriptionIds -ErrorAction SilentlyContinue)
        {
            foreach ($subId in @(Get-ArchLucidManagementGroupSubscriptionIds -ManagementGroupId $ManagementGroupId))
            {
                if ([string]::IsNullOrWhiteSpace($subId)) { continue }

                [string]$subscriptionPath = "/subscriptions/$subId/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version=2020-10-01&`$filter=asTarget()"

                Add-ArchLucidAzureRoleEligibilityScheduleRowsFromRestPath `
                    -Rows $rows `
                    -RestPath $subscriptionPath `
                    -ResourceGroupScope $ResourceGroupScope
            }
        }
    }
    elseif (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
    {
        [string]$subscriptionPath = "/subscriptions/$($SubscriptionId.Trim())/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version=2020-10-01&`$filter=asTarget()"

        Add-ArchLucidAzureRoleEligibilityScheduleRowsFromRestPath `
            -Rows $rows `
            -RestPath $subscriptionPath `
            -ResourceGroupScope $ResourceGroupScope
    }

    return @($rows.ToArray())
}

function Add-ArchLucidAzureRoleEligibilityScheduleRowsFromRestPath
{
    param(
        [System.Collections.IList] $Rows,
        [Parameter(Mandatory = $true)]
        [string] $RestPath,
        [string] $ResourceGroupScope = $null
    )

    if ([string]::IsNullOrWhiteSpace($RestPath)) { return }

    try
    {
        $response = Invoke-AzRestMethod -Method GET -Path $RestPath -ErrorAction Stop
        $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

        foreach ($schedule in @($payload.value))
        {
            [string]$scope = "$( $schedule.properties.scope )".Trim()
            [string]$principalId = "$( $schedule.properties.principalId )".Trim()
            [string]$roleDefinitionId = "$( $schedule.properties.roleDefinitionId )".Trim()

            if ([string]::IsNullOrWhiteSpace($scope)) { continue }
            if ([string]::IsNullOrWhiteSpace($principalId)) { continue }
            if ([string]::IsNullOrWhiteSpace($roleDefinitionId)) { continue }

            if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
            {
                [string]$expectedSuffix = "/resourceGroups/$ResourceGroupScope"

                if (-not ($scope.EndsWith($expectedSuffix, [System.StringComparison]::OrdinalIgnoreCase)))
                {
                    continue
                }
            }

            [void]$Rows.Add([ordered]@{
                scope = $scope
                principalId = $principalId
                principalType = $schedule.properties.principalType
                roleDefinitionId = $roleDefinitionId
                pimEligibilityKind = "eligible"
            })
        }
    }
    catch
    {
    }
}

function Get-ArchLucidInventoryPropertyEntries([object] $Properties)
{
    if ($null -eq $Properties) { return @() }

    if ($Properties -is [System.Collections.IDictionary])
    {
        return @($Properties.GetEnumerator() | ForEach-Object {
            [PSCustomObject]@{ Name = "$( $_.Key )"; Value = $_.Value }
        })
    }

    return @($Properties.psobject.Properties)
}

function Test-ArchLucidInventoryPropertyExists
{
    param(
        [object] $Properties,
        [string] $PropertyName
    )

    if ($null -eq $Properties) { return $false }
    if ([string]::IsNullOrWhiteSpace($PropertyName)) { return $false }

    if ($Properties -is [System.Collections.IDictionary])
    {
        return $Properties.Contains($PropertyName)
    }

    return $Properties.PSObject.Properties.Match($PropertyName).Count -gt 0
}

function Test-ArchLucidAzureInventoryNeverShowResourceType
{
    param(
        [string] $ResourceType
    )

    if ([string]::IsNullOrWhiteSpace($ResourceType))
    {
        return $false
    }

    $catalogTypes = @(
        'Microsoft.Portal/dashboards'
        'Microsoft.OperationalInsights/workspaces'
        'Microsoft.Insights/activityLogAlerts'
        'Microsoft.Insights/metricAlerts'
        'Microsoft.Insights/workbooks'
        'Microsoft.Insights/scheduledQueryRules'
        'Microsoft.Insights/actionGroups'
        'Microsoft.AlertsManagement/smartDetectorAlertRules'
        'Microsoft.OperationsManagement/solutions'
        'Microsoft.Network/dnszones'
        'Microsoft.Network/privateDnsZones'
        'Microsoft.Network/dnsResolvers'
        'Microsoft.Network/firewallPolicies'
        'Microsoft.Network/networkIntentPolicies'
        'Microsoft.Network/networkWatchers'
        'Microsoft.Network/networkWatchers/flowLogs'
        'Microsoft.ManagedIdentity/userAssignedIdentities'
        'Microsoft.Automation/automationAccounts'
        'Microsoft.Automation/automationAccounts/runbooks'
        'Microsoft.Compute/virtualMachines/extensions'
        'Microsoft.Compute/virtualMachineScaleSets/extensions'
        'Microsoft.Compute/disks'
        'Microsoft.Compute/sshPublicKeys'
        'Microsoft.HybridCompute/machines/extensions'
        'Microsoft.Maintenance/maintenanceConfigurations'
        'Microsoft.Maintenance/configurationAssignments'
        'Microsoft.Network/privateDnsZones/virtualNetworkLinks'
        'Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks'
    )

    foreach ($catalogType in $catalogTypes)
    {
        if ($ResourceType.Equals($catalogType, [StringComparison]::OrdinalIgnoreCase))
        {
            return $true
        }
    }

    [string[]]$segments = @($ResourceType -split '/' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

    if ($segments.Count -eq 0)
    {
        return $false
    }

    [string]$lastSegment = $segments[$segments.Count - 1]

    $lastSegments = @(
        'dashboards'
        'workspaces'
        'activitylogalerts'
        'metricalerts'
        'workbooks'
        'scheduledqueryrules'
        'actiongroups'
        'smartdetectoralertrules'
        'solutions'
        'extensions'
        'disks'
        'sshpublickeys'
        'dnssettings'
        'dnszones'
        'privatednszones'
        'dnsresolvers'
        'firewallpolicies'
        'networkintentpolicies'
        'networkwatchers'
        'flowlogs'
        'userassignedidentities'
        'automationaccounts'
        'runbooks'
        'versions'
        'virtualnetworklinks'
        'maintenanceconfigurations'
        'configurationassignments'
    )

    foreach ($segment in $lastSegments)
    {
        if ($lastSegment.Equals($segment, [StringComparison]::OrdinalIgnoreCase))
        {
            return $true
        }
    }

    # ARM ids are .../{type}/{name}; Type uses the segment immediately before the name.
    if ($segments.Count -ge 2)
    {
        [string]$lastTypeSegment = $segments[$segments.Count - 2]

        foreach ($segment in $lastSegments)
        {
            if ($lastTypeSegment.Equals($segment, [StringComparison]::OrdinalIgnoreCase))
            {
                return $true
            }
        }
    }

    return $false
}

function Get-ArchLucidAzurePrivateLinkOnlyNicArmIds
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources,

        [object[]] $NetworkAssociations = @()
    )

    $vmAttachedNicArmIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    $privateEndpointNicArmIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceId = "$( $resource.resourceId )".Trim()
        [string]$resourceType = "$( $resource.resourceType )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }
        if ([string]::IsNullOrWhiteSpace($resourceType)) { continue }

        if ($resourceType -like "*networkInterfaces*")
        {
            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if (-not ($property.Name -like '*privateEndpoint*')) { continue }
                if ([string]::IsNullOrWhiteSpace("$( $property.Value )".Trim())) { continue }

                [void]$privateEndpointNicArmIds.Add($resourceId)
            }
        }

        if ($resourceType -like "*virtualMachines*")
        {
            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if (-not ($property.Name -like 'networkProfile.networkInterfaces[*]')) { continue }

                [string]$nicId = "$( $property.Value )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($nicId)))
                {
                    [void]$vmAttachedNicArmIds.Add($nicId)
                }
            }
        }

        if ($resourceType -like "*privateEndpoints*")
        {
            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if (-not ($property.Name -like 'networkInterfaces*')) { continue }

                [string]$nicId = "$( $property.Value )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($nicId)))
                {
                    [void]$privateEndpointNicArmIds.Add($nicId)
                }
            }
        }
    }

    foreach ($association in @($NetworkAssociations))
    {
        if ($null -eq $association) { continue }

        [string]$associationType = "$( $association.associationType )".Trim()
        [string]$toResourceId = "$( $association.toResourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($toResourceId)) { continue }

        if ($associationType -eq 'vmToNic')
        {
            [void]$vmAttachedNicArmIds.Add($toResourceId)
            continue
        }

        if ($associationType -eq 'peToNic')
        {
            [void]$privateEndpointNicArmIds.Add($toResourceId)
        }
    }

    foreach ($vmNicArmId in @($vmAttachedNicArmIds))
    {
        [void]$privateEndpointNicArmIds.Remove($vmNicArmId)
    }

    return @($privateEndpointNicArmIds)
}

function Test-ArchLucidAzureInventoryNeverShowResource
{
    param(
        [Parameter(Mandatory = $true)]
        [object] $Resource,

        [string[]] $PrivateLinkOnlyNicArmIds = @()
    )

    [string]$resourceType = "$( $Resource.resourceType )".Trim()
    [string]$resourceId = "$( $Resource.resourceId )".Trim()

    if (Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType $resourceType)
    {
        return $true
    }

    if ($resourceType -like "*networkInterfaces*" -and -not ([string]::IsNullOrWhiteSpace($resourceId)))
    {
        foreach ($omittedNicArmId in @($PrivateLinkOnlyNicArmIds))
        {
            if ($resourceId.Equals($omittedNicArmId, [StringComparison]::OrdinalIgnoreCase))
            {
                return $true
            }
        }
    }

    return $false
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

        if ($resourceType -like "*virtualMachines*")
        {
            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if (-not ($property.Name -like 'networkProfile.networkInterfaces[*]')) { continue }

                [string]$nicId = "$( $property.Value )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($nicId)))
                {
                    Add-ArchLucidNetworkAssociationRow `
                        -Rows $rows `
                        -Seen $seen `
                        -FromResourceId $resourceId `
                        -ToResourceId $nicId `
                        -AssociationType "vmToNic"
                }
            }
        }

        if ($resourceType -like "*networkInterfaces*")
        {
            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if ($property.Name -like 'ipConfiguration.subnet.id[*]' -or $property.Name -eq 'ipConfiguration.subnet.id')
                {
                    [string]$subnetId = "$( $property.Value )".Trim()

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

                if ($property.Name -like 'ipConfiguration.publicIPAddress.id[*]')
                {
                    [string]$publicIpId = "$( $property.Value )".Trim()

                    if (-not ([string]::IsNullOrWhiteSpace($publicIpId)))
                    {
                        Add-ArchLucidNetworkAssociationRow `
                            -Rows $rows `
                            -Seen $seen `
                            -FromResourceId $publicIpId `
                            -ToResourceId $resourceId `
                            -AssociationType "publicIpToNic"
                    }
                }
            }

            [string]$nsgId = ""

            if (Test-ArchLucidInventoryPropertyExists -Properties $resource.properties -PropertyName 'networkSecurityGroup.id')
            {
                $nsgId = "$( $resource.properties.'networkSecurityGroup.id' )".Trim()
            }

            if (-not ([string]::IsNullOrWhiteSpace($nsgId)))
            {
                Add-ArchLucidNetworkAssociationRow `
                    -Rows $rows `
                    -Seen $seen `
                    -FromResourceId $resourceId `
                    -ToResourceId $nsgId `
                    -AssociationType "nicToNsg"
            }
        }

        if ($resourceType -like "*publicIPAddresses*")
        {
            [string]$ipConfigurationId = ""

            if (Test-ArchLucidInventoryPropertyExists -Properties $resource.properties -PropertyName 'ipConfiguration.id')
            {
                $ipConfigurationId = "$( $resource.properties.'ipConfiguration.id' )".Trim()
            }

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
            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if (-not ($property.Name -like 'privateLinkServiceId*')) { continue }

                [string]$targetResourceId = "$( $property.Value )".Trim()

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

            [string]$subnetId = ""

            if (Test-ArchLucidInventoryPropertyExists -Properties $resource.properties -PropertyName 'subnet.id')
            {
                $subnetId = "$( $resource.properties.'subnet.id' )".Trim()
            }

            if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
            {
                Add-ArchLucidNetworkAssociationRow `
                    -Rows $rows `
                    -Seen $seen `
                    -FromResourceId $resourceId `
                    -ToResourceId $subnetId `
                    -AssociationType "peToSubnet"
            }

            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if (-not ($property.Name -like 'networkInterfaces*')) { continue }

                [string]$nicId = "$( $property.Value )".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($nicId)))
                {
                    Add-ArchLucidNetworkAssociationRow `
                        -Rows $rows `
                        -Seen $seen `
                        -FromResourceId $resourceId `
                        -ToResourceId $nicId `
                        -AssociationType "peToNic"
                }
            }
        }

        if ($resourceType -like "*virtualNetworks*" -and $resourceType -notlike "*virtualNetworkLinks*")
        {
            [string]$subnetsJson = "$( $resource.properties.subnets )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($subnetsJson)))
            {
                try
                {
                    foreach ($subnet in @(ConvertFrom-Json -InputObject $subnetsJson))
                    {
                        [string]$subnetId = "$( $subnet.id )".Trim()

                        if ([string]::IsNullOrWhiteSpace($subnetId))
                        {
                            [string]$subnetName = "$( $subnet.name )".Trim()

                            if (-not ([string]::IsNullOrWhiteSpace($subnetName)))
                            {
                                $subnetId = "$resourceId/subnets/$subnetName"
                            }
                        }

                        [string]$subnetNsgId = "$( $subnet.properties.networkSecurityGroup.id )".Trim()

                        if (-not ([string]::IsNullOrWhiteSpace($subnetId)) -and -not ([string]::IsNullOrWhiteSpace($subnetNsgId)))
                        {
                            Add-ArchLucidNetworkAssociationRow `
                                -Rows $rows `
                                -Seen $seen `
                                -FromResourceId $subnetId `
                                -ToResourceId $subnetNsgId `
                                -AssociationType "subnetToNsg"
                        }

                        [string]$routeTableId = "$( $subnet.properties.routeTable.id )".Trim()

                        if (-not ([string]::IsNullOrWhiteSpace($subnetId)) -and -not ([string]::IsNullOrWhiteSpace($routeTableId)))
                        {
                            Add-ArchLucidNetworkAssociationRow `
                                -Rows $rows `
                                -Seen $seen `
                                -FromResourceId $subnetId `
                                -ToResourceId $routeTableId `
                                -AssociationType "subnetToRouteTable"
                        }
                    }
                }
                catch
                {
                }
            }

            [string]$peeringsJson = ""

            if (Test-ArchLucidInventoryPropertyExists -Properties $resource.properties -PropertyName 'virtualNetworkPeerings')
            {
                $peeringsJson = "$( $resource.properties.virtualNetworkPeerings )".Trim()
            }

            if (-not ([string]::IsNullOrWhiteSpace($peeringsJson)))
            {
                try
                {
                    foreach ($peering in @(ConvertFrom-Json -InputObject $peeringsJson))
                    {
                        [string]$remoteVnetId = "$( $peering.properties.remoteVirtualNetwork.id )".Trim()

                        if (-not ([string]::IsNullOrWhiteSpace($remoteVnetId)))
                        {
                            Add-ArchLucidNetworkAssociationRow `
                                -Rows $rows `
                                -Seen $seen `
                                -FromResourceId $resourceId `
                                -ToResourceId $remoteVnetId `
                                -AssociationType "vnetPeering"
                        }
                    }
                }
                catch
                {
                }
            }
        }
    }

    [object[]]$nsgAllowRuleRows = @(Get-ArchLucidAzureNsgAllowRuleCompanionRows -InventoryResources @($InventoryResources))

    foreach ($nsgAllowRuleRow in @($nsgAllowRuleRows))
    {
        Add-ArchLucidNetworkAssociationRow `
            -Rows $rows `
            -Seen $seen `
            -FromResourceId $nsgAllowRuleRow.fromResourceId `
            -ToResourceId $nsgAllowRuleRow.toResourceId `
            -AssociationType $nsgAllowRuleRow.associationType `
            -RuleName $nsgAllowRuleRow.ruleName
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

function Get-ArchLucidAzureFederatedCredentialCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if (-not ($resourceType -like "*userAssignedIdentities*")) { continue }
        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        [string]$principalId = "$( $resource.properties.principalId )".Trim()
        [string]$clientId = "$( $resource.properties.clientId )".Trim()

        if ([string]::IsNullOrWhiteSpace($principalId)) { continue }

        try
        {
            [string]$path = "$resourceId/federatedIdentityCredentials?api-version=2023-01-31"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($credential in @($payload.value))
            {
                [string]$issuer = "$( $credential.properties.issuer )".Trim()
                [string]$subject = "$( $credential.properties.subject )".Trim()

                if ([string]::IsNullOrWhiteSpace($issuer)) { continue }
                if ([string]::IsNullOrWhiteSpace($subject)) { continue }

                [void]$rows.Add([ordered]@{
                    issuer = $issuer
                    subject = $subject
                    principalId = $principalId
                    appId = $(if ([string]::IsNullOrWhiteSpace($clientId)) { $null } else { $clientId })
                    parentResourceId = $resourceId
                    credentialName = $credential.name
                    provenanceKind = "ObservedFact"
                })
            }
        }
        catch
        {
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureEffectiveNetworkControlCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $nicResourceIds = [System.Collections.Generic.List[string]]::new()
    $maxNicCount = 200

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if (-not ($resourceType -like "*networkInterfaces*")) { continue }
        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        if (-not $nicResourceIds.Contains($resourceId))
        {
            [void]$nicResourceIds.Add($resourceId)
        }
    }

    $nicResourceIds.Sort([System.StringComparer]::OrdinalIgnoreCase)

    if ($nicResourceIds.Count -gt $maxNicCount)
    {
        $nicResourceIds = [System.Collections.Generic.List[string]]::new(@($nicResourceIds.GetRange(0, $maxNicCount)))
    }

    foreach ($nicResourceId in @($nicResourceIds))
    {
        [void]$rows.Add((Get-ArchLucidAzureEffectiveNetworkControlRow `
            -NicResourceId $nicResourceId `
            -Kind 'effectiveNsg' `
            -RelativePath 'effectiveNetworkSecurityGroups' `
            -ResolveEffectiveResourceId { param($payload) Get-ArchLucidEffectiveNsgResourceId -Payload $payload }))

        [void]$rows.Add((Get-ArchLucidAzureEffectiveNetworkControlRow `
            -NicResourceId $nicResourceId `
            -Kind 'effectiveRoutes' `
            -RelativePath 'effectiveRouteTable' `
            -ResolveEffectiveResourceId { param($payload) Get-ArchLucidEffectiveRouteTableResourceId -Payload $payload }))
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureEffectiveNetworkControlRow
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $NicResourceId,

        [Parameter(Mandatory = $true)]
        [string] $Kind,

        [Parameter(Mandatory = $true)]
        [string] $RelativePath,

        [Parameter(Mandatory = $true)]
        [scriptblock] $ResolveEffectiveResourceId
    )

    $row = [ordered]@{
        nicResourceId = $NicResourceId
        kind = $Kind
        collectionStatus = 'Skipped'
    }

    try
    {
        [string]$path = "$NicResourceId/$RelativePath?api-version=2023-09-01"
        $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

        if ($response.StatusCode -eq 404 -or $response.StatusCode -eq 403)
        {
            return $row
        }

        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
        {
            return $row
        }

        $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop
        [string]$effectiveResourceId = & $ResolveEffectiveResourceId $payload

        if ([string]::IsNullOrWhiteSpace($effectiveResourceId))
        {
            return $row
        }

        $hashBytes = [System.Security.Cryptography.SHA256]::Create().ComputeHash(
            [System.Text.Encoding]::UTF8.GetBytes([string]$response.Content))

        $row.collectionStatus = 'Succeeded'
        $row.effectiveResourceId = $effectiveResourceId
        $row.payloadHashSha256 = -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
    }
    catch
    {
    }

    return $row
}

function Get-ArchLucidEffectiveNsgResourceId
{
    param(
        [Parameter(Mandatory = $true)]
        [object] $Payload
    )

    foreach ($item in @($Payload.value))
    {
        if ($null -eq $item) { continue }

        [string]$nsgId = "$( $item.networkSecurityGroup.id )".Trim()

        if (-not ([string]::IsNullOrWhiteSpace($nsgId)))
        {
            return $nsgId
        }
    }

    return $null
}

function Get-ArchLucidEffectiveRouteTableResourceId
{
    param(
        [Parameter(Mandatory = $true)]
        [object] $Payload
    )

    [string]$routeTableId = "$( $Payload.id )".Trim()

    if ([string]::IsNullOrWhiteSpace($routeTableId)) { return $null }
    if ($routeTableId -notlike '*/routeTables/*') { return $null }

    return $routeTableId
}

function Get-ArchLucidAzureNsgAllowRuleCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    $rows = [System.Collections.ArrayList]::new()
    $allowRulesByNsgId = @{}
    $subnetResourceGroups = @{}
    $storageAccountsByResourceGroup = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        if ($resourceType -like "*networkSecurityGroups*")
        {
            Add-ArchLucidNsgAllowRulesForResource -AllowRulesByNsgId $allowRulesByNsgId -Resource $resource
            continue
        }

        if ($resourceType -like "*virtualNetworks*")
        {
            Add-ArchLucidSubnetResourceGroups -SubnetResourceGroups $subnetResourceGroups -Resource $resource
            continue
        }

        if ($resourceType -like "*storageAccounts*")
        {
            [string]$resourceGroupName = Get-ArchLucidResourceGroupNameFromResourceId -ResourceId $resourceId

            if (-not ([string]::IsNullOrWhiteSpace($resourceGroupName)))
            {
                if (-not $storageAccountsByResourceGroup.ContainsKey($resourceGroupName))
                {
                    $storageAccountsByResourceGroup[$resourceGroupName] = [System.Collections.ArrayList]::new()
                }

                [void]$storageAccountsByResourceGroup[$resourceGroupName].Add($resourceId)
            }
        }
    }

    foreach ($subnetEntry in $subnetResourceGroups.GetEnumerator())
    {
        [string]$subnetId = $subnetEntry.Key
        [string]$resourceGroupName = $subnetEntry.Value
        [string]$nsgId = Get-ArchLucidSubnetNetworkSecurityGroupId -SubnetId $subnetId -InventoryResources $InventoryResources

        if ([string]::IsNullOrWhiteSpace($nsgId)) { continue }
        if (-not $allowRulesByNsgId.ContainsKey($nsgId)) { continue }
        if (-not $storageAccountsByResourceGroup.ContainsKey($resourceGroupName)) { continue }

        foreach ($allowRule in @($allowRulesByNsgId[$nsgId]))
        {
            foreach ($storageAccountId in @($storageAccountsByResourceGroup[$resourceGroupName]))
            {
                [void]$rows.Add([ordered]@{
                    fromResourceId = $subnetId
                    toResourceId = $storageAccountId
                    associationType = "nsgAllowRule"
                    ruleName = $allowRule
                })
            }
        }
    }

    return @($rows.ToArray())
}

function Add-ArchLucidNsgAllowRulesForResource
{
    param(
        [hashtable] $AllowRulesByNsgId,
        [object] $Resource
    )

    [string]$resourceId = "$( $Resource.resourceId )".Trim()
    [string]$securityRulesJson = "$( $Resource.properties.securityRules )".Trim()

    if ([string]::IsNullOrWhiteSpace($securityRulesJson)) { return }

    try
    {
        [object[]]$securityRules = @($securityRulesJson | ConvertFrom-Json -ErrorAction Stop)
    }
    catch
    {
        return
    }

    $allowRules = [System.Collections.ArrayList]::new()

    foreach ($rule in @($securityRules))
    {
        [string]$ruleName = "$( $rule.name )".Trim()
        [string]$access = "$( $rule.properties.access )".Trim()
        [string]$direction = "$( $rule.properties.direction )".Trim()

        if ([string]::IsNullOrWhiteSpace($ruleName)) { continue }
        if (-not ($access -eq "Allow")) { continue }
        if (-not ($direction -eq "Inbound")) { continue }

        if (Test-ArchLucidNsgRuleTargetsStorageServiceTag -RuleProperties $rule.properties)
        {
            [void]$allowRules.Add($ruleName)
        }
    }

    if ($allowRules.Count -gt 0)
    {
        $AllowRulesByNsgId[$resourceId] = @($allowRules.ToArray())
    }
}

function Test-ArchLucidNsgRuleTargetsStorageServiceTag([object] $RuleProperties)
{
    [string]$prefix = "$( $RuleProperties.destinationAddressPrefix )".Trim()

    if ($prefix -eq "Storage") { return $true }

    foreach ($candidate in @($RuleProperties.destinationAddressPrefixes))
    {
        if ("$( $candidate )".Trim() -eq "Storage") { return $true }
    }

    foreach ($serviceTag in @($RuleProperties.destinationServiceTags))
    {
        if ("$( $serviceTag )".Trim() -eq "Storage") { return $true }
    }

    return $false
}

function Add-ArchLucidSubnetResourceGroups
{
    param(
        [hashtable] $SubnetResourceGroups,
        [object] $Resource
    )

    [string]$resourceGroupName = Get-ArchLucidResourceGroupNameFromResourceId -ResourceId "$( $Resource.resourceId )"

    if ([string]::IsNullOrWhiteSpace($resourceGroupName)) { return }

    [string]$subnetsJson = "$( $Resource.properties.subnets )".Trim()

    if ([string]::IsNullOrWhiteSpace($subnetsJson)) { return }

    try
    {
        [object[]]$subnets = @($subnetsJson | ConvertFrom-Json -ErrorAction Stop)
    }
    catch
    {
        return
    }

    foreach ($subnet in @($subnets))
    {
        [string]$subnetId = "$( $subnet.id )".Trim()

        if ([string]::IsNullOrWhiteSpace($subnetId)) { continue }

        $SubnetResourceGroups[$subnetId] = $resourceGroupName
    }
}

function Get-ArchLucidSubnetNetworkSecurityGroupId
{
    param(
        [string] $SubnetId,
        [object[]] $InventoryResources
    )

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()

        if (-not ($resourceType -like "*virtualNetworks*")) { continue }

        [string]$subnetsJson = "$( $resource.properties.subnets )".Trim()

        if ([string]::IsNullOrWhiteSpace($subnetsJson)) { continue }

        try
        {
            [object[]]$subnets = @($subnetsJson | ConvertFrom-Json -ErrorAction Stop)
        }
        catch
        {
            continue
        }

        foreach ($subnet in @($subnets))
        {
            [string]$candidateSubnetId = "$( $subnet.id )".Trim()

            if (-not ($candidateSubnetId -eq $SubnetId)) { continue }

            [string]$nsgId = "$( $subnet.properties.networkSecurityGroup.id )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($nsgId)))
            {
                return $nsgId
            }
        }
    }

    return $null
}

function Get-ArchLucidResourceGroupNameFromResourceId([string] $ResourceId)
{
    if ([string]::IsNullOrWhiteSpace($ResourceId)) { return $null }

    [string]$marker = "/resourceGroups/"
    [int]$markerIndex = $ResourceId.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase)

    if ($markerIndex -lt 0) { return $null }

    [int]$startIndex = $markerIndex + $marker.Length
    [int]$endIndex = $ResourceId.IndexOf("/", $startIndex)

    if ($endIndex -lt 0) { return $null }

    return $ResourceId.Substring($startIndex, $endIndex - $startIndex)
}

function Test-ArchLucidPathRelevantDiagnosticResourceType
{
    param(
        [string] $ResourceType
    )

    if ([string]::IsNullOrWhiteSpace($ResourceType))
    {
        return $false
    }

    return $ResourceType -eq 'Microsoft.Storage/storageAccounts' `
        -or $ResourceType -eq 'Microsoft.KeyVault/vaults' `
        -or $ResourceType -eq 'Microsoft.Network/networkSecurityGroups' `
        -or $ResourceType -eq 'Microsoft.Sql/servers' `
        -or $ResourceType -eq 'Microsoft.DataFactory/factories' `
        -or $ResourceType -eq 'Microsoft.Synapse/workspaces' `
        -or $ResourceType -eq 'Microsoft.EventHub/namespaces' `
        -or $ResourceType -eq 'Microsoft.ServiceBus/namespaces' `
        -or $ResourceType -eq 'Microsoft.Web/sites' `
        -or $ResourceType -eq 'Microsoft.ContainerService/managedClusters' `
        -or $ResourceType -eq 'Microsoft.Network/applicationGateways' `
        -or $ResourceType -eq 'Microsoft.Network/azureFirewalls' `
        -or $ResourceType -eq 'Microsoft.DocumentDB/databaseAccounts'
}

function Get-ArchLucidAzurePolicyAssignmentCompanionRows
{
    param(
        [object[]] $PolicyAssignments
    )

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($assignment in @($PolicyAssignments))
    {
        if ($null -eq $assignment) { continue }

        [string]$scope = "$( $assignment.Scope )".Trim()
        [string]$policyDefinitionId = "$( $assignment.PolicyDefinitionId )".Trim()
        [string]$policySetDefinitionId = "$( $assignment.PolicySetDefinitionId )".Trim()
        [string]$definitionId = $(if (-not ([string]::IsNullOrWhiteSpace($policyDefinitionId))) { $policyDefinitionId } else { $policySetDefinitionId })

        if ([string]::IsNullOrWhiteSpace($scope)) { continue }
        if ([string]::IsNullOrWhiteSpace($definitionId)) { continue }

        [string]$name = "$( $assignment.Name )".Trim()
        [string]$key = "$scope|$definitionId|$name"

        if ($seen.ContainsKey($key))
        {
            continue
        }

        $seen[$key] = $true

        [void]$rows.Add([ordered]@{
            scope = $scope
            policyDefinitionId = $definitionId
            name = $(if ([string]::IsNullOrWhiteSpace($name)) { $null } else { $name })
            assignmentId = $assignment.ResourceId
        })
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureDiagnosticSettingCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if (-not (Test-ArchLucidPathRelevantDiagnosticResourceType -ResourceType $resourceType)) { continue }
        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        try
        {
            [string]$path = "$resourceId/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($setting in @($payload.value))
            {
                [string]$name = "$( $setting.name )".Trim()

                if ([string]::IsNullOrWhiteSpace($name)) { continue }

                [string]$workspaceId = "$( $setting.properties.workspaceId )".Trim()

                if ([string]::IsNullOrWhiteSpace($workspaceId))
                {
                    try
                    {
                        $workspaceId = "$( $setting.properties.workspaces[0].workspaceResourceId )".Trim()
                    }
                    catch
                    {
                    }
                }

                [string]$storageAccountId = ''
                [string]$eventHubAuthorizationRuleId = ''

                try
                {
                    $storageAccountId = "$( $setting.properties.storageAccountId )".Trim()
                }
                catch
                {
                }

                try
                {
                    $eventHubAuthorizationRuleId = "$( $setting.properties.eventHubAuthorizationRuleId )".Trim()
                }
                catch
                {
                }

                if ([string]::IsNullOrWhiteSpace($workspaceId) -and [string]::IsNullOrWhiteSpace($storageAccountId) -and [string]::IsNullOrWhiteSpace($eventHubAuthorizationRuleId))
                {
                    continue
                }

                [string]$key = "$resourceId|$name|$workspaceId|$storageAccountId|$eventHubAuthorizationRuleId"

                if ($seen.ContainsKey($key))
                {
                    continue
                }

                $seen[$key] = $true

                [void]$rows.Add([ordered]@{
                    targetResourceId = $resourceId
                    name = $name
                    workspaceId = $(if ([string]::IsNullOrWhiteSpace($workspaceId)) { $null } else { $workspaceId })
                    storageAccountId = $(if ([string]::IsNullOrWhiteSpace($storageAccountId)) { $null } else { $storageAccountId })
                    eventHubAuthorizationRuleId = $(if ([string]::IsNullOrWhiteSpace($eventHubAuthorizationRuleId)) { $null } else { $eventHubAuthorizationRuleId })
                })
            }
        }
        catch
        {
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureDefenderSummaryCompanionRows
{
    param(
        [string] $SubscriptionId,

        [string] $ManagementGroupId
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $subscriptionIds = [System.Collections.ArrayList]::new()

    if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
    {
        [void]$subscriptionIds.Add($SubscriptionId.Trim())
    }
    elseif (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
    {
        if (Get-Command Get-ArchLucidManagementGroupSubscriptionIds -ErrorAction SilentlyContinue)
        {
            foreach ($subId in @(Get-ArchLucidManagementGroupSubscriptionIds -ManagementGroupId $ManagementGroupId))
            {
                if (-not ([string]::IsNullOrWhiteSpace($subId)))
                {
                    [void]$subscriptionIds.Add($subId.Trim())
                }
            }
        }
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($subId in @($subscriptionIds))
    {
        try
        {
            [string]$path = "/subscriptions/$subId/providers/Microsoft.Security/secureScores?api-version=2020-01-01"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop
            [int]$secureScore = Get-ArchLucidAzureDefenderSecureScorePercent -SecureScoresPayload $payload

            if ($secureScore -lt 0)
            {
                continue
            }

            [string]$resourceId = "/subscriptions/$subId"

            if ($seen.ContainsKey($resourceId))
            {
                continue
            }

            $seen[$resourceId] = $true

            [void]$rows.Add([ordered]@{
                resourceId = $resourceId
                secureScore = $secureScore
            })
        }
        catch
        {
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureDefenderSecureScorePercent
{
    param(
        [Parameter(Mandatory = $true)]
        $SecureScoresPayload
    )

    [int]$bestScore = -1

    foreach ($item in @($SecureScoresPayload.value))
    {
        if ($null -eq $item) { continue }

        [double]$percent = -1

        try
        {
            if ($null -ne $item.properties.score.percentage)
            {
                $percent = [double]$item.properties.score.percentage * 100.0
            }
            elseif ($null -ne $item.properties.score.current -and $null -ne $item.properties.score.max)
            {
                [double]$max = [double]$item.properties.score.max

                if ($max -gt 0)
                {
                    $percent = ([double]$item.properties.score.current / $max) * 100.0
                }
            }
        }
        catch
        {
            continue
        }

        if ($percent -lt 0)
        {
            continue
        }

        [int]$rounded = [int][Math]::Round([Math]::Min(100.0, [Math]::Max(0.0, $percent)), [MidpointRounding]::AwayFromZero)

        if ($rounded -gt $bestScore)
        {
            $bestScore = $rounded
        }
    }

    return $bestScore
}

function Test-ArchLucidAzureFactoryStyleResource
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $ResourceType
    )

    [string]$trimmed = $ResourceType.Trim()

    return ($trimmed -eq 'Microsoft.DataFactory/factories') -or ($trimmed -eq 'Microsoft.Synapse/workspaces')
}

function Get-ArchLucidAzureFactoryStyleApiVersion
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $FactoryResourceId
    )

    if ($FactoryResourceId -match '/providers/Microsoft\.Synapse/workspaces/')
    {
        return '2020-12-01'
    }

    return '2018-06-01'
}

function Get-ArchLucidAzureAdfLinkedServiceCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $supportedTypes = @(
        'AzureBlobStorage', 'AzureBlobFS', 'AzureSqlDatabase', 'AzureSqlMI', 'AzureSynapseAnalytics',
        'AzureDataLakeStore', 'AzureKeyVault', 'AzureCosmosDb', 'CosmosDb', 'AzurePostgreSql', 'AzureMySql',
        'AzureTableStorage', 'AzureEventHub', 'EventHub', 'AzureServiceBus', 'ServiceBus', 'AzureDatabricks',
        'Snowflake', 'SapTable', 'SapOpenHub', 'SapEcc', 'SapHana', 'Oracle', 'OracleServiceCloud',
        'FtpServer', 'Sftp', 'FileServer', 'Hdfs', 'RestService', 'HttpServer', 'Web',
        'AmazonS3', 'GoogleCloudStorage'
    )

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$factoryResourceId = "$( $resource.resourceId )".Trim()

        if (-not (Test-ArchLucidAzureFactoryStyleResource -ResourceType $resourceType)) { continue }
        if ([string]::IsNullOrWhiteSpace($factoryResourceId)) { continue }

        try
        {
            [string]$apiVersion = Get-ArchLucidAzureFactoryStyleApiVersion -FactoryResourceId $factoryResourceId
            [string]$path = "$factoryResourceId/linkedservices?api-version=$apiVersion"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($linkedService in @($payload.value))
            {
                [string]$linkedServiceResourceId = "$( $linkedService.id )".Trim()
                [string]$linkedServiceName = "$( $linkedService.name )".Trim()
                [string]$linkedServiceType = "$( $linkedService.properties.type )".Trim()

                if ([string]::IsNullOrWhiteSpace($linkedServiceResourceId) -or [string]::IsNullOrWhiteSpace($linkedServiceName))
                {
                    continue
                }

                if ($supportedTypes -notcontains $linkedServiceType)
                {
                    [void]$rows.Add([ordered]@{
                        factoryResourceId = $factoryResourceId
                        linkedServiceResourceId = $linkedServiceResourceId
                        linkedServiceName = $linkedServiceName
                        linkedServiceType = $linkedServiceType
                        collectionStatus = 'UnsupportedConnector'
                        warningCode = "adf-unsupported-connector:$linkedServiceType"
                    })

                    continue
                }

                $normalized = New-ArchLucidAzureAdfLinkedServiceNormalizedRow `
                    -FactoryResourceId $factoryResourceId `
                    -LinkedServiceResourceId $linkedServiceResourceId `
                    -LinkedServiceName $linkedServiceName `
                    -LinkedServiceType $linkedServiceType `
                    -Properties $linkedService.properties

                if ($null -ne $normalized)
                {
                    [void]$rows.Add($normalized)
                }
            }
        }
        catch
        {
            [void]$rows.Add([ordered]@{
                factoryResourceId = $factoryResourceId
                linkedServiceResourceId = "$factoryResourceId/linkedservices/_collection_failed"
                linkedServiceName = '_collection_failed'
                linkedServiceType = 'CollectionFailure'
                collectionStatus = 'Forbidden'
                warningCode = "adf-factory-collection-failed:$factoryResourceId"
            })
        }
    }

    return @($rows.ToArray())
}

function New-ArchLucidAzureAdfLinkedServiceNormalizedRow
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $FactoryResourceId,

        [Parameter(Mandatory = $true)]
        [string] $LinkedServiceResourceId,

        [Parameter(Mandatory = $true)]
        [string] $LinkedServiceName,

        [Parameter(Mandatory = $true)]
        [string] $LinkedServiceType,

        [Parameter(Mandatory = $true)]
        [object] $Properties
    )

    $typeProperties = $Properties.typeProperties
    [string]$integrationRuntimeName = ''

    try
    {
        $integrationRuntimeName = "$( $Properties.connectVia.referenceName )".Trim()
    }
    catch
    {
    }

    [string]$targetResourceId = ''
    [string]$targetHost = ''
    [string]$keyVaultResourceId = ''
    [string]$collectionStatus = 'Succeeded'
    [string]$warningCode = $null

    if ($LinkedServiceType -eq 'AzureBlobStorage')
    {
        [string]$serviceEndpoint = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'serviceEndpoint'

        if ($serviceEndpoint -like '/subscriptions/*')
        {
            $targetResourceId = $serviceEndpoint
        }
        else
        {
            $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value $serviceEndpoint
        }
    }
    elseif ($LinkedServiceType -eq 'AzureBlobFS')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'url')
    }
    elseif ($LinkedServiceType -eq 'AzureSqlDatabase')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'server')
    }
    elseif ($LinkedServiceType -eq 'AzureSqlMI')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'instanceName')
    }
    elseif ($LinkedServiceType -eq 'AzureSynapseAnalytics')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'endpoint')
        if ([string]::IsNullOrWhiteSpace($targetHost))
        {
            $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'server')
        }
    }
    elseif ($LinkedServiceType -eq 'AzureDataLakeStore')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'dataLakeStoreUri')
    }
    elseif ($LinkedServiceType -eq 'AzureKeyVault')
    {
        [string]$baseUrl = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'baseUrl'
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value $baseUrl
    }
    elseif ($LinkedServiceType -eq 'AzureCosmosDb' -or $LinkedServiceType -eq 'CosmosDb')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'accountEndpoint')
    }
    elseif ($LinkedServiceType -eq 'AzurePostgreSql' -or $LinkedServiceType -eq 'AzureMySql')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'server')
    }
    elseif ($LinkedServiceType -eq 'AzureEventHub' -or $LinkedServiceType -eq 'EventHub' -or $LinkedServiceType -eq 'AzureServiceBus' -or $LinkedServiceType -eq 'ServiceBus')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'fullyQualifiedNamespace')
    }
    elseif ($LinkedServiceType -eq 'RestService' -or $LinkedServiceType -eq 'HttpServer' -or $LinkedServiceType -eq 'Web')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'url')
        if ([string]::IsNullOrWhiteSpace($targetHost))
        {
            $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'baseUrl')
        }
    }
    elseif ($LinkedServiceType -eq 'SapTable' -or $LinkedServiceType -eq 'SapOpenHub' -or $LinkedServiceType -eq 'SapEcc' -or $LinkedServiceType -eq 'SapHana')
    {
        $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'server')
        if ([string]::IsNullOrWhiteSpace($targetHost))
        {
            $targetHost = Get-ArchLucidAzureAdfHostFromValue -Value (Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'messageServer')
        }
    }

    if ([string]::IsNullOrWhiteSpace($targetResourceId) -and [string]::IsNullOrWhiteSpace($targetHost) -and [string]::IsNullOrWhiteSpace($keyVaultResourceId))
    {
        $collectionStatus = 'TargetUnresolved'
        $warningCode = "adf-target-unresolved:$LinkedServiceName"
    }

    return [ordered]@{
        factoryResourceId = $FactoryResourceId
        linkedServiceResourceId = $LinkedServiceResourceId
        linkedServiceName = $LinkedServiceName
        linkedServiceType = $LinkedServiceType
        targetResourceId = $(if ([string]::IsNullOrWhiteSpace($targetResourceId)) { $null } else { $targetResourceId })
        targetHost = $(if ([string]::IsNullOrWhiteSpace($targetHost)) { $null } else { $targetHost })
        keyVaultResourceId = $(if ([string]::IsNullOrWhiteSpace($keyVaultResourceId)) { $null } else { $keyVaultResourceId })
        integrationRuntimeName = $(if ([string]::IsNullOrWhiteSpace($integrationRuntimeName)) { $null } else { $integrationRuntimeName })
        collectionStatus = $collectionStatus
        warningCode = $warningCode
    }
}

function Get-ArchLucidAzureAdfAllowedScalar
{
    param(
        [object] $Object,
        [Parameter(Mandatory = $true)]
        [string] $PropertyName
    )

    if ($null -eq $Object) { return '' }

    $blocked = @(
        'connectionString', 'password', 'accountKey', 'secretKey', 'clientSecret',
        'servicePrincipalKey', 'encryptedCredential', 'sasToken', 'accessKey', 'apiKey', 'token', 'key', 'credentials'
    )

    if ($blocked -contains $PropertyName) { return '' }

    try
    {
        $value = $Object.$PropertyName

        if ($null -eq $value) { return '' }

        if ($value -is [System.Management.Automation.PSCustomObject] -and "$( $value.type )".Trim() -eq 'SecureString')
        {
            return ''
        }

        return "$( $value )".Trim()
    }
    catch
    {
        return ''
    }
}

function Get-ArchLucidAzureAdfHostFromValue
{
    param(
        [string] $Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) { return '' }
    if ($Value -like '/subscriptions/*') { return '' }

    try
    {
        $uri = [Uri]$Value
        return $uri.Host.ToLowerInvariant()
    }
    catch
    {
        [string]$trimmed = $Value.Trim().TrimEnd('.')
        if ($trimmed.StartsWith('tcp:', [System.StringComparison]::OrdinalIgnoreCase))
        {
            $trimmed = $trimmed.Substring(4)
        }

        $commaIndex = $trimmed.IndexOf(',')
        if ($commaIndex -ge 0)
        {
            $trimmed = $trimmed.Substring(0, $commaIndex)
        }

        return $trimmed.ToLowerInvariant()
    }
}

function Test-ArchLucidAzureAdfStaticReferenceName
{
    param(
        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [string] $ReferenceName
    )

    if ([string]::IsNullOrWhiteSpace($ReferenceName)) { return $false }

    [string]$trimmed = $ReferenceName.Trim()

    if ($trimmed.Contains('@') -or $trimmed.Contains('${') -or $trimmed.StartsWith('[')) { return $false }

    return $true
}

function Get-ArchLucidAzureAdfDatasetCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$factoryResourceId = "$( $resource.resourceId )".Trim()

        if (-not (Test-ArchLucidAzureFactoryStyleResource -ResourceType $resourceType)) { continue }
        if ([string]::IsNullOrWhiteSpace($factoryResourceId)) { continue }

        try
        {
            [string]$apiVersion = Get-ArchLucidAzureFactoryStyleApiVersion -FactoryResourceId $factoryResourceId
            [string]$path = "$factoryResourceId/datasets?api-version=$apiVersion"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($dataset in @($payload.value))
            {
                [string]$datasetResourceId = "$( $dataset.id )".Trim()
                [string]$datasetName = "$( $dataset.name )".Trim()

                if ([string]::IsNullOrWhiteSpace($datasetResourceId) -or [string]::IsNullOrWhiteSpace($datasetName))
                {
                    continue
                }

                [string]$linkedServiceName = ''
                try
                {
                    $linkedServiceName = "$( $dataset.properties.linkedServiceName.referenceName )".Trim()
                }
                catch
                {
                }

                if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $linkedServiceName))
                {
                    [void]$rows.Add([ordered]@{
                        factoryResourceId = $factoryResourceId
                        datasetResourceId = $datasetResourceId
                        datasetName = $datasetName
                        linkedServiceName = '_unresolved'
                        collectionStatus = 'TargetUnresolved'
                        warningCode = "adf-target-unresolved:$datasetName"
                    })

                    continue
                }

                $location = Get-ArchLucidAzureAdfDatasetLocationFields -Properties $dataset.properties

                [void]$rows.Add([ordered]@{
                    factoryResourceId = $factoryResourceId
                    datasetResourceId = $datasetResourceId
                    datasetName = $datasetName
                    linkedServiceName = $linkedServiceName
                    locationKind = $location.locationKind
                    containerOrFilesystem = $location.containerOrFilesystem
                    folderPath = $location.folderPath
                    tableName = $location.tableName
                    schemaName = $location.schemaName
                    collectionStatus = 'Succeeded'
                })
            }
        }
        catch
        {
            continue
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureAdfDatasetLocationFields
{
    param(
        [Parameter(Mandatory = $true)]
        [object] $Properties
    )

    [string]$locationKind = ''
    [string]$containerOrFilesystem = ''
    [string]$folderPath = ''
    [string]$tableName = ''
    [string]$schemaName = ''

    try
    {
        $locationKind = "$( $Properties.type )".Trim()
        $typeProperties = $Properties.typeProperties

        $folderPath = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'folderPath'
        if ([string]::IsNullOrWhiteSpace($folderPath))
        {
            $folderPath = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'directory'
        }

        $containerOrFilesystem = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'fileSystem'
        if ([string]::IsNullOrWhiteSpace($containerOrFilesystem))
        {
            $containerOrFilesystem = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'container'
        }

        $tableName = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'tableName'
        if ([string]::IsNullOrWhiteSpace($tableName))
        {
            $tableName = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'table'
        }

        $schemaName = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'schema'
        if ([string]::IsNullOrWhiteSpace($schemaName))
        {
            $schemaName = Get-ArchLucidAzureAdfAllowedScalar -Object $typeProperties -PropertyName 'schemaName'
        }
    }
    catch
    {
    }

    return [ordered]@{
        locationKind = $(if ([string]::IsNullOrWhiteSpace($locationKind)) { $null } else { $locationKind })
        containerOrFilesystem = $(if ([string]::IsNullOrWhiteSpace($containerOrFilesystem)) { $null } else { $containerOrFilesystem })
        folderPath = $(if ([string]::IsNullOrWhiteSpace($folderPath)) { $null } else { $folderPath })
        tableName = $(if ([string]::IsNullOrWhiteSpace($tableName)) { $null } else { $tableName })
        schemaName = $(if ([string]::IsNullOrWhiteSpace($schemaName)) { $null } else { $schemaName })
    }
}

function Get-ArchLucidAzureAdfPipelineFlowCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources,

        [Parameter(Mandatory = $false)]
        [int] $MaxNestedPipelineDepth = 3
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$factoryResourceId = "$( $resource.resourceId )".Trim()

        if (-not (Test-ArchLucidAzureFactoryStyleResource -ResourceType $resourceType)) { continue }
        if ([string]::IsNullOrWhiteSpace($factoryResourceId)) { continue }

        try
        {
            [string]$apiVersion = Get-ArchLucidAzureFactoryStyleApiVersion -FactoryResourceId $factoryResourceId
            [string]$path = "$factoryResourceId/pipelines?api-version=$apiVersion"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop
            $pipelineResources = @($payload.value)

            $pipelinesByName = @{}
            foreach ($pipeline in $pipelineResources)
            {
                [string]$pipelineName = "$( $pipeline.name )".Trim()
                if (-not [string]::IsNullOrWhiteSpace($pipelineName))
                {
                    $pipelinesByName[$pipelineName] = $pipeline
                }
            }

            $flowKeys = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

            foreach ($pipeline in $pipelineResources)
            {
                [string]$pipelineResourceId = "$( $pipeline.id )".Trim()
                [string]$pipelineName = "$( $pipeline.name )".Trim()

                if ([string]::IsNullOrWhiteSpace($pipelineResourceId) -or [string]::IsNullOrWhiteSpace($pipelineName))
                {
                    continue
                }

                Add-ArchLucidAzureAdfPipelineActivityFlows `
                    -FactoryResourceId $factoryResourceId `
                    -PipelineResourceId $pipelineResourceId `
                    -PipelineName $pipelineName `
                    -PipelineResource $pipeline `
                    -PipelinesByName $pipelinesByName `
                    -RemainingNestedDepth $MaxNestedPipelineDepth `
                    -PipelineVisitStack @() `
                    -Rows $rows `
                    -FlowKeys $flowKeys
            }
        }
        catch
        {
            continue
        }
    }

    return @($rows.ToArray())
}

function Add-ArchLucidAzureAdfPipelineActivityFlows
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $FactoryResourceId,

        [Parameter(Mandatory = $true)]
        [string] $PipelineResourceId,

        [Parameter(Mandatory = $true)]
        [string] $PipelineName,

        [Parameter(Mandatory = $true)]
        [object] $PipelineResource,

        [Parameter(Mandatory = $true)]
        [hashtable] $PipelinesByName,

        [Parameter(Mandatory = $true)]
        [int] $RemainingNestedDepth,

        [Parameter(Mandatory = $true)]
        [string[]] $PipelineVisitStack,

        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList] $Rows,

        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.HashSet[string]] $FlowKeys
    )

    $activities = @($PipelineResource.properties.activities)
    if ($null -eq $activities) { return }

    foreach ($activity in $activities)
    {
        [string]$activityName = "$( $activity.name )".Trim()
        [string]$activityType = "$( $activity.type )".Trim()

        if ([string]::IsNullOrWhiteSpace($activityName) -or [string]::IsNullOrWhiteSpace($activityType))
        {
            continue
        }

        if ($activityType -eq 'ExecutePipeline')
        {
            if ($RemainingNestedDepth -le 0) { continue }

            [string]$nestedPipelineName = ''
            try
            {
                $nestedPipelineName = "$( $activity.typeProperties.pipeline.referenceName )".Trim()
            }
            catch
            {
            }

            if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $nestedPipelineName)) { continue }
            if (-not $PipelinesByName.ContainsKey($nestedPipelineName)) { continue }

            if ($PipelineVisitStack -contains $nestedPipelineName) { continue }

            $nestedPipeline = $PipelinesByName[$nestedPipelineName]
            [string]$nestedPipelineResourceId = "$( $nestedPipeline.id )".Trim()

            if ([string]::IsNullOrWhiteSpace($nestedPipelineResourceId)) { continue }

            Add-ArchLucidAzureAdfPipelineActivityFlows `
                -FactoryResourceId $FactoryResourceId `
                -PipelineResourceId $nestedPipelineResourceId `
                -PipelineName $nestedPipelineName `
                -PipelineResource $nestedPipeline `
                -PipelinesByName $PipelinesByName `
                -RemainingNestedDepth ($RemainingNestedDepth - 1) `
                -PipelineVisitStack (@($PipelineVisitStack) + @($nestedPipelineName)) `
                -Rows $Rows `
                -FlowKeys $FlowKeys

            continue
        }

        Add-ArchLucidAzureAdfDatasetReferenceFlows `
            -FactoryResourceId $FactoryResourceId `
            -PipelineResourceId $PipelineResourceId `
            -PipelineName $PipelineName `
            -ActivityName $activityName `
            -ActivityType $activityType `
            -Activity $activity `
            -PropertyName 'inputs' `
            -FlowDirection 'Read' `
            -Rows $Rows `
            -FlowKeys $FlowKeys

        Add-ArchLucidAzureAdfDatasetReferenceFlows `
            -FactoryResourceId $FactoryResourceId `
            -PipelineResourceId $PipelineResourceId `
            -PipelineName $PipelineName `
            -ActivityName $activityName `
            -ActivityType $activityType `
            -Activity $activity `
            -PropertyName 'outputs' `
            -FlowDirection 'Write' `
            -Rows $Rows `
            -FlowKeys $FlowKeys
    }
}

function Add-ArchLucidAzureAdfDatasetReferenceFlows
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $FactoryResourceId,

        [Parameter(Mandatory = $true)]
        [string] $PipelineResourceId,

        [Parameter(Mandatory = $true)]
        [string] $PipelineName,

        [Parameter(Mandatory = $true)]
        [string] $ActivityName,

        [Parameter(Mandatory = $true)]
        [string] $ActivityType,

        [Parameter(Mandatory = $true)]
        [object] $Activity,

        [Parameter(Mandatory = $true)]
        [string] $PropertyName,

        [Parameter(Mandatory = $true)]
        [string] $FlowDirection,

        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList] $Rows,

        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.HashSet[string]] $FlowKeys
    )

    $references = @()
    try
    {
        $references = @($Activity.$PropertyName)
    }
    catch
    {
        return
    }

    foreach ($reference in $references)
    {
        if ($null -eq $reference) { continue }

        [string]$referenceType = ''
        try { $referenceType = "$( $reference.type )".Trim() } catch { }

        if ($referenceType -like '*Expression*') { continue }

        try
        {
            if ($null -ne $reference.parameters -and @($reference.parameters.PSObject.Properties).Count -gt 0)
            {
                continue
            }
        }
        catch
        {
        }

        [string]$datasetName = ''
        try { $datasetName = "$( $reference.referenceName )".Trim() } catch { }

        if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $datasetName)) { continue }

        [string]$flowKey = "$FactoryResourceId|$PipelineResourceId|$ActivityName|$FlowDirection|$datasetName"
        if (-not $FlowKeys.Add($flowKey)) { continue }

        [void]$Rows.Add([ordered]@{
            factoryResourceId = $FactoryResourceId
            pipelineResourceId = $PipelineResourceId
            pipelineName = $PipelineName
            activityName = $ActivityName
            activityType = $ActivityType
            flowDirection = $FlowDirection
            datasetName = $datasetName
            collectionStatus = 'Succeeded'
        })
    }
}

function Get-ArchLucidAzureAdfTriggerCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$factoryResourceId = "$( $resource.resourceId )".Trim()

        if (-not (Test-ArchLucidAzureFactoryStyleResource -ResourceType $resourceType)) { continue }
        if ([string]::IsNullOrWhiteSpace($factoryResourceId)) { continue }

        try
        {
            [string]$apiVersion = Get-ArchLucidAzureFactoryStyleApiVersion -FactoryResourceId $factoryResourceId
            [string]$path = "$factoryResourceId/triggers?api-version=$apiVersion"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($trigger in @($payload.value))
            {
                [string]$triggerResourceId = "$( $trigger.id )".Trim()
                [string]$triggerName = "$( $trigger.name )".Trim()
                [string]$triggerType = "$( $trigger.properties.type )".Trim()

                if ([string]::IsNullOrWhiteSpace($triggerResourceId) -or [string]::IsNullOrWhiteSpace($triggerName) -or [string]::IsNullOrWhiteSpace($triggerType))
                {
                    continue
                }

                [void]$rows.Add([ordered]@{
                    factoryResourceId = $factoryResourceId
                    triggerResourceId = $triggerResourceId
                    triggerName = $triggerName
                    triggerType = $triggerType
                    pipelineNames = @()
                    collectionStatus = 'Succeeded'
                })
            }
        }
        catch
        {
            continue
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureAdfIntegrationRuntimeCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$factoryResourceId = "$( $resource.resourceId )".Trim()

        if (-not (Test-ArchLucidAzureFactoryStyleResource -ResourceType $resourceType)) { continue }
        if ([string]::IsNullOrWhiteSpace($factoryResourceId)) { continue }

        try
        {
            [string]$apiVersion = Get-ArchLucidAzureFactoryStyleApiVersion -FactoryResourceId $factoryResourceId
            [string]$path = "$factoryResourceId/integrationruntimes?api-version=$apiVersion"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($integrationRuntime in @($payload.value))
            {
                [string]$integrationRuntimeResourceId = "$( $integrationRuntime.id )".Trim()
                [string]$name = "$( $integrationRuntime.name )".Trim()
                [string]$kind = "$( $integrationRuntime.properties.type )".Trim()

                if ([string]::IsNullOrWhiteSpace($integrationRuntimeResourceId) -or [string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($kind))
                {
                    continue
                }

                [void]$rows.Add([ordered]@{
                    factoryResourceId = $factoryResourceId
                    integrationRuntimeResourceId = $integrationRuntimeResourceId
                    name = $name
                    kind = $kind
                    collectionStatus = 'Succeeded'
                })
            }
        }
        catch
        {
            continue
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureAdfDataflowCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$factoryResourceId = "$( $resource.resourceId )".Trim()

        if (-not (Test-ArchLucidAzureFactoryStyleResource -ResourceType $resourceType)) { continue }
        if ([string]::IsNullOrWhiteSpace($factoryResourceId)) { continue }

        try
        {
            [string]$apiVersion = Get-ArchLucidAzureFactoryStyleApiVersion -FactoryResourceId $factoryResourceId
            [string]$path = "$factoryResourceId/dataflows?api-version=$apiVersion"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($dataflow in @($payload.value))
            {
                [string]$dataflowResourceId = "$( $dataflow.id )".Trim()
                [string]$dataflowName = "$( $dataflow.name )".Trim()

                if ([string]::IsNullOrWhiteSpace($dataflowResourceId) -or [string]::IsNullOrWhiteSpace($dataflowName))
                {
                    continue
                }

                [void]$rows.Add([ordered]@{
                    factoryResourceId = $factoryResourceId
                    dataflowResourceId = $dataflowResourceId
                    dataflowName = $dataflowName
                    sourceLinkedServiceNames = @()
                    sinkLinkedServiceNames = @()
                    collectionStatus = 'Succeeded'
                })
            }
        }
        catch
        {
            continue
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureEventGridWebhookHost
{
    param(
        [string] $EndpointUrl
    )

    if ([string]::IsNullOrWhiteSpace($EndpointUrl)) { return '' }

    try
    {
        $uri = [Uri]$EndpointUrl.Trim()
        return $uri.Host.ToLowerInvariant()
    }
    catch
    {
        return ''
    }
}

function Get-ArchLucidAzureEventGridSubscriptionCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources,

        [string] $SubscriptionId
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$sourceResourceId = "$( $resource.resourceId )".Trim()

        if ($resourceType -notin @('Microsoft.EventGrid/topics', 'Microsoft.EventGrid/domains', 'Microsoft.EventGrid/systemTopics')) { continue }
        if ([string]::IsNullOrWhiteSpace($sourceResourceId)) { continue }

        try
        {
            [string]$path = "$sourceResourceId/eventSubscriptions?api-version=2022-06-15"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($subscription in @($payload.value))
            {
                [string]$subscriptionName = "$( $subscription.name )".Trim()
                [string]$destinationKind = "$( $subscription.properties.destination.endpointType )".Trim()
                [string]$destinationResourceId = ''
                [string]$destinationHost = ''

                if ($destinationKind -eq 'WebHook')
                {
                    $destinationHost = Get-ArchLucidAzureEventGridWebhookHost -EndpointUrl "$( $subscription.properties.destination.endpointUrl )"
                }
                else
                {
                    $destinationResourceId = "$( $subscription.properties.destination.resourceId )".Trim()
                }

                [string]$key = "$sourceResourceId|$subscriptionName|$destinationResourceId|$destinationHost"
                if ($seen.ContainsKey($key)) { continue }
                $seen[$key] = $true

                [void]$rows.Add([ordered]@{
                    sourceResourceId = $sourceResourceId
                    subscriptionName = $subscriptionName
                    subscriptionResourceId = "$( $subscription.id )".Trim()
                    destinationResourceId = $(if ([string]::IsNullOrWhiteSpace($destinationResourceId)) { $null } else { $destinationResourceId })
                    destinationHost = $(if ([string]::IsNullOrWhiteSpace($destinationHost)) { $null } else { $destinationHost })
                    destinationKind = $destinationKind
                    collectionStatus = 'Succeeded'
                })
            }
        }
        catch
        {
            continue
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($SubscriptionId))
    {
        try
        {
            [string]$sourceResourceId = "/subscriptions/$($SubscriptionId.Trim())"
            [string]$path = "$sourceResourceId/providers/Microsoft.EventGrid/eventSubscriptions?api-version=2022-06-15"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($subscription in @($payload.value))
            {
                [string]$subscriptionName = "$( $subscription.name )".Trim()
                [string]$destinationKind = "$( $subscription.properties.destination.endpointType )".Trim()
                [string]$destinationResourceId = "$( $subscription.properties.destination.resourceId )".Trim()

                [string]$key = "$sourceResourceId|$subscriptionName|$destinationResourceId|"
                if ($seen.ContainsKey($key)) { continue }
                $seen[$key] = $true

                [void]$rows.Add([ordered]@{
                    sourceResourceId = $sourceResourceId
                    subscriptionName = $subscriptionName
                    subscriptionResourceId = "$( $subscription.id )".Trim()
                    destinationResourceId = $(if ([string]::IsNullOrWhiteSpace($destinationResourceId)) { $null } else { $destinationResourceId })
                    destinationKind = $destinationKind
                    collectionStatus = 'Succeeded'
                })
            }
        }
        catch
        {
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureLogicAppConnectionCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ($resourceType -eq 'Microsoft.Logic/workflows' -and -not [string]::IsNullOrWhiteSpace($resourceId))
        {
            try
            {
                [string]$path = "$resourceId?api-version=2019-05-01"
                $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
                $workflow = $response.Content | ConvertFrom-Json -ErrorAction Stop
                $connections = $workflow.properties.parameters.'$connections'.value

                foreach ($property in $connections.PSObject.Properties)
                {
                    [string]$connectionName = $property.Name
                    [string]$connectionResourceId = "$( $property.Value.connectionId )".Trim()

                    if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $connectionName)) { continue }
                    if ([string]::IsNullOrWhiteSpace($connectionResourceId)) { continue }

                    [string]$key = "$resourceId|$connectionName|$connectionResourceId"
                    if ($seen.ContainsKey($key)) { continue }
                    $seen[$key] = $true

                    [void]$rows.Add([ordered]@{
                        workflowResourceId = $resourceId
                        workflowName = "$( $workflow.name )".Trim()
                        connectionName = $connectionName
                        connectionResourceId = $connectionResourceId
                        collectionStatus = 'Succeeded'
                    })
                }
            }
            catch
            {
            }
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureMessagingAssociationCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$parentResourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($parentResourceId)) { continue }

        if ($resourceType -eq 'Microsoft.EventHub/namespaces')
        {
            try
            {
                [string]$path = "$parentResourceId/eventhubs?api-version=2021-11-01"
                $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
                $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

                foreach ($eventHub in @($payload.value))
                {
                    [string]$childResourceId = "$( $eventHub.id )".Trim()
                    [string]$childName = "$( $eventHub.name )".Trim()
                    [string]$captureStorageAccountId = ''

                    try
                    {
                        $captureStorageAccountId = "$( $eventHub.properties.captureDescription.destination.storageAccountResourceId )".Trim()
                    }
                    catch
                    {
                    }

                    [string]$key = "$parentResourceId|$childResourceId|eventHub"
                    if ($seen.ContainsKey($key)) { continue }
                    $seen[$key] = $true

                    [void]$rows.Add([ordered]@{
                        parentResourceId = $parentResourceId
                        childResourceId = $childResourceId
                        childName = $childName
                        childType = 'eventHub'
                        associationType = 'messagingChild'
                        captureStorageAccountId = $(if ([string]::IsNullOrWhiteSpace($captureStorageAccountId)) { $null } else { $captureStorageAccountId })
                        collectionStatus = 'Succeeded'
                    })
                }
            }
            catch
            {
            }

            continue
        }

        if ($resourceType -eq 'Microsoft.ServiceBus/namespaces')
        {
            foreach ($childCollection in @('queues', 'topics'))
            {
                try
                {
                    [string]$path = "$parentResourceId/$childCollection?api-version=2021-11-01"
                    $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
                    $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

                    foreach ($child in @($payload.value))
                    {
                        [string]$childResourceId = "$( $child.id )".Trim()
                        [string]$childName = "$( $child.name )".Trim()
                        [string]$childType = if ($childCollection -eq 'queues') { 'serviceBusQueue' } else { 'serviceBusTopic' }

                        [string]$key = "$parentResourceId|$childResourceId|$childType"
                        if ($seen.ContainsKey($key)) { continue }
                        $seen[$key] = $true

                        [void]$rows.Add([ordered]@{
                            parentResourceId = $parentResourceId
                            childResourceId = $childResourceId
                            childName = $childName
                            childType = $childType
                            associationType = 'messagingChild'
                            collectionStatus = 'Succeeded'
                        })
                    }
                }
                catch
                {
                }
            }
        }
    }

    return @($rows.ToArray())
}

function Test-ArchLucidAzureAppSettingHostRejectedValue
{
    param(
        [Parameter(Mandatory = $false)]
        [string] $Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) { return $false }

    foreach ($token in @('Password=', 'SharedAccessKey=', 'AccountKey=', 'token=', 'secret=', 'key='))
    {
        if ($Value.IndexOf($token, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
        {
            return $true
        }
    }

    return $false
}

function Get-ArchLucidAzureAppSettingHostFromValue
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SettingName,

        [Parameter(Mandatory = $false)]
        [string] $Value
    )

    if (Test-ArchLucidAzureAppSettingHostRejectedValue -Value $Value)
    {
        return $null
    }

    $row = [ordered]@{
        settingName = $SettingName
        parsedHost = $null
        keyVaultHost = $null
        secretName = $null
    }

    if (-not [string]::IsNullOrWhiteSpace($Value))
    {
        $sqlMatch = [regex]::Match($Value, 'Server\s*=\s*tcp:(?<host>[^,;]+)', 'IgnoreCase')

        if ($sqlMatch.Success)
        {
            $row.parsedHost = $sqlMatch.Groups['host'].Value.Trim().ToLowerInvariant()
        }

        $kvMatch = [regex]::Match(
            $Value,
            '@Microsoft\.KeyVault\(SecretUri\s*=\s*https?://(?<host>[^/]+)/secrets/(?<secret>[^/)]+)',
            'IgnoreCase')

        if ($kvMatch.Success)
        {
            $row.keyVaultHost = $kvMatch.Groups['host'].Value.Trim().ToLowerInvariant()
            $row.secretName = $kvMatch.Groups['secret'].Value.Trim()
        }
    }

    if ([string]::IsNullOrWhiteSpace($row.parsedHost) -and [string]::IsNullOrWhiteSpace($row.keyVaultHost))
    {
        return $null
    }

    return $row
}

function Get-ArchLucidAzureAppSettingHostCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$siteResourceId = "$( $resource.resourceId )".Trim()

        if ($resourceType -ne 'Microsoft.Web/sites') { continue }
        if ([string]::IsNullOrWhiteSpace($siteResourceId)) { continue }

        foreach ($listPath in @('config/appsettings/list', 'config/connectionstrings/list'))
        {
            try
            {
                [string]$path = "$siteResourceId/$listPath?api-version=2022-03-01"
                $response = Invoke-AzRestMethod -Method POST -Path $path -Payload '{}' -ErrorAction Stop

                if ($response.StatusCode -eq 403 -or $response.StatusCode -eq 404)
                {
                    continue
                }

                if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
                {
                    continue
                }

                $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

                foreach ($property in @($payload.properties.PSObject.Properties))
                {
                    [string]$settingName = "$( $property.Name )".Trim()
                    [string]$settingValue = "$( $property.Value )".Trim()
                    $parsed = Get-ArchLucidAzureAppSettingHostFromValue -SettingName $settingName -Value $settingValue

                    if ($null -eq $parsed) { continue }

                    [string]$key = "$siteResourceId|$settingName|$($parsed.parsedHost)|$($parsed.keyVaultHost)|$($parsed.secretName)"

                    if ($seen.ContainsKey($key)) { continue }
                    $seen[$key] = $true

                    [void]$rows.Add([ordered]@{
                        siteResourceId = $siteResourceId
                        settingName = $settingName
                        host = $parsed.parsedHost
                        keyVaultHost = $parsed.keyVaultHost
                        secretName = $parsed.secretName
                        collectionStatus = 'Succeeded'
                    })
                }
            }
            catch
            {
            }
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureServiceConnectorCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$sourceResourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($sourceResourceId)) { continue }

        if ($resourceType -ne 'Microsoft.Web/sites' -and $resourceType -ne 'Microsoft.App/containerApps')
        {
            continue
        }

        try
        {
            [string]$path = "$sourceResourceId/providers/Microsoft.ServiceLinker/linkers?api-version=2022-11-01-preview"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

            if ($response.StatusCode -eq 404)
            {
                continue
            }

            if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
            {
                continue
            }

            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($linker in @($payload.value))
            {
                [string]$linkerName = "$( $linker.name )".Trim()
                [string]$linkerResourceId = "$( $linker.id )".Trim()
                [string]$targetResourceId = ''

                try
                {
                    $targetResourceId = "$( $linker.properties.targetService.id )".Trim()
                }
                catch
                {
                }

                if ([string]::IsNullOrWhiteSpace($linkerName)) { continue }

                [string]$key = "$sourceResourceId|$linkerName|$linkerResourceId|$targetResourceId"

                if ($seen.ContainsKey($key)) { continue }
                $seen[$key] = $true

                [void]$rows.Add([ordered]@{
                    sourceResourceId = $sourceResourceId
                    linkerName = $linkerName
                    linkerResourceId = $linkerResourceId
                    targetResourceId = $targetResourceId
                    collectionStatus = 'Succeeded'
                })
            }
        }
        catch
        {
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureAvdSessionHostAssociationRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$hostPoolResourceId = "$( $resource.resourceId )".Trim()

        if (-not ($resourceType -eq 'Microsoft.DesktopVirtualization/hostPools')) { continue }

        if ([string]::IsNullOrWhiteSpace($hostPoolResourceId)) { continue }

        try
        {
            [string]$path = "$hostPoolResourceId/sessionHosts?api-version=2024-04-03"
            $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop
            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($sessionHost in @($payload.value))
            {
                [string]$sessionHostResourceId = "$( $sessionHost.id )".Trim()
                [string]$virtualMachineResourceId = ''

                try
                {
                    $virtualMachineResourceId = "$( $sessionHost.properties.resourceId )".Trim()
                }
                catch
                {
                }

                if ([string]::IsNullOrWhiteSpace($sessionHostResourceId) -or [string]::IsNullOrWhiteSpace($virtualMachineResourceId))
                {
                    continue
                }

                Add-ArchLucidNetworkAssociationRow `
                    -Rows $rows `
                    -Seen $seen `
                    -FromResourceId $sessionHostResourceId `
                    -ToResourceId $virtualMachineResourceId `
                    -AssociationType 'avdSessionHostToVm'
            }
        }
        catch
        {
        }
    }

    return @($rows.ToArray())
}
