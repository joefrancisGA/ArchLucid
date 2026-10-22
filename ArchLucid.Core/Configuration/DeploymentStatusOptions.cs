namespace ArchLucid.Core.Configuration;

/// <summary>Optional safe links and identity overrides for the internal deployment-status view.</summary>
public sealed class DeploymentStatusOptions
{
    public const string SectionPath = "DeploymentStatus";

    /// <summary>Template with <c>{commitSha}</c> placeholder for the source commit URL.</summary>
    public string? GitHubCommitUrlTemplate
    {
        get;
        set;
    }

    /// <summary>Template with <c>{runId}</c> for the latest CD workflow run (omit when unset).</summary>
    public string? GitHubWorkflowRunUrlTemplate
    {
        get;
        set;
    }

    public string? LatestGitHubWorkflowRunId
    {
        get;
        set;
    }

    public string? AzureResourceOverviewUrl
    {
        get;
        set;
    }

    public string? LogsUrl
    {
        get;
        set;
    }

    public string? MonitoringUrl
    {
        get;
        set;
    }

    /// <summary>Optional worker BUILD_ID when the worker does not expose HTTP /version.</summary>
    public string? WorkerBuildCommitSha
    {
        get;
        set;
    }

    /// <summary>Optional last-known-good BUILD_ID when persisted outside CI artifacts.</summary>
    public string? LastKnownGoodBuildId
    {
        get;
        set;
    }

    /// <summary>Optional latest smoke result label (Passed / Failed / Unknown).</summary>
    public string? LatestSmokeTestResult
    {
        get;
        set;
    }
}
