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
        -or $ResourceType -eq 'Microsoft.Sql/servers'
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

                if ([string]::IsNullOrWhiteSpace($workspaceId)) { continue }

                [string]$key = "$resourceId|$name|$workspaceId"

                if ($seen.ContainsKey($key))
                {
                    continue
                }

                $seen[$key] = $true

                [void]$rows.Add([ordered]@{
                    targetResourceId = $resourceId
                    name = $name
                    workspaceId = $workspaceId
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
