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

    public static bool IsOmittedKind(string? kind)
    {
        if (string.IsNullOrWhiteSpace(kind))
        {
            return false;
        }

        return string.Equals(
            kind.Trim(),
            ArchitectureDiagramNodeKinds.KindNotStored,
            StringComparison.Ordinal);
    }

    public static bool IsAllowedKind(string? kind)
    {
        if (IsKnownKind(kind))
        {
            return true;
        }

        return IsOmittedKind(kind);
    }
}
