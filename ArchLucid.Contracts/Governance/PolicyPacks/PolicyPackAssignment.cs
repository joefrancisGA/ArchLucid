using ArchLucid.Contracts.Governance.Resolution;

namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Binds a published <see cref="PolicyPackVersion" /> to a governance tier (tenant, workspace, or project) for a
///     tenant.
/// </summary>
public class PolicyPackAssignment
{
    public Guid AssignmentId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string PolicyPackVersion
    {
        get;
        set;
    } = null!;

    public bool IsEnabled
    {
        get;
        set;
    } = true;

    public string ScopeLevel
    {
        get;
        set;
    } = GovernanceScopeLevel.Project;

    public bool IsPinned
    {
        get;
        set;
    }

    public DateTime AssignedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public DateTime? ArchivedUtc
    {
        get;
        set;
    }

    public bool BlockCommitOnCritical
    {
        get;
        set;
    }

    public int? BlockCommitMinimumSeverity
    {
        get;
        set;
    }
}
