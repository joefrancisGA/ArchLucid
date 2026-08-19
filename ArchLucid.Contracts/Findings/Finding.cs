namespace ArchLucid.Contracts.Findings;

public class Finding
{
    /// <summary>Schema version of this finding record (increment when envelope or payload contracts change).</summary>
    public int FindingSchemaVersion
    {
        get;
        set;
    } = FindingsSchema.CurrentFindingVersion;

    public string FindingId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string FindingType
    {
        get;
        set;
    } = null!;

    public string Category
    {
        get;
        set;
    } = null!;

    public string EngineType
    {
        get;
        set;
    } = null!;

    public FindingSeverity Severity
    {
        get;
        set;
    }

    public string Title
    {
        get;
        set;
    } = null!;

    public string Rationale
    {
        get;
        set;
    } = null!;

    public List<string> RelatedNodeIds
    {
        get;
        set;
    } = [];

    public List<string> RecommendedActions
    {
        get;
        set;
    } = [];

    public Dictionary<string, string> Properties
    {
        get;
        set;
    } = new();

    public object? Payload
    {
        get;
        set;
    }

    public string? PayloadType
    {
        get;
        set;
    }

    public ExplainabilityTrace Trace
    {
        get;
        set;
    } = new();

    /// <summary><see cref="ArchLucid.Contracts.Requests.ArchitectureRequest.RequestId" /> for the run input.</summary>
    public string? RequestInputRef
    {
        get;
        set;
    }

    /// <summary>Run identifier (string form) that produced this finding.</summary>
    public string? RunIdRef
    {
        get;
        set;
    }

    /// <summary>FK to <c>dbo.AgentExecutionTraces.TraceId</c> when the finding is AI-sourced.</summary>
    public string? AgentExecutionTraceId
    {
        get;
        set;
    }

    public string? ModelDeploymentName
    {
        get;
        set;
    }

    /// <summary>Customer-facing governed model alias when captured from the agent execution trace (TB-871).</summary>
    public string? ModelAlias
    {
        get;
        set;
    }

    public string? ModelVersion
    {
        get;
        set;
    }

    public string? PromptTemplateId
    {
        get;
        set;
    }

    public string? PromptTemplateVersion
    {
        get;
        set;
    }

    /// <summary>Parent agent self-reported confidence in [0,1] when applicable.</summary>
    public double? ConfidenceScore
    {
        get;
        set;
    }

    /// <summary>Evaluation-derived confidence score in [0,100] from harness/reference/trace completeness.</summary>
    public int? EvaluationConfidenceScore
    {
        get;
        set;
    }

    /// <summary>Mapped bucket for <see cref="EvaluationConfidenceScore" />.</summary>
    public FindingConfidenceLevel? ConfidenceLevel
    {
        get;
        set;
    }

    /// <summary>Deterministic policy / rule identifier when available.</summary>
    public string? PolicyRuleId
    {
        get;
        set;
    }

    public FindingHumanReviewStatus HumanReviewStatus
    {
        get;
        set;
    }

    public string? ReviewedByUserId
    {
        get;
        set;
    }

    public DateTimeOffset? ReviewedAtUtc
    {
        get;
        set;
    }

    public string? ReviewNotes
    {
        get;
        set;
    }

    /// <summary>Estimated monthly savings in USD when the finding is cost-related and quantified.</summary>
    public decimal? ProjectedImpactUsd
    {
        get;
        set;
    }

    /// <summary>When true, this finding is hidden from default operator review lists until un-muted (SQL-backed tenants).</summary>
    public bool IsMuted
    {
        get;
        set;
    }

    /// <summary>Justification captured when the finding was muted.</summary>
    public string? MuteReason
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

    /// <summary>Operator-assigned remediation owner (distinct from disposition reviewer or waiver owner). TB-395.</summary>
    public string? AssignedToUserId
    {
        get;
        set;
    }

    /// <summary>Target remediation completion date (distinct from deferral <c>RevisitDueUtc</c>). TB-395.</summary>
    public DateTimeOffset? RemediationDueUtc
    {
        get;
        set;
    }
}
