namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Canonicalizes tenant/workspace/project scope ids for review-cache manifest hashing.
/// </summary>
internal static class ClosedLoopScopeIdHashNormalizer
{
    public static string Normalize(string? scopeId)
    {
        if (string.IsNullOrWhiteSpace(scopeId))
            return string.Empty;

        string trimmed = scopeId.Trim();

        if (Guid.TryParse(trimmed, out Guid guid))
            return guid.ToString("D").ToLowerInvariant();

        return trimmed;
    }
}
