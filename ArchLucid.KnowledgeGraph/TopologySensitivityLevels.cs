namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Canonical topology sensitivity labels used for security-baseline scoping (TB-2208).
/// </summary>
public static class TopologySensitivityLevels
{
    public const string PublicEdge = "public-edge";

    public const string Internal = "internal";

    public const string DataBearing = "data-bearing";

    public const string Identity = "identity";
}
