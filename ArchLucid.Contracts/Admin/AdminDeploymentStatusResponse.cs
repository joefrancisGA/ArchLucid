namespace ArchLucid.Contracts.Admin;

/// <summary>Internal operator deployment-status snapshot (no secrets).</summary>
public sealed class AdminDeploymentStatusResponse
{
    public string Environment
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string ReleaseBuildId
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string SourceCommit
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string FrontendBuildId
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string ApiBuildId
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string WorkerBuildId
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string DeploymentTimeUtc
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string ActivePlatformRevision
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string HealthStatus
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string ReadinessStatus
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string DatabaseMigrationVersion
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string LatestSmokeTestResult
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string LastKnownGoodBuildId
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    /// <summary>Match | Mismatch | Partial | Unknown</summary>
    public string ComponentAgreement
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string ComponentAgreementDetail
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    /// <summary>Healthy | Warning | Failed | Unknown</summary>
    public string OverallStatus
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public string OverallStatusLabel
    {
        get;
        set;
    } = AdminDeploymentStatusValues.Unknown;

    public IReadOnlyList<AdminDeploymentStatusLink> Links
    {
        get;
        set;
    } = [];

    public DateTimeOffset GeneratedAtUtc
    {
        get;
        set;
    }
}
