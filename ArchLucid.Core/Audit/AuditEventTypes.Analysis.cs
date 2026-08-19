namespace ArchLucid.Core.Audit;

// Quick scan, Architecture Intelligence, recommendations, product learning, advisory scans, and digests.
public static partial class AuditEventTypes
{
    /// <summary>Post-merge graph invariant checker detected dangling edges or topology endpoint collisions.</summary>
    public const string GraphMergeInvariantViolation = "GraphMerge.InvariantViolation";

    /// <summary>Closed-loop Architecture Intelligence reasoning run completed (additive lane).</summary>
    public const string ArchitectureIntelligenceRunCompleted = "ArchitectureIntelligence.RunCompleted";

    /// <summary>Architecture Intelligence golden harness executed (additive lane).</summary>
    public const string ArchitectureIntelligenceGoldenTestCompleted = "ArchitectureIntelligence.GoldenTestCompleted";

    /// <summary>
    ///     Emitted when <c>POST /v1/architecture/quick-scan</c> completes successfully (single-pass LLM; ephemeral result).
    /// </summary>
    public const string ArchitectureQuickScanExecuted = "ArchitectureQuickScanExecuted";

    /// <summary>Runtime Quick Scan safety override changed by an administrator (TB-898).</summary>
    public const string QuickScanSafetyOperationalOverrideChanged = "QuickScanSafetyOperationalOverrideChanged";

    public const string RecommendationGenerated = "RecommendationGenerated";
    public const string RecommendationAccepted = "RecommendationAccepted";
    public const string RecommendationRejected = "RecommendationRejected";
    public const string RecommendationDeferred = "RecommendationDeferred";
    public const string RecommendationImplemented = "RecommendationImplemented";

    public const string RecommendationLearningProfileRebuilt = "RecommendationLearningProfileRebuilt";

    public const string RecommendationLearningPreviewRequested = "RecommendationLearningPreviewRequested";

    public const string RecommendationLearningProfileRolledBack = "RecommendationLearningProfileRolledBack";

    /// <summary>
    ///     Pilot feedback signal captured via <c>POST /v1/product-learning/signals</c>.
    ///     Payload: <c>subjectType</c>, <c>disposition</c>, <c>patternKey</c> (when supplied).
    /// </summary>
    public const string ProductLearningPilotSignalRecorded = "ProductLearningPilotSignalRecorded";

    /// <summary>
    ///     59R planning drafts materialized via <c>POST /v1/learning/planning/materialize</c>.
    ///     Payload: <c>sinceUtc</c>, <c>maxPlansToMaterialize</c>, and themes/plans/signal-link insert counts (same fields as
    ///     the JSON response body).
    /// </summary>
    public const string ProductLearningPlanningMaterialized = "ProductLearningPlanningMaterialized";

    public const string AdvisoryScanScheduled = "AdvisoryScanScheduled";
    public const string AdvisoryScanExecuted = "AdvisoryScanExecuted";
    public const string ArchitectureDigestGenerated = "ArchitectureDigestGenerated";

    public const string DigestSubscriptionCreated = "DigestSubscriptionCreated";
    public const string DigestSubscriptionToggled = "DigestSubscriptionToggled";
    public const string DigestDeliverySucceeded = "DigestDeliverySucceeded";
    public const string DigestDeliveryFailed = "DigestDeliveryFailed";

    /// <summary>Cross-tenant pattern library listed via <c>GET /v1/analytics/patterns</c> (TB-880).</summary>
    public const string PatternInsightsListed = "PatternInsightsListed";
}
