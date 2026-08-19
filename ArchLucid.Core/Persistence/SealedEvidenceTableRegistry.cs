namespace ArchLucid.Core.Persistence;

/// <summary>
///     Commit-sealed evidence tables: <c>[ArchLucidApp]</c> must have DENY UPDATE/DELETE (ADR 0039 / TB-303).
///     <see cref="AgentResultEnrichmentsTableName" /> is intentionally excluded — post-commit enrichments live there.
/// </summary>
public static class SealedEvidenceTableRegistry
{
    public const string AgentResultEnrichmentsTableName = "dbo.AgentResultEnrichments";

    /// <summary>Two-part names (<c>dbo.Table</c>) probed at startup and guarded in migration 247.</summary>
    public static IReadOnlyList<string> SealedTableNames { get; } =
    [
        "dbo.AuditEvents",
        "dbo.AgentResults",
        "dbo.AgentEvidencePackages",
        "dbo.DecisionNodes",
        "dbo.DecisioningTraces",
        "dbo.ContextSnapshots",
        "dbo.ContextSnapshotCanonicalObjects",
        "dbo.ContextSnapshotCanonicalObjectProperties",
        "dbo.ContextSnapshotWarnings",
        "dbo.ContextSnapshotErrors",
        "dbo.ContextSnapshotSourceHashes",
        "dbo.GraphSnapshots",
        "dbo.GraphSnapshotEdges",
        "dbo.GraphSnapshotNodes",
        "dbo.GraphSnapshotNodeProperties",
        "dbo.GraphSnapshotEdgeProperties",
        "dbo.GraphSnapshotWarnings",
        "dbo.FindingsSnapshots",
        "dbo.FindingRecords",
        "dbo.FindingRelatedNodes",
        "dbo.FindingRecommendedActions",
        "dbo.FindingProperties",
        "dbo.FindingTraceGraphNodesExamined",
        "dbo.FindingTraceRulesApplied",
        "dbo.FindingTraceDecisionsTaken",
        "dbo.FindingTraceAlternativePaths",
        "dbo.FindingTraceNotes",
        "dbo.GoldenManifests",
        "dbo.GoldenManifestAssumptions",
        "dbo.GoldenManifestWarnings",
        "dbo.GoldenManifestDecisions",
        "dbo.GoldenManifestDecisionEvidenceLinks",
        "dbo.GoldenManifestDecisionNodeLinks",
        "dbo.GoldenManifestProvenanceSourceFindings",
        "dbo.GoldenManifestProvenanceSourceGraphNodes",
        "dbo.GoldenManifestProvenanceAppliedRules",
        "dbo.ArtifactBundles",
        "dbo.ArtifactBundleArtifacts",
        "dbo.ArtifactBundleArtifactMetadata",
        "dbo.ArtifactBundleArtifactDecisionLinks",
        "dbo.ArtifactBundleTraceGenerators",
        "dbo.ArtifactBundleTraceDecisionLinks",
        "dbo.ArtifactBundleTraceNotes"
    ];
}
