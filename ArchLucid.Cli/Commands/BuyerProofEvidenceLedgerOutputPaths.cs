namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerOutputResolution
{
    public string? JsonPath
    {
        get;
        init;
    }

    public string? MarkdownPath
    {
        get;
        init;
    }

    public bool WillWriteJson => !string.IsNullOrWhiteSpace(JsonPath);

    public bool WillWriteMarkdown => !string.IsNullOrWhiteSpace(MarkdownPath);
}

internal static class BuyerProofEvidenceLedgerOutputPaths
{
    internal const string ArtifactDirectorySegment = "buyer-proof-evidence-ledger";

    internal static BuyerProofEvidenceLedgerOutputResolution Resolve(
        BuyerProofEvidenceLedgerOptions options,
        string? repositoryRoot,
        string artifactKey)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (string.IsNullOrWhiteSpace(artifactKey))
            throw new ArgumentException("Artifact key is required.", nameof(artifactKey));

        string sanitizedArtifactKey = artifactKey.Trim();
        string? defaultDirectory = TryBuildDefaultRunDirectory(repositoryRoot, sanitizedArtifactKey);

        return new BuyerProofEvidenceLedgerOutputResolution
        {
            JsonPath = ResolveJsonPath(options, defaultDirectory),
            MarkdownPath = ResolveMarkdownPath(options, defaultDirectory),
        };
    }

    internal static string ResolveArtifactKey(BuyerProofEvidenceLedgerReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (!string.IsNullOrWhiteSpace(report.RunId))
            return report.RunId.Trim();

        string proofDirectory = report.ProofDirectory.Trim().TrimEnd(
            Path.DirectorySeparatorChar,
            Path.AltDirectorySeparatorChar);

        return Path.GetFileName(proofDirectory);
    }

    internal static string BuildDefaultRunDirectory(string repositoryRoot, string artifactKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentException.ThrowIfNullOrWhiteSpace(artifactKey);

        return Path.Combine(
            repositoryRoot,
            "artifacts",
            ArtifactDirectorySegment,
            artifactKey.Trim());
    }

    private static string? TryBuildDefaultRunDirectory(string? repositoryRoot, string artifactKey)
    {
        if (string.IsNullOrWhiteSpace(repositoryRoot))
            return null;

        return BuildDefaultRunDirectory(repositoryRoot, artifactKey);
    }

    private static string? ResolveJsonPath(BuyerProofEvidenceLedgerOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            return options.JsonOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "buyer-proof-evidence-ledger.json");
    }

    private static string? ResolveMarkdownPath(BuyerProofEvidenceLedgerOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            return options.MarkdownOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "buyer-proof-evidence-ledger.md");
    }
}
