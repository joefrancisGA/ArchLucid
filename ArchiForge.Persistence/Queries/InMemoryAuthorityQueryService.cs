using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ContextIngestion.Interfaces;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Interfaces;
using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.Persistence.Interfaces;
using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Queries;

public sealed class InMemoryAuthorityQueryService : IAuthorityQueryService
{
    private readonly IRunRepository _runRepository;
    private readonly IContextSnapshotRepository _contextSnapshotRepository;
    private readonly IGraphSnapshotRepository _graphSnapshotRepository;
    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository;
    private readonly IDecisionTraceRepository _decisionTraceRepository;
    private readonly IGoldenManifestRepository _goldenManifestRepository;
    private readonly IArtifactBundleRepository _artifactBundleRepository;

    public InMemoryAuthorityQueryService(
        IRunRepository runRepository,
        IContextSnapshotRepository contextSnapshotRepository,
        IGraphSnapshotRepository graphSnapshotRepository,
        IFindingsSnapshotRepository findingsSnapshotRepository,
        IDecisionTraceRepository decisionTraceRepository,
        IGoldenManifestRepository goldenManifestRepository,
        IArtifactBundleRepository artifactBundleRepository)
    {
        _runRepository = runRepository;
        _contextSnapshotRepository = contextSnapshotRepository;
        _graphSnapshotRepository = graphSnapshotRepository;
        _findingsSnapshotRepository = findingsSnapshotRepository;
        _decisionTraceRepository = decisionTraceRepository;
        _goldenManifestRepository = goldenManifestRepository;
        _artifactBundleRepository = artifactBundleRepository;
    }

    public async Task<IReadOnlyList<RunSummaryDto>> ListRunsByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct)
    {
        var runs = await _runRepository.ListByProjectAsync(scope, projectId, take, ct);
        return runs.Select(MapSummary).ToList();
    }

    public async Task<RunSummaryDto?> GetRunSummaryAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        var run = await _runRepository.GetByIdAsync(scope, runId, ct);
        return run is null ? null : MapSummary(run);
    }

    public async Task<RunDetailDto?> GetRunDetailAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        var run = await _runRepository.GetByIdAsync(scope, runId, ct);
        if (run is null)
            return null;

        return new RunDetailDto
        {
            Run = run,
            ContextSnapshot = run.ContextSnapshotId.HasValue
                ? await _contextSnapshotRepository.GetByIdAsync(run.ContextSnapshotId.Value, ct)
                : null,
            GraphSnapshot = run.GraphSnapshotId.HasValue
                ? await _graphSnapshotRepository.GetByIdAsync(run.GraphSnapshotId.Value, ct)
                : null,
            FindingsSnapshot = run.FindingsSnapshotId.HasValue
                ? await _findingsSnapshotRepository.GetByIdAsync(run.FindingsSnapshotId.Value, ct)
                : null,
            DecisionTrace = run.DecisionTraceId.HasValue
                ? await _decisionTraceRepository.GetByIdAsync(scope, run.DecisionTraceId.Value, ct)
                : null,
            GoldenManifest = run.GoldenManifestId.HasValue
                ? await _goldenManifestRepository.GetByIdAsync(scope, run.GoldenManifestId.Value, ct)
                : null,
            ArtifactBundle = run.ArtifactBundleId.HasValue && run.GoldenManifestId.HasValue
                ? await _artifactBundleRepository.GetByManifestIdAsync(scope, run.GoldenManifestId.Value, ct)
                : null
        };
    }

    public async Task<ManifestSummaryDto?> GetManifestSummaryAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        var manifest = await _goldenManifestRepository.GetByIdAsync(scope, manifestId, ct);
        if (manifest is null)
            return null;

        return new ManifestSummaryDto
        {
            ManifestId = manifest.ManifestId,
            RunId = manifest.RunId,
            CreatedUtc = manifest.CreatedUtc,
            ManifestHash = manifest.ManifestHash,
            RuleSetId = manifest.RuleSetId,
            RuleSetVersion = manifest.RuleSetVersion,
            DecisionCount = manifest.Decisions.Count,
            WarningCount = manifest.Warnings.Count,
            UnresolvedIssueCount = manifest.UnresolvedIssues.Items.Count,
            Status = manifest.Metadata.Status
        };
    }

    private static RunSummaryDto MapSummary(RunRecord run)
    {
        return new RunSummaryDto
        {
            RunId = run.RunId,
            ProjectId = run.ProjectId,
            Description = run.Description,
            CreatedUtc = run.CreatedUtc,
            ContextSnapshotId = run.ContextSnapshotId,
            GraphSnapshotId = run.GraphSnapshotId,
            FindingsSnapshotId = run.FindingsSnapshotId,
            GoldenManifestId = run.GoldenManifestId,
            DecisionTraceId = run.DecisionTraceId,
            ArtifactBundleId = run.ArtifactBundleId
        };
    }
}
