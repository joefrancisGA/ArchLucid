using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Resolves deployment fingerprint fields from environment variables (CD-injected) with safe fallbacks.
/// </summary>
public static class DeploymentBuildMetadata
{
    public const string BuildTimestampVariable = "ARCHLUCID_BUILD_TIMESTAMP";

    public const string BuildCommitShaVariable = "ARCHLUCID_BUILD_COMMIT_SHA";

    /// <summary>First-class deploy/CI stamp (preferred over legacy <see cref="CdDeployRunVariable"/>).</summary>
    public const string DeployStampVariable = "ARCHLUCID_DEPLOY_STAMP";

    /// <summary>Legacy Container Apps env already set by CD (<c>GITHUB_RUN_ID</c>-<c>GITHUB_RUN_ATTEMPT</c>).</summary>
    public const string CdDeployRunVariable = "CD_DEPLOY_RUN";

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

    /// <summary>
    ///     Resolves the human-searchable deploy stamp used by Report Problem and <c>GET /version</c>.
    ///     Prefers <see cref="DeployStampVariable"/>, then <see cref="CdDeployRunVariable"/>.
    /// </summary>
    public static string ResolveDeployStamp(IConfiguration? configuration = null)
    {
        string? fromConfiguration = configuration?[DeployStampVariable];

        if (!string.IsNullOrWhiteSpace(fromConfiguration))
            return fromConfiguration.Trim();

        string? fromEnvironment = Environment.GetEnvironmentVariable(DeployStampVariable);

        if (!string.IsNullOrWhiteSpace(fromEnvironment))
            return fromEnvironment.Trim();

        string? fromCdDeployRun = Environment.GetEnvironmentVariable(CdDeployRunVariable);

        if (!string.IsNullOrWhiteSpace(fromCdDeployRun))
            return fromCdDeployRun.Trim();

        return "unknown";
    }
}
