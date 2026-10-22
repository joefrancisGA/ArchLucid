using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Lightweight, non-secret build identity payload returned by <c>GET /version</c>,
///     <c>GET /health/version</c>, and included in CLI <c>doctor</c> output for support handoff.
/// </summary>
public sealed class BuildInfoResponse
{
    public string Application
    {
        get;
        init;
    } = string.Empty;

    public string InformationalVersion
    {
        get;
        init;
    } = string.Empty;

    public string AssemblyVersion
    {
        get;
        init;
    } = string.Empty;

    public string? FileVersion
    {
        get;
        init;
    }

    public string? CommitSha
    {
        get;
        init;
    }

    /// <summary>UTC build timestamp from <see cref="DeploymentBuildMetadata.BuildTimestampVariable" /> when set by CD.</summary>
    public string BuildTimestamp
    {
        get;
        init;
    } = "unknown";

    /// <summary>
    ///     CI/deploy stamp (<c>GITHUB_RUN_ID</c>-<c>GITHUB_RUN_ATTEMPT</c>) for support search —
    ///     from <see cref="DeploymentBuildMetadata.ResolveDeployStamp"/>.
    /// </summary>
    public string DeployStamp
    {
        get;
        init;
    } = "unknown";

    public string RuntimeFramework
    {
        get;
        init;
    } = string.Empty;

    public string Environment
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Seconds since the API host process started (for operator health dashboards).</summary>
    public long ProcessUptimeSeconds
    {
        get;
        init;
    }

    /// <summary>
    ///     Creates a <see cref="BuildInfoResponse" /> from <paramref name="provenance" />
    ///     and optional environment metadata.
    /// </summary>
    public static BuildInfoResponse FromProvenance(
        BuildProvenance provenance,
        string applicationName,
        string environmentName,
        long processUptimeSeconds = 0,
        IConfiguration? configuration = null)
    {
        ArgumentNullException.ThrowIfNull(provenance);

        return new BuildInfoResponse
        {
            Application = applicationName,
            InformationalVersion = provenance.InformationalVersion,
            AssemblyVersion = provenance.AssemblyVersion,
            FileVersion = provenance.FileVersion,
            CommitSha = DeploymentBuildMetadata.ResolveCommitSha(provenance, configuration),
            BuildTimestamp = DeploymentBuildMetadata.ResolveBuildTimestamp(configuration),
            DeployStamp = DeploymentBuildMetadata.ResolveDeployStamp(configuration),
            RuntimeFramework = provenance.RuntimeFrameworkDescription,
            Environment = environmentName,
            ProcessUptimeSeconds = processUptimeSeconds
        };
    }
}
