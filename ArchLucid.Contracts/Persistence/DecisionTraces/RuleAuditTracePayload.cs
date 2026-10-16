using ArchLucid.Contracts.Serialization;

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

    private List<string> appliedRuleIds = [];

    public List<string> AppliedRuleIds
    {
        get => appliedRuleIds;
        set => appliedRuleIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> acceptedFindingIds = [];

    public List<string> AcceptedFindingIds
    {
        get => acceptedFindingIds;
        set => acceptedFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Findings accepted by a <c>require</c> rule action (TB-204).</summary>
    private List<string> requiredFindingIds = [];

    public List<string> RequiredFindingIds
    {
        get => requiredFindingIds;
        set => requiredFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Findings accepted by an <c>allow</c> rule action (TB-204).</summary>
    private List<string> allowedFindingIds = [];

    public List<string> AllowedFindingIds
    {
        get => allowedFindingIds;
        set => allowedFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Findings accepted by a <c>prefer</c> rule action (TB-204).</summary>
    private List<string> preferredFindingIds = [];

    public List<string> PreferredFindingIds
    {
        get => preferredFindingIds;
        set => preferredFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> rejectedFindingIds = [];

    public List<string> RejectedFindingIds
    {
        get => rejectedFindingIds;
        set => rejectedFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> notes = [];

    public List<string> Notes
    {
        get => notes;
        set => notes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<RuleAuditTraceWarning> warnings = [];

    public List<RuleAuditTraceWarning> Warnings
    {
        get => warnings;
        set => warnings = ContractCollectionDefaults.Coalesce(value);
    }

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
    private List<RuleAuditTracePromptRef> promptRefs = [];

    public List<RuleAuditTracePromptRef> PromptRefs
    {
        get => promptRefs;
        set => promptRefs = ContractCollectionDefaults.Coalesce(value);
    }
}
