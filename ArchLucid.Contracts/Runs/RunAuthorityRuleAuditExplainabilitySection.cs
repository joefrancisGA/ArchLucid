using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Runs;

/// <summary>Authority rule-engine audit section on unified run decision explainability (TB-054).</summary>
public sealed class RunAuthorityRuleAuditExplainabilitySection
{
    public string Pipeline
    {
        get;
        set;
    } = "authority";

    public Guid? DecisionTraceId
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

    private IReadOnlyList<string> appliedRuleIds = [];

    public IReadOnlyList<string> AppliedRuleIds
    {
        get => appliedRuleIds;
        set => appliedRuleIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> acceptedFindingIds = [];

    public IReadOnlyList<string> AcceptedFindingIds
    {
        get => acceptedFindingIds;
        set => acceptedFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> requiredFindingIds = [];

    public IReadOnlyList<string> RequiredFindingIds
    {
        get => requiredFindingIds;
        set => requiredFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> allowedFindingIds = [];

    public IReadOnlyList<string> AllowedFindingIds
    {
        get => allowedFindingIds;
        set => allowedFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> preferredFindingIds = [];

    public IReadOnlyList<string> PreferredFindingIds
    {
        get => preferredFindingIds;
        set => preferredFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> rejectedFindingIds = [];

    public IReadOnlyList<string> RejectedFindingIds
    {
        get => rejectedFindingIds;
        set => rejectedFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> notes = [];

    public IReadOnlyList<string> Notes
    {
        get => notes;
        set => notes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<RuleAuditTracePromptRef> promptRefs = [];

    public IReadOnlyList<RuleAuditTracePromptRef> PromptRefs
    {
        get => promptRefs;
        set => promptRefs = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
