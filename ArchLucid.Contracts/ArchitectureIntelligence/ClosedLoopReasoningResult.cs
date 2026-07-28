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
}
