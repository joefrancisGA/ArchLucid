namespace ArchLucid.Cli.Commands;

internal static class FrontierAiBaselineOutputPaths
{
    internal const string ArtifactDirectorySegment = "frontier-ai-baseline";

    internal const string DefaultArtifactKey = "frontier-ai-scoreboard";

    internal static FrontierAiBaselineOutputResolution Resolve(
        FrontierAiBaselineOptions options,
        string? repositoryRoot,
        string artifactKey)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (string.IsNullOrWhiteSpace(artifactKey))
            throw new ArgumentException("Artifact key is required.", nameof(artifactKey));

        string sanitizedArtifactKey = artifactKey.Trim();
        string? defaultDirectory = TryBuildDefaultRunDirectory(repositoryRoot, sanitizedArtifactKey);

        return new FrontierAiBaselineOutputResolution
        {
            JsonPath = ResolveJsonPath(options, defaultDirectory),
            MarkdownPath = ResolveMarkdownPath(options, defaultDirectory),
        };
    }

    internal static string ResolveArtifactKey(FrontierAiBaselineReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        // Normalize Windows-style backslashes so Path.GetFileNameWithoutExtension works on Linux CI.
        string scoreboardPath = report.ScoreboardPath.Trim().Replace('\\', '/');
        string fileName = Path.GetFileNameWithoutExtension(scoreboardPath);

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

    private static string? ResolveJsonPath(FrontierAiBaselineOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            return options.JsonOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "frontier-ai-baseline.json");
    }

    private static string? ResolveMarkdownPath(FrontierAiBaselineOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            return options.MarkdownOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "frontier-ai-baseline.md");
    }
}
