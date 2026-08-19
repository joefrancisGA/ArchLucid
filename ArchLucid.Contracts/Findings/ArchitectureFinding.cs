using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Findings;

public sealed class ArchitectureFinding
{
    public string FindingId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public AgentType SourceAgent
    {
        get;
        set;
    }

    public FindingSeverity Severity
    {
        get;
        set;
    } = FindingSeverity.Info;

    /// <summary>Optional self-rated confidence from the producing agent when mapped from <c>AgentResult</c>.</summary>
    public double? ConfidenceScore
    {
        get;
        set;
    }

    /// <summary>Deterministic 0–100 evaluation score from harness / reference-case / trace completeness (nullable for backwards compatibility).</summary>
    public int? EvaluationConfidenceScore
    {
        get;
        set;
    }

    /// <summary>Mapped coarse bucket for <see cref="EvaluationConfidenceScore" />.</summary>
    public FindingConfidenceLevel? ConfidenceLevel
    {
        get;
        set;
    }

    public string Category
    {
        get;
        set;
    } = string.Empty;

    public string Message
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Optional short rationale for reviewers (LLM or rules may populate; omit when unknown).</summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }

    /// <summary>When true, operators hid this finding from default review surfaces (SQL <c>dbo.FindingRecords.IsMuted</c>).</summary>
    public bool IsMuted
    {
        get;
        set;
    }

    /// <summary>Operator justification when <see cref="IsMuted" /> is true.</summary>
    public string? MuteReason
    {
        get;
        set;
    }

    public List<string> EvidenceRefs
    {
        get;
        set;
    } = [];

    /// <summary>Optional minimal IaC remediation snippet (for example, Azure Bicep) generated for this finding.</summary>
    public string? IacStub
    {
        get;
        set;
    }

    /// <summary>Tenant-adjusted projected USD savings when populated by the ROI pipeline.</summary>
    public decimal? EstimatedUsdSavings
    {
        get;
        set;
    }

    /// <summary>Optional policy-pack rule identifier when the finding maps to a curated pack rule.</summary>
    public string? PolicyRuleId
    {
        get;
        set;
    }

    /// <summary>
    ///     Whether the finding is governance-blocking (<see cref="FindingEnforcementTier.PolicyViolation" />)
    ///     or opt-in baseline guidance (<see cref="FindingEnforcementTier.Advisory" />).
    /// </summary>
    public FindingEnforcementTier EnforcementTier
    {
        get;
        set;
    } = FindingEnforcementTier.PolicyViolation;

    /// <summary>Deterministic or LLM-refined insight-density score in [0, 100] (TB-382).</summary>
    public int? InsightDensityScore
    {
        get;
        set;
    }

    /// <summary>Post-gate routing after insight-density scoring (TB-382).</summary>
    public FindingTreatment? Treatment
    {
        get;
        set;
    }

    /// <summary>Whether this observation is a decision-grade finding or checklist coverage (TB-384).</summary>
    public FindingClassification? Classification
    {
        get;
        set;
    }

    /// <summary>LLM-derived rationale for why the insight is not generic (TB-382; Phase 2).</summary>
    public string? WhyThisIsNotGeneric
    {
        get;
        set;
    }

    /// <summary>LLM-derived principal-architect value statement (TB-382; Phase 2).</summary>
    public string? PrincipalArchitectValue
    {
        get;
        set;
    }

    /// <summary>LLM-derived decision consequence when the insight is acted on or ignored (TB-382; Phase 2).</summary>
    public string? DecisionConsequence
    {
        get;
        set;
    }

    /// <summary>Authoritative trust label string for operator review surfaces (run-detail enrichment).</summary>
    public string? TrustLabel
    {
        get;
        set;
    }

    /// <summary>Short reason accompanying <see cref="TrustLabel" />.</summary>
    public string? TrustLabelReason
    {
        get;
        set;
    }
}
