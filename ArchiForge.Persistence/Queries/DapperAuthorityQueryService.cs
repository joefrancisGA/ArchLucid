using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ContextIngestion.Interfaces;
using ArchiForge.Decisioning.Interfaces;
using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.Persistence.Interfaces;
using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Queries;

public sealed class DapperAuthorityQueryService : IAuthorityQueryService
{
    private readonly IRunRepository _runRepository;
    private readonly IContextSnapshotRepository _contextSnapshotRepository;
    private readonly IGraphSnapshotRepository _graphSnapshotRepository;
    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository;
    private readonly IDecisionTraceRepository _decisionTraceRepository;
    private readonly IGoldenManifestRepository _goldenManifestRepository;
    private readonly IArtifactBundleRepository _artifactBundleRepository;

    public DapperAuthorityQueryService(
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
        string projectId,
        int take,
        CancellationToken ct)
    {
        var runs = await _runRepository.ListByProjectAsync(projectId, take, ct);
        return runs.Select(MapSummary).ToList();
    }

    public async Task<RunSummaryDto?> GetRunSummaryAsync(Guid runId, CancellationToken ct)
    {
        var run = await _runRepository.GetByIdAsync(runId, ct);
        return run is null ? null : MapSummary(run);
    }

    public async Task<RunDetailDto?> GetRunDetailAsync(Guid runId, CancellationToken ct)
    {
        var run = await _runRepository.GetByIdAsync(runId, ct);
        if (run is null)
            return null;

        var result = new RunDetailDto { Run = run };

        if (run.ContextSnapshotId.HasValue)
        {
            result.ContextSnapshot = await _contextSnapshotRepository.GetByIdAsync(run.ContextSnapshotId.Value, ct);
        }

        if (run.GraphSnapshotId.HasValue)
        {
            result.GraphSnapshot = await _graphSnapshotRepository.GetByIdAsync(run.GraphSnapshotId.Value, ct);
        }

        if (run.FindingsSnapshotId.HasValue)
        {
            result.FindingsSnapshot = await _findingsSnapshotRepository.GetByIdAsync(run.FindingsSnapshotId.Value, ct);
        }

        if (run.DecisionTraceId.HasValue)
        {
            result.DecisionTrace = await _decisionTraceRepository.GetByIdAsync(run.DecisionTraceId.Value, ct);
        }

        if (run.GoldenManifestId.HasValue)
        {
            result.GoldenManifest = await _goldenManifestRepository.GetByIdAsync(run.GoldenManifestId.Value, ct);
        }

        if (run.ArtifactBundleId.HasValue && run.GoldenManifestId.HasValue)
        {
            result.ArtifactBundle = await _artifactBundleRepository.GetByManifestIdAsync(run.GoldenManifestId.Value, ct);
        }

        return result;
    }

    public async Task<ManifestSummaryDto?> GetManifestSummaryAsync(Guid manifestId, CancellationToken ct)
    {
        var manifest = await _goldenManifestRepository.GetByIdAsync(manifestId, ct);
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
