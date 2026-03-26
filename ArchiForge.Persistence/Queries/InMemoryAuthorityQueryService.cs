using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ContextIngestion.Interfaces;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;
using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.Persistence.Interfaces;
using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Queries;

/// <summary>
/// <see cref="IAuthorityQueryService"/> backed by the same repository abstractions as <see cref="DapperAuthorityQueryService"/> (in-memory stores in test / storage-off mode).
/// </summary>
public sealed class InMemoryAuthorityQueryService(
    IRunRepository runRepository,
    IContextSnapshotRepository contextSnapshotRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IArtifactBundleRepository artifactBundleRepository)
    : IAuthorityQueryService
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<RunSummaryDto>> ListRunsByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct)
    {
        IReadOnlyList<RunRecord> runs = await runRepository.ListByProjectAsync(scope, projectId, take, ct).ConfigureAwait(false);
        return runs.Select(MapSummary).ToList();
    }

    public async Task<RunSummaryDto?> GetRunSummaryAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct).ConfigureAwait(false);
        return run is null ? null : MapSummary(run);
    }

    /// <inheritdoc />
    public async Task<RunDetailDto?> GetRunDetailAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct).ConfigureAwait(false);
        if (run is null)
            return null;

        return new RunDetailDto
        {
            Run = run,
            ContextSnapshot = run.ContextSnapshotId.HasValue
                ? await contextSnapshotRepository.GetByIdAsync(run.ContextSnapshotId.Value, ct).ConfigureAwait(false)
                : null,
            GraphSnapshot = run.GraphSnapshotId.HasValue
                ? await graphSnapshotRepository.GetByIdAsync(run.GraphSnapshotId.Value, ct).ConfigureAwait(false)
                : null,
            FindingsSnapshot = run.FindingsSnapshotId.HasValue
                ? await findingsSnapshotRepository.GetByIdAsync(run.FindingsSnapshotId.Value, ct).ConfigureAwait(false)
                : null,
            DecisionTrace = run.DecisionTraceId.HasValue
                ? await decisionTraceRepository.GetByIdAsync(scope, run.DecisionTraceId.Value, ct).ConfigureAwait(false)
                : null,
            GoldenManifest = run.GoldenManifestId.HasValue
                ? await goldenManifestRepository.GetByIdAsync(scope, run.GoldenManifestId.Value, ct).ConfigureAwait(false)
                : null,
            ArtifactBundle = run is { ArtifactBundleId: not null, GoldenManifestId: not null }
                ? await artifactBundleRepository.GetByManifestIdAsync(scope, run.GoldenManifestId.Value, ct).ConfigureAwait(false)
                : null
        };
    }

    /// <inheritdoc />
    public async Task<ManifestSummaryDto?> GetManifestSummaryAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        GoldenManifest? manifest = await goldenManifestRepository.GetByIdAsync(scope, manifestId, ct).ConfigureAwait(false);
        return manifest is null ? null : AuthorityRunMapper.MapManifestSummary(manifest);
    }

    private static RunSummaryDto MapSummary(RunRecord run) => AuthorityRunMapper.MapSummary(run);
}
