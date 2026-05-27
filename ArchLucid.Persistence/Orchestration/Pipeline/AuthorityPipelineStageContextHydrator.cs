using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Persistence.Ports;
namespace ArchLucid.Persistence.Orchestration.Pipeline;

/// <summary>
///     Loads committed stage artefacts into <see cref="AuthorityPipelineContext" /> when TB-041 checkpoint skip applies.
/// </summary>
public sealed class AuthorityPipelineStageContextHydrator(
    IContextSnapshotRepository contextSnapshotRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IArtifactBundleRepository artifactBundleRepository)
{
    private readonly IArtifactBundleRepository _artifactBundleRepository =
        artifactBundleRepository ?? throw new ArgumentNullException(nameof(artifactBundleRepository));

    private readonly IContextSnapshotRepository _contextSnapshotRepository =
        contextSnapshotRepository ?? throw new ArgumentNullException(nameof(contextSnapshotRepository));

    private readonly IDecisionTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    /// <summary>
    ///     Hydrates context for a checkpoint-completed stage. Returns <see langword="false" /> when the FK is set but the
    ///     artefact cannot be loaded (caller should re-run the stage).
    /// </summary>
    public async Task<bool> TryHydrateAsync(AuthorityPipelineContext ctx, string stageName, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(ctx);

        return stageName switch
        {
            "context_ingestion" => await HydrateContextIngestionAsync(ctx, ct),
            "graph" => await HydrateGraphAsync(ctx, ct),
            "findings" => await HydrateFindingsAsync(ctx, ct),
            "decisioning" => await HydrateDecisioningAsync(ctx, ct),
            "artifacts" => await HydrateArtifactsAsync(ctx, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(stageName), stageName, "Unknown authority pipeline stage.")
        };
    }

    private async Task<bool> HydrateContextIngestionAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        ScopeContext scope = ctx.Scope;
        Guid snapshotId = ctx.Run.ContextSnapshotId!.Value;
        ContextSnapshot? snapshot = await _contextSnapshotRepository.GetByIdAsync(scope.ToReadScope(), snapshotId, ct);

        if (snapshot is null)
            return false;

        ctx.ContextSnapshot = snapshot;
        return true;
    }

    private async Task<bool> HydrateGraphAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        ScopeContext scope = ctx.Scope;
        Guid graphId = ctx.Run.GraphSnapshotId!.Value;
        GraphSnapshot? snapshot = await _graphSnapshotRepository.GetByIdAsync(scope, graphId, ct);

        if (snapshot is null)
            return false;

        ctx.GraphSnapshot = snapshot;
        ctx.GraphResolution = new GraphSnapshotResolutionResult(snapshot, "reused_from_run_header");
        return true;
    }

    private async Task<bool> HydrateFindingsAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        ScopeContext scope = ctx.Scope;
        Guid findingsId = ctx.Run.FindingsSnapshotId!.Value;
        FindingsSnapshot? snapshot = await _findingsSnapshotRepository.GetByIdAsync(scope, findingsId, ct);

        if (snapshot is null)
            return false;

        ctx.FindingsSnapshot = snapshot;
        return true;
    }

    private async Task<bool> HydrateDecisioningAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        ScopeContext scope = ctx.Scope;
        Guid traceId = ctx.Run.DecisionTraceId!.Value;
        Guid manifestId = ctx.Run.GoldenManifestId!.Value;

        DecisionTraceDto? trace = await _decisionTraceRepository.GetByIdAsync(scope, traceId, ct);
        ManifestDocument? manifest = await _goldenManifestRepository.GetByIdAsync(scope, manifestId, ct);

        if (trace is null || manifest is null)
            return false;

        ctx.Trace = trace;
        ctx.Manifest = manifest;
        return true;
    }

    private async Task<bool> HydrateArtifactsAsync(AuthorityPipelineContext ctx, CancellationToken ct)
    {
        Guid manifestId = ctx.Run.GoldenManifestId!.Value;
        ArtifactBundle? bundle = await _artifactBundleRepository.GetByManifestIdAsync(
            ctx.Scope,
            manifestId,
            loadArtifactBodies: false,
            ct);

        if (bundle is null)
            return false;

        ctx.ArtifactBundle = bundle;
        return true;
    }
}
