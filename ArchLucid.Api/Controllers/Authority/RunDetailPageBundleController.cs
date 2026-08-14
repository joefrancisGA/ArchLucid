using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models.Runs;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Runs;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Run detail page bundles to collapse first-paint and timeline fan-out.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/authority/reviews/{runId:guid}")]
[EnableRateLimiting("fixed")]
public sealed class RunDetailPageBundleController(
    IAuthorityQueryService queryService,
    IAuthorityRunDetailOperatorEnricher runDetailOperatorEnricher,
    IArtifactQueryService artifactQueryService,
    IRunPipelineAuditTimelineService pipelineAuditTimeline,
    IRunRepository runRepository,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IScopeContextProvider scopeProvider,
    IConfiguration configuration,
    ILogger<RunDetailPageBundleController> logger) : ControllerBase
{
    private readonly IAuthorityQueryService _queryService =
        queryService ?? throw new ArgumentNullException(nameof(queryService));

    private readonly IAuthorityRunDetailOperatorEnricher _runDetailOperatorEnricher =
        runDetailOperatorEnricher ?? throw new ArgumentNullException(nameof(runDetailOperatorEnricher));

    private readonly IArtifactQueryService _artifactQueryService =
        artifactQueryService ?? throw new ArgumentNullException(nameof(artifactQueryService));

    private readonly IRunPipelineAuditTimelineService _pipelineAuditTimeline =
        pipelineAuditTimeline ?? throw new ArgumentNullException(nameof(pipelineAuditTimeline));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<RunDetailPageBundleController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>First-paint bundle: buyer summary + progress + manifest summary + artifacts.</summary>
    [HttpGet("critical-page-bundle")]
    [ProducesResponseType(typeof(RunDetailCriticalPageBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCriticalPageBundle(Guid runId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        RunDetailDto? detail =
            await _queryService.GetRunDetailForBuyerSummaryAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (detail is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        BuyerRunDetailSummaryDto buyerSummary = await BuildBuyerSummaryAsync(detail, cancellationToken).ConfigureAwait(false);

        Task<RunSummaryDto?> progressTask = _queryService.GetRunSummaryAsync(scope, runId, cancellationToken);

        Guid? manifestId = detail.Run.GoldenManifestId;

        Task<ManifestSummaryDto?> manifestTask = manifestId.HasValue
            ? _queryService.GetManifestSummaryAsync(scope, manifestId.Value, cancellationToken)
            : Task.FromResult<ManifestSummaryDto?>(null);

        Task<IReadOnlyList<ArtifactDescriptor>> artifactsTask = manifestId.HasValue
            ? _artifactQueryService.ListArtifactsByManifestIdAsync(scope, manifestId.Value, cancellationToken)
            : Task.FromResult<IReadOnlyList<ArtifactDescriptor>>([]);

        await Task.WhenAll(progressTask, manifestTask, artifactsTask).ConfigureAwait(false);

        RunSummaryDto? progress = await progressTask.ConfigureAwait(false);
        ManifestSummaryDto? manifest = await manifestTask.ConfigureAwait(false);
        IReadOnlyList<ArtifactDescriptor> artifacts = await artifactsTask.ConfigureAwait(false);

        RunDetailCriticalPageBundleResponse body = new()
        {
            BuyerSummary = buyerSummary,
            ProgressSummary = progress is null ? null : ToRunSummaryResponse(progress),
            ManifestSummary = manifest is null ? null : ToManifestSummaryResponse(manifest),
            Artifacts = manifestId.HasValue
                ? artifacts.Select(a => ArtifactDescriptorResponse.From(a, manifestId.Value)).ToList()
                : [],
        };

        return Ok(body);
    }

    /// <summary>Below-fold timelines bundle: pipeline audit trail + stage outcomes.</summary>
    [HttpGet("timelines-bundle")]
    [ProducesResponseType(typeof(RunDetailTimelinesBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTimelinesBundle(Guid runId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        Task<IReadOnlyList<RunPipelineTimelineItemDto>?> pipelineTask =
            _pipelineAuditTimeline.GetTimelineAsync(scope, runId, cancellationToken);

        Task<IReadOnlyList<StageTimelineSummary>> stageTask =
            LoadStageTimelineAsync(scope, runId, cancellationToken);

        await Task.WhenAll(pipelineTask, stageTask).ConfigureAwait(false);

        IReadOnlyList<RunPipelineTimelineItemDto>? pipelineItems = await pipelineTask.ConfigureAwait(false);

        if (pipelineItems is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        IReadOnlyList<RunPipelineTimelineItemResponse> pipeline = pipelineItems
            .Select(static i => new RunPipelineTimelineItemResponse
            {
                EventId = i.EventId,
                OccurredUtc = i.OccurredUtc,
                EventType = i.EventType,
                ActorUserName = i.ActorUserName,
                CorrelationId = i.CorrelationId,
            })
            .ToList();

        RunDetailTimelinesBundleResponse body = new()
        {
            PipelineTimeline = pipeline,
            StageTimeline = await stageTask.ConfigureAwait(false),
        };

        return Ok(body);
    }

    private async Task<BuyerRunDetailSummaryDto> BuildBuyerSummaryAsync(
        RunDetailDto detail,
        CancellationToken cancellationToken)
    {
        detail.ExecutionFlavorBuyerSummary = RunExecutionFlavorSummary.Build(
            detail.Run.RealModeFellBackToSimulator,
            _configuration["AgentExecution:Mode"]);

        try
        {
            await _runDetailOperatorEnricher
                .EnrichBuyerSummaryAsync(detail, _configuration["AgentExecution:Mode"], cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Buyer-summary enrichment failed for run {RunId}; returning unenriched proof DTO.",
                detail.Run.RunId);
        }

        return RunDetailBuyerMapper.Map(detail);
    }

    private async Task<IReadOnlyList<StageTimelineSummary>> LoadStageTimelineAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        Persistence.Models.RunRecord? run =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
        {
            return [];
        }

        return await _runStageOutcomesRepository.ListByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);
    }

    private static RunSummaryResponse ToRunSummaryResponse(RunSummaryDto summary)
    {
        return new RunSummaryResponse
        {
            RunId = summary.RunId,
            ProjectId = summary.ProjectId,
            Description = summary.Description,
            DisplayName = string.IsNullOrWhiteSpace(summary.Description) ? null : summary.Description.Trim(),
            IsDemoWelcomeRun = summary.IsDemoWelcomeRun,
            IsSample = summary.IsSample,
            IsPinned = summary.IsPinned,
            CreatedUtc = summary.CreatedUtc,
            HasContextSnapshot = summary.HasContextSnapshot,
            HasGraphSnapshot = summary.HasGraphSnapshot,
            HasFindingsSnapshot = summary.HasFindingsSnapshot,
            HasGoldenManifest = summary.HasGoldenManifest,
            GoldenManifestId = summary.GoldenManifestId,
            HasDecisionTrace = summary.HasDecisionTrace,
            HasArtifactBundle = summary.HasArtifactBundle,
            HasWarnings = summary.HasWarnings,
            HasGovernanceWarnings = summary.HasGovernanceWarnings,
            RunDegradedExecution = summary.RunDegradedExecution,
            DegradedExecutionAgents = summary.DegradedExecutionAgents,
            PackageOrigin = summary.PackageOrigin,
            StructuralExecutionMode = summary.StructuralExecutionMode,
        };
    }

    private static ManifestSummaryResponse ToManifestSummaryResponse(ManifestSummaryDto summary)
    {
        return new ManifestSummaryResponse
        {
            ManifestId = summary.ManifestId,
            RunId = summary.RunId,
            CreatedUtc = summary.CreatedUtc,
            ManifestHash = summary.ManifestHash,
            RuleSetId = summary.RuleSetId,
            RuleSetVersion = summary.RuleSetVersion,
            DecisionCount = summary.DecisionCount,
            WarningCount = summary.WarningCount,
            UnresolvedIssueCount = summary.UnresolvedIssueCount,
            Status = summary.Status,
            HasWarnings = summary.WarningCount > 0,
            HasUnresolvedIssues = summary.UnresolvedIssueCount > 0,
            OperatorSummary =
                $"{summary.DecisionCount} decisions, {summary.WarningCount} warnings, {summary.UnresolvedIssueCount} unresolved issues, status {summary.Status}",
            TopDecisionSynopses = summary.TopDecisionSynopses,
            FeasibilityVerdict = summary.FeasibilityVerdict,
            EffectiveGovernanceAtCommit = summary.EffectiveGovernanceAtCommit,
        };
    }
}
