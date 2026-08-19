namespace ArchLucid.Cli.Commands;

internal static class ItsmPullForwardOutputPaths
{
    internal const string ArtifactDirectorySegment = "itsm-pull-forward-gate";

    internal const string DefaultArtifactKey = "paid-pilot-ledgers";

    internal const string LiveApiArtifactKey = "live-api";

    internal static ItsmPullForwardOutputResolution Resolve(
        ItsmPullForwardOptions options,
        string? repositoryRoot,
        string artifactKey)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (string.IsNullOrWhiteSpace(artifactKey))
            throw new ArgumentException("Artifact key is required.", nameof(artifactKey));

        string sanitizedArtifactKey = artifactKey.Trim();
        string? defaultDirectory = TryBuildDefaultRunDirectory(repositoryRoot, sanitizedArtifactKey);

        return new ItsmPullForwardOutputResolution
        {
            JsonPath = ResolveJsonPath(options, defaultDirectory),
            MarkdownPath = ResolveMarkdownPath(options, defaultDirectory),
        };
    }

    internal static string ResolveArtifactKey(ItsmPullForwardReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (!string.IsNullOrWhiteSpace(report.BaseUrl))
            return LiveApiArtifactKey;

        // Normalize Windows-style backslashes so Path.GetFileName works on Linux CI.
        string ledgerDirectory = report.LedgerDirectory.Trim()
            .Replace('\\', '/')
            .TrimEnd('/');

        string fileName = Path.GetFileName(ledgerDirectory);

        if (!string.IsNullOrWhiteSpace(fileName))
            return fileName;

        return DefaultArtifactKey;
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

    private static string? ResolveJsonPath(ItsmPullForwardOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            return options.JsonOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "itsm-pull-forward-gate.json");
    }

    private static string? ResolveMarkdownPath(ItsmPullForwardOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            return options.MarkdownOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "itsm-pull-forward-gate.md");
    }
}
