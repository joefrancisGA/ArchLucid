namespace ArchLucid.Application.Findings;

/// <summary>Detects declaration themes referenced by a deferred source finding's text.</summary>
public static class OpenCommitmentDeclarationThemeDetector
{
    public static OpenCommitmentDeclarationTheme Detect(IReadOnlyList<string> textSegments)
    {
        ArgumentNullException.ThrowIfNull(textSegments);

        string combined = string.Join(' ', textSegments).ToLowerInvariant();

        if (ContainsPublicNetworkTheme(combined))
        {
            return OpenCommitmentDeclarationTheme.PublicNetworkAccess;
        }

        if (ContainsHttpsTheme(combined))
        {
            return OpenCommitmentDeclarationTheme.HttpsOnly;
        }

        return OpenCommitmentDeclarationTheme.None;
    }

    private static bool ContainsPublicNetworkTheme(string combined) =>
        combined.Contains("public network", StringComparison.Ordinal)
        || combined.Contains("publicnetworkaccess", StringComparison.Ordinal)
        || combined.Contains("public network access", StringComparison.Ordinal)
        || combined.Contains("blob public", StringComparison.Ordinal)
        || combined.Contains("allow public", StringComparison.Ordinal);

    private static bool ContainsHttpsTheme(string combined) =>
        combined.Contains("https only", StringComparison.Ordinal)
        || combined.Contains("https-only", StringComparison.Ordinal)
        || combined.Contains("https traffic", StringComparison.Ordinal)
        || combined.Contains("httpsonly", StringComparison.Ordinal)
        || combined.Contains("require https", StringComparison.Ordinal);
}
