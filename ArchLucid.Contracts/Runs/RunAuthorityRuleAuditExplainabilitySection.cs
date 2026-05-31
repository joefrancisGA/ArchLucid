using ArchLucid.Contracts.Persistence.DecisionTraces;

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

    public IReadOnlyList<string> AppliedRuleIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> AcceptedFindingIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> RejectedFindingIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> Notes
    {
        get;
        set;
    } = [];

    public IReadOnlyList<RuleAuditTracePromptRef> PromptRefs
    {
        get;
        set;
    } = [];
}
