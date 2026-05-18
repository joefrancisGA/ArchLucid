# ArchLucid - Azure Policy Insights latest policy-state helpers for Get-ArchLucidAzurePackage.ps1
# Calls POST PolicyStates/latest/queryResults (ARM; same RBAC read surface as Get-AzPolicyState).

function Escape-ODataArchLucidLiteral([string] $Literal)
{
    if ($null -eq $Literal)
    {
        return ""
    }

    return "$Literal".Replace("'", "''")
}

function Expand-ArmNextRelativePath([string] $AbsoluteOrRelativeUri)
{
    if ([string]::IsNullOrWhiteSpace("$AbsoluteOrRelativeUri"))
    {
        return $null
    }

    try
    {
        return ([Uri]::new("$AbsoluteOrRelativeUri".Trim())).PathAndQuery
    }
    catch
    {
        return $null
    }
}

function Get-AzurePolicyStatePageNextLinkAbsolute([PSObject] $ParsedPage)
{
    if ($null -eq $ParsedPage)
    {
        return $null
    }

    foreach ($prop in @( $ParsedPage.psobject.Properties ))
    {
        [string]$candidateName = "$( $prop.Name )".Trim()

        $matchesKnownPaging =
            ($candidateName.Equals("@odata.nextLink", [System.StringComparison]::OrdinalIgnoreCase)) -or
            ($candidateName.Equals("odata.nextLink", [System.StringComparison]::OrdinalIgnoreCase))

        if (-not ($matchesKnownPaging))
        {
            continue
        }

        [string]$candidateValue = "$( $prop.Value )"

        if (-not ([string]::IsNullOrWhiteSpace($candidateValue)))
        {
            return $candidateValue
        }
    }

    return $null
}

function Get-AzurePolicyStatePageValueArray([PSObject] $ParsedPage)
{
    if (($null -eq $ParsedPage) -or (-not ($ParsedPage.psobject.Properties["value"])))
    {
        return @()
    }

    return @($ParsedPage.value)
}

function Normalize-ArmPolicyStatePageBody([object] $Response)
{
    if ($null -eq $Response)
    {
        return $null
    }

    if ($Response -is [string])
    {
        return ConvertFrom-Json -InputObject "$Response" -ErrorAction Stop -AsHashtable:$false
    }

    return $Response
}

function Get-AzureHttpStatusFromPipelineError([System.Management.Automation.ErrorRecord] $Er)
{
    foreach ($possible in @( $Er.Exception.Response, $Er.Exception.InnerException.Response ))
    {
        if ($null -eq $possible)
        {
            continue
        }

        try
        {
            return [int]$possible.StatusCode
        }
        catch
        {
            continue
        }
    }

    return [int]::MinValue
}

function Invoke-ArchLucidPolicyInsightsPostRetryable(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string] $RelativePathStartsWithSlash)
{
    [System.Management.Automation.ErrorRecord]$lastEr = $null

    [string]$pathUse = "$RelativePathStartsWithSlash".Trim()

    if ([string]::IsNullOrWhiteSpace($pathUse))
    {
        throw "Policy Insights query requires Path."
    }

    if (-not $pathUse.StartsWith("/", [System.StringComparison]::Ordinal))
    {
        $pathUse = "/" + $pathUse.TrimStart('/')
    }

    for ($attempt = 1; $attempt -le 12; $attempt++)
    {
        try
        {
            return (Normalize-ArmPolicyStatePageBody (Invoke-AzRestMethod -Method POST -Path $pathUse -Payload '{}'))
        }
        catch
        {
            $lastEr = $_
            [int]$code = Get-AzureHttpStatusFromPipelineError $_

            if (($code -eq 401) -or ($code -eq 403))
            {
                throw $lastEr
            }

            [bool]$shouldBackoff =
                (($code -eq ([int]::MinValue)) -or ($code -in @(408, 425, 429, 500, 502, 503, 504)))

            if (-not ($shouldBackoff))
            {
                throw $lastEr
            }

            if ($attempt -eq 12)
            {
                throw $lastEr
            }

            [int]$sleepMs = [Math]::Min(90000, (900 + (($attempt - 1) * 2800)))
            [int]$fuzz = Get-Random -Minimum 120 -Maximum 620

            Start-Sleep -Milliseconds ($sleepMs + $fuzz)
        }
    }
}

function New-ArchLucidPolicyComplianceDocument(
    [Parameter(Mandatory = $true)]
    [string] $SubscriptionId,

    [Parameter(Mandatory = $true)]
    [string] $ScopeDescriptor,

    [Parameter(Mandatory = $true)]
    [string] $CollectionTimestampUtc,

    [string] $ResourceGroupScope,

    [int] $PolicyComplianceSchemaVersion = 1,

    [ValidateRange(50, 600)]
    [int] $PageSize = 450)
{
    [int]$safeTop = [Math]::Clamp($PageSize, 55, 500)

    [string]$pathBase =
        "/subscriptions/$SubscriptionId/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults"

    [System.Collections.Generic.List[string]]$queryParts = [System.Collections.Generic.List[string]]::new()

    [void]$queryParts.Add("api-version=2019-10-01")
    [void]$queryParts.Add("`$top=$safeTop")
    [void]$queryParts.Add("`$orderby=" + [Uri]::EscapeDataString("Timestamp desc"))

    if (-not ([string]::IsNullOrWhiteSpace("$ResourceGroupScope")))
    {
        [string]$rgPrefix =
            "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupScope/"

        [string]$lit = Escape-ODataArchLucidLiteral $rgPrefix
        [string]$filterExpr = "(startswith(ResourceId,'$lit'))"

        [void]$queryParts.Add("`$filter=" + [Uri]::EscapeDataString($filterExpr))
    }

    [string]$firstRequest = $pathBase + "?" + ($queryParts -join "&")

    [System.Collections.Generic.List[object]]$accumulator = [System.Collections.Generic.List[object]]::new()

    [string]$cursor = $firstRequest

    while (-not ([string]::IsNullOrWhiteSpace($cursor)))
    {
        [object]$page = Invoke-ArchLucidPolicyInsightsPostRetryable -RelativePathStartsWithSlash $cursor

        foreach ($row in @(Get-AzurePolicyStatePageValueArray $page))
        {
            [void]$accumulator.Add($row)
        }

        [string]$nextAbs = Get-AzurePolicyStatePageNextLinkAbsolute $page

        if ([string]::IsNullOrWhiteSpace($nextAbs))
        {
            break
        }

        [int]$pageGapMs = 160 + (Get-Random -Minimum 30 -Maximum 220)

        Start-Sleep -Milliseconds $pageGapMs

        [string]$nextRel = Expand-ArmNextRelativePath $nextAbs

        if ([string]::IsNullOrWhiteSpace($nextRel))
        {
            break
        }

        $cursor = $nextRel
    }

    return [ordered]@{
        policyComplianceSchemaVersion = $PolicyComplianceSchemaVersion
        collectionTimestampUtc = $CollectionTimestampUtc
        scope = $ScopeDescriptor
        managementPlane = "AzurePolicyInsights"
        apiShape = "policyStates/latest/queryResults"
        readerNote =
            "Policy Insights queryResults read aligns with RBAC Reader at subscription or resource-group scope."
        recordCount = $accumulator.Count
        records = @($accumulator)
    }
}
