namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestPrivateEndpointEdgeAccessibility
{
    public const string AccessTitlePrefix = "Private endpoint access was stored.";

    public const string NameNotStoredSuffix = "name not stored";

    public const string NameStoredEmptySuffix = "name was stored empty.";

    public const string MultiplePrivateEndpointAccessNamesStored =
        "Multiple private endpoint access names were stored on rolled-up members.";

    public static string FormatRollupMultiplePrivateEndpointAccessNames() =>
        $"{AccessTitlePrefix} {MultiplePrivateEndpointAccessNamesStored}";

    public static string FormatEdgeTitle(string? privateEndpointAccessName, bool multipleStoredNames = false)
    {
        if (multipleStoredNames)
        {
            return FormatRollupMultiplePrivateEndpointAccessNames();
        }

        if (privateEndpointAccessName is null)
        {
            return $"{AccessTitlePrefix} {NameNotStoredSuffix}";
        }

        if (privateEndpointAccessName.Length == 0)
        {
            return $"{AccessTitlePrefix} {NameStoredEmptySuffix}";
        }

        if (string.IsNullOrWhiteSpace(privateEndpointAccessName))
        {
            return $"{AccessTitlePrefix} {NameStoredEmptySuffix}";
        }

        return $"{AccessTitlePrefix} {privateEndpointAccessName.Trim()}";
    }
}
