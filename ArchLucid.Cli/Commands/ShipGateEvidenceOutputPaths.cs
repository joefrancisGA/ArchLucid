namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateEvidenceOutputResolution
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

internal static class ShipGateEvidenceOutputPaths
{
    internal const string ArtifactDirectorySegment = "ship-gate-evidence";

    internal static ShipGateEvidenceOutputResolution Resolve(
        ShipGateEvidenceOptions options,
        string? repositoryRoot,
        string runId)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        string sanitizedRunId = runId.Trim();
        string? defaultDirectory = TryBuildDefaultRunDirectory(repositoryRoot, sanitizedRunId);

        return new ShipGateEvidenceOutputResolution
        {
            JsonPath = ResolveJsonPath(options, defaultDirectory),
            MarkdownPath = ResolveMarkdownPath(options, defaultDirectory),
        };
    }

    internal static string BuildDefaultRunDirectory(string repositoryRoot, string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return Path.Combine(
            repositoryRoot,
            "artifacts",
            ArtifactDirectorySegment,
            runId.Trim());
    }

    private static string? TryBuildDefaultRunDirectory(string? repositoryRoot, string runId)
    {
        if (string.IsNullOrWhiteSpace(repositoryRoot))
            return null;

        return BuildDefaultRunDirectory(repositoryRoot, runId);
    }

    private static string? ResolveJsonPath(ShipGateEvidenceOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.JsonOutPath))
            return options.JsonOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "ship-gate-evidence.json");
    }

    private static string? ResolveMarkdownPath(ShipGateEvidenceOptions options, string? defaultDirectory)
    {
        if (!string.IsNullOrWhiteSpace(options.MarkdownOutPath))
            return options.MarkdownOutPath.Trim();

        if (options.SuppressDefaultArtifacts || defaultDirectory is null)
            return null;

        return Path.Combine(defaultDirectory, "ship-gate-evidence.md");
    }
}
