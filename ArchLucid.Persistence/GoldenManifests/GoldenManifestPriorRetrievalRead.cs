using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.GoldenManifests;

/// <summary>
///     Slim hydrate for <see cref="IGoldenManifestRepository.ListPriorCommittedForRetrievalAsync" />:
///     Decisions + Topology (+ Metadata) from JSON columns only — no phase-1 child COUNT/load round-trips.
/// </summary>
internal static class GoldenManifestPriorRetrievalRead
{
    /// <summary>
    ///     Builds a minimal <see cref="ManifestDocument" /> for prior-manifest retrieval indexing.
    ///     Callers that need full sections must use <see cref="GoldenManifestPhase1RelationalRead.HydrateAsync" />.
    /// </summary>
    internal static ManifestDocument Hydrate(GoldenManifestStorageRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return new ManifestDocument
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            ManifestId = row.ManifestId,
            RunId = row.RunId,
            ContextSnapshotId = row.ContextSnapshotId,
            GraphSnapshotId = row.GraphSnapshotId,
            FindingsSnapshotId = row.FindingsSnapshotId,
            DecisionTraceId = row.DecisionTraceId,
            CreatedUtc = row.CreatedUtc,
            ManifestHash = row.ManifestHash ?? string.Empty,
            RuleSetId = row.RuleSetId ?? string.Empty,
            RuleSetVersion = row.RuleSetVersion ?? string.Empty,
            RuleSetHash = row.RuleSetHash ?? string.Empty,
            Metadata = GoldenManifestPhase1RelationalRead.DeserializeOrNew(
                row.MetadataJson,
                static j => JsonEntitySerializer.Deserialize<ManifestMetadata>(j)),
            Topology = GoldenManifestPhase1RelationalRead.DeserializeOrNew(
                row.TopologyJson,
                static j => JsonEntitySerializer.Deserialize<TopologySection>(j)),
            Decisions = GoldenManifestPhase1RelationalRead.FallbackDeserializeDecisions(row.DecisionsJson),
        };
    }
}
