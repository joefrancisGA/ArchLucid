namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Records that a specific run/manifest version is (or was) the active architecture
///     baseline for a given deployment environment. At most one record per environment
///     should have <see cref="IsActive" /> set to <see langword="true" /> at any time.
/// </summary>
public sealed class GovernanceEnvironmentActivation
{
    /// <summary>Tenant owning this record (aligns with <c>dbo.Runs.TenantId</c>).</summary>
    public Guid TenantId
    {
        get;
        set;
    }

    /// <summary>Workspace within the tenant (aligns with <c>dbo.Runs.WorkspaceId</c>).</summary>
    public Guid WorkspaceId
    {
        get;
        set;
    }

    /// <summary>Scoped project for RLS (aligns with <c>dbo.Runs.ScopeProjectId</c>).</summary>
    public Guid ProjectId
    {
        get;
        set;
    }

    /// <summary>Unique identifier for this activation record.</summary>
    public string ActivationId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    /// <summary>The architecture run activated for the environment.</summary>
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>The manifest version label activated.</summary>
    public string ManifestVersion
    {
        get;
        set;
    } = string.Empty;

    /// <summary>The deployment environment this activation applies to.</summary>
    public string Environment
    {
        get;
        set;
    } = GovernanceEnvironment.Dev;

    /// <summary>
    ///     <see langword="true" /> while this run/manifest pair is the current active baseline;
    ///     set to <see langword="false" /> when superseded by a subsequent activation.
    /// </summary>
    public bool IsActive
    {
        get;
        set;
    } = true;

    /// <summary>UTC timestamp when the activation was recorded.</summary>
    public DateTime ActivatedUtc
    {
        get;
        set;
    } = DateTime.UtcNow;
}
