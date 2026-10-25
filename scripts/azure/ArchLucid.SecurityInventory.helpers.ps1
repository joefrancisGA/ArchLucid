Set-StrictMode -Version Latest

function Invoke-ArchLucidSecurityInventoryCompanion
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $CompanionName,

        [Parameter(Mandatory = $true)]
        [scriptblock] $Collector
    )

    try
    {
        return [pscustomobject]@{
            rows = @(& $Collector)
            errorMessage = $null
        }
    }
    catch
    {
        return [pscustomobject]@{
            rows = @()
            errorMessage = "$( $_.Exception.Message )".Trim()
        }
    }
}

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

    if ($AzResource.ResourceType -like "*bastionHosts*")
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

            [string]$natGatewayId = "$( $AzResource.Properties.natGateway.id )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($natGatewayId)))
            {
                $Properties["natGateway.id"] = $natGatewayId
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
            if (Test-ArchLucidInventoryPropertyExists -Properties $AzResource.Properties -PropertyName 'securityRules')
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

function Add-ArchLucidAzureContainerImageProperty(
    [hashtable] $Properties,
    [string] $Image)
{
    if ([string]::IsNullOrWhiteSpace($Image))
    {
        return
    }

    [int]$index = @($Properties.Keys | Where-Object { "$_" -match '^container\.image\[\d+\]$' }).Count
    $Properties["container.image[$index]"] = $Image.Trim()
}

function Add-ArchLucidAzureContainerImagePropertiesFromPayload(
    [hashtable] $Properties,
    [object] $Payload)
{
    if ($null -eq $Payload)
    {
        return
    }

    [string]$resourceType = "$( $Payload.type )".Trim()
    [object]$payloadProperties = $Payload.properties

    if ($resourceType -eq 'Microsoft.ContainerRegistry/registries')
    {
        [string]$loginServer = "$( $payloadProperties.loginServer )".Trim().ToLowerInvariant()

        if (-not [string]::IsNullOrWhiteSpace($loginServer))
        {
            $Properties['loginServer'] = $loginServer
        }

        return
    }

    if ($resourceType -eq 'Microsoft.App/containerApps')
    {
        foreach ($container in @($payloadProperties.template.containers))
        {
            Add-ArchLucidAzureContainerImageProperty `
                -Properties $Properties `
                -Image "$( $container.image )"
        }

        return
    }

    if ($resourceType -ne 'Microsoft.Web/sites')
    {
        return
    }

    foreach ($propertyName in @('linuxFxVersion', 'windowsFxVersion'))
    {
        [string]$value = "$( $payloadProperties.siteConfig.$propertyName )".Trim()

        if ($value.StartsWith('DOCKER|', [System.StringComparison]::OrdinalIgnoreCase))
        {
            Add-ArchLucidAzureContainerImageProperty `
                -Properties $Properties `
                -Image $value.Substring('DOCKER|'.Length)
        }
    }
}

function Expand-ArchLucidAzureContainerImageAndRegistryProperties(
    [object[]] $InventoryResources)
{
    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource)
        {
            continue
        }

        [string]$resourceType = "$( $resource.resourceType )".Trim()

        if ($resourceType -notin @(
                'Microsoft.ContainerRegistry/registries',
                'Microsoft.App/containerApps',
                'Microsoft.Web/sites'))
        {
            continue
        }

        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId))
        {
            continue
        }

        try
        {
            [string]$apiVersion = switch ($resourceType)
            {
                'Microsoft.ContainerRegistry/registries' { '2023-07-01' }
                'Microsoft.App/containerApps' { '2024-03-01' }
                default { '2022-03-01' }
            }

            [string]$path = "${resourceId}?api-version=$apiVersion"
            [object]$response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

            if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
            {
                continue
            }

            [object]$payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            if ($null -eq $resource.properties)
            {
                $resource.properties = @{}
            }

            Add-ArchLucidAzureContainerImagePropertiesFromPayload `
                -Properties $resource.properties `
                -Payload $payload
        }
        catch
        {
            # Optional enrichment must never prevent the base inventory from being emitted.
        }
    }
}

function Get-ArchLucidAzureAksWorkloadImageKubectlCommand
{
    return 'kubectl get deployments,statefulsets,daemonsets,jobs,cronjobs -A -o jsonpath=''{range .items[*]}{range .spec.template.spec.containers[*]}{.image}{\"\n\"}{end}{range .spec.template.spec.initContainers[*]}{.image}{\"\n\"}{end}{end}'''
}

function Get-ArchLucidAzureAksRunCommandPollPath([string] $CommandResultId)
{
    [string]$path = "$CommandResultId".Trim()

    if ([string]::IsNullOrWhiteSpace($path))
    {
        return $null
    }

    if ($path.StartsWith('http', [StringComparison]::OrdinalIgnoreCase))
    {
        $path = ([Uri]$path).AbsolutePath
    }

    if ($path -notmatch '\?api-version=')
    {
        $path = "${path}?api-version=2024-02-01"
    }

    return $path
}

function Format-ArchLucidAzureAksWorkloadImageCollectionWarningCode(
    [Parameter(Mandatory = $true)]
    [string] $ClusterResourceId,

    [Parameter(Mandatory = $true)]
    [string] $Reason)
{
    [string]$normalizedClusterId = "$( $ClusterResourceId )".Trim().TrimEnd('/')
    [string]$normalizedReason = "$( $Reason )".Trim()

    return "aks-workload-images-not-collected-customer-script:${normalizedReason}:$normalizedClusterId"
}

function Resolve-ArchLucidAzureAksWorkloadImageCollectionWarningReason([string] $OutcomeKind)
{
    switch ("$( $OutcomeKind )".Trim())
    {
        'InsufficientRbac' { return 'insufficient-rbac' }
        'MissingLogs' { return 'missing-logs' }
        'RunCommandFailed' { return 'run-command-failed' }
        'HttpError' { return 'http-error' }
        'PollTimeout' { return 'poll-timeout' }
        'Error' { return 'error' }
        default { return 'unavailable' }
    }
}

function New-ArchLucidAzureAksWorkloadImageCommandOutcome(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Success', 'InsufficientRbac', 'MissingLogs', 'RunCommandFailed', 'HttpError', 'PollTimeout', 'Unavailable', 'Error')]
    [string] $Kind,

    [string] $Logs = $null,

    [int] $HttpStatusCode = 0)
{
    return [pscustomobject]@{
        kind = $Kind
        logs = $Logs
        httpStatusCode = $HttpStatusCode
    }
}

function Resolve-ArchLucidAzureAksRunCommandHttpOutcomeKind([int] $StatusCode)
{
    if ($StatusCode -eq 401 -or $StatusCode -eq 403)
    {
        return 'InsufficientRbac'
    }

    return 'HttpError'
}

function Read-ArchLucidAzureAksRunCommandLogs([object] $Document)
{
    if ($null -eq $Document -or $null -eq $Document.properties)
    {
        return $null
    }

    [string]$provisioningState = "$( $Document.properties.provisioningState )".Trim()

    if (-not $provisioningState.Equals('Succeeded', [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $null
    }

    if (-not ($Document.properties.PSObject.Properties.Name -contains 'logs'))
    {
        return [pscustomobject]@{
            missingLogs = $true
            logs = $null
        }
    }

    return [pscustomobject]@{
        missingLogs = $false
        logs = "$( $Document.properties.logs )"
    }
}

function Get-ArchLucidAzureAksWorkloadImageCommandOutcome([string] $ResourceId)
{
    try
    {
        [string]$command = Get-ArchLucidAzureAksWorkloadImageKubectlCommand
        [string]$payload = @{ command = $command } | ConvertTo-Json -Compress
        [object]$response = Invoke-AzRestMethod `
            -Method POST `
            -Path "$ResourceId/runCommand?api-version=2024-02-01" `
            -Payload $payload `
            -ErrorAction Stop

        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
        {
            return New-ArchLucidAzureAksWorkloadImageCommandOutcome `
                -Kind $(Resolve-ArchLucidAzureAksRunCommandHttpOutcomeKind -StatusCode $response.StatusCode) `
                -HttpStatusCode $response.StatusCode
        }

        [object]$document = $response.Content | ConvertFrom-Json -ErrorAction Stop
        [object]$initialOutcome = Resolve-ArchLucidAzureAksRunCommandDocumentOutcome -Document $document

        if ($null -ne $initialOutcome)
        {
            return $initialOutcome
        }

        [string]$pollPath = Get-ArchLucidAzureAksRunCommandPollPath -CommandResultId "$( $document.id )"

        if ([string]::IsNullOrWhiteSpace($pollPath))
        {
            return New-ArchLucidAzureAksWorkloadImageCommandOutcome -Kind Unavailable
        }

        for ($poll = 0; $poll -lt 15; $poll++)
        {
            Start-Sleep -Seconds 2

            [object]$pollResponse = Invoke-AzRestMethod `
                -Method GET `
                -Path $pollPath `
                -ErrorAction Stop

            if ($pollResponse.StatusCode -lt 200 -or $pollResponse.StatusCode -ge 300)
            {
                return New-ArchLucidAzureAksWorkloadImageCommandOutcome `
                    -Kind $(Resolve-ArchLucidAzureAksRunCommandHttpOutcomeKind -StatusCode $pollResponse.StatusCode) `
                    -HttpStatusCode $pollResponse.StatusCode
            }

            if ([string]::IsNullOrWhiteSpace($pollResponse.Content))
            {
                continue
            }

            [object]$pollDocument = $pollResponse.Content | ConvertFrom-Json -ErrorAction Stop
            [object]$pollOutcome = Resolve-ArchLucidAzureAksRunCommandDocumentOutcome -Document $pollDocument

            if ($null -ne $pollOutcome)
            {
                return $pollOutcome
            }

            [string]$pollState = "$( $pollDocument.properties.provisioningState )"

            if ($pollState -in @('Failed', 'Canceled', 'Cancelled'))
            {
                return New-ArchLucidAzureAksWorkloadImageCommandOutcome -Kind RunCommandFailed
            }
        }

        return New-ArchLucidAzureAksWorkloadImageCommandOutcome -Kind PollTimeout
    }
    catch
    {
        return New-ArchLucidAzureAksWorkloadImageCommandOutcome -Kind Error
    }
}

function Resolve-ArchLucidAzureAksRunCommandDocumentOutcome([object] $Document)
{
    if ($null -eq $Document -or $null -eq $Document.properties)
    {
        return $null
    }

    [string]$provisioningState = "$( $Document.properties.provisioningState )".Trim()

    if ([string]::IsNullOrWhiteSpace($provisioningState))
    {
        return $null
    }

    if ($provisioningState -in @('Failed', 'Canceled', 'Cancelled'))
    {
        return New-ArchLucidAzureAksWorkloadImageCommandOutcome -Kind RunCommandFailed
    }

    if (-not $provisioningState.Equals('Succeeded', [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $null
    }

    if (-not ($Document.properties.PSObject.Properties.Name -contains 'logs'))
    {
        return New-ArchLucidAzureAksWorkloadImageCommandOutcome -Kind MissingLogs
    }

    return New-ArchLucidAzureAksWorkloadImageCommandOutcome `
        -Kind Success `
        -Logs "$( $Document.properties.logs )"
}

function Add-ArchLucidAzureVmssSubnetPropertiesFromPayload(
    [hashtable] $Properties,
    [object] $Payload)
{
    if ($null -eq $Payload -or $null -eq $Payload.properties)
    {
        return
    }

    [object]$configurations = $Payload.properties.virtualMachineProfile.networkProfile.networkInterfaceConfigurations

    if ($null -eq $configurations)
    {
        return
    }

    [int]$index = 0

    foreach ($configuration in @($configurations))
    {
        foreach ($ipConfiguration in @($configuration.properties.ipConfigurations))
        {
            [string]$subnetId = "$( $ipConfiguration.properties.subnet.id )".Trim()

            if (-not [string]::IsNullOrWhiteSpace($subnetId))
            {
                $Properties["ipConfiguration.subnet.id[$index]"] = $subnetId
            }

            $index++
        }
    }
}

function Expand-ArchLucidAzureManagedClusterAndVmssProperties(
    [object[]] $InventoryResources)
{
    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource)
        {
            continue
        }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId))
        {
            continue
        }

        if ($resourceType -notin @(
                'Microsoft.ContainerService/managedClusters',
                'Microsoft.Compute/virtualMachineScaleSets'))
        {
            continue
        }

        try
        {
            [string]$apiVersion = switch ($resourceType)
            {
                'Microsoft.ContainerService/managedClusters' { '2024-02-01' }
                default { '2024-03-01' }
            }

            [string]$path = "${resourceId}?api-version=$apiVersion"
            [object]$response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

            if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
            {
                continue
            }

            [object]$payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            [hashtable]$propertyBag = $resource.properties

            if ($null -eq $propertyBag)
            {
                $propertyBag = @{}
                $resource | Add-Member -NotePropertyName properties -NotePropertyValue $propertyBag -Force
            }

            if ($resourceType -eq 'Microsoft.ContainerService/managedClusters')
            {
                [string]$nodeResourceGroup = "$( $payload.properties.nodeResourceGroup )".Trim()

                if (-not [string]::IsNullOrWhiteSpace($nodeResourceGroup))
                {
                    $propertyBag['nodeResourceGroup'] = $nodeResourceGroup
                }

                continue
            }

            Add-ArchLucidAzureVmssSubnetPropertiesFromPayload `
                -Properties $propertyBag `
                -Payload $payload
        }
        catch
        {
            # Optional enrichment must never prevent the base inventory from being emitted.
        }
    }
}

function Add-ArchLucidAzureAksWorkloadImageProperties(
    [object[]] $InventoryResources)
{
    [System.Collections.Generic.List[string]]$warnings = [System.Collections.Generic.List[string]]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource)
        {
            continue
        }

        if ("$( $resource.resourceType )".Trim() -ne 'Microsoft.ContainerService/managedClusters')
        {
            continue
        }

        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId))
        {
            continue
        }

        try
        {
            [object]$outcome = Get-ArchLucidAzureAksWorkloadImageCommandOutcome -ResourceId $resourceId

            if ($outcome.kind -ne 'Success')
            {
                [string]$reason = Resolve-ArchLucidAzureAksWorkloadImageCollectionWarningReason -OutcomeKind $outcome.kind
                [void]$warnings.Add($(Format-ArchLucidAzureAksWorkloadImageCollectionWarningCode `
                    -ClusterResourceId $resourceId `
                    -Reason $reason))
                continue
            }

            [string[]]$images = @(
                "$( $outcome.logs )" -split '\r?\n' |
                    ForEach-Object { "$_".Trim() } |
                    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
                    Select-Object -Unique
            )

            [hashtable]$propertyBag = $resource.properties

            if ($null -eq $propertyBag)
            {
                $propertyBag = @{}
                $resource | Add-Member -NotePropertyName properties -NotePropertyValue $propertyBag -Force
            }

            foreach ($image in $images)
            {
                Add-ArchLucidAzureContainerImageProperty `
                    -Properties $propertyBag `
                    -Image $image
            }
        }
        catch
        {
            [void]$warnings.Add($(Format-ArchLucidAzureAksWorkloadImageCollectionWarningCode `
                -ClusterResourceId $resourceId `
                -Reason $(Resolve-ArchLucidAzureAksWorkloadImageCollectionWarningReason -OutcomeKind Error)))
        }
    }

    return [pscustomobject]@{
        warnings = @($warnings | Select-Object -Unique)
        collectedCount = @($InventoryResources | Where-Object {
            $_.properties.Keys | Where-Object { $_ -like 'container.image[*]' }
        }).Count
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

        [string]$roleName = $null

        if ($null -ne $assignment.PSObject.Properties['RoleDefinitionName'] -and
            -not [string]::IsNullOrWhiteSpace($assignment.RoleDefinitionName))
        {
            $roleName = $assignment.RoleDefinitionName.Trim()
        }

        [void]$Rows.Add([ordered]@{
            scope = $assignment.Scope
            principalId = $assignment.ObjectId
            principalType = $assignment.ObjectType
            roleDefinitionId = $assignment.RoleDefinitionId
            roleName = $roleName
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

function Get-ArchLucidInventoryPropertyStringValue
{
    param(
        [object] $Properties,
        [string] $PropertyName
    )

    if (-not (Test-ArchLucidInventoryPropertyExists -Properties $Properties -PropertyName $PropertyName))
    {
        return ""
    }

    if ($Properties -is [System.Collections.IDictionary])
    {
        return "$( $Properties[$PropertyName] )".Trim()
    }

    return "$( $Properties.$PropertyName )".Trim()
}

function Test-ArchLucidAzureInventoryVirtualNetworkResourceType
{
    param(
        [string] $ResourceType
    )

    if ([string]::IsNullOrWhiteSpace($ResourceType)) { return $false }
    if ($ResourceType -like "*virtualNetworkLinks*") { return $false }

    return $ResourceType -match '(?i)/virtualNetworks$'
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

function Test-ArchLucidAzureInventoryNeverShowSqlDatabaseResource
{
    param(
        [string] $ResourceType,
        [string] $ResourceId,
        [string] $ResourceName = ''
    )

    [string[]]$neverShowDatabaseNames = @('master')
    [string[]]$sqlDatabaseArmTypePrefixes = @(
        'Microsoft.Sql/servers/databases'
        'Microsoft.Sql/managedInstances/databases'
    )

    [bool]$isSqlDatabase = $false

    if (-not [string]::IsNullOrWhiteSpace($ResourceType))
    {
        foreach ($prefix in $sqlDatabaseArmTypePrefixes)
        {
            if ($ResourceType.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase))
            {
                $isSqlDatabase = $true
                break
            }
        }
    }

    if (-not $isSqlDatabase -and -not [string]::IsNullOrWhiteSpace($ResourceId))
    {
        if (($ResourceId -like '*/Microsoft.Sql/servers/*' -and $ResourceId -like '*/databases/*') -or
            ($ResourceId -like '*/Microsoft.Sql/managedInstances/*' -and $ResourceId -like '*/databases/*'))
        {
            $isSqlDatabase = $true
        }
    }

    if (-not $isSqlDatabase)
    {
        return $false
    }

    [string]$effectiveName = "$( $ResourceName )".Trim()

    if ([string]::IsNullOrWhiteSpace($effectiveName) -and -not [string]::IsNullOrWhiteSpace($ResourceId))
    {
        [string[]]$segments = @($ResourceId -split '/' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

        if ($segments.Count -gt 0)
        {
            $effectiveName = $segments[$segments.Count - 1]
        }
    }

    if ([string]::IsNullOrWhiteSpace($effectiveName))
    {
        return $false
    }

    foreach ($databaseName in $neverShowDatabaseNames)
    {
        if ($effectiveName.Equals($databaseName, [StringComparison]::OrdinalIgnoreCase))
        {
            return $true
        }
    }

    return $false
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
    [string]$resourceName = ''

    if ($null -ne $Resource.PSObject.Properties['name'])
    {
        $resourceName = "$( $Resource.name )".Trim()
    }

    if (Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType $resourceType)
    {
        return $true
    }

    if (Test-ArchLucidAzureInventoryNeverShowSqlDatabaseResource `
            -ResourceType $resourceType `
            -ResourceId $resourceId `
            -ResourceName $resourceName)
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

        if ($resourceType -like "*bastionHosts*")
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
                            -AssociationType "bastionToSubnet"
                    }
                }
            }
        }

        if ($resourceType -like "*virtualMachineScaleSets*")
        {
            foreach ($property in @(Get-ArchLucidInventoryPropertyEntries $resource.properties))
            {
                if ($property.Name -like 'ipConfiguration.subnet.id*')
                {
                    [string]$subnetId = "$( $property.Value )".Trim()

                    if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
                    {
                        Add-ArchLucidNetworkAssociationRow `
                            -Rows $rows `
                            -Seen $seen `
                            -FromResourceId $resourceId `
                            -ToResourceId $subnetId `
                            -AssociationType "vmssToSubnet"
                    }
                }
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

        if (Test-ArchLucidAzureInventoryVirtualNetworkResourceType -ResourceType $resourceType)
        {
            [string]$subnetsJson = Get-ArchLucidInventoryPropertyStringValue -Properties $resource.properties -PropertyName 'subnets'

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

    Add-ArchLucidManagedClusterToLoadBalancerCompanionRows `
        -Rows $rows `
        -Seen $seen `
        -InventoryResources @($InventoryResources)

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
        [string] $RuleName = $null,
        [string] $ProfileId = $null,
        [string] $AccessMode = $null,
        [string] $Kind = $null
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

    if (-not ([string]::IsNullOrWhiteSpace($ProfileId)))
    {
        $row["profileId"] = $ProfileId
    }

    if (-not ([string]::IsNullOrWhiteSpace($AccessMode)))
    {
        $row["accessMode"] = $AccessMode
    }

    if (-not ([string]::IsNullOrWhiteSpace($Kind)))
    {
        $row["kind"] = $Kind
    }

    [void]$Rows.Add($row)
}

function Get-ArchLucidArmResourceGroupNameFromResourceId
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $ResourceId
    )

    [string]$normalized = "$ResourceId".Trim()
    [string]$marker = '/resourceGroups/'

    if ([string]::IsNullOrWhiteSpace($normalized)) { return $null }

    [int]$markerIndex = $normalized.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase)

    if ($markerIndex -lt 0) { return $null }

    [int]$rgStart = $markerIndex + $marker.Length
    [int]$rgEnd = $normalized.IndexOf('/', $rgStart)

    if ($rgEnd -lt 0) { return $null }

    return $normalized.Substring($rgStart, $rgEnd - $rgStart)
}

function Get-ArchLucidManagedClusterNameFromResourceId
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $ResourceId
    )

    [string]$normalized = "$ResourceId".Trim().TrimEnd('/')

    if ([string]::IsNullOrWhiteSpace($normalized)) { return $null }

    [int]$lastSlash = $normalized.LastIndexOf('/')

    if ($lastSlash -lt 0 -or $lastSlash -ge ($normalized.Length - 1)) { return $null }

    return $normalized.Substring($lastSlash + 1)
}

function Get-ArchLucidInventoryResourceTagValue
{
    param(
        [object] $Tags,

        [Parameter(Mandatory = $true)]
        [string] $TagName
    )

    if ($null -eq $Tags) { return '' }

    if ($Tags -is [System.Collections.IDictionary])
    {
        foreach ($key in @($Tags.Keys))
        {
            if ($key.Equals($TagName, [System.StringComparison]::OrdinalIgnoreCase))
            {
                return "$( $Tags[$key] )".Trim()
            }
        }

        return ''
    }

    foreach ($property in @($Tags.PSObject.Properties))
    {
        if ($property.Name.Equals($TagName, [System.StringComparison]::OrdinalIgnoreCase))
        {
            return "$( $property.Value )".Trim()
        }
    }

    return ''
}

function Test-ArchLucidKubernetesLoadBalancerClusterOwnership
{
    param(
        [object] $LoadBalancerTags,

        [Parameter(Mandatory = $true)]
        [string] $ManagedClusterName,

        [Parameter(Mandatory = $true)]
        [string] $ManagedClusterResourceId
    )

    [string]$clusterName = "$ManagedClusterName".Trim()
    [string]$clusterId = "$ManagedClusterResourceId".Trim().TrimEnd('/').ToLowerInvariant()

    if ([string]::IsNullOrWhiteSpace($clusterName) -or [string]::IsNullOrWhiteSpace($clusterId))
    {
        return $false
    }

    [string]$kubernetesClusterNameTag = 'kubernetes.io/cluster-name'
    [string]$aksManagedClusterNameTag = 'aks-managed-cluster-name'

    [string]$kubernetesTagValue = Get-ArchLucidInventoryResourceTagValue -Tags $LoadBalancerTags -TagName $kubernetesClusterNameTag
    [string]$aksTagValue = Get-ArchLucidInventoryResourceTagValue -Tags $LoadBalancerTags -TagName $aksManagedClusterNameTag

    if (-not [string]::IsNullOrWhiteSpace($kubernetesTagValue))
    {
        if ($kubernetesTagValue.Equals($clusterName, [System.StringComparison]::OrdinalIgnoreCase) `
            -or $kubernetesTagValue.Trim().TrimEnd('/').ToLowerInvariant().Equals($clusterId, [System.StringComparison]::OrdinalIgnoreCase))
        {
            return $true
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($aksTagValue) `
        -and $aksTagValue.Equals($clusterName, [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $true
    }

    return $false
}

function Add-ArchLucidManagedClusterToLoadBalancerCompanionRows
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,

        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    [System.Collections.ArrayList]$clusters = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$loadBalancers = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()

        if ($resourceType -like '*managedClusters*')
        {
            [void]$clusters.Add($resource)
            continue
        }

        if ($resourceType -like '*loadBalancers*')
        {
            [void]$loadBalancers.Add($resource)
        }
    }

    if ($clusters.Count -eq 0 -or $loadBalancers.Count -eq 0) { return }

    foreach ($cluster in @($clusters))
    {
        [string]$clusterId = "$( $cluster.resourceId )".Trim()
        [string]$clusterName = Get-ArchLucidManagedClusterNameFromResourceId -ResourceId $clusterId
        [string]$nodeResourceGroup = Get-ArchLucidInventoryPropertyStringValue `
            -Properties $cluster.properties `
            -PropertyName 'nodeResourceGroup'

        if ([string]::IsNullOrWhiteSpace($clusterId) `
            -or [string]::IsNullOrWhiteSpace($clusterName) `
            -or [string]::IsNullOrWhiteSpace($nodeResourceGroup))
        {
            continue
        }

        foreach ($loadBalancer in @($loadBalancers))
        {
            [string]$loadBalancerId = "$( $loadBalancer.resourceId )".Trim()
            [string]$loadBalancerResourceGroup = Get-ArchLucidArmResourceGroupNameFromResourceId -ResourceId $loadBalancerId

            if ([string]::IsNullOrWhiteSpace($loadBalancerId) -or [string]::IsNullOrWhiteSpace($loadBalancerResourceGroup))
            {
                continue
            }

            if (-not $loadBalancerResourceGroup.Equals($nodeResourceGroup.Trim(), [System.StringComparison]::OrdinalIgnoreCase))
            {
                continue
            }

            if (-not (Test-ArchLucidKubernetesLoadBalancerClusterOwnership `
                    -LoadBalancerTags $loadBalancer.tags `
                    -ManagedClusterName $clusterName `
                    -ManagedClusterResourceId $clusterId))
            {
                continue
            }

            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $clusterId `
                -ToResourceId $loadBalancerId `
                -AssociationType 'managedClusterToLoadBalancer'
        }
    }
}

function Add-ArchLucidLoadBalancerBackendPropertiesFromFacts
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $Resources,

        [object[]] $LoadBalancerPropertyFacts = @()
    )

    [hashtable]$resourcesById = @{}

    foreach ($resource in @($Resources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        $resourcesById[$resourceId.ToLowerInvariant()] = $resource
    }

    foreach ($fact in @($LoadBalancerPropertyFacts))
    {
        if ($null -eq $fact) { continue }

        [string]$resourceId = "$( $fact.resourceId )".Trim()
        [string]$backendAddressPools = "$( $fact.backendAddressPools )".Trim()
        [string]$loadBalancingRules = "$( $fact.loadBalancingRules )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        if (-not $resourcesById.ContainsKey($resourceId.ToLowerInvariant()))
        {
            continue
        }

        $resource = $resourcesById[$resourceId.ToLowerInvariant()]

        if ($null -eq $resource.properties)
        {
            $resource.properties = @{}
        }

        if (-not [string]::IsNullOrWhiteSpace($backendAddressPools) `
            -and -not $resource.properties.ContainsKey('backendAddressPools'))
        {
            $resource.properties['backendAddressPools'] = $backendAddressPools
        }

        if (-not [string]::IsNullOrWhiteSpace($loadBalancingRules) `
            -and -not $resource.properties.ContainsKey('loadBalancingRules'))
        {
            $resource.properties['loadBalancingRules'] = $loadBalancingRules
        }
    }
}

function Add-ArchLucidPublicIpIpConfigurationPropertiesFromFacts
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $Resources,

        [object[]] $PublicIpIpConfigurationFacts = @()
    )

    [hashtable]$resourcesById = @{}

    foreach ($resource in @($Resources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        $resourcesById[$resourceId.ToLowerInvariant()] = $resource
    }

    foreach ($fact in @($PublicIpIpConfigurationFacts))
    {
        if ($null -eq $fact) { continue }

        [string]$resourceId = "$( $fact.resourceId )".Trim()
        [string]$ipConfigurationId = "$( $fact.ipConfigurationId )".Trim()
        [string]$natGatewayId = ''

        if (($fact.PSObject.Properties.Match('natGatewayId').Count -gt 0) -and ($null -ne $fact.natGatewayId))
        {
            $natGatewayId = "$( $fact.natGatewayId )".Trim()
        }

        if ([string]::IsNullOrWhiteSpace($resourceId) -or
            ([string]::IsNullOrWhiteSpace($ipConfigurationId) -and
             [string]::IsNullOrWhiteSpace($natGatewayId)))
        {
            continue
        }

        if (-not $resourcesById.ContainsKey($resourceId.ToLowerInvariant()))
        {
            continue
        }

        $resource = $resourcesById[$resourceId.ToLowerInvariant()]

        if ($null -eq $resource.properties)
        {
            $resource.properties = @{}
        }

        if (-not ($resource.properties.ContainsKey('ipConfiguration.id')))
        {
            if (-not [string]::IsNullOrWhiteSpace($ipConfigurationId))
            {
                $resource.properties['ipConfiguration.id'] = $ipConfigurationId
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($natGatewayId) -and
            -not ($resource.properties.ContainsKey('natGateway.id')))
        {
            $resource.properties['natGateway.id'] = $natGatewayId
        }
    }
}

function Add-ArchLucidBastionSubnetPropertiesFromAssociations
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $Resources,

        [object[]] $NetworkAssociations = @()
    )

    [hashtable]$resourcesById = @{}

    foreach ($resource in @($Resources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        $resourcesById[$resourceId.ToLowerInvariant()] = $resource
    }

    foreach ($association in @($NetworkAssociations))
    {
        if ($null -eq $association) { continue }
        if ("$( $association.associationType )".Trim() -ne 'bastionToSubnet') { continue }

        [string]$fromResourceId = "$( $association.fromResourceId )".Trim()
        [string]$subnetId = "$( $association.toResourceId )".Trim()

        if ([string]::IsNullOrWhiteSpace($fromResourceId) -or [string]::IsNullOrWhiteSpace($subnetId))
        {
            continue
        }

        if (-not $resourcesById.ContainsKey($fromResourceId.ToLowerInvariant()))
        {
            continue
        }

        $resource = $resourcesById[$fromResourceId.ToLowerInvariant()]

        if ($null -eq $resource.properties)
        {
            $resource.properties = @{}
        }

        if (-not ($resource.properties.ContainsKey('ipConfiguration.subnet.id')))
        {
            $resource.properties['ipConfiguration.subnet.id'] = $subnetId
        }

        if (-not ($resource.properties.ContainsKey('ipConfiguration.subnet.id[0]')))
        {
            $resource.properties['ipConfiguration.subnet.id[0]'] = $subnetId
        }
    }
}

function Add-ArchLucidFirewallSubnetPropertiesFromFacts
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $Resources,

        [object[]] $FirewallSubnetFacts = @(),

        [object[]] $VirtualNetworkSubnetFacts = @()
    )

    [hashtable]$resourcesById = @{}

    foreach ($resource in @($Resources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceId = "$( $resource.resourceId )".Trim()
        if (-not [string]::IsNullOrWhiteSpace($resourceId))
        {
            $resourcesById[$resourceId.ToLowerInvariant()] = $resource
        }
    }

    $firewallFactsById = @{}
    foreach ($fact in @($FirewallSubnetFacts))
    {
        if ($null -eq $fact) { continue }

        [string]$resourceId = "$( $fact.resourceId )".Trim()
        [string]$subnetId = "$( $fact.subnetId )".Trim()
        if ([string]::IsNullOrWhiteSpace($resourceId) `
            -or [string]::IsNullOrWhiteSpace($subnetId))
        {
            continue
        }

        $key = $resourceId.ToLowerInvariant()
        if (-not $firewallFactsById.ContainsKey($key))
        {
            $firewallFactsById[$key] = [System.Collections.ArrayList]::new()
        }

        [void]$firewallFactsById[$key].Add($fact)
    }

    foreach ($key in @($firewallFactsById.Keys))
    {
        if (-not $resourcesById.ContainsKey($key)) { continue }

        $resource = $resourcesById[$key]
        if ($null -eq $resource.properties) { $resource.properties = @{} }

        [int]$ipConfigurationIndex = 0
        foreach ($fact in @($firewallFactsById[$key]))
        {
            [string]$subnetId = "$( $fact.subnetId )".Trim()
            [string]$propertyName = "$( $fact.propertyName )".Trim()

            if ($propertyName -eq 'managementIpConfiguration')
            {
                if (-not $resource.properties.ContainsKey('managementIpConfiguration.subnet.id'))
                {
                    $resource.properties['managementIpConfiguration.subnet.id'] = $subnetId
                }
                continue
            }

            if ($propertyName -ne 'ipConfiguration') { continue }

            [string]$indexedPropertyName = "ipConfiguration.subnet.id[$ipConfigurationIndex]"
            if (-not $resource.properties.ContainsKey($indexedPropertyName))
            {
                $resource.properties[$indexedPropertyName] = $subnetId
            }

            if ($ipConfigurationIndex -eq 0 `
                -and -not $resource.properties.ContainsKey('ipConfiguration.subnet.id'))
            {
                $resource.properties['ipConfiguration.subnet.id'] = $subnetId
            }

            $ipConfigurationIndex++
        }
    }

    foreach ($fact in @($VirtualNetworkSubnetFacts))
    {
        if ($null -eq $fact) { continue }

        [string]$resourceId = "$( $fact.resourceId )".Trim()
        if ([string]::IsNullOrWhiteSpace($resourceId) `
            -or -not $resourcesById.ContainsKey($resourceId.ToLowerInvariant()))
        {
            continue
        }

        $resource = $resourcesById[$resourceId.ToLowerInvariant()]
        if ($null -eq $resource.properties) { $resource.properties = @{} }
        if ($resource.properties.ContainsKey('subnets') `
            -and -not [string]::IsNullOrWhiteSpace("$( $resource.properties['subnets'] )"))
        {
            continue
        }

        $subnetRecords = [System.Collections.Generic.List[object]]::new()
        foreach ($subnet in @($fact.subnets))
        {
            if ($null -eq $subnet) { continue }

            [string]$subnetId = "$( $subnet.id )".Trim()
            if ([string]::IsNullOrWhiteSpace($subnetId))
            {
                [string]$subnetName = "$( $subnet.name )".Trim()
                if (-not [string]::IsNullOrWhiteSpace($subnetName))
                {
                    $subnetId = "$resourceId/subnets/$subnetName"
                }
            }

            if (-not [string]::IsNullOrWhiteSpace($subnetId))
            {
                $subnetRecords.Add([ordered]@{ id = $subnetId })
            }
        }

        if ($subnetRecords.Count -gt 0)
        {
            $resource.properties['subnets'] = $subnetRecords | ConvertTo-Json -Depth 4 -Compress
        }
    }
}

function Resolve-ArchLucidAssociatedResourceFromIpConfiguration([string] $IpConfigurationId)
{
    if ([string]::IsNullOrWhiteSpace($IpConfigurationId)) { return $null }

    [string[]]$segments = $IpConfigurationId.Trim().Trim('/') -split '/'

    for ($index = $segments.Count - 2; $index -ge 1; $index--)
    {
        if ($segments[$index].EndsWith('ipConfigurations', [System.StringComparison]::OrdinalIgnoreCase))
        {
            return '/' + (($segments[0..($index - 1)]) -join '/')
        }
    }

    return $null
}

function Get-ArchLucidAzureFederatedCredentialCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    $rows = [System.Collections.ArrayList]::new()

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if (-not $resourceType.Equals(
                "Microsoft.ManagedIdentity/userAssignedIdentities",
                [System.StringComparison]::OrdinalIgnoreCase)) { continue }
        if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

        try
        {
            [string]$principalId = Get-ArchLucidInventoryPropertyStringValue `
                -Properties $resource.properties `
                -PropertyName "principalId"
            [string]$clientId = Get-ArchLucidInventoryPropertyStringValue `
                -Properties $resource.properties `
                -PropertyName "clientId"

            if ([string]::IsNullOrWhiteSpace($principalId))
            {
                [string]$identityPath = "${resourceId}?api-version=2023-01-31"
                $identityResponse = Invoke-AzRestMethod -Method GET -Path $identityPath -ErrorAction Stop
                $identityPayload = $identityResponse.Content | ConvertFrom-Json -ErrorAction Stop
                [object]$identityProperties = $identityPayload.properties

                $principalId = Get-ArchLucidInventoryPropertyStringValue `
                    -Properties $identityProperties `
                    -PropertyName "principalId"

                if ([string]::IsNullOrWhiteSpace($clientId))
                {
                    $clientId = Get-ArchLucidInventoryPropertyStringValue `
                        -Properties $identityProperties `
                        -PropertyName "clientId"
                }
            }

            if ([string]::IsNullOrWhiteSpace($principalId)) { continue }

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

        if (Test-ArchLucidAzureInventoryVirtualNetworkResourceType -ResourceType $resourceType)
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

    if (-not (Test-ArchLucidInventoryPropertyExists -Properties $Resource.properties -PropertyName 'securityRules')) { return }

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

    [string]$subnetsJson = Get-ArchLucidInventoryPropertyStringValue -Properties $Resource.properties -PropertyName 'subnets'

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

        if (-not (Test-ArchLucidAzureInventoryVirtualNetworkResourceType -ResourceType $resourceType)) { continue }

        [string]$subnetsJson = Get-ArchLucidInventoryPropertyStringValue -Properties $resource.properties -PropertyName 'subnets'

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

        [string]$scope = Get-ArchLucidInventoryPropertyStringValue -Properties $assignment -PropertyName 'Scope'
        [string]$policyDefinitionId = Get-ArchLucidInventoryPropertyStringValue -Properties $assignment -PropertyName 'PolicyDefinitionId'
        [string]$policySetDefinitionId = Get-ArchLucidInventoryPropertyStringValue -Properties $assignment -PropertyName 'PolicySetDefinitionId'
        [string]$definitionId = $(if (-not ([string]::IsNullOrWhiteSpace($policyDefinitionId))) { $policyDefinitionId } else { $policySetDefinitionId })

        if ([string]::IsNullOrWhiteSpace($scope)) { continue }
        if ([string]::IsNullOrWhiteSpace($definitionId)) { continue }

        [string]$name = Get-ArchLucidInventoryPropertyStringValue -Properties $assignment -PropertyName 'Name'
        [string]$assignmentResourceId = Get-ArchLucidInventoryPropertyStringValue -Properties $assignment -PropertyName 'ResourceId'
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
            assignmentId = $(if ([string]::IsNullOrWhiteSpace($assignmentResourceId)) { $null } else { $assignmentResourceId })
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

function Get-ArchLucidAzureDefenderPropertyValue
{
    param(
        [object] $Object,
        [string] $Name
    )

    if ($null -eq $Object -or [string]::IsNullOrWhiteSpace($Name))
    {
        return $null
    }

    $property = $Object.PSObject.Properties[$Name]

    if ($null -eq $property)
    {
        return $null
    }

    return $property.Value
}

function Get-ArchLucidAzureDefenderCompanionBundle
{
    param(
        [string] $SubscriptionId,

        [string] $ManagementGroupId,

        [object[]] $InventoryResources = @()
    )

    [System.Collections.ArrayList]$pricings = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$scoreControls = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$assessments = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$assessmentCounts = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$securityContacts = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$warnings = [System.Collections.ArrayList]::new()

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        [void]$warnings.Add('defender-pricings.json collection failed; Invoke-AzRestMethod missing')
        [void]$warnings.Add('defender-security-contacts-not-collected')
        return [pscustomobject]@{
            pricings = @()
            scoreControls = @()
            assessments = @()
            assessmentCounts = @()
            securityContacts = @()
            warnings = @($warnings.ToArray())
        }
    }

    [System.Collections.ArrayList]$subscriptionIds = [System.Collections.ArrayList]::new()

    if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
    {
        [void]$subscriptionIds.Add($SubscriptionId.Trim())
    }
    elseif (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)) -and (Get-Command Get-ArchLucidManagementGroupSubscriptionIds -ErrorAction SilentlyContinue))
    {
        foreach ($subId in @(Get-ArchLucidManagementGroupSubscriptionIds -ManagementGroupId $ManagementGroupId))
        {
            if (-not ([string]::IsNullOrWhiteSpace($subId)))
            {
                [void]$subscriptionIds.Add($subId.Trim())
            }
        }
    }

    foreach ($subId in @($subscriptionIds))
    {
        [object]$pricingPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/pricings' -ApiVersion '2024-01-01' -CompanionName 'defender-pricings.json'
        if (-not [string]::IsNullOrWhiteSpace($pricingPage.warning)) { [void]$warnings.Add($pricingPage.warning) }

        foreach ($item in @($pricingPage.items))
        {
            $pricingProperties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
            $pricingTier = Get-ArchLucidAzureDefenderPropertyValue -Object $pricingProperties -Name 'pricingTier'
            if ($null -eq $item -or [string]::IsNullOrWhiteSpace($item.name) -or $null -eq $pricingTier) { continue }

            [System.Collections.ArrayList]$extensionPairs = [System.Collections.ArrayList]::new()

            foreach ($extension in @(Get-ArchLucidAzureDefenderPropertyValue -Object $pricingProperties -Name 'extensions'))
            {
                if ($null -eq $extension -or [string]::IsNullOrWhiteSpace($extension.name)) { continue }
                [string]$enabled = 'false'
                if ($extension.isEnabled -eq $true -or "$($extension.isEnabled)" -eq 'True') { $enabled = 'true' }
                [void]$extensionPairs.Add("$($extension.name)=$enabled")
            }

            [string]$extensions = ($extensionPairs -join ';')
            if ($extensions.Length -gt 512) { $extensions = $extensions.Substring(0, 512) }

            [void]$pricings.Add([ordered]@{
                subscriptionId = $subId
                pricingName = "$($item.name)".Trim()
                tier = "$pricingTier".Trim()
                extensions = $extensions
            })
        }

        [object]$scorePage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/secureScores' -ApiVersion '2020-01-01' -CompanionName 'defender-score-controls.json'
        [System.Collections.ArrayList]$scoreNames = [System.Collections.ArrayList]::new()

        if (-not [string]::IsNullOrWhiteSpace($scorePage.warning))
        {
            [void]$warnings.Add($scorePage.warning)
        }
        else
        {
            foreach ($item in @($scorePage.items))
            {
                if ($null -eq $item -or [string]::IsNullOrWhiteSpace($item.name)) { continue }
                if ($scoreNames -notcontains "$($item.name)".Trim() -and $scoreNames.Count -lt 5)
                {
                    [void]$scoreNames.Add("$($item.name)".Trim())
                }
            }

            if ($scoreNames -notcontains 'ascScore')
            {
                if ($scoreNames.Count -ge 5) { $scoreNames[$scoreNames.Count - 1] = 'ascScore' }
                else { $scoreNames.Insert(0, 'ascScore') }
            }

            foreach ($scoreName in @($scoreNames | Select-Object -First 5))
            {
                [string]$controlsPath = "providers/Microsoft.Security/secureScores/$scoreName/secureScoreControls"
                [object]$controlsPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath $controlsPath -ApiVersion '2020-01-01' -CompanionName 'defender-score-controls.json'
                if (-not [string]::IsNullOrWhiteSpace($controlsPage.warning)) { [void]$warnings.Add($controlsPage.warning); continue }

                foreach ($item in @($controlsPage.items))
                {
                    $controlProperties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
                    $controlScore = Get-ArchLucidAzureDefenderPropertyValue -Object $controlProperties -Name 'score'
                    $currentValue = Get-ArchLucidAzureDefenderPropertyValue -Object $controlScore -Name 'current'
                    $maxValue = Get-ArchLucidAzureDefenderPropertyValue -Object $controlScore -Name 'max'
                    if ($null -eq $item -or [string]::IsNullOrWhiteSpace($item.name) -or $null -eq $controlScore) { continue }
                    if ($null -eq $currentValue -and $null -eq $maxValue) { continue }

                    [int]$current = 0
                    [int]$max = 0
                    [int]$percentage = 0
                    try { if ($null -ne $currentValue) { $current = [int]$currentValue } } catch { }
                    try { if ($null -ne $maxValue) { $max = [int]$maxValue } } catch { }
                    $percentageValue = Get-ArchLucidAzureDefenderPropertyValue -Object $controlScore -Name 'percentage'
                    try
                    {
                        if ($null -ne $percentageValue)
                        {
                            $percentage = [int][Math]::Round(([double]$percentageValue) * 100.0, [MidpointRounding]::AwayFromZero)
                        }
                        elseif ($max -gt 0)
                        {
                            $percentage = [int][Math]::Round(($current / [double]$max) * 100.0, [MidpointRounding]::AwayFromZero)
                        }
                    }
                    catch { }

                    $weightValue = Get-ArchLucidAzureDefenderPropertyValue -Object $controlProperties -Name 'weight'
                    $unhealthyValue = Get-ArchLucidAzureDefenderPropertyValue -Object $controlProperties -Name 'unhealthyResourceCount'
                    $healthyValue = Get-ArchLucidAzureDefenderPropertyValue -Object $controlProperties -Name 'healthyResourceCount'
                    $controlDisplayName = Get-ArchLucidAzureDefenderPropertyValue -Object $controlProperties -Name 'displayName'

                    [void]$scoreControls.Add([ordered]@{
                        subscriptionId = $subId
                        scoreName = $scoreName
                        controlName = "$($item.name)".Trim()
                        displayName = "$controlDisplayName".Trim()
                        current = $current
                        max = $max
                        percentage = $percentage
                        weight = $(if ($null -eq $weightValue) { 0 } else { [int]$weightValue })
                        unhealthyResourceCount = $(if ($null -eq $unhealthyValue) { 0 } else { [int]$unhealthyValue })
                        healthyResourceCount = $(if ($null -eq $healthyValue) { 0 } else { [int]$healthyValue })
                    })
                }
            }
        }

        [hashtable]$counts = @{}
        [int]$detailCount = 0
        [object]$assessmentPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/assessments' -ApiVersion '2021-06-01' -CompanionName 'defender-assessments.json'

        if (-not [string]::IsNullOrWhiteSpace($assessmentPage.warning) -and @($assessmentPage.items).Count -eq 0)
        {
            [void]$warnings.Add($assessmentPage.warning)
        }
        else
        {
            if ($assessmentPage.truncated) { [void]$warnings.Add('defender-assessments-truncated') }
            if (-not [string]::IsNullOrWhiteSpace($assessmentPage.warning)) { [void]$warnings.Add($assessmentPage.warning) }

            foreach ($item in @($assessmentPage.items))
            {
                if ($null -eq $item -or [string]::IsNullOrWhiteSpace($item.name)) { continue }
                [string]$status = 'Unknown'
                [string]$cause = ''
                try { if ($null -ne $item.properties.status.code) { $status = "$($item.properties.status.code)".Trim() } } catch { }
                try { if ($null -ne $item.properties.status.cause) { $cause = "$($item.properties.status.cause)".Trim() } } catch { }
                [string]$severity = 'Unknown'
                [string]$category = ''
                try { if ($null -ne $item.properties.metadata.severity) { $severity = "$($item.properties.metadata.severity)".Trim() } } catch { }
                try { $category = @($item.properties.metadata.categories)[0] } catch { }
                [string]$resourceId = ''
                try { $resourceId = "$($item.properties.resourceDetails.id)".Trim() } catch { }
                if ([string]::IsNullOrWhiteSpace($resourceId))
                {
                    try { $resourceId = "$($item.properties.resourceDetails.Id)".Trim() } catch { }
                }

                if (-not $counts.ContainsKey("$($item.name)"))
                {
                    $counts["$($item.name)"] = @{ displayName = "$($item.properties.displayName)"; severity = $severity; healthy = 0; unhealthy = 0; notApplicable = 0 }
                }

                if ($status -eq 'Healthy') { $counts["$($item.name)"].healthy++ }
                elseif ($status -eq 'Unhealthy') { $counts["$($item.name)"].unhealthy++ }
                elseif ($status -eq 'NotApplicable') { $counts["$($item.name)"].notApplicable++ }

                if ($status -ne 'Unhealthy' -or [string]::IsNullOrWhiteSpace($resourceId)) { continue }
                if ($detailCount -ge 4000) { [void]$warnings.Add('defender-assessments-truncated'); continue }
                $detailCount++
                if ($cause.Length -gt 240) { $cause = $cause.Substring(0, 240) }

                [void]$assessments.Add([ordered]@{
                    subscriptionId = $subId
                    assessmentKey = "$($item.name)".Trim()
                    displayName = "$($item.properties.displayName)".Trim()
                    severity = $severity
                    status = 'Unhealthy'
                    statusCause = $cause
                    category = "$category".Trim()
                    resourceId = $resourceId
                })
            }
        }

        foreach ($key in @($counts.Keys))
        {
            [void]$assessmentCounts.Add([ordered]@{
                subscriptionId = $subId
                assessmentKey = $key
                displayName = "$($counts[$key].displayName)".Trim()
                severity = "$($counts[$key].severity)".Trim()
                healthyCount = [int]$counts[$key].healthy
                unhealthyCount = [int]$counts[$key].unhealthy
                notApplicableCount = [int]$counts[$key].notApplicable
            })
        }

        [object]$contactPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/securityContacts' -ApiVersion '2020-01-01' -CompanionName 'defender-security-contacts.json'
        if (-not [string]::IsNullOrWhiteSpace($contactPage.warning) -and @($contactPage.items).Count -eq 0)
        {
            [void]$warnings.Add('defender-security-contacts-not-collected')
            [void]$warnings.Add($contactPage.warning)
            [void]$securityContacts.Add([ordered]@{
                subscriptionId = $subId
                collectionStatus = 'Unavailable'
                emailCount = 0
                emails = ''
                alertsToAdmins = $false
                minimalSeverity = ''
                notificationRoles = ''
            })
        }
        else
        {
            [System.Collections.Generic.HashSet[string]]$emails = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
            [bool]$alertsToAdmins = $false
            [string]$minimalSeverity = ''
            [System.Collections.ArrayList]$roles = [System.Collections.ArrayList]::new()

            foreach ($item in @($contactPage.items))
            {
                if ($null -eq $item) { continue }
                foreach ($email in @("$($item.properties.emails)".Split(@(';', ','), [System.StringSplitOptions]::RemoveEmptyEntries)))
                {
                    [string]$trimmedEmail = $email.Trim()
                    if (-not [string]::IsNullOrWhiteSpace($trimmedEmail) -and $trimmedEmail -ne 'null') { [void]$emails.Add($trimmedEmail) }
                }
                try
                {
                    if ("$($item.properties.alertNotifications.state)" -eq 'On') { $alertsToAdmins = $true }
                    if ([string]::IsNullOrWhiteSpace($minimalSeverity) -and $null -ne $item.properties.alertNotifications.minimalSeverity)
                    {
                        $minimalSeverity = "$($item.properties.alertNotifications.minimalSeverity)".Trim()
                    }
                }
                catch { }
                try
                {
                    foreach ($role in @($item.properties.notificationsByRole.roles))
                    {
                        if (-not [string]::IsNullOrWhiteSpace($role)) { [void]$roles.Add("$role".Trim()) }
                    }
                }
                catch { }
            }

            if ($emails.Count -eq 0) { [void]$warnings.Add('defender-security-contact-missing') }
            [string]$emailText = (@($emails) | Sort-Object) -join ';'
            if ($emailText.Length -gt 512) { $emailText = $emailText.Substring(0, 512) }

            [void]$securityContacts.Add([ordered]@{
                subscriptionId = $subId
                collectionStatus = 'Collected'
                emailCount = $emails.Count
                emails = $emailText
                alertsToAdmins = $alertsToAdmins
                minimalSeverity = $minimalSeverity
                notificationRoles = ((@($roles) | Sort-Object -Unique) -join ';')
            })
        }
    }

    [System.Collections.Generic.HashSet[string]]$planWarnings = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    [hashtable]$planTypes = @{
        VirtualMachines = 'Microsoft.Compute/virtualMachines'
        SqlServers = 'Microsoft.Sql/servers'
        AppServices = 'Microsoft.Web/sites'
        StorageAccounts = 'Microsoft.Storage/storageAccounts'
        KeyVaults = 'Microsoft.KeyVault/vaults'
        Containers = 'Microsoft.ContainerService/managedClusters'
        Api = 'Microsoft.ApiManagement/service'
    }

    foreach ($pricing in @($pricings))
    {
        if ("$($pricing.tier)" -ne 'Free' -or -not $planTypes.ContainsKey($pricing.pricingName)) { continue }
        [string]$prefix = $planTypes[$pricing.pricingName]
        [string]$token = "/subscriptions/$($pricing.subscriptionId)/"
        foreach ($resource in @($InventoryResources))
        {
            [string]$resourceId = "$($resource.resourceId)"
            [string]$resourceType = "$($resource.resourceType)"
            if ($resourceId.IndexOf($token, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and ($resourceType -eq $prefix -or $resourceType.StartsWith("$prefix/", [StringComparison]::OrdinalIgnoreCase)))
            {
                [void]$planWarnings.Add("defender-plan-off:$($pricing.pricingName)")
                break
            }
        }
    }

    foreach ($planWarning in @($planWarnings)) { [void]$warnings.Add($planWarning) }

    return [pscustomobject]@{
        pricings = @($pricings.ToArray())
        scoreControls = @($scoreControls.ToArray())
        assessments = @($assessments.ToArray())
        assessmentCounts = @($assessmentCounts.ToArray())
        securityContacts = @($securityContacts.ToArray())
        warnings = @($warnings.ToArray())
    }
}

function Get-ArchLucidAzureDefenderFollowOnBundle
{
    param(
        [string] $SubscriptionId,

        [string] $ManagementGroupId,

        [object[]] $Pricings = @(),

        [object[]] $Assessments = @()
    )

    [System.Collections.ArrayList]$governance = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$complianceStandards = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$complianceControls = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$alerts = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$attackPaths = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$vulnerabilityCounts = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$vulnerabilityFindings = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$warnings = [System.Collections.ArrayList]::new()

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        [void]$warnings.Add('defender-governance.json collection failed; Invoke-AzRestMethod missing')
        return [pscustomobject]@{
            governance = @()
            complianceStandards = @()
            complianceControls = @()
            alerts = @()
            attackPaths = @()
            vulnerabilityCounts = @()
            vulnerabilityFindings = @()
            warnings = @($warnings.ToArray())
        }
    }

    [System.Collections.ArrayList]$subscriptionIds = [System.Collections.ArrayList]::new()

    if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
    {
        [void]$subscriptionIds.Add($SubscriptionId.Trim())
    }
    elseif (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)) -and (Get-Command Get-ArchLucidManagementGroupSubscriptionIds -ErrorAction SilentlyContinue))
    {
        foreach ($subId in @(Get-ArchLucidManagementGroupSubscriptionIds -ManagementGroupId $ManagementGroupId))
        {
            if (-not ([string]::IsNullOrWhiteSpace($subId)))
            {
                [void]$subscriptionIds.Add($subId.Trim())
            }
        }
    }

    foreach ($subId in @($subscriptionIds))
    {
        [object]$governancePage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/governanceAssignments' -ApiVersion '2022-01-01-preview' -CompanionName 'defender-governance.json'
        [object[]]$governanceItems = @($governancePage.items)

        if ($governanceItems.Count -eq 0 -and -not [string]::IsNullOrWhiteSpace($governancePage.warning))
        {
            [string[]]$keys = @($Assessments | Where-Object { "$($_.subscriptionId)" -eq $subId } | ForEach-Object { "$($_.assessmentKey)" } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
            if ($keys.Count -eq 0)
            {
                [void]$warnings.Add('defender-governance.json collection failed; HTTP 404; api-version 2022-01-01-preview')
            }
            else
            {
                if ($keys.Count -gt 40) { [void]$warnings.Add('defender-governance-truncated') }
                [int]$misses = 0
                foreach ($assessmentKey in @($keys | Select-Object -First 40))
                {
                    [string]$path = "providers/Microsoft.Security/assessments/$([uri]::EscapeDataString($assessmentKey))/governanceAssignments"
                    [object]$assignmentPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath $path -ApiVersion '2022-01-01-preview' -CompanionName 'defender-governance.json'
                    if (@($assignmentPage.items).Count -eq 0)
                    {
                        $misses++
                        if ($misses -ge 3)
                        {
                            [void]$warnings.Add('defender-governance.json collection failed; HTTP 404; api-version 2022-01-01-preview')
                            break
                        }
                    }
                    else
                    {
                        $misses = 0
                        $governanceItems += @($assignmentPage.items)
                    }
                }
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($governancePage.warning))
        {
            [void]$warnings.Add($governancePage.warning)
        }

        foreach ($item in @($governanceItems))
        {
            if ($governance.Count -ge 4000) { [void]$warnings.Add('defender-governance-truncated'); break }
            [string]$fullId = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'id')"
            [int]$marker = $fullId.IndexOf('/providers/Microsoft.Security/assessments/', [StringComparison]::OrdinalIgnoreCase)
            if ($marker -le 0) { continue }
            [string]$resourceId = $fullId.Substring(0, $marker)
            [string]$rest = $fullId.Substring($marker + '/providers/Microsoft.Security/assessments/'.Length)
            [string]$assessmentKey = $rest.Split('/')[0]
            if ([string]::IsNullOrWhiteSpace($assessmentKey) -or $resourceId.IndexOf('/subscriptions/', [StringComparison]::OrdinalIgnoreCase) -lt 0) { continue }
            $properties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
            [string]$owner = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'owner')".Trim()
            [void]$governance.Add([ordered]@{
                subscriptionId = $subId
                assessmentKey = $assessmentKey
                resourceId = $resourceId.ToLowerInvariant()
                owner = $(if ([string]::IsNullOrWhiteSpace($owner)) { $null } else { $owner })
                remediationDueUtc = Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'remediationDueDate'
                isGracePeriod = ($(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'isGracePeriod') -eq $true)
                assignmentStatus = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'assignmentStatus')".Trim()
            })
        }

        [object]$standardsPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/regulatoryComplianceStandards' -ApiVersion '2019-01-01-preview' -CompanionName 'defender-compliance-standards.json'
        if (-not [string]::IsNullOrWhiteSpace($standardsPage.warning) -and @($standardsPage.items).Count -eq 0)
        {
            [void]$warnings.Add($standardsPage.warning)
        }
        else
        {
            if (-not [string]::IsNullOrWhiteSpace($standardsPage.warning)) { [void]$warnings.Add($standardsPage.warning) }
            [System.Collections.ArrayList]$failedStandards = [System.Collections.ArrayList]::new()
            foreach ($item in @($standardsPage.items))
            {
                $properties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
                [string]$standardName = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'name')".Trim()
                if ([string]::IsNullOrWhiteSpace($standardName)) { continue }
                [string]$state = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'state')".Trim()
                [void]$complianceStandards.Add([ordered]@{
                    subscriptionId = $subId
                    standardName = $standardName
                    state = $state
                    passedControlCount = [int](Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'passedControls')
                    failedControlCount = [int](Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'failedControls')
                    skippedControlCount = [int](Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'skippedControls')
                })
                if ($state -eq 'Failed') { [void]$failedStandards.Add($standardName) }
            }

            foreach ($standardName in @($failedStandards))
            {
                if ($complianceControls.Count -ge 500) { [void]$warnings.Add('defender-compliance-truncated'); break }
                [string]$controlPath = "providers/Microsoft.Security/regulatoryComplianceStandards/$([uri]::EscapeDataString($standardName))/regulatoryComplianceControls"
                [object]$controlPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath $controlPath -ApiVersion '2019-01-01-preview' -CompanionName 'defender-compliance-standards.json'
                if (-not [string]::IsNullOrWhiteSpace($controlPage.warning)) { [void]$warnings.Add($controlPage.warning) }
                foreach ($item in @($controlPage.items))
                {
                    if ($complianceControls.Count -ge 500) { [void]$warnings.Add('defender-compliance-truncated'); break }
                    $properties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
                    if ("$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'state')" -ne 'Failed') { continue }
                    [void]$complianceControls.Add([ordered]@{
                        subscriptionId = $subId
                        standardName = $standardName
                        controlName = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'name')".Trim()
                        state = 'Failed'
                        failedAssessmentCount = [int](Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'failedAssessments')
                    })
                }
            }
        }

        [object]$alertPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/alerts' -ApiVersion '2022-01-01' -CompanionName 'defender-alerts.json'
        [System.Collections.ArrayList]$alertBuffer = [System.Collections.ArrayList]::new()
        if (-not [string]::IsNullOrWhiteSpace($alertPage.warning) -and @($alertPage.items).Count -eq 0)
        {
            [void]$warnings.Add($alertPage.warning)
        }
        else
        {
            foreach ($item in @($alertPage.items))
            {
                $properties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
                [string]$alertStatus = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'status')"
                if ($alertStatus -ne 'Active' -and $alertStatus -ne 'InProgress') { continue }
                [string]$severity = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'severity')"
                if ($severity -eq 'Critical') { $severity = 'High' }
                [string]$resourceId = ''
                foreach ($identifier in @(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'resourceIdentifiers'))
                {
                    if ("$(Get-ArchLucidAzureDefenderPropertyValue -Object $identifier -Name 'type')" -eq 'AzureResource')
                    {
                        $resourceId = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $identifier -Name 'azureResourceId')".ToLowerInvariant()
                        break
                    }
                }
                [void]$alertBuffer.Add([pscustomobject]@{
                    subscriptionId = $subId
                    alertId = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'name')"
                    displayName = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'alertDisplayName')"
                    severity = $severity
                    status = $alertStatus
                    intent = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'intent')"
                    alertType = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'alertType')"
                    startTimeUtc = Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'startTimeUtc'
                    resourceId = $resourceId
                })
            }
            if ($alertPage.truncated -or $alertBuffer.Count -gt 500) { [void]$warnings.Add('defender-alerts-truncated') }
            foreach ($alert in @($alertBuffer | Select-Object -First 500)) { [void]$alerts.Add($alert) }
        }

        [object[]]$cspm = @($Pricings | Where-Object { "$($_.subscriptionId)" -eq $subId -and ($_.pricingName -eq 'CloudPosture' -or $_.pricingName -eq 'DefenderCspm') })
        [bool]$skipAttackPaths = ($cspm.Count -gt 0 -and @($cspm | Where-Object { "$($_.tier)" -ne 'Free' }).Count -eq 0)
        if ($skipAttackPaths)
        {
            [void]$warnings.Add('defender-attack-paths-skipped-plan-off')
        }
        else
        {
            [object]$attackPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/attackPaths' -ApiVersion '2024-01-01' -CompanionName 'defender-attack-paths.json'
            if (-not [string]::IsNullOrWhiteSpace($attackPage.warning) -and @($attackPage.items).Count -eq 0)
            {
                [void]$warnings.Add($attackPage.warning)
            }
            else
            {
                foreach ($item in @($attackPage.items))
                {
                    if ($attackPaths.Count -ge 200) { [void]$warnings.Add('defender-attack-paths-truncated'); break }
                    $properties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
                    [string]$entryIds = (Get-ArchLucidAzureDefenderEndpointResourceIds -Node (Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'entryPointEntityInformation')) -join ';'
                    if ([string]::IsNullOrWhiteSpace($entryIds))
                    {
                        $entryIds = (Get-ArchLucidAzureDefenderEndpointResourceIds -Node (Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'entryPoint')) -join ';'
                    }
                    [string]$targetIds = (Get-ArchLucidAzureDefenderEndpointResourceIds -Node (Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'targetEntityInformation')) -join ';'
                    if ([string]::IsNullOrWhiteSpace($targetIds))
                    {
                        $targetIds = (Get-ArchLucidAzureDefenderEndpointResourceIds -Node (Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'target')) -join ';'
                    }
                    if ([string]::IsNullOrWhiteSpace($entryIds) -and [string]::IsNullOrWhiteSpace($targetIds)) { continue }
                    [void]$attackPaths.Add([ordered]@{
                        subscriptionId = $subId
                        attackPathId = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'name')"
                        displayName = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'displayName')"
                        riskLevel = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'riskLevel')"
                        entryResourceIds = $entryIds
                        targetResourceIds = $targetIds
                    })
                }
            }
        }

        [object]$subPage = Get-ArchLucidAzureDefenderArmValues -SubscriptionId $subId -RelativePath 'providers/Microsoft.Security/subAssessments' -ApiVersion '2019-01-01-preview' -CompanionName 'defender-vulnerability-counts.json'
        if (-not [string]::IsNullOrWhiteSpace($subPage.warning) -and @($subPage.items).Count -eq 0)
        {
            [void]$warnings.Add($subPage.warning)
        }
        else
        {
            [hashtable]$counts = @{}
            foreach ($item in @($subPage.items))
            {
                $properties = Get-ArchLucidAzureDefenderPropertyValue -Object $item -Name 'properties'
                $details = Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'resourceDetails'
                [string]$resourceId = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $details -Name 'id')".Trim().ToLowerInvariant()
                if ($resourceId.IndexOf('/subscriptions/', [StringComparison]::OrdinalIgnoreCase) -ne 0) { continue }
                $status = Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'status'
                [string]$severity = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $status -Name 'severity')"
                if (-not $counts.ContainsKey($resourceId)) { $counts[$resourceId] = @{ critical = 0; high = 0; medium = 0; low = 0 } }
                [hashtable]$bucket = $counts[$resourceId]
                if ($severity -eq 'Critical') { $bucket.critical = [int]$bucket.critical + 1 }
                elseif ($severity -eq 'High') { $bucket.high = [int]$bucket.high + 1 }
                elseif ($severity -eq 'Medium') { $bucket.medium = [int]$bucket.medium + 1 }
                elseif ($severity -eq 'Low') { $bucket.low = [int]$bucket.low + 1 }
                else { continue }
                if ($severity -ne 'Critical' -and $severity -ne 'High') { continue }
                if ($vulnerabilityFindings.Count -ge 1000) { [void]$warnings.Add('defender-vulnerability-truncated'); continue }
                $additional = Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'additionalData'
                $cve = @(Get-ArchLucidAzureDefenderPropertyValue -Object $additional -Name 'cve') | Select-Object -First 1
                [string]$findingId = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $cve -Name 'title')"
                if ([string]::IsNullOrWhiteSpace($findingId)) { $findingId = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'id')" }
                [void]$vulnerabilityFindings.Add([ordered]@{
                    subscriptionId = $subId
                    resourceId = $resourceId
                    severity = $severity
                    findingId = $findingId
                    displayName = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $properties -Name 'displayName')"
                })
            }
            foreach ($resourceId in @($counts.Keys))
            {
                [void]$vulnerabilityCounts.Add([ordered]@{
                    subscriptionId = $subId
                    resourceId = $resourceId
                    criticalCount = [int]$counts[$resourceId].critical
                    highCount = [int]$counts[$resourceId].high
                    mediumCount = [int]$counts[$resourceId].medium
                    lowCount = [int]$counts[$resourceId].low
                })
            }
        }
    }

    return [pscustomobject]@{
        governance = @($governance.ToArray())
        complianceStandards = @($complianceStandards.ToArray())
        complianceControls = @($complianceControls.ToArray())
        alerts = @($alerts.ToArray())
        attackPaths = @($attackPaths.ToArray())
        vulnerabilityCounts = @($vulnerabilityCounts.ToArray())
        vulnerabilityFindings = @($vulnerabilityFindings.ToArray())
        warnings = @($warnings.ToArray())
    }
}

function Get-ArchLucidAzureDefenderEndpointResourceIds
{
    param([object] $Node)

    [System.Collections.ArrayList]$ids = [System.Collections.ArrayList]::new()
    if ($null -eq $Node) { return @() }
    foreach ($name in @('azureResourceId', 'resourceId', 'id'))
    {
        [string]$value = "$(Get-ArchLucidAzureDefenderPropertyValue -Object $Node -Name $name)"
        if ($value.StartsWith('/subscriptions/', [StringComparison]::OrdinalIgnoreCase))
        {
            [void]$ids.Add($value.ToLowerInvariant())
        }
    }

    return @($ids.ToArray())
}

function New-ArchLucidAzureDefenderArmValuesFailureWarning(
    [Parameter(Mandatory = $true)]
    [string] $CompanionName,

    [int] $StatusCode = 0)
{
    if ($StatusCode -gt 0)
    {
        return "$CompanionName collection failed; HTTP $StatusCode"
    }

    return "$CompanionName collection failed"
}

function Format-ArchLucidAzureDefenderGovernanceCollectionFailedWarning(
    [int[]] $StatusCodes = @())
{
    [string]$apiSuffix = 'api-version 2022-01-01-preview'
    [int[]]$ordered = @(
        @($StatusCodes) |
            Where-Object { $_ -gt 0 } |
            Sort-Object -Unique
    )

    if ($ordered.Count -eq 0)
    {
        return "defender-governance.json collection failed; $apiSuffix"
    }

    if ($ordered.Count -eq 1)
    {
        return "defender-governance.json collection failed; HTTP $($ordered[0]); $apiSuffix"
    }

    [string]$joined = ($ordered | ForEach-Object { "$_" }) -join ', '
    return "defender-governance.json collection failed; HTTP $joined; $apiSuffix"
}

function Get-ArchLucidAzureDefenderGovernanceWarningStatusCodes(
    [Parameter(Mandatory = $true)]
    [string[]] $Warnings)
{
    [System.Collections.Generic.List[int]]$statuses = [System.Collections.Generic.List[int]]::new()

    foreach ($warning in @($Warnings))
    {
        if (-not "$warning".Contains('defender-governance.json', [StringComparison]::Ordinal))
        {
            continue
        }

        if ("$warning" -match 'collection failed; HTTP (\d+)')
        {
            [void]$statuses.Add([int]$Matches[1])
        }
    }

    return @($statuses.ToArray())
}

function Get-ArchLucidAzureDefenderArmValues
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [Parameter(Mandatory = $true)]
        [string] $RelativePath,

        [Parameter(Mandatory = $true)]
        [string] $ApiVersion,

        [Parameter(Mandatory = $true)]
        [string] $CompanionName
    )

    [System.Collections.ArrayList]$items = [System.Collections.ArrayList]::new()
    [string]$nextLink = "/subscriptions/$SubscriptionId/$RelativePath`?api-version=$ApiVersion"
    [hashtable]$visited = @{}
    [int]$requestCount = 0
    [string]$warning = ''
    [int]$httpStatusCode = 0
    [bool]$truncated = $false

    while (-not [string]::IsNullOrWhiteSpace($nextLink))
    {
        if ($visited.ContainsKey($nextLink)) { break }
        $visited[$nextLink] = $true
        $requestCount++
        if ($requestCount -gt 64) { $truncated = $true; break }

        try
        {
            if ($nextLink.StartsWith('https://', [StringComparison]::OrdinalIgnoreCase))
            {
                $response = Invoke-AzRestMethod -Method GET -Uri $nextLink -ErrorAction Stop
            }
            else
            {
                $response = Invoke-AzRestMethod -Method GET -Path $nextLink -ErrorAction Stop
            }

            try { $httpStatusCode = [int]$response.StatusCode } catch { $httpStatusCode = 0 }

            if ($httpStatusCode -lt 200 -or $httpStatusCode -ge 300)
            {
                $warning = New-ArchLucidAzureDefenderArmValuesFailureWarning -CompanionName $CompanionName -StatusCode $httpStatusCode
                break
            }

            $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop
            foreach ($item in @($payload.value))
            {
                if ($null -ne $item) { [void]$items.Add($item) }
            }

            $nextLink = ''
            $nextLinkProperty = $payload.PSObject.Properties['nextLink']
            if ($null -ne $nextLinkProperty -and -not [string]::IsNullOrWhiteSpace("$($nextLinkProperty.Value)"))
            {
                [string]$candidate = "$($nextLinkProperty.Value)".Trim()
                if ($candidate.IndexOf("/subscriptions/$SubscriptionId/", [StringComparison]::OrdinalIgnoreCase) -lt 0 -or $candidate.IndexOf("/$RelativePath", [StringComparison]::OrdinalIgnoreCase) -lt 0)
                {
                    throw [System.InvalidOperationException]::new('defender-companions-rejected-next-link')
                }

                $nextLink = $candidate
            }
        }
        catch
        {
            if ("$($_.Exception.Message)" -eq 'defender-companions-rejected-next-link')
            {
                $warning = 'defender-companions-rejected-next-link'
            }
            else
            {
                [int]$errorStatus = 0

                if ($null -ne $_.Exception -and $null -ne $_.Exception.Response)
                {
                    try { $errorStatus = [int]$_.Exception.Response.StatusCode } catch { }
                }

                if ($errorStatus -gt 0)
                {
                    $httpStatusCode = $errorStatus
                }

                $warning = New-ArchLucidAzureDefenderArmValuesFailureWarning -CompanionName $CompanionName -StatusCode $httpStatusCode
            }

            break
        }
    }

    return [pscustomobject]@{
        items = @($items.ToArray())
        warning = $warning
        httpStatusCode = $httpStatusCode
        truncated = $truncated
    }
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
        [int] $MaxNestedPipelineDepth = 3,

        [Parameter(Mandatory = $false)]
        [object[]] $DataflowRows = @()
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
            $dataflowsByName = @{}
            foreach ($dataflowRow in @($DataflowRows))
            {
                if ($null -eq $dataflowRow) { continue }
                if ("$( $dataflowRow.factoryResourceId )".Trim() -ne $factoryResourceId) { continue }

                [string]$dataflowName = "$( $dataflowRow.dataflowName )".Trim()
                if (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $dataflowName)
                {
                    $dataflowsByName[$dataflowName] = $dataflowRow
                }
            }

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
                    -DataflowsByName $dataflowsByName `
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

        [Parameter(Mandatory = $false)]
        [hashtable] $DataflowsByName = @{},

        [Parameter(Mandatory = $true)]
        [int] $RemainingNestedDepth,

        [Parameter(Mandatory = $true)]
        [string[]] $PipelineVisitStack,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [System.Collections.ArrayList] $Rows,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
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
                -DataflowsByName $DataflowsByName `
                -RemainingNestedDepth ($RemainingNestedDepth - 1) `
                -PipelineVisitStack (@($PipelineVisitStack) + @($nestedPipelineName)) `
                -Rows $Rows `
                -FlowKeys $FlowKeys

            continue
        }

        if ($activityType -eq 'ExecuteDataFlow')
        {
            Add-ArchLucidAzureAdfExecuteDataflowFlows `
                -FactoryResourceId $FactoryResourceId `
                -PipelineResourceId $PipelineResourceId `
                -PipelineName $PipelineName `
                -ActivityName $activityName `
                -ActivityType $activityType `
                -Activity $activity `
                -DataflowsByName $DataflowsByName `
                -Rows $Rows `
                -FlowKeys $FlowKeys

            continue
        }

        $hasReadDatasetReference = Add-ArchLucidAzureAdfDatasetReferenceFlows `
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

        if (-not $hasReadDatasetReference)
        {
            Add-ArchLucidAzureAdfTypePropertyDatasetReference `
                -FactoryResourceId $FactoryResourceId `
                -PipelineResourceId $PipelineResourceId `
                -PipelineName $PipelineName `
                -ActivityName $activityName `
                -ActivityType $activityType `
                -Activity $activity `
                -FlowDirection 'Read' `
                -PropertyName 'dataset' `
                -Rows $Rows `
                -FlowKeys $FlowKeys

            Add-ArchLucidAzureAdfTypePropertyDatasetReference `
                -FactoryResourceId $FactoryResourceId `
                -PipelineResourceId $PipelineResourceId `
                -PipelineName $PipelineName `
                -ActivityName $activityName `
                -ActivityType $activityType `
                -Activity $activity `
                -FlowDirection 'Read' `
                -PropertyName 'source' `
                -Rows $Rows `
                -FlowKeys $FlowKeys
        }

        $hasWriteDatasetReference = Add-ArchLucidAzureAdfDatasetReferenceFlows `
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

        if (-not $hasWriteDatasetReference)
        {
            Add-ArchLucidAzureAdfTypePropertyDatasetReference `
                -FactoryResourceId $FactoryResourceId `
                -PipelineResourceId $PipelineResourceId `
                -PipelineName $PipelineName `
                -ActivityName $activityName `
                -ActivityType $activityType `
                -Activity $activity `
                -FlowDirection 'Write' `
                -PropertyName 'sink' `
                -Rows $Rows `
                -FlowKeys $FlowKeys
        }
    }
}

function Add-ArchLucidAzureAdfExecuteDataflowFlows
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
        [hashtable] $DataflowsByName,
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [System.Collections.ArrayList] $Rows,
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [System.Collections.Generic.HashSet[string]] $FlowKeys
    )

    [string]$dataflowName = ''
    try { $dataflowName = "$( $Activity.typeProperties.dataFlow.referenceName )".Trim() } catch { }
    if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $dataflowName) `
        -or -not $DataflowsByName.ContainsKey($dataflowName))
    {
        return
    }

    $dataflow = $DataflowsByName[$dataflowName]
    foreach ($direction in @(
            [ordered]@{ Name = 'sourceLinkedServiceNames'; Value = 'Read' },
            [ordered]@{ Name = 'sinkLinkedServiceNames'; Value = 'Write' }))
    {
        foreach ($linkedServiceName in @($dataflow.($direction.Name)))
        {
            [string]$name = "$( $linkedServiceName )".Trim()
            if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $name)) { continue }

            [string]$flowKey = "$FactoryResourceId|$PipelineResourceId|$ActivityName|$($direction.Value)|ls:$name"
            if (-not $FlowKeys.Add($flowKey)) { continue }

            [void]$Rows.Add([ordered]@{
                factoryResourceId = $FactoryResourceId
                pipelineResourceId = $PipelineResourceId
                pipelineName = $PipelineName
                activityName = $ActivityName
                activityType = $ActivityType
                flowDirection = $direction.Value
                datasetName = "__linkedService:$name"
                collectionStatus = 'Succeeded'
            })
        }
    }
}

function Add-ArchLucidAzureAdfTypePropertyDatasetReference
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
        [string] $FlowDirection,
        [Parameter(Mandatory = $true)]
        [string] $PropertyName,
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList] $Rows,
        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.HashSet[string]] $FlowKeys
    )

    $typeProperties = $Activity.typeProperties
    if ($null -eq $typeProperties) { return }

    $dataset = $typeProperties
    if ($PropertyName -in @('source', 'sink'))
    {
        $dataset = $typeProperties.$PropertyName.dataset
    }

    if ($null -eq $dataset) { return }

    [string]$referenceType = ''
    try { $referenceType = "$( $dataset.type )".Trim() } catch { }
    if ($referenceType -like '*Expression*') { return }

    [string]$datasetName = ''
    try { $datasetName = "$( $dataset.referenceName )".Trim() } catch { }
    if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $datasetName)) { return }

    [string]$flowKey = "$FactoryResourceId|$PipelineResourceId|$ActivityName|$FlowDirection|$datasetName"
    if (-not $FlowKeys.Add($flowKey)) { return }

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

    $addedReference = $false

    foreach ($reference in $references)
    {
        if ($null -eq $reference) { continue }

        [string]$referenceType = ''
        try { $referenceType = "$( $reference.type )".Trim() } catch { }

        if ($referenceType -like '*Expression*') { continue }

        [string]$datasetName = ''
        try { $datasetName = "$( $reference.referenceName )".Trim() } catch { }

        if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $datasetName)) { continue }

        [string]$flowKey = "$FactoryResourceId|$PipelineResourceId|$ActivityName|$FlowDirection|$datasetName"
        if (-not $FlowKeys.Add($flowKey)) { continue }

        $addedReference = $true
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

    return $addedReference
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

function Get-ArchLucidAzureAdfDataflowLinkedServiceNames
{
    param(
        [Parameter(Mandatory = $false)]
        [object[]] $Items,

        [Parameter(Mandatory = $false)]
        [hashtable] $DatasetLinkedServiceNames
    )

    $names = [System.Collections.Generic.List[string]]::new()
    foreach ($item in @($Items))
    {
        if ($null -eq $item) { continue }

        [string]$linkedServiceName = ''
        try { $linkedServiceName = "$( $item.linkedService.referenceName )".Trim() } catch { }

        if ([string]::IsNullOrWhiteSpace($linkedServiceName))
        {
            try { $linkedServiceName = "$( $item.dataset.linkedService.referenceName )".Trim() } catch { }
        }

        if ([string]::IsNullOrWhiteSpace($linkedServiceName) -and $null -ne $DatasetLinkedServiceNames)
        {
            [string]$datasetName = ''
            try { $datasetName = "$( $item.dataset.referenceName )".Trim() } catch { }

            if (-not [string]::IsNullOrWhiteSpace($datasetName) `
                -and $DatasetLinkedServiceNames.ContainsKey($datasetName))
            {
                $linkedServiceName = "$( $DatasetLinkedServiceNames[$datasetName] )".Trim()
            }
        }

        if ((Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $linkedServiceName) `
            -and -not @($names | Where-Object {
                $_.Equals($linkedServiceName, [System.StringComparison]::OrdinalIgnoreCase)
            }))
        {
            $names.Add($linkedServiceName)
        }
    }

    return @($names.ToArray())
}

function Get-ArchLucidAzureAdfDataflowCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources,

        [Parameter(Mandatory = $false)]
        [object[]] $DatasetRows = @()
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
            $datasetLinkedServiceNames = @{}

            foreach ($datasetRow in @($DatasetRows))
            {
                if ($null -eq $datasetRow) { continue }
                if ("$( $datasetRow.factoryResourceId )".Trim() -ne $factoryResourceId) { continue }

                [string]$datasetName = "$( $datasetRow.datasetName )".Trim()
                [string]$linkedServiceName = "$( $datasetRow.linkedServiceName )".Trim()
                if (-not [string]::IsNullOrWhiteSpace($datasetName) `
                    -and (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $linkedServiceName))
                {
                    $datasetLinkedServiceNames[$datasetName] = $linkedServiceName
                }
            }

            foreach ($dataflow in @($payload.value))
            {
                [string]$dataflowResourceId = "$( $dataflow.id )".Trim()
                [string]$dataflowName = "$( $dataflow.name )".Trim()

                if ([string]::IsNullOrWhiteSpace($dataflowResourceId) -or [string]::IsNullOrWhiteSpace($dataflowName))
                {
                    continue
                }

                $dataflowDetails = $dataflow
                $typeProperties = $null
                try { $typeProperties = $dataflow.properties.typeProperties } catch { }

                if ($null -eq $typeProperties)
                {
                    try
                    {
                        $detailResponse = Invoke-AzRestMethod -Method GET `
                            -Path "$dataflowResourceId?api-version=$apiVersion" `
                            -ErrorAction Stop
                        $dataflowDetails = $detailResponse.Content | ConvertFrom-Json -ErrorAction Stop
                        $typeProperties = $dataflowDetails.properties.typeProperties
                    }
                    catch
                    {
                        continue
                    }
                }

                [void]$rows.Add([ordered]@{
                    factoryResourceId = $factoryResourceId
                    dataflowResourceId = $dataflowResourceId
                    dataflowName = $dataflowName
                    sourceLinkedServiceNames = @(Get-ArchLucidAzureAdfDataflowLinkedServiceNames `
                        -Items @($typeProperties.sources) `
                        -DatasetLinkedServiceNames $datasetLinkedServiceNames)
                    sinkLinkedServiceNames = @(Get-ArchLucidAzureAdfDataflowLinkedServiceNames `
                        -Items @($typeProperties.sinks) `
                        -DatasetLinkedServiceNames $datasetLinkedServiceNames)
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

function Test-ArchLucidAzureLogicAppActionResourceId
{
    param(
        [AllowEmptyString()]
        [string] $Value,

        [string] $WorkflowResourceId
    )

    if ([string]::IsNullOrWhiteSpace($Value) `
        -or $Value.Contains('@') `
        -or -not $Value.Trim().StartsWith('/subscriptions/', [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $false
    }

    [string]$candidate = $Value.Trim()
    if ($candidate.Equals($WorkflowResourceId, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }

    [string[]]$segments = @($candidate.Trim('/').Split('/'))
    [int]$providerIndex = [System.Array]::IndexOf(
        $segments,
        ($segments | Where-Object { $_ -ieq 'providers' } | Select-Object -First 1))
    if ($providerIndex -lt 0 -or $providerIndex + 2 -ge $segments.Count) { return $false }

    [string]$providerAndType = "$($segments[$providerIndex + 1])/$($segments[$providerIndex + 2])".ToLowerInvariant()
    return $providerAndType -in @(
        'microsoft.datafactory/factories',
        'microsoft.synapse/workspaces',
        'microsoft.storage/storageaccounts',
        'microsoft.web/sites',
        'microsoft.servicebus/namespaces',
        'microsoft.eventhub/namespaces',
        'microsoft.sql/servers',
        'microsoft.documentdb/databaseaccounts')
}

function Test-ArchLucidAzureLogicAppSensitiveProperty
{
    param([string] $PropertyName)

    [string]$normalized = "$( $PropertyName )".Replace('_', '').Replace('-', '').ToLowerInvariant()
    return $normalized -match 'password|secret|connectionstring|securedata|accesskey|accountkey|token|sas|authentication'
}

function Add-ArchLucidAzureLogicAppActionConnectionRows
{
    param(
        [object] $Node,
        [string] $ActionName,
        [string] $WorkflowResourceId,
        [string] $WorkflowName,
        [System.Collections.ArrayList] $Rows,
        [hashtable] $Seen
    )

    if ($null -eq $Node) { return }

    if ($Node -is [System.Array])
    {
        foreach ($item in $Node)
        {
            Add-ArchLucidAzureLogicAppActionConnectionRows `
                -Node $item `
                -ActionName $ActionName `
                -WorkflowResourceId $WorkflowResourceId `
                -WorkflowName $WorkflowName `
                -Rows $Rows `
                -Seen $Seen
        }
        return
    }

    if ($Node -is [string]) { return }

    foreach ($property in @($Node.PSObject.Properties))
    {
        if (Test-ArchLucidAzureLogicAppSensitiveProperty -PropertyName $property.Name) { continue }

        if ($property.Name -ieq 'actions' -and $null -ne $property.Value)
        {
            foreach ($actionProperty in @($property.Value.PSObject.Properties))
            {
                Add-ArchLucidAzureLogicAppActionConnectionRows `
                    -Node $actionProperty.Value `
                    -ActionName $actionProperty.Name `
                    -WorkflowResourceId $WorkflowResourceId `
                    -WorkflowName $WorkflowName `
                    -Rows $Rows `
                    -Seen $Seen
            }
            continue
        }

        if ($property.Value -is [string])
        {
            if (Test-ArchLucidAzureLogicAppActionResourceId `
                    -Value $property.Value `
                    -WorkflowResourceId $WorkflowResourceId)
            {
                [string]$resourceId = $property.Value.Trim()
                [string]$key = "$WorkflowResourceId|$resourceId"
                if (-not $Seen.ContainsKey($key))
                {
                    $Seen[$key] = $true
                    [void]$Rows.Add([ordered]@{
                        workflowResourceId = $WorkflowResourceId
                        workflowName = $WorkflowName
                        connectionName = $ActionName
                        connectionResourceId = $resourceId
                        collectionStatus = 'Succeeded'
                    })
                }
            }
            continue
        }

        Add-ArchLucidAzureLogicAppActionConnectionRows `
            -Node $property.Value `
            -ActionName $ActionName `
            -WorkflowResourceId $WorkflowResourceId `
            -WorkflowName $WorkflowName `
            -Rows $Rows `
            -Seen $Seen
    }
}

function Add-ArchLucidAzureLogicAppWorkflowCollectionFailureRow(
    [System.Collections.IList] $Rows,
    [hashtable] $Seen,
    [string] $WorkflowResourceId,
    [string] $WorkflowName,
    [string] $Reason)
{
    [string]$warningCode = "logic-app-connections-not-collected:${Reason}:$( $WorkflowResourceId.Trim() )"
    [string]$key = "$WorkflowResourceId|_collection|$warningCode"

    if ($Seen.ContainsKey($key))
    {
        return
    }

    $Seen[$key] = $true

    [string]$collectionStatus = if ($Reason -eq 'insufficient-permission') { 'Forbidden' } else { 'MalformedPayload' }

    [void]$Rows.Add([ordered]@{
        workflowResourceId = $WorkflowResourceId
        workflowName = $WorkflowName
        connectionName = '_collection'
        collectionStatus = $collectionStatus
        warningCode = $warningCode
    })
}

function Add-ArchLucidAzureStaticSiteLinkedBackendAssociationRows(
    [System.Collections.IList] $NetworkAssociationRows,
    [object[]] $InventoryResources)
{
    [System.Collections.Generic.List[string]]$warnings = [System.Collections.Generic.List[string]]::new()
    [hashtable]$seen = @{}

    foreach ($row in @($NetworkAssociationRows))
    {
        [string]$key = "$( $row.fromResourceId )|$( $row.associationType )|$( $row.toResourceId )"
        $seen[$key] = $true
    }

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return [pscustomobject]@{
            rows = @($NetworkAssociationRows)
            warnings = @($warnings)
        }
    }

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ($resourceType -ne 'Microsoft.Web/staticSites' -or [string]::IsNullOrWhiteSpace($resourceId))
        {
            continue
        }

        try
        {
            [string]$path = "$resourceId/linkedBackends?api-version=2023-12-01"
            [object]$response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

            if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403)
            {
                [void]$warnings.Add("static-site-backends-not-collected:insufficient-permission:$resourceId")
                continue
            }

            if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
            {
                [void]$warnings.Add("static-site-backends-not-collected:http-error:$resourceId")
                continue
            }

            [object]$payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

            foreach ($backend in @($payload.value))
            {
                [string]$backendResourceId = ''

                try
                {
                    $backendResourceId = "$( $backend.properties.resourceId )".Trim()
                }
                catch
                {
                }

                if ([string]::IsNullOrWhiteSpace($backendResourceId))
                {
                    try
                    {
                        $backendResourceId = "$( $backend.properties.backendResourceId )".Trim()
                    }
                    catch
                    {
                    }
                }

                if ([string]::IsNullOrWhiteSpace($backendResourceId))
                {
                    continue
                }

                Add-ArchLucidNetworkAssociationRow `
                    -Rows $NetworkAssociationRows `
                    -Seen $seen `
                    -FromResourceId $resourceId `
                    -ToResourceId $backendResourceId `
                    -AssociationType 'staticSiteToLinkedBackend'
            }
        }
        catch
        {
            [void]$warnings.Add("static-site-backends-not-collected:error:$resourceId")
        }
    }

    return [pscustomobject]@{
        rows = @($NetworkAssociationRows)
        warnings = @($warnings)
    }
}

function Add-ArchLucidAzureFabricCapacityWorkspaceAssociationRows(
    [System.Collections.IList] $NetworkAssociationRows,
    [object[]] $InventoryResources)
{
    [System.Collections.Generic.List[string]]$warnings = [System.Collections.Generic.List[string]]::new()
    [hashtable]$seen = @{}

    foreach ($row in @($NetworkAssociationRows))
    {
        [string]$key = "$( $row.fromResourceId )|$( $row.associationType )|$( $row.toResourceId )"
        $seen[$key] = $true
    }

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return [pscustomobject]@{
            rows = @($NetworkAssociationRows)
            warnings = @($warnings)
        }
    }

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$resourceId = "$( $resource.resourceId )".Trim()

        if ($resourceType -ne 'Microsoft.Fabric/capacities' -or [string]::IsNullOrWhiteSpace($resourceId))
        {
            continue
        }

        try
        {
            [string]$path = "$resourceId/workspaces?api-version=2024-05-01"
            [object]$response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

            if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403)
            {
                [void]$warnings.Add("fabric-capacity-assignments-not-collected:insufficient-permission:$resourceId")
                continue
            }

            if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
            {
                [void]$warnings.Add("fabric-capacity-assignments-not-collected:http-error:$resourceId")
                continue
            }

            [object]$payload = $response.Content | ConvertFrom-Json -ErrorAction Stop
            [int]$outsideInventoryCount = 0

            foreach ($workspace in @($payload.value))
            {
                [string]$workspaceId = "$( $workspace.id )".Trim()

                if (-not $workspaceId.StartsWith('/subscriptions/', [System.StringComparison]::OrdinalIgnoreCase))
                {
                    $outsideInventoryCount++
                    continue
                }

                Add-ArchLucidNetworkAssociationRow `
                    -Rows $NetworkAssociationRows `
                    -Seen $seen `
                    -FromResourceId $resourceId `
                    -ToResourceId $workspaceId `
                    -AssociationType 'fabricCapacityToWorkspace'
            }

            if ($outsideInventoryCount -gt 0)
            {
                [void]$warnings.Add("fabric-capacity-workspaces-outside-inventory:${outsideInventoryCount}:$resourceId")
            }
        }
        catch
        {
            [void]$warnings.Add("fabric-capacity-assignments-not-collected:error:$resourceId")
        }
    }

    return [pscustomobject]@{
        rows = @($NetworkAssociationRows)
        warnings = @($warnings)
    }
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
        [string]$workflowName = "$( $resource.name )".Trim()

        if ($resourceType -eq 'Microsoft.Logic/workflows' -and -not [string]::IsNullOrWhiteSpace($resourceId))
        {
            try
            {
                [string]$path = "$resourceId?api-version=2019-05-01"
                [object]$response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

                if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403)
                {
                    Add-ArchLucidAzureLogicAppWorkflowCollectionFailureRow `
                        -Rows $rows `
                        -Seen $seen `
                        -WorkflowResourceId $resourceId `
                        -WorkflowName $workflowName `
                        -Reason 'insufficient-permission'
                    continue
                }

                if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
                {
                    Add-ArchLucidAzureLogicAppWorkflowCollectionFailureRow `
                        -Rows $rows `
                        -Seen $seen `
                        -WorkflowResourceId $resourceId `
                        -WorkflowName $workflowName `
                        -Reason 'http-error'
                    continue
                }

                [object]$workflow = $response.Content | ConvertFrom-Json -ErrorAction Stop
                [string]$resolvedWorkflowName = "$( $workflow.name )".Trim()

                if ([string]::IsNullOrWhiteSpace($resolvedWorkflowName))
                {
                    $resolvedWorkflowName = $workflowName
                }

                [object]$connections = $null

                try
                {
                    $connections = $workflow.properties.parameters.'$connections'.value
                }
                catch
                {
                }

                if ($null -ne $connections)
                {
                    foreach ($property in $connections.PSObject.Properties)
                    {
                        [string]$connectionName = $property.Name
                        [string]$connectionResourceId = "$( $property.Value.connectionId )".Trim()

                        if (-not (Test-ArchLucidAzureAdfStaticReferenceName -ReferenceName $connectionName)) { continue }
                        if ([string]::IsNullOrWhiteSpace($connectionResourceId)) { continue }

                        [string]$key = "$resourceId|$connectionName|$connectionResourceId"
                        if ($seen.ContainsKey($key)) { continue }
                        $seen[$key] = $true
                        $seen["$resourceId|$connectionResourceId"] = $true

                        [void]$rows.Add([ordered]@{
                            workflowResourceId = $resourceId
                            workflowName = $resolvedWorkflowName
                            connectionName = $connectionName
                            connectionResourceId = $connectionResourceId
                            collectionStatus = 'Succeeded'
                        })
                    }
                }

                Add-ArchLucidAzureLogicAppActionConnectionRows `
                    -Node $workflow.properties.definition `
                    -ActionName $workflow.name `
                    -WorkflowResourceId $resourceId `
                    -WorkflowName $resolvedWorkflowName `
                    -Rows $rows `
                    -Seen $seen
            }
            catch
            {
                Add-ArchLucidAzureLogicAppWorkflowCollectionFailureRow `
                    -Rows $rows `
                    -Seen $seen `
                    -WorkflowResourceId $resourceId `
                    -WorkflowName $workflowName `
                    -Reason 'error'
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

    [object[]]$rows = @(Get-ArchLucidAzureAppSettingHostParsedRows -SettingName $SettingName -Value $Value)

    if ($rows.Count -eq 0)
    {
        return $null
    }

    return $rows[0]
}

function Get-ArchLucidAzureAppSettingHostParsedRows
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SettingName,

        [Parameter(Mandatory = $false)]
        [string] $Value
    )

    if ([string]::IsNullOrWhiteSpace($Value))
    {
        return @()
    }

    [System.Collections.ArrayList] $rows = [System.Collections.ArrayList]::new()
    $primary = [ordered]@{
        settingName = $SettingName
        parsedHost = $null
        catalog = $null
        keyVaultHost = $null
        secretName = $null
        warningCode = $null
    }

    $sqlMatch = [regex]::Match($Value, 'Server\s*=\s*(?:tcp:)?(?<host>[^,;]+)', 'IgnoreCase')

    if ($sqlMatch.Success)
    {
        $primary.parsedHost = $sqlMatch.Groups['host'].Value.Trim().ToLowerInvariant()
    }

    $catalogMatch = [regex]::Match(
        $Value,
        '(?:Initial\s+Catalog|Database)\s*=\s*(?<catalog>[^;]+)',
        'IgnoreCase')

    if ($catalogMatch.Success)
    {
        [string]$catalog = $catalogMatch.Groups['catalog'].Value.Trim()

        if ($catalog -match '[{}]' -or $catalog -match '(?i)\{0\}' -or $catalog -match '(?i)\{tenant\}')
        {
            $primary.warningCode = 'app-settings-catalog-template'
        }
        else
        {
            $primary.catalog = $catalog
        }
    }

    $kvMatch = [regex]::Match(
        $Value,
        '@Microsoft\.KeyVault\(SecretUri\s*=\s*https?://(?<host>[^/]+)/secrets/(?<secret>[^/)]+)',
        'IgnoreCase')

    if ($kvMatch.Success)
    {
        $primary.keyVaultHost = $kvMatch.Groups['host'].Value.Trim().ToLowerInvariant()
        $primary.secretName = $kvMatch.Groups['secret'].Value.Trim()
    }

    if ([string]::IsNullOrWhiteSpace($primary.parsedHost) -and [string]::IsNullOrWhiteSpace($primary.keyVaultHost))
    {
        $httpsMatch = [regex]::Match($Value, 'https?://(?<host>[^/\s;]+)', 'IgnoreCase')

        if ($httpsMatch.Success)
        {
            [string]$httpsHost = $httpsMatch.Groups['host'].Value.Trim().ToLowerInvariant()

            if ($httpsHost.EndsWith('.vault.azure.net', [StringComparison]::OrdinalIgnoreCase))
            {
                $primary.keyVaultHost = $httpsHost
            }
            else
            {
                $primary.parsedHost = $httpsHost
            }
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($primary.parsedHost) -or
        -not [string]::IsNullOrWhiteSpace($primary.keyVaultHost) -or
        -not [string]::IsNullOrWhiteSpace($primary.catalog) -or
        -not [string]::IsNullOrWhiteSpace($primary.warningCode))
    {
        [void]$rows.Add($primary)
    }

    Add-ArchLucidAzureAppSettingHostConnectionStringHosts -Value $Value -Rows $rows

    return @($rows.ToArray())
}

function Add-ArchLucidAzureAppSettingHostConnectionStringHosts
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $Value,

        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList] $Rows
    )

    $accountMatch = [regex]::Match($Value, 'AccountName\s*=\s*(?<name>[^;]+)', 'IgnoreCase')

    if ($accountMatch.Success)
    {
        [string]$accountName = $accountMatch.Groups['name'].Value.Trim().ToLowerInvariant()
        [string[]]$endpointHosts = @()

        foreach ($endpointKey in @('QueueEndpoint', 'TableEndpoint', 'FileEndpoint', 'BlobEndpoint'))
        {
            $endpointMatch = [regex]::Match(
                $Value,
                "$endpointKey\s*=\s*https?://(?<host>[^/\s;]+)",
                'IgnoreCase')

            if ($endpointMatch.Success)
            {
                $endpointHosts += $endpointMatch.Groups['host'].Value.Trim().ToLowerInvariant()
            }
        }

        if ($endpointHosts.Count -gt 0)
        {
            foreach ($endpointHost in ($endpointHosts | Select-Object -Unique))
            {
                Add-ArchLucidAzureAppSettingHostParsedHostRow -Rows $Rows -ParsedHostValue $endpointHost
            }
        }
        else
        {
            $suffixMatch = [regex]::Match($Value, 'EndpointSuffix\s*=\s*(?<suffix>[^;]+)', 'IgnoreCase')

            if ($suffixMatch.Success)
            {
                [string]$suffix = $suffixMatch.Groups['suffix'].Value.Trim().ToLowerInvariant()
                Add-ArchLucidAzureAppSettingHostParsedHostRow -Rows $Rows -ParsedHostValue "$accountName.blob.$suffix"
            }
        }
    }

    $serviceBusMatch = [regex]::Match($Value, 'Endpoint\s*=\s*sb://(?<host>[^/;\s]+)/?', 'IgnoreCase')

    if ($serviceBusMatch.Success)
    {
        Add-ArchLucidAzureAppSettingHostParsedHostRow -Rows $Rows -ParsedHostValue $serviceBusMatch.Groups['host'].Value.Trim().ToLowerInvariant()
    }

    $cosmosMatch = [regex]::Match($Value, 'https?://(?<host>[^/\s;]+\.documents\.azure\.com)', 'IgnoreCase')

    if ($cosmosMatch.Success)
    {
        Add-ArchLucidAzureAppSettingHostParsedHostRow -Rows $Rows -ParsedHostValue $cosmosMatch.Groups['host'].Value.Trim().ToLowerInvariant()
    }

    $redisMatch = [regex]::Match($Value, '(?<host>[^,;\s]+\.redis\.cache\.windows\.net)', 'IgnoreCase')

    if ($redisMatch.Success)
    {
        Add-ArchLucidAzureAppSettingHostParsedHostRow -Rows $Rows -ParsedHostValue $redisMatch.Groups['host'].Value.Trim().ToLowerInvariant()
    }
}

function Add-ArchLucidAzureAppSettingHostParsedHostRow
{
    param(
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList] $Rows,

        [Parameter(Mandatory = $true)]
        [string] $ParsedHostValue
    )

    [string]$normalizedHost = $ParsedHostValue.Trim().ToLowerInvariant()

    foreach ($existing in @($Rows))
    {
        if ($existing.parsedHost -eq $normalizedHost)
        {
            return
        }
    }

    [void]$Rows.Add([ordered]@{
        settingName = $null
        parsedHost = $normalizedHost
        catalog = $null
        keyVaultHost = $null
        secretName = $null
        warningCode = $null
    })
}

function Add-ArchLucidAzureAppSettingHostCompanionRow
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [System.Collections.ArrayList] $Rows,

        [Parameter(Mandatory = $true)]
        [hashtable] $Seen,

        [Parameter(Mandatory = $true)]
        [string] $SiteResourceId,

        [Parameter(Mandatory = $true)]
        [string] $SettingName,

        [Parameter(Mandatory = $false)]
        [string] $ParsedHost,

        [Parameter(Mandatory = $false)]
        [string] $Catalog,

        [Parameter(Mandatory = $false)]
        [string] $KeyVaultHost,

        [Parameter(Mandatory = $false)]
        [string] $SecretName,

        [Parameter(Mandatory = $false)]
        [string] $SecretRef,

        [Parameter(Mandatory = $false)]
        [string] $WarningCode,

        [Parameter(Mandatory = $false)]
        [string] $CollectionStatus = 'Succeeded'
    )

    [string]$key = "$SiteResourceId|$SettingName|$ParsedHost|$Catalog|$KeyVaultHost|$SecretName|$SecretRef|$WarningCode"

    if ($Seen.ContainsKey($key)) { return }

    $Seen[$key] = $true

    [void]$Rows.Add([ordered]@{
        siteResourceId = $SiteResourceId
        settingName = $SettingName
        host = $ParsedHost
        catalog = $Catalog
        keyVaultHost = $KeyVaultHost
        secretName = $SecretName
        secretRef = $SecretRef
        warningCode = $WarningCode
        collectionStatus = $CollectionStatus
    })
}

function Get-ArchLucidAzureContainerAppEnvEntriesFromJson
{
    param(
        [Parameter(Mandatory = $true)]
        [object] $ContainerAppJson
    )

    $entries = [System.Collections.ArrayList]::new()

    if ($null -eq $ContainerAppJson) { return @($entries.ToArray()) }

    [object[]]$containers = @()

    try
    {
        if ($ContainerAppJson.properties.template.containers)
        {
            $containers = @($ContainerAppJson.properties.template.containers)
        }
    }
    catch
    {
        return @($entries.ToArray())
    }

    foreach ($container in @($containers))
    {
        if ($null -eq $container -or $null -eq $container.env) { continue }

        foreach ($envEntry in @($container.env))
        {
            if ($null -eq $envEntry) { continue }

            [string]$name = "$( $envEntry.name )".Trim()

            if ([string]::IsNullOrWhiteSpace($name)) { continue }

            [string]$value = $null
            [string]$secretRef = $null

            if ($envEntry.PSObject.Properties.Match('value').Count -gt 0 -and $null -ne $envEntry.value)
            {
                $value = "$( $envEntry.value )".Trim()
            }

            if ($envEntry.PSObject.Properties.Match('secretRef').Count -gt 0 -and $null -ne $envEntry.secretRef)
            {
                $secretRef = "$( $envEntry.secretRef )".Trim()
            }

            [void]$entries.Add([ordered]@{
                name = $name
                value = $value
                secretRef = $secretRef
            })
        }
    }

    return @($entries.ToArray())
}

function Get-ArchLucidAzureContainerAppEnvEntries
{
    param(
        [Parameter(Mandatory = $true)]
        [object] $Resource
    )

    [string]$siteResourceId = "$( $Resource.resourceId )".Trim()
    $entries = @(Get-ArchLucidAzureContainerAppEnvEntriesFromJson -ContainerAppJson $Resource)

    if ($entries.Count -gt 0)
    {
        return $entries
    }

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        return @()
    }

    if ([string]::IsNullOrWhiteSpace($siteResourceId))
    {
        return @()
    }

    try
    {
        [string]$path = "${siteResourceId}?api-version=2024-03-01"
        $response = Invoke-AzRestMethod -Method GET -Path $path -ErrorAction Stop

        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
        {
            return @()
        }

        $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop

        return @(Get-ArchLucidAzureContainerAppEnvEntriesFromJson -ContainerAppJson $payload)
    }
    catch
    {
        return @()
    }
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

        if ([string]::IsNullOrWhiteSpace($siteResourceId)) { continue }

        if ($resourceType -eq 'Microsoft.Web/sites')
        {
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
                        foreach ($parsed in @(Get-ArchLucidAzureAppSettingHostParsedRows -SettingName $settingName -Value $settingValue))
                        {
                            Add-ArchLucidAzureAppSettingHostCompanionRow `
                                -Rows $rows `
                                -Seen $seen `
                                -SiteResourceId $siteResourceId `
                                -SettingName $settingName `
                                -ParsedHost $parsed.parsedHost `
                                -Catalog $parsed.catalog `
                                -KeyVaultHost $parsed.keyVaultHost `
                                -SecretName $parsed.secretName `
                                -WarningCode $parsed.warningCode
                        }
                    }
                }
                catch
                {
                }
            }

            continue
        }

        if ($resourceType -ne 'Microsoft.App/containerApps')
        {
            continue
        }

        [object[]]$envEntries = @(Get-ArchLucidAzureContainerAppEnvEntries -Resource $resource)

        foreach ($envEntry in @($envEntries))
        {
            [string]$settingName = "$( $envEntry.name )".Trim()
            [string]$settingValue = "$( $envEntry.value )".Trim()
            [string]$secretRef = "$( $envEntry.secretRef )".Trim()
            $parsed = $null

            [object[]]$parsedRows = @()

            if (-not [string]::IsNullOrWhiteSpace($settingValue))
            {
                $parsedRows = @(Get-ArchLucidAzureAppSettingHostParsedRows -SettingName $settingName -Value $settingValue)
            }

            if ($parsedRows.Count -eq 0 -and [string]::IsNullOrWhiteSpace($secretRef))
            {
                continue
            }

            if ($parsedRows.Count -eq 0)
            {
                Add-ArchLucidAzureAppSettingHostCompanionRow `
                    -Rows $rows `
                    -Seen $seen `
                    -SiteResourceId $siteResourceId `
                    -SettingName $settingName `
                    -SecretRef $(if (-not [string]::IsNullOrWhiteSpace($secretRef)) { $secretRef } else { $null })

                continue
            }

            foreach ($parsed in $parsedRows)
            {
                Add-ArchLucidAzureAppSettingHostCompanionRow `
                    -Rows $rows `
                    -Seen $seen `
                    -SiteResourceId $siteResourceId `
                    -SettingName $settingName `
                    -ParsedHost $parsed.parsedHost `
                    -Catalog $parsed.catalog `
                    -KeyVaultHost $parsed.keyVaultHost `
                    -SecretName $parsed.secretName `
                    -SecretRef $(if (-not [string]::IsNullOrWhiteSpace($secretRef)) { $secretRef } else { $null }) `
                    -WarningCode $parsed.warningCode
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

function Get-ArchLucidAzureDependencyObservationCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    if (-not (Get-Command Invoke-AzRestMethod -ErrorAction SilentlyContinue))
    {
        Write-Warning 'dependency-observations: Invoke-AzRestMethod unavailable; companion omitted.'
        return @()
    }

    $workspaceCustomerIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()

        if ($resourceType -eq 'Microsoft.OperationalInsights/workspaces')
        {
            try
            {
                [string]$customerId = "$( $resource.properties.customerId )".Trim()

                if (-not [string]::IsNullOrWhiteSpace($customerId))
                {
                    [void]$workspaceCustomerIds.Add($customerId)
                }
            }
            catch
            {
            }
        }

        if ($resourceType -eq 'Microsoft.Insights/components')
        {
            try
            {
                [string]$workspaceResourceId = "$( $resource.properties.WorkspaceResourceId )".Trim()

                if (-not [string]::IsNullOrWhiteSpace($workspaceResourceId))
                {
                    [void]$workspaceCustomerIds.Add($workspaceResourceId)
                }
            }
            catch
            {
            }
        }
    }

    if ($workspaceCustomerIds.Count -eq 0)
    {
        Write-Warning 'dependency-observations: no Log Analytics workspace discovered in inventory; companion empty.'
        return @()
    }

    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}
    [DateTime]$windowEnd = (Get-Date).ToUniversalTime()
    [DateTime]$windowStart = $windowEnd.AddDays(-7)
    [string]$windowStartUtc = $windowStart.ToString('o')
    [string]$windowEndUtc = $windowEnd.ToString('o')

    $queries = @(
        @{
            observationKind = 'sqlDependency'
            operationClass = 'unknown'
            query = @"
AppDependencies
| where TimeGenerated >= ago(7d)
| where Target has '.database.windows.net'
| summarize eventCount = count() by sourcePrincipalId = AppRoleInstance, targetHost = tolower(Target), operationClass = 'unknown'
| where eventCount > 0
| take 200
"@
        },
        @{
            observationKind = 'httpDependency'
            operationClass = 'unknown'
            query = @"
AppDependencies
| where TimeGenerated >= ago(7d)
| where Target !has '.database.windows.net'
| summarize eventCount = count() by sourceAppRoleName = AppRoleName, targetHost = tolower(Target), operationClass = 'unknown'
| where eventCount > 0
| take 200
"@
        },
        @{
            observationKind = 'sqlAudit'
            operationClass = 'unknown'
            query = @"
AzureDiagnostics
| where TimeGenerated >= ago(7d)
| where Category == 'SQLSecurityAuditEvents'
| summarize eventCount = count() by sourcePrincipalId = tostring(identity_claim_oid_g), targetCatalog = database_name_s, operationClass = 'unknown'
| where eventCount > 0
| take 200
"@
        },
        @{
            observationKind = 'storageBlob'
            operationClass = 'unknown'
            query = @"
StorageBlobLogs
| where TimeGenerated >= ago(7d)
| summarize eventCount = count() by sourcePrincipalId = tostring(identity_claim_oid_g), targetHost = tolower(AccountName), operationClass = 'unknown'
| where eventCount > 0
| take 200
"@
        },
        @{
            observationKind = 'storageQueue'
            operationClass = 'unknown'
            query = @"
StorageQueueLogs
| where TimeGenerated >= ago(7d)
| summarize eventCount = count() by sourcePrincipalId = tostring(identity_claim_oid_g), targetHost = tolower(AccountName), operationClass = 'unknown'
| where eventCount > 0
| take 200
"@
        },
        @{
            observationKind = 'keyVault'
            operationClass = 'unknown'
            query = @"
AzureDiagnostics
| where TimeGenerated >= ago(7d)
| where ResourceProvider == 'MICROSOFT.KEYVAULT'
| summarize eventCount = count() by sourcePrincipalId = tostring(identity_claim_oid_g), targetHost = tolower(Resource), operationClass = 'unknown'
| where eventCount > 0
| take 200
"@
        },
        @{
            observationKind = 'managedIdentitySignIn'
            operationClass = 'unknown'
            query = @"
AADManagedIdentitySignInLogs
| where TimeGenerated >= ago(7d)
| where ResourceIdentityType == 'Service'
| summarize eventCount = count() by sourcePrincipalId = tostring(Identity), operationClass = 'unknown'
| where eventCount > 0
| take 200
"@
        }
    )

    foreach ($workspaceId in @($workspaceCustomerIds))
    {
        foreach ($querySpec in @($queries))
        {
            try
            {
                $body = @{
                    query = $querySpec.query
                    timespan = 'P7D'
                } | ConvertTo-Json -Depth 6 -Compress

                $response = Invoke-AzRestMethod `
                    -Method POST `
                    -Uri "https://api.loganalytics.io/v1/workspaces/$workspaceId/query" `
                    -Payload $body `
                    -ErrorAction Stop

                if ($response.StatusCode -eq 403 -or $response.StatusCode -eq 404)
                {
                    Write-Warning "dependency-observations: workspace $workspaceId returned $($response.StatusCode); skipping."
                    continue
                }

                if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300)
                {
                    Write-Warning "dependency-observations: workspace $workspaceId query failed with $($response.StatusCode)."
                    continue
                }

                $payload = $response.Content | ConvertFrom-Json -ErrorAction Stop
                $columns = @($payload.tables[0].columns | ForEach-Object { $_.name })
                $columnIndex = @{}

                for ($i = 0; $i -lt $columns.Count; $i++)
                {
                    $columnIndex[$columns[$i]] = $i
                }

                foreach ($tableRow in @($payload.tables[0].rows))
                {
                    [string]$sourcePrincipalId = ''
                    [string]$sourceAppRoleName = ''
                    [string]$targetHost = ''
                    [string]$targetCatalog = ''
                    [long]$eventCount = 0

                    if ($columnIndex.ContainsKey('sourcePrincipalId'))
                    {
                        $sourcePrincipalId = "$( $tableRow[$columnIndex['sourcePrincipalId']] )".Trim()
                    }

                    if ($columnIndex.ContainsKey('sourceAppRoleName'))
                    {
                        $sourceAppRoleName = "$( $tableRow[$columnIndex['sourceAppRoleName']] )".Trim()
                    }

                    if ($columnIndex.ContainsKey('targetHost'))
                    {
                        $targetHost = "$( $tableRow[$columnIndex['targetHost']] )".Trim().ToLowerInvariant()
                    }

                    if ($columnIndex.ContainsKey('targetCatalog'))
                    {
                        $targetCatalog = "$( $tableRow[$columnIndex['targetCatalog']] )".Trim()
                    }

                    if ($columnIndex.ContainsKey('eventCount'))
                    {
                        [void][long]::TryParse("$( $tableRow[$columnIndex['eventCount']] )", [ref]$eventCount)
                    }

                    if ([string]::IsNullOrWhiteSpace($sourcePrincipalId) -and [string]::IsNullOrWhiteSpace($sourceAppRoleName))
                    {
                        continue
                    }

                    [string]$key = "$workspaceId|$($querySpec.observationKind)|$sourcePrincipalId|$sourceAppRoleName|$targetHost|$targetCatalog"

                    if ($seen.ContainsKey($key)) { continue }
                    $seen[$key] = $true

                    [void]$rows.Add([ordered]@{
                        sourcePrincipalId = $(if ([string]::IsNullOrWhiteSpace($sourcePrincipalId)) { $null } else { $sourcePrincipalId })
                        sourceAppRoleName = $(if ([string]::IsNullOrWhiteSpace($sourceAppRoleName)) { $null } else { $sourceAppRoleName })
                        targetHost = $(if ([string]::IsNullOrWhiteSpace($targetHost)) { $null } else { $targetHost })
                        targetCatalog = $(if ([string]::IsNullOrWhiteSpace($targetCatalog)) { $null } else { $targetCatalog })
                        observationKind = $querySpec.observationKind
                        operationClass = $querySpec.operationClass
                        eventCount = $eventCount
                        windowStartUtc = $windowStartUtc
                        windowEndUtc = $windowEndUtc
                        workspaceId = $workspaceId
                        collectionStatus = 'Succeeded'
                    })
                }
            }
            catch
            {
                Write-Warning "dependency-observations: query failed for workspace $workspaceId ($($querySpec.observationKind))."
            }
        }
    }

    return @($rows.ToArray())
}

function Get-ArchLucidAzureSqlDatabasePrincipalCompanionRows
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $InventoryResources
    )

    $skipDatabaseNames = @('master', 'msdb', 'tempdb')
    $rows = [System.Collections.ArrayList]::new()
    $seen = @{}

    foreach ($resource in @($InventoryResources))
    {
        if ($null -eq $resource) { continue }

        [string]$resourceType = "$( $resource.resourceType )".Trim()
        [string]$databaseArmId = "$( $resource.resourceId )".Trim()
        [string]$databaseName = "$( $resource.name )".Trim()

        if ($resourceType -ne 'Microsoft.Sql/servers/databases') { continue }

        if ([string]::IsNullOrWhiteSpace($databaseArmId) -or [string]::IsNullOrWhiteSpace($databaseName)) { continue }

        if ($skipDatabaseNames -contains $databaseName.ToLowerInvariant()) { continue }

        if (-not ($databaseArmId -match '/servers/(?<server>[^/]+)/databases/(?<database>[^/]+)$'))
        {
            continue
        }

        [string]$serverName = $Matches['server']
        [string]$connectionString = "Server=tcp:$serverName.database.windows.net,1433;Database=$databaseName;Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;"

        try
        {
            $connection = [Microsoft.Data.SqlClient.SqlConnection]::new($connectionString)
            $connection.Open()
            $command = $connection.CreateCommand()
            $command.CommandText = "SELECT name, type_desc FROM sys.database_principals WHERE type IN ('E','X')"

            $reader = $command.ExecuteReader()

            while ($reader.Read())
            {
                [string]$principalName = "$( $reader.GetValue(0) )".Trim()
                [string]$typeDesc = "$( $reader.GetValue(1) )".Trim()

                if ([string]::IsNullOrWhiteSpace($principalName) -or [string]::IsNullOrWhiteSpace($typeDesc)) { continue }

                [string]$key = "$databaseArmId|$principalName|$typeDesc"

                if ($seen.ContainsKey($key)) { continue }
                $seen[$key] = $true

                [void]$rows.Add([ordered]@{
                    databaseArmId = $databaseArmId
                    principalName = $principalName
                    typeDesc = $typeDesc
                    collectionStatus = 'Succeeded'
                })
            }

            $reader.Close()
            $connection.Close()
        }
        catch
        {
            Write-Warning "sql-database-principals: connect/query failed for $databaseArmId."
        }
    }

    return @($rows.ToArray())
}
