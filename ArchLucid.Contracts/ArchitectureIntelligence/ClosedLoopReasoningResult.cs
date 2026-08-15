using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ClosedLoopReasoningResult
{
    public ArchitectureKnowledgeModel Model
    {
        get;
        set;
    } = new();

    public ProgressiveInterviewState Interview
    {
        get;
        set;
    } = new();

    public List<SpecialistReviewResult> SpecialistReviews
    {
        get;
        set;
    } = [];

    public AdversarialReviewResult Adversarial
    {
        get;
        set;
    } = new();

    public List<ArchitectureRecommendation> Recommendations
    {
        get;
        set;
    } = [];

    public List<ChangeImpactResult> ImpactResults
    {
        get;
        set;
    } = [];

    public IncrementalReReviewResult? ReReview
    {
        get;
        set;
    }

    public GoldenArchitectureTestResult? GoldenMetrics
    {
        get;
        set;
    }

    public List<MustNotFailViolation> MustNotFailViolations
    {
        get;
        set;
    } = [];

    public List<EvidenceValidationResult> ValidationResults
    {
        get;
        set;
    } = [];

    /// <summary>Product-shaped findings for reuse with existing Finding pipelines/UI.</summary>
    public List<Finding> ProductFindings
    {
        get;
        set;
    } = [];

    /// <summary>Product-shaped recommendation records (Proposed) for advisory workflow reuse.</summary>
    public List<RecommendationRecord> ProductRecommendations
    {
        get;
        set;
    } = [];

    /// <summary>
    /// True when publishable output was emptied by integrity/must-not-fail gating (TB-1981 / TB-1991).
    /// </summary>
    public bool PublishBlocked
    {
        get;
        set;
    }

    /// <summary>True when L0 framing MUST questions remain unanswered (TB-2341 item 47).</summary>
    public bool ReviewCompleteBlocked
    {
        get;
        set;
    }

    public List<string> PublishBlockReasons
    {
        get;
        set;
    } = [];

    /// <summary>Finding ids that passed deterministic integrity (stage 1).</summary>
    public List<string> IntegrityPassedFindingIds
    {
        get;
        set;
    } = [];

    /// <summary>Explicit model diffs produced while evaluating recommendations.</summary>
    public List<ArchitectureModelDiff> ModelDiffs
    {
        get;
        set;
    } = [];

    public string? RunId
    {
        get;
        set;
    }

    public string? ModelId
    {
        get;
        set;
    }

    public bool PublishedToProduct
    {
        get;
        set;
    }

    public Guid? PublishedFindingsSnapshotId
    {
        get;
        set;
    }

    public int PublishedRecommendationCount
    {
        get;
        set;
    }

    public string? PublishSkipReason
    {
        get;
        set;
    }

    /// <summary>True when this result was served from <c>IReviewResultCache</c> (TB-1992).</summary>
    public bool CacheHit
    {
        get;
        set;
    }

    public string? CacheReuseReason
    {
        get;
        set;
    }

    /// <summary>True when pre-flight admission rejected the run on analysis depth or remaining AI budget.</summary>
    public bool BudgetRejected
    {
        get;
        set;
    }

    public string? BudgetRejectReason
    {
        get;
        set;
    }

    public int BudgetEstimatedTokens
    {
        get;
        set;
    }

    public int BudgetMaxTokens
    {
        get;
        set;
    }

    /// <summary>Estimated pre-tax cost of this analysis, or null when no LLM cost rates are configured.</summary>
    public decimal? BudgetEstimatedCostUsd
    {
        get;
        set;
    }

    /// <summary>Tenant AI budget left this UTC month, or null when no budget policy resolved.</summary>
    public decimal? BudgetRemainingUsd
    {
        get;
        set;
    }

    /// <summary>True when both a cost estimate and a remaining balance were available for the USD comparison.</summary>
    public bool BudgetEnforced
    {
        get;
        set;
    }
}
