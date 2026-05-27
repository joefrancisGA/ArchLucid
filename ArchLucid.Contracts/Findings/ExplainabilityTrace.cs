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

    public List<string> GraphNodeIdsExamined
    {
        get;
        set;
    } = [];

    public List<string> RulesApplied
    {
        get;
        set;
    } = [];

    public List<string> DecisionsTaken
    {
        get;
        set;
    } = [];

    public List<string> AlternativePathsConsidered
    {
        get;
        set;
    } = [];

    public List<string> Notes
    {
        get;
        set;
    } = [];

    public List<string> Citations
    {
        get;
        set;
    } = [];

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
