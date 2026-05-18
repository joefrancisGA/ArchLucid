# ArchLucid — Azure Policy Insights "latest" policy-state helpers for Get-ArchLucidAzurePackage.ps1
# Collects POST .../policyStates/latest/queryResults (same REST surface queried by Get-AzPolicyState).

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
        return ([Uri]::new(("$AbsoluteOrRelativeUri".Trim()))).PathAndQuery
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
        $candidate = "$( $prop.Name )".Trim()

        $isPaging =
            ($candidate.Equals("@odata.nextLink", [System.StringComparison]::OrdinalIgnoreCase)) -or
            ($candidate.Equals("odata.nextLink", [System.StringComparison]::OrdinalIgnoreCase))

        if (-not ($isPaging))
        {
            continue
        }

        $valueText = "$( $prop.Value )"

        if (-not ([string]::IsNullOrWhiteSpace($valueText)))
        {
            return $valueText
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

        # PS 7+: -NoEnumerate avoids single-element array wrapping quirks for objects.
        return ConvertFrom-Json -InputObject "$Response" -ErrorAction Stop -AsHashtable:$false -NoEnumerate
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

            # HttpWebResponse and HttpResponseMessage both expose numeric-castable HttpStatusCode enums.
            return [int]$possible.StatusCode

        }

        catch
        {

            continue

        }
    }

    return [int]::MinValue
}

function Invoke-ArchLucidPolicyInsightsPostRetryable([string] $RelativePathStartsWithSlash)
{

    param([Parameter(Mandatory = $true)] [ValidateNotNullOrEmpty()] [string] $RelativePathStartsWithSlash)


    $attempt = 0

    while ($attempt -lt 12)

    {


        ...

    }


}

