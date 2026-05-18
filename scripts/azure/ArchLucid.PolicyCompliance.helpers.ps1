# ArchLucid — Azure Policy Insights "latest" policy-state helpers for Get-ArchLucidAzurePackage.ps1
# Calls POST PolicyStates/latest/queryResults (ARM; same RBAC/read surface as Get-AzPolicyState).

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

        ...

