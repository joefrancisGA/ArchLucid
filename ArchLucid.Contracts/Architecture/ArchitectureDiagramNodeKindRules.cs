namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Published node-kind tokens for structured diagram models (AS-006).
/// </summary>
public static class ArchitectureDiagramNodeKindRules
{
    private static readonly HashSet<string> KnownKinds = new(StringComparer.Ordinal)
    {
        ArchitectureDiagramNodeKinds.User,
        ArchitectureDiagramNodeKinds.System,
        ArchitectureDiagramNodeKinds.External,
        ArchitectureDiagramNodeKinds.Boundary,
    };

    public static bool IsKnownKind(string? kind)
    {
        if (string.IsNullOrEmpty(kind))
        {
            return false;
        }

        return KnownKinds.Contains(kind);
    }
}
