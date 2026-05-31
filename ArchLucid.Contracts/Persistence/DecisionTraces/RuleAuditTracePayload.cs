namespace ArchLucid.Contracts.Persistence.DecisionTraces;

/// <summary>
///     Authority pipeline record of which rules were applied and which findings were accepted or rejected;
///     carried on <see cref="RuleAuditTraceDto.RuleAudit" />.
/// </summary>
public sealed class RuleAuditTracePayload
{
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

    public Guid DecisionTraceId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public string RuleSetId
    {
        get;
        set;
    } = string.Empty;

    public string RuleSetVersion
    {
        get;
        set;
    } = string.Empty;

    public string RuleSetHash
    {
        get;
        set;
    } = string.Empty;

    public List<string> AppliedRuleIds
    {
        get;
        set;
    } = [];

    public List<string> AcceptedFindingIds
    {
        get;
        set;
    } = [];

    public List<string> RejectedFindingIds
    {
        get;
        set;
    } = [];

    public List<string> Notes
    {
        get;
        set;
    } = [];

    public List<RuleAuditTraceWarning> Warnings
    {
        get;
        set;
    } = [];

    /// <summary>Context snapshot evaluated when the authority rule engine ran (TB-052).</summary>
    public Guid? ContextSnapshotId
    {
        get;
        set;
    }

    /// <summary>Graph snapshot evaluated when the authority rule engine ran (TB-052).</summary>
    public Guid? GraphSnapshotId
    {
        get;
        set;
    }

    /// <summary>Findings snapshot evaluated when the authority rule engine ran (TB-052).</summary>
    public Guid? FindingsSnapshotId
    {
        get;
        set;
    }

    /// <summary>Distinct prompt templates referenced by accepted findings (TB-052).</summary>
    public List<RuleAuditTracePromptRef> PromptRefs
    {
        get;
        set;
    } = [];
}
