namespace ArchLucid.Contracts.Risk;

public sealed class ArchitectureTradeoff
{
    public string TradeoffId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public WafPillar GainedPillar
    {
        get;
        set;
    }

    public WafPillar SacrificedPillar
    {
        get;
        set;
    }

    /// <summary>Catalog mechanism key (for example <c>cost-reliability/single-region</c>).</summary>
    public string Mechanism
    {
        get;
        set;
    } = null!;

    public List<string> EvidenceNodeIds
    {
        get;
        set;
    } = [];

    public List<string> EvidenceFindingIds
    {
        get;
        set;
    } = [];

    /// <summary>L0 pillar answer key that explicitly accepts the sacrifice, if any.</summary>
    public string? AcknowledgedByAnswerKey
    {
        get;
        set;
    }

    /// <summary>Stated requirement violated when <see cref="Status" /> is <see cref="TradeoffStatus.Conflicting" />.</summary>
    public string? ConflictingRequirementId
    {
        get;
        set;
    }

    /// <summary>Set when this is an optimization-mismatch tradeoff (analyzer §3.3).</summary>
    public string? RelatedOutcomeRef
    {
        get;
        set;
    }

    public TradeoffStatus Status
    {
        get;
        set;
    }

    public RiskConsequence Consequence
    {
        get;
        set;
    }

    public ReversibilityClass Reversibility
    {
        get;
        set;
    }

    /// <summary>Key into the WAF counterfactual catalog; null when not applicable.</summary>
    public string? CounterfactualRef
    {
        get;
        set;
    }

    /// <summary>LLM-generated architect rendering for conflicting tradeoffs (risk-03).</summary>
    public string? ExplanationArchitect
    {
        get;
        set;
    }

    /// <summary>LLM-generated executive consequence rendering for conflicting tradeoffs (risk-03).</summary>
    public string? ExplanationExecutive
    {
        get;
        set;
    }

    /// <summary>Closed-form counterfactual statement for conflicting tradeoffs (risk-03).</summary>
    public string? CounterfactualStatement
    {
        get;
        set;
    }
}
