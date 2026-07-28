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
}
