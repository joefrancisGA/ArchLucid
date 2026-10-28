namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestPrivateEndpointEdgeAccessibility
{
    public const string AccessTitlePrefix = "Private endpoint access was stored.";

    public const string NameNotStoredSuffix = "name not stored";

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

        if (string.IsNullOrWhiteSpace(privateEndpointAccessName))
        {
            return $"{AccessTitlePrefix} {NameNotStoredSuffix}";
        }

        return $"{AccessTitlePrefix} {privateEndpointAccessName.Trim()}";
    }
}
