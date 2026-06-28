namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestOutputResolution
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

internal static class TenantIsolationNegativeTestOutputPaths
{
    internal const string ArtifactDirectorySegment = "tenant-isolation-negative-test";

    internal const string OfflineArtifactKey = "offline-fixture";

    internal static TenantIsolationNegativeTestOutputResolution Resolve(
        TenantIsolationNegativeTestOptions options,
        string? repositoryRoot,
        string artifactKey)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (string.IsNullOrWhiteSpace(artifactKey))
            throw new ArgumentException("Artifact key is required.", nameof(artifactKey));

        string sanitizedArtifactKey = artifactKey.Trim();
        string? defaultDirectory = TryBuildDefaultRunDirectory(repositoryRoot, sanitizedArtifactKey);

        return new TenantIsolationNegativeTestOutputResolution
        {
            JsonPath = ResolveJsonPath(options, defaultDirectory),
            MarkdownPath = ResolveMarkdownPath(options, defaultDirectory),
        };
    }

    internal static string ResolveArtifactKey(TenantIsolationNegativeTestReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (!string.IsNullOrWhiteSpace(report.PrimaryRunId))
            return report.PrimaryRunId.Trim();

        return OfflineArtifactKey;
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

    private static string? ResolveJsonPath(TenantIsolationNegativeTestOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            return options.JsonOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "tenant-isolation-negative-test.json");
    }

    private static string? ResolveMarkdownPath(TenantIsolationNegativeTestOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            return options.MarkdownOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "tenant-isolation-negative-test.md");
    }
}
