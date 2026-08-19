using System.Text.RegularExpressions;

namespace ArchLucid.Decisioning.Feasibility;

/// <summary>
///     Validation helpers for <c>INV-*</c> keys from the architecture invariant catalog (ADR 0035).
/// </summary>
public static partial class FeasibilityInvariantCatalog
{
    public const string InvariantKeyPrefix = "INV-";

    /// <summary>Matches catalog IDs such as <c>INV-001</c> through <c>INV-016</c>.</summary>
    [GeneratedRegex(@"^INV-\d{3}$", RegexOptions.CultureInvariant)]
    private static partial Regex InvariantKeyPattern();

    public static bool IsValidInvariantKey(string? invariantKey) =>
        !string.IsNullOrWhiteSpace(invariantKey) && InvariantKeyPattern().IsMatch(invariantKey.Trim());
}
