using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Represents a request to promote an architecture run's manifest from one deployment
///     environment to another, subject to a review and approval workflow.
/// </summary>
public sealed class GovernanceApprovalRequest
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

    /// <summary>Unique identifier for this approval request.</summary>
    private string approvalRequestId = Guid.NewGuid().ToString("N");

    public string ApprovalRequestId
    {
        get => approvalRequestId;
        set => approvalRequestId = string.IsNullOrEmpty(value)
            ? Guid.NewGuid().ToString("N")
            : value;
    }

    /// <summary>The architecture run targeted for promotion.</summary>
    private string runId = string.Empty;

    public string RunId
    {
        get => runId;
        set => runId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>The manifest version label being promoted.</summary>
    private string manifestVersion = string.Empty;

    public string ManifestVersion
    {
        get => manifestVersion;
        set => manifestVersion = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>The environment the run is currently active in.</summary>
    private string sourceEnvironment = GovernanceEnvironment.Dev;

    public string SourceEnvironment
    {
        get => sourceEnvironment;
        set => sourceEnvironment = ContractCollectionDefaults.CoalesceStringDefault(value, GovernanceEnvironment.Dev);
    }

    /// <summary>The environment the run is being promoted to.</summary>
    private string targetEnvironment = GovernanceEnvironment.Test;

    public string TargetEnvironment
    {
        get => targetEnvironment;
        set => targetEnvironment = ContractCollectionDefaults.CoalesceStringDefault(value, GovernanceEnvironment.Test);
    }

    /// <summary>Current lifecycle status of the request; see <see cref="GovernanceApprovalStatus" />.</summary>
    private string status = GovernanceApprovalStatus.Draft;

    public string Status
    {
        get => status;
        set => status = ContractCollectionDefaults.CoalesceStringDefault(value, GovernanceApprovalStatus.Draft);
    }

    /// <summary>Identity of the user who submitted the promotion request.</summary>
    private string requestedBy = string.Empty;

    public string RequestedBy
    {
        get => requestedBy;
        set => requestedBy = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>
    ///     Canonical segregation-of-duties key for the submitter when available (typically
    ///     <c>jwt:{tid}:{oid}</c> from Entra). Null for legacy rows submitted before this column existed.
    /// </summary>
    public string? RequestedByActorKey
    {
        get;
        set;
    }

    /// <summary>Identity of the reviewer, or <see langword="null" /> when not yet reviewed.</summary>
    public string? ReviewedBy
    {
        get;
        set;
    }

    /// <summary>
    ///     Canonical segregation-of-duties key for the reviewer when reviewed; null until a decision is recorded.
    /// </summary>
    public string? ReviewedByActorKey
    {
        get;
        set;
    }

    /// <summary>Optional comment provided by the requester at submission time.</summary>
    public string? RequestComment
    {
        get;
        set;
    }

    /// <summary>Optional comment provided by the reviewer at decision time.</summary>
    public string? ReviewComment
    {
        get;
        set;
    }

    /// <summary>UTC timestamp when the request was submitted.</summary>
    public DateTime RequestedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    /// <summary>UTC timestamp when the request was reviewed, or <see langword="null" /> when pending.</summary>
    public DateTime? ReviewedUtc
    {
        get;
        set;
    }

    /// <summary>UTC deadline for the approval SLA. Null when SLA is not configured.</summary>
    public DateTime? SlaDeadlineUtc
    {
        get;
        set;
    }

    /// <summary>
    ///     UTC timestamp when the SLA breach notification was sent, or <see langword="null" /> if not yet
    ///     breached/notified.
    /// </summary>
    public DateTime? SlaBreachNotifiedUtc
    {
        get;
        set;
    }
}
