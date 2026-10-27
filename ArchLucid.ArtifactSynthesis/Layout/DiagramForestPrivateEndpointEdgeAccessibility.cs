namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestPrivateEndpointEdgeAccessibility
{
    public const string AccessTitlePrefix = "Private endpoint access was stored.";

    public const string NameNotStoredSuffix = "name not stored";

    public static string FormatEdgeTitle(string? privateEndpointAccessName)
    {
        if (string.IsNullOrWhiteSpace(privateEndpointAccessName))
        {
            return $"{AccessTitlePrefix} {NameNotStoredSuffix}";
        }

        return $"{AccessTitlePrefix} {privateEndpointAccessName.Trim()}";
    }
}
