using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Serialization;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GoldenManifests;

internal static partial class GoldenManifestPhase1RelationalRead
{
    internal static async Task<ManifestDocument> HydrateAsync(
        SqlConnection connection,
        GoldenManifestStorageRow row,
        CancellationToken ct)
    {
        Guid manifestId = row.ManifestId;

        ManifestSliceCounts sliceCounts = await LoadSliceCountsAsync(connection, manifestId, ct);
        int assumptionsCount = sliceCounts.AssumptionsCount;
        int warningsCount = sliceCounts.WarningsCount;
        int decisionsCount = sliceCounts.DecisionsCount;
        int provFindingCount = sliceCounts.ProvenanceFindingCount;
        int provNodeCount = sliceCounts.ProvenanceNodeCount;
        int provRuleCount = sliceCounts.ProvenanceRuleCount;

        List<string> assumptions = assumptionsCount > 0
            ? await LoadAssumptionsRelationalAsync(connection, manifestId, ct)
            : FallbackDeserializeList(row.AssumptionsJson);

        List<string> warnings = warningsCount > 0
            ? await LoadWarningsRelationalAsync(connection, manifestId, ct)
            : FallbackDeserializeList(row.WarningsJson);

        ManifestProvenance provenance = await LoadProvenanceRelationalAsync(
            connection,
            manifestId,
            provFindingCount,
            provNodeCount,
            provRuleCount,
            row.ProvenanceJson,
            ct);

        List<ResolvedArchitectureDecision> decisions = decisionsCount > 0
            ? await LoadDecisionsRelationalAsync(connection, manifestId, ct)
            : FallbackDeserializeDecisions(row.DecisionsJson);

        ManifestDocument document = new()
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
            ManifestHash = row.ManifestHash,
            RuleSetId = row.RuleSetId,
            RuleSetVersion = row.RuleSetVersion,
            RuleSetHash = row.RuleSetHash,
            Metadata = RelationalSliceReadCore.DeserializeOrNew(row.MetadataJson,
                static j => JsonEntitySerializer.Deserialize<ManifestMetadata>(j)),
            Requirements = RelationalSliceReadCore.DeserializeOrNew(
                row.RequirementsJson,
                static j => JsonEntitySerializer.Deserialize<RequirementsCoverageSection>(j)),
            Topology =
                RelationalSliceReadCore.DeserializeOrNew(row.TopologyJson, static j => JsonEntitySerializer.Deserialize<TopologySection>(j)),
            Security =
                RelationalSliceReadCore.DeserializeOrNew(row.SecurityJson, static j => JsonEntitySerializer.Deserialize<SecuritySection>(j)),
            Compliance = RelationalSliceReadCore.DeserializeOrDefault(
                row.ComplianceJson,
                static () => new ComplianceSection()),
            Cost = RelationalSliceReadCore.DeserializeOrNew(row.CostJson, static j => JsonEntitySerializer.Deserialize<CostSection>(j)),
            Constraints = RelationalSliceReadCore.DeserializeOrNew(
                row.ConstraintsJson,
                static j => JsonEntitySerializer.Deserialize<ConstraintSection>(j)),
            UnresolvedIssues = RelationalSliceReadCore.DeserializeOrNew(
                row.UnresolvedIssuesJson,
                static j => JsonEntitySerializer.Deserialize<UnresolvedIssuesSection>(j)),
            Decisions = decisions,
            Assumptions = assumptions,
            Warnings = warnings,
            Provenance = provenance
        };

        GoldenManifestHasherBoundPayload.ApplyJsonToDocument(row.HasherBoundJson, document);
        return document;
    }

    /// <summary>Shared JSON section deserialize used by full hydrate and prior-retrieval slim hydrate.</summary>
    internal static T DeserializeOrNew<T>(string? json, Func<string, T> deserialize)
        where T : class, new() =>
        RelationalSliceReadCore.DeserializeOrNew(json, deserialize);

    private static async Task<List<string>> LoadOrderedStringsAsync(
        SqlConnection connection,
        string sql,
        Guid manifestId,
        CancellationToken ct) =>
        await RelationalSliceReadCore.LoadOrderedStringsAsync(
            connection,
            sql,
            new { ManifestId = manifestId },
            transaction: null,
            ct);
}
