namespace ArchLucid.Contracts.Audit;

/// <summary>
///     High-level lifecycle grouping shared by Activity ribbons and Audit timelines — aligns with buyer-facing stage copy.
/// </summary>
public enum ReviewAuditLifecycleStage
{
    ReviewStarted = 0,

    ContextCaptured = 1,

    GraphCreated = 2,

    FindingsCaptured = 3,

    ManifestFinalized = 4,

    ArtifactsBundled = 5,

    GovernanceHandoff = 6,

    /// <summary>Events outside the linear spine (integrations, internal tooling).</summary>
    Other = 99
}
