# ArchLucid - JSON array serialization for extractor companion inventory files.

Set-StrictMode -Version Latest

function ConvertTo-ArchLucidJsonArray
{
    param(
        [AllowNull()]
        [object] $Items
    )

    [object[]]$rows = @()

    if ($null -ne $Items)
    {
        $rows = @($Items)
    }

    # Pipeline ConvertTo-Json unwraps a one-row collection into a JSON object.
    # Upload validation requires companion files to be JSON arrays, including 0- and 1-row inventories.
    return [string](ConvertTo-Json -InputObject $rows -Depth 12 -Compress:$false)
}
