# Redacted ARM properties document for resources.json (schema v2).

function Test-ArchLucidSensitiveArmPropertyKey
{
    param(
        [string] $PropertyKey
    )

    if ([string]::IsNullOrWhiteSpace($PropertyKey))
    {
        return $false
    }

    [string]$normalized = ($PropertyKey -replace '[-_]', '').ToLowerInvariant()
    [string[]]$fragments = @(
        'secret', 'password', 'connectionstring', 'privatekey', 'certificate',
        'accesskey', 'accountkey', 'apikey', 'clientsecret', 'primarykey', 'secondarykey'
    )

    foreach ($fragment in $fragments)
    {
        if ($normalized.Contains($fragment))
        {
            return $true
        }
    }

    if ($normalized.EndsWith('token', [System.StringComparison]::Ordinal)
        -and -not $normalized.EndsWith('tokenless', [System.StringComparison]::Ordinal)
        -and -not $normalized.EndsWith('tokenizer', [System.StringComparison]::Ordinal))
    {
        return $true
    }

    return $false
}

function ConvertTo-ArchLucidRedactedArmPropertyNode
{
    param(
        [object] $Node,
        [string] $PropertyKey = ''
    )

    if ($null -eq $Node)
    {
        return $null
    }

    if (Test-ArchLucidSensitiveArmPropertyKey $PropertyKey)
    {
        return '[REDACTED]'
    }

    if ($Node -is [System.Collections.IDictionary])
    {
        [ordered]@{} | Out-Null
        $clone = [ordered]@{}

        foreach ($key in @($Node.Keys))
        {
            $clone[$key] = ConvertTo-ArchLucidRedactedArmPropertyNode -Node $Node[$key] -PropertyKey "$key"
        }

        return $clone
    }

    if ($Node -is [System.Management.Automation.PSObject])
    {
        $props = @($Node.PSObject.Properties)

        if ($props.Count -eq 0)
        {
            return $Node
        }

        $clone = [ordered]@{}

        foreach ($prop in $props)
        {
            $clone[$prop.Name] = ConvertTo-ArchLucidRedactedArmPropertyNode -Node $prop.Value -PropertyKey $prop.Name
        }

        return $clone
    }

    if ($Node -is [System.Array])
    {
        $list = [System.Collections.Generic.List[object]]::new()

        foreach ($item in $Node)
        {
            $list.Add((ConvertTo-ArchLucidRedactedArmPropertyNode -Node $item -PropertyKey $PropertyKey))
        }

        return @($list.ToArray())
    }

    return $Node
}

function ConvertTo-ArchLucidRedactedArmPropertiesJson
{
    param(
        [object] $Properties,
        [int] $MaxLength = 32000
    )

    if ($null -eq $Properties)
    {
        return [pscustomobject]@{ json = ''; truncated = $false }
    }

    try
    {
        [object]$redacted = ConvertTo-ArchLucidRedactedArmPropertyNode -Node $Properties -PropertyKey ''
        [string]$json = $redacted | ConvertTo-Json -Depth 100 -Compress
        [bool]$truncated = $false

        if ($json.Length -gt $MaxLength)
        {
            $json = $json.Substring(0, $MaxLength)
            $truncated = $true
        }

        return [pscustomobject]@{ json = $json; truncated = $truncated }
    }
    catch
    {
        return [pscustomobject]@{ json = ''; truncated = $false }
    }
}

function Add-ArchLucidRedactedArmPropertiesToResourceRecord
{
    param(
        [hashtable] $Properties,
        [object] $ArmProperties
    )

    if ($null -eq $Properties -or $null -eq $ArmProperties)
    {
        return $false
    }

    $result = ConvertTo-ArchLucidRedactedArmPropertiesJson -Properties $ArmProperties

    if ([string]::IsNullOrWhiteSpace($result.json))
    {
        return $false
    }

    $Properties['armPropertiesRedactedJson'] = $result.json

    if ($result.truncated)
    {
        $Properties['armPropertiesTruncated'] = 'true'
    }

    return $result.truncated
}
