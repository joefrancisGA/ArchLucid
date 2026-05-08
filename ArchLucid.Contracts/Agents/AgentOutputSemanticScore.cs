using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>Semantic quality score for a single agent trace output (claims evidence + finding completeness).</summary>
public sealed class AgentOutputSemanticScore
{
    public string TraceId
    {
        get;
        set;
    } = string.Empty;

    public AgentType AgentType
    {
        get;
        set;
    }

    /// <summary>Fraction of claims that have non-empty evidence references or evidence string.</summary>
    public double ClaimsQualityRatio
    {
        get;
        set;
    }

    /// <summary>Fraction of findings with non-empty severity, description (&gt;10 chars), and recommendation (&gt;5 chars).</summary>
    public double FindingsQualityRatio
    {
        get;
        set;
    }

    public int EmptyClaimCount
    {
        get;
        set;
    }

    public int IncompleteFindingCount
    {
        get;
        set;
    }

    /// <summary>
    ///     Primary score consumed by quality gates and averages — LLM judge when enabled and successful, otherwise the
    ///     heuristic completeness score.
    /// </summary>
    public double OverallSemanticScore
    {
        get;
        set;
    }

    /// <summary>
    ///     Same formula as heuristic <see cref="OverallSemanticScore" /> before any LLM overlay; surfaced for buyer-facing
    ///     breakdown.
    /// </summary>
    public double HeuristicOverallScore
    {
        get;
        set;
    }

    /// <summary>Rubric aggregate from Azure OpenAI judge when enabled; absent when skipped or failed.</summary>
    public double? LlmJudgeOverallQuality
    {
        get;
        set;
    }

    /// <summary>
    ///     Deterministic AgentResult→evidence grounding ratio when computed (token overlap + resolved evidence refs); absent when not evaluated.
    /// </summary>
    public double? AgentResultFaithfulnessSupportRatio
    {
        get;
        set;
    }

    /// <summary>Optional short rationale from LLM judge (or skip reason).</summary>
    public string? LlmJudgeNotes
    {
        get;
        set;
    }
}
