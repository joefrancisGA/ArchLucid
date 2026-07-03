using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Resolves deployment fingerprint fields from environment variables (CD-injected) with safe fallbacks.
/// </summary>
public static class DeploymentBuildMetadata
{
    public const string BuildTimestampVariable = "ARCHLUCID_BUILD_TIMESTAMP";

    public const string BuildCommitShaVariable = "ARCHLUCID_BUILD_COMMIT_SHA";

    public static string ResolveBuildTimestamp(IConfiguration? configuration = null)
    {
        string? fromConfiguration = configuration?[BuildTimestampVariable];

        if (!string.IsNullOrWhiteSpace(fromConfiguration))
            return fromConfiguration.Trim();

        string? fromEnvironment = Environment.GetEnvironmentVariable(BuildTimestampVariable);

        if (!string.IsNullOrWhiteSpace(fromEnvironment))
            return fromEnvironment.Trim();

        return "unknown";
    }

    public static string ResolveCommitSha(BuildProvenance provenance, IConfiguration? configuration = null)
    {
        ArgumentNullException.ThrowIfNull(provenance);

        string? fromConfiguration = configuration?[BuildCommitShaVariable];

        if (!string.IsNullOrWhiteSpace(fromConfiguration))
            return fromConfiguration.Trim();

        string? fromEnvironment = Environment.GetEnvironmentVariable(BuildCommitShaVariable);

        if (!string.IsNullOrWhiteSpace(fromEnvironment))
            return fromEnvironment.Trim();

        if (!string.IsNullOrWhiteSpace(provenance.CommitSha))
            return provenance.CommitSha;

        return "unknown";
    }
}
