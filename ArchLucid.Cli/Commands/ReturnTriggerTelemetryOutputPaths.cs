namespace ArchLucid.Cli.Commands;

internal static class ReturnTriggerTelemetryOutputPaths
{
    internal const string ArtifactDirectorySegment = "return-trigger-telemetry";

    internal static ReturnTriggerTelemetryOutputResolution Resolve(
        ReturnTriggerTelemetryOptions options,
        string? repositoryRoot,
        string artifactKey)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (string.IsNullOrWhiteSpace(artifactKey))
            throw new ArgumentException("Artifact key is required.", nameof(artifactKey));

        string sanitizedArtifactKey = artifactKey.Trim();
        string? defaultDirectory = TryBuildDefaultRunDirectory(repositoryRoot, sanitizedArtifactKey);

        return new ReturnTriggerTelemetryOutputResolution
        {
            JsonPath = ResolveJsonPath(options, defaultDirectory),
            MarkdownPath = ResolveMarkdownPath(options, defaultDirectory),
        };
    }

    internal static string ResolveArtifactKey(ReturnTriggerTelemetryReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        // Normalize Windows-style backslashes so Path.GetFileName works on Linux CI.
        string ledgerDirectory = report.LedgerDirectory.Trim()
            .Replace('\\', '/')
            .TrimEnd('/');

        return Path.GetFileName(ledgerDirectory);
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

    private static string? ResolveJsonPath(ReturnTriggerTelemetryOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            return options.JsonOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "return-trigger-telemetry.json");
    }

    private static string? ResolveMarkdownPath(ReturnTriggerTelemetryOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            return options.MarkdownOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "return-trigger-telemetry.md");
    }
}
