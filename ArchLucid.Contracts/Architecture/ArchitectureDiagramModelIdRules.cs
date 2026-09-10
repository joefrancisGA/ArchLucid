using System.Text.RegularExpressions;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Stable identifier rules for structured diagram nodes, edges, and subgraphs (AS-006).
/// </summary>
public static partial class ArchitectureDiagramModelIdRules
{
    public const int MaxIdLength = 128;

    [GeneratedRegex("^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$", RegexOptions.CultureInvariant)]
    private static partial Regex StableIdPattern();

    public static bool IsValidStableId(string? id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return false;
        }

        string trimmed = id.Trim();

        if (trimmed.Length > MaxIdLength)
        {
            return false;
        }

        return StableIdPattern().IsMatch(trimmed);
    }
}
