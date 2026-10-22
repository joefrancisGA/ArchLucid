using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref="ICommitPipelineManifestReuseService" />
public sealed class CommitPipelineManifestReuseService(
    IGoldenManifestRepository goldenManifestRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestBuilder goldenManifestBuilder,
    IGoldenManifestValidator manifestValidator,
    IManifestHashService manifestHashService,
    IAuthorityFeasibilityVerdictComposer feasibilityVerdictComposer,
    IDecisionIntakeTrailProvider intakeTrailProvider) : ICommitPipelineManifestReuseService
{
    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IDecisionTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IGoldenManifestBuilder _goldenManifestBuilder =
        goldenManifestBuilder ?? throw new ArgumentNullException(nameof(goldenManifestBuilder));

    private readonly IGoldenManifestValidator _manifestValidator =
        manifestValidator ?? throw new ArgumentNullException(nameof(manifestValidator));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IAuthorityFeasibilityVerdictComposer _feasibilityVerdictComposer =
        feasibilityVerdictComposer ?? throw new ArgumentNullException(nameof(feasibilityVerdictComposer));

    private readonly IDecisionIntakeTrailProvider _intakeTrailProvider =
        intakeTrailProvider ?? throw new ArgumentNullException(nameof(intakeTrailProvider));

    /// <inheritdoc />
    public async Task<CommitPipelineManifestReuseResult?> TryReusePipelineManifestAsync(
        ArchitectureRun run,
        Guid runGuid,
        Guid contextSnapshotId,
        GraphSnapshot graph,
        GraphSnapshot graphForDecision,
        FindingsSnapshot findings,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphForDecision);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(scope);

        if (run.GoldenManifestId is not { } manifestId || run.DecisionTraceId is not { } traceId)
            return null;

        ManifestDocument? pipelineManifest = await _goldenManifestRepository.GetByIdAsync(scope, manifestId, cancellationToken);

        if (pipelineManifest is null)
            return null;

        DecisionTraceDto? traceDto = await _decisionTraceRepository.GetByIdAsync(scope, traceId, cancellationToken);

        if (traceDto is null)
            return null;

        if (!PipelineManifestAlignsWithCommitSnapshots(
                pipelineManifest,
                runGuid,
                contextSnapshotId,
                graph.GraphSnapshotId,
                findings.FindingsSnapshotId))
            return null;

        bool topologyMergeChanged = !ReferenceEquals(graph, graphForDecision);

        if (topologyMergeChanged)
            await ApplyTopologyMergeRefreshAsync(pipelineManifest, graphForDecision, runGuid, cancellationToken);
        else if (string.IsNullOrWhiteSpace(pipelineManifest.ManifestHash))
            pipelineManifest.ManifestHash = _manifestHashService.ComputeHash(pipelineManifest);

        return new CommitPipelineManifestReuseResult(pipelineManifest, traceDto);
    }

    private async Task ApplyTopologyMergeRefreshAsync(
        ManifestDocument manifest,
        GraphSnapshot graphForDecision,
        Guid runGuid,
        CancellationToken cancellationToken)
    {
        _goldenManifestBuilder.RefreshGraphDerivedTopology(manifest, graphForDecision);

        TransparencyTrail? intakeTrail =
            await _intakeTrailProvider.TryGetTransparencyTrailAsync(runGuid, cancellationToken);

        manifest.FeasibilityVerdict = _feasibilityVerdictComposer.Compose(manifest, intakeTrail);
        _manifestValidator.Validate(manifest);
        manifest.ManifestHash = _manifestHashService.ComputeHash(manifest);
    }

    private static bool PipelineManifestAlignsWithCommitSnapshots(
        ManifestDocument manifest,
        Guid runId,
        Guid contextSnapshotId,
        Guid graphSnapshotId,
        Guid findingsSnapshotId)
    {
        return manifest.RunId == runId
               && manifest.ContextSnapshotId == contextSnapshotId
               && manifest.GraphSnapshotId == graphSnapshotId
               && manifest.FindingsSnapshotId == findingsSnapshotId;
    }
}
