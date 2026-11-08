namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Reviewer-facing topology category labels — never substitute <c>general</c> for a missing category.
/// </summary>
internal static class GraphTopologyCategoryHonesty
{
    public const string CategoryNotStoredCopy = "Topology category was not stored.";

    public static string ResolvePresentCategory(string? category) =>
        string.IsNullOrWhiteSpace(category) ? CategoryNotStoredCopy : category.Trim();
}
