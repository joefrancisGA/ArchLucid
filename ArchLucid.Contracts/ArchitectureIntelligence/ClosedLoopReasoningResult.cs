using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ClosedLoopReasoningResult
{
    private ArchitectureKnowledgeModel model = new();

    public ArchitectureKnowledgeModel Model
    {
        get => model;
        set => model = value ?? new ArchitectureKnowledgeModel();
    }

    private ProgressiveInterviewState interview = new();

    public ProgressiveInterviewState Interview
    {
        get => interview;
        set => interview = value ?? new ProgressiveInterviewState();
    }

    private List<SpecialistReviewResult> specialistReviews = [];

    public List<SpecialistReviewResult> SpecialistReviews
    {
        get => specialistReviews;
        set => specialistReviews = ContractCollectionDefaults.Coalesce(value);
    }

    private AdversarialReviewResult adversarial = new();

    public AdversarialReviewResult Adversarial
    {
        get => adversarial;
        set => adversarial = value ?? new AdversarialReviewResult();
    }

    private List<ArchitectureRecommendation> recommendations = [];

    public List<ArchitectureRecommendation> Recommendations
    {
        get => recommendations;
        set => recommendations = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ChangeImpactResult> impactResults = [];

    public List<ChangeImpactResult> ImpactResults
    {
        get => impactResults;
        set => impactResults = ContractCollectionDefaults.Coalesce(value);
    }

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

    private List<MustNotFailViolation> mustNotFailViolations = [];

    public List<MustNotFailViolation> MustNotFailViolations
    {
        get => mustNotFailViolations;
        set => mustNotFailViolations = ContractCollectionDefaults.Coalesce(value);
    }

    private List<EvidenceValidationResult> validationResults = [];

    public List<EvidenceValidationResult> ValidationResults
    {
        get => validationResults;
        set => validationResults = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Product-shaped findings for reuse with existing Finding pipelines/UI.</summary>
    private List<Finding> productFindings = [];

    public List<Finding> ProductFindings
    {
        get => productFindings;
        set => productFindings = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Product-shaped recommendation records (Proposed) for advisory workflow reuse.</summary>
    private List<RecommendationRecord> productRecommendations = [];

    public List<RecommendationRecord> ProductRecommendations
    {
        get => productRecommendations;
        set => productRecommendations = ContractCollectionDefaults.Coalesce(value);
    }

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

    private List<string> publishBlockReasons = [];

    public List<string> PublishBlockReasons
    {
        get => publishBlockReasons;
        set => publishBlockReasons = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Finding ids that passed deterministic integrity (stage 1).</summary>
    private List<string> integrityPassedFindingIds = [];

    public List<string> IntegrityPassedFindingIds
    {
        get => integrityPassedFindingIds;
        set => integrityPassedFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Explicit model diffs produced while evaluating recommendations.</summary>
    private List<ArchitectureModelDiff> modelDiffs = [];

    public List<ArchitectureModelDiff> ModelDiffs
    {
        get => modelDiffs;
        set => modelDiffs = ContractCollectionDefaults.Coalesce(value);
    }

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
