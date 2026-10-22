using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

public class ExplainabilityTrace
{
    /// <summary>
    ///     Optional correlation to a persisted agent execution trace id (32-char hex, no dashes), when the engine records one.
    /// </summary>
    public string? SourceAgentExecutionTraceId
    {
        get;
        set;
    }

    private List<string> graphNodeIdsExamined = [];

    public List<string> GraphNodeIdsExamined
    {
        get => graphNodeIdsExamined;
        set => graphNodeIdsExamined = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> rulesApplied = [];

    public List<string> RulesApplied
    {
        get => rulesApplied;
        set => rulesApplied = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> decisionsTaken = [];

    public List<string> DecisionsTaken
    {
        get => decisionsTaken;
        set => decisionsTaken = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> alternativePathsConsidered = [];

    public List<string> AlternativePathsConsidered
    {
        get => alternativePathsConsidered;
        set => alternativePathsConsidered = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> notes = [];

    public List<string> Notes
    {
        get => notes;
        set => notes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> citations = [];

    public List<string> Citations
    {
        get => citations;
        set => citations = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Bounded agent reasoning text copied from <c>AgentResult.ReasoningTrace</c> (TB-055).</summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }

    /// <summary>SHA-256 hex digest of full reasoning when <see cref="ReasoningTrace" /> was truncated.</summary>
    public string? ReasoningTraceDigestSha256
    {
        get;
        set;
    }
}
