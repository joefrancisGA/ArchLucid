namespace ArchLucid.Core.InfraEvidence;

/// <summary>Normalizes ARM resource identifiers for stable cross-snapshot joins.</summary>
public static class ArmResourceIdNormalizer
{
    /// <summary>Lowercases and strips a trailing slash from an ARM resource id.</summary>
    public static string Normalize(string? externalResourceId)
    {
        if (string.IsNullOrWhiteSpace(externalResourceId))
            return string.Empty;

        ReadOnlySpan<char> trimmed = externalResourceId.AsSpan().Trim();

        if (trimmed.EndsWith('/'))
            trimmed = trimmed[..^1];

        return trimmed.ToString().ToLowerInvariant();
    }
}
