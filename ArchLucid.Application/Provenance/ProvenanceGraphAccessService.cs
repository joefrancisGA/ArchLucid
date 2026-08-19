using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Provenance.Services;

using ContractsDecisionProvenanceSnapshot = ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot;

namespace ArchLucid.Application.Provenance;

/// <inheritdoc cref="IProvenanceGraphAccessService" />
public sealed class ProvenanceGraphAccessService(
    IProvenanceSnapshotRepository snapshotRepository,
    IProvenanceBuilder provenanceBuilder,
    TimeProvider timeProvider) : IProvenanceGraphAccessService
{
    private readonly IProvenanceSnapshotRepository _snapshotRepository =
        snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));

    private readonly IProvenanceBuilder _provenanceBuilder =
        provenanceBuilder ?? throw new ArgumentNullException(nameof(provenanceBuilder));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task<DecisionProvenanceGraph?> ResolveGraphAsync(
        ScopeContext scope,
        RunDetailDto detail,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(detail);

        if (!TryCreateBuildInput(detail, out ProvenanceBuildInput? buildInput))
            return null;

        string expectedRevision = ProvenanceSnapshotRevisionHasher.Compute(buildInput, detail.Run.ArtifactBundleId);
        ContractsDecisionProvenanceSnapshot? stored =
            await _snapshotRepository.GetByRunIdAsync(scope, detail.Run.RunId, ct);

        if (stored is not null
            && !string.IsNullOrWhiteSpace(stored.SourceRevisionHash)
            && string.Equals(stored.SourceRevisionHash, expectedRevision, StringComparison.Ordinal))
        {
            ArchLucidInstrumentation.RecordProvenanceSnapshotReadHit();

            return DeserializeGraph(stored, detail.Run.RunId);
        }

        ArchLucidInstrumentation.RecordProvenanceSnapshotRebuildFallback();

        DecisionProvenanceGraph graph = _provenanceBuilder.Build(buildInput);

        await UpsertSnapshotAsync(scope, buildInput, expectedRevision, graph, ct);

        return graph;
    }

    /// <inheritdoc />
    public async Task TryMaterializeSnapshotAsync(
        ScopeContext scope,
        RunDetailDto detail,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(detail);

        if (!TryCreateBuildInput(detail, out ProvenanceBuildInput? buildInput))
            return;

        string revision = ProvenanceSnapshotRevisionHasher.Compute(buildInput, detail.Run.ArtifactBundleId);
        ContractsDecisionProvenanceSnapshot? existing =
            await _snapshotRepository.GetByRunIdAsync(scope, detail.Run.RunId, ct);

        if (existing is not null
            && string.Equals(existing.SourceRevisionHash, revision, StringComparison.Ordinal))
            return;

        DecisionProvenanceGraph graph = _provenanceBuilder.Build(buildInput);
        await UpsertSnapshotAsync(scope, buildInput, revision, graph, ct);
    }

    private async Task UpsertSnapshotAsync(
        ScopeContext scope,
        ProvenanceBuildInput buildInput,
        string revision,
        DecisionProvenanceGraph graph,
        CancellationToken ct)
    {
        ContractsDecisionProvenanceSnapshot snapshot = new()
        {
            Id = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = buildInput.RunId,
            GraphJson = ProvenanceGraphSerializer.Serialize(graph),
            SourceRevisionHash = revision,
            CreatedUtc = _timeProvider.GetUtcNow().UtcDateTime,
        };

        await _snapshotRepository.SaveAsync(snapshot, ct);
        ArchLucidInstrumentation.RecordProvenanceSnapshotWrite();
    }

    private static DecisionProvenanceGraph? DeserializeGraph(ContractsDecisionProvenanceSnapshot stored, Guid runId)
    {
        try
        {
            return ProvenanceGraphSerializer.Deserialize(stored.GraphJson);
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize provenance graph for run '{runId}'. " +
                "The stored JSON may be corrupt or from an incompatible schema version.",
                ex);
        }
    }

    private static bool TryCreateBuildInput(RunDetailDto detail, out ProvenanceBuildInput buildInput)
    {
        buildInput = null!;

        if (detail.GoldenManifest is null
            || detail.GraphSnapshot is null
            || detail.FindingsSnapshot is null
            || detail.AuthorityTrace is null)
            return false;

        IReadOnlyList<SynthesizedArtifact> artifacts = detail.ArtifactBundle?.Artifacts ?? [];
        buildInput = new ProvenanceBuildInput
        {
            RunId = detail.Run.RunId,
            Findings = detail.FindingsSnapshot,
            Graph = detail.GraphSnapshot,
            Manifest = detail.GoldenManifest,
            DecisionTrace = detail.AuthorityTrace,
            Artifacts = artifacts,
        };

        return true;
    }
}
