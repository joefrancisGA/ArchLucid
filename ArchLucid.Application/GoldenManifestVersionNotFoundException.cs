namespace ArchLucid.Application;

/// <summary>Thrown when a golden manifest version cannot be resolved for preview or read paths.</summary>
public sealed class GoldenManifestVersionNotFoundException(string manifestVersion, string? runId = null)
    : Exception(runId is null
        ? $"Golden manifest version '{manifestVersion}' was not found."
        : $"Golden manifest version '{manifestVersion}' was not found for run '{runId}'.")
{
    public string ManifestVersion { get; } = manifestVersion;

    public string? RunId { get; } = runId;
}
