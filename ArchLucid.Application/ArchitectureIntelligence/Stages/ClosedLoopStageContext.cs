using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

/// <summary>Mutable state passed through closed-loop review stage handlers.</summary>
public sealed class ClosedLoopStageContext
{
    public required ClosedLoopReasoningRequest EffectiveRequest { get; init; }

    public required string TenantId { get; init; }

    public required string RunId { get; init; }

    public required ArchitectureIntelligenceBudgetDecision Budget { get; init; }

    public ReviewCacheDependencyManifest? CacheManifest { get; init; }

    public ReviewCacheStorageKind? StorageKind { get; init; }

    public ArchitectureKnowledgeModel Model { get; set; } = null!;

    public List<string> StoredArtifactIds { get; set; } = [];

    public bool HadPersistedModelForRun { get; set; }

    public ProgressiveInterviewState Interview { get; set; } = null!;

    public List<SpecialistReviewResult> SpecialistReviews { get; set; } = [];

    public List<SpecialistReviewFinding> AllFindings { get; set; } = [];

    public List<EvidenceValidationResult> ValidationResults { get; set; } = [];

    public Dictionary<string, EvidenceValidationResult> ValidationByFindingId { get; set; } =
        new(StringComparer.Ordinal);

    public AdversarialReviewResult Adversarial { get; set; } = null!;

    public List<ArchitectureRecommendation> Recommendations { get; set; } = [];

    public List<ChangeImpactResult> ImpactResults { get; set; } = [];

    public List<ArchitectureModelDiff> ModelDiffs { get; set; } = [];

    public IncrementalReReviewResult? ReReview { get; set; }

    public SpecialistFindingsSubstantiationResult? ReReviewSubstantiation { get; set; }

    public ArchitectureKnowledgeModel? ModelBeforeRecommendationApply { get; set; }

    public int AllFindingsCountBeforeIntegrate { get; set; }

    public HashSet<string> ValidationFindingIdsBeforeIntegrate { get; set; } = new(StringComparer.Ordinal);

    public bool ReReviewIntegrated { get; set; }

    public List<MustNotFailViolation> MustNotFailViolations { get; set; } = [];

    public TrustPublishDecision PublishDecision { get; set; } = null!;

    public List<SpecialistReviewFinding> GateFindings { get; set; } = [];

    public ClosedLoopReasoningResult? Result { get; set; }
}
