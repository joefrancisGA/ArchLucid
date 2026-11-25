using System.Security.Claims;

using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Graph;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Api.Services.Authority;

/// <inheritdoc cref="IRunGraphQueryService"/>
public sealed class RunGraphQueryService(
    IRunDetailQueryService runDetailQueryService,
    IRunRoiEstimator runRoiEstimator,
    IRunRepository authorityRunRepository,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IScopeContextProvider scopeContextProvider,
    IRunTrustEvidenceCardBuilder trustEvidenceCardBuilder,
    ILlmCostEstimator llmCostEstimator,
    IAuthorityQueryService authorityQueryService,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IDbConnectionFactory dbConnectionFactory,
    AuthorityRunInventoryQuery inventoryQuery,
    IArchitectureShareAccessGate architectureShareAccessGate) : IRunGraphQueryService
{
    public async Task<RunGraphDetailQueryResult> GetRunDetailAsync(string runId, CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(runId, out Guid runGuid))
        {
            return NotFoundDetail($"Run '{runId}' was not found.");
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Persistence.Models.RunRecord? runHeader =
            await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (runHeader is null)
            return NotFoundDetail($"Run '{runId}' was not found.");

        string? runEtag = null;

        if (ConditionalGetNegotiation.TryFromRowVersion(runHeader.RowVersion, out string headerEtag))
            runEtag = headerEtag;

        ArchitectureRunDetail? detail =
            await runDetailQueryService.GetRunDetailForOperatorEnrichAsync(runId, cancellationToken);

        if (detail is null)
            return NotFoundDetail($"Run '{runId}' was not found.");

        if (!string.IsNullOrWhiteSpace(detail.Run.CurrentManifestVersion) && detail.Manifest is null)
        {
            return new RunGraphDetailQueryResult
            {
                Outcome = RunGraphQueryOutcome.ManifestNotFound,
                ProblemDetail = $"Manifest referenced by run '{runId}' could not be found."
            };
        }

        RunDetailsResponse response = RunResponseMapper.ToRunDetailsResponse(
            detail.Run,
            detail.Tasks,
            detail.Results,
            detail.Manifest,
            detail.DecisionTraces);

        response.AuthorityPipelineComplete = detail.AuthorityPipelineComplete;
        response.AgentTaskLoopComplete = detail.AgentTaskLoopComplete;
        response.AuthorityLifecyclePhase = detail.AuthorityLifecyclePhase;

        response.ExecutionFlavorBuyerSummary = RunExecutionFlavorSummary.Build(
            detail.Run,
            effectiveAgentExecutionModeAccessor.GetEffectiveMode());

        if (detail.IsCommitted)
        {
            response.TrustEvidenceCard = await trustEvidenceCardBuilder.BuildAsync(
                detail,
                effectiveAgentExecutionModeAccessor.GetEffectiveMode(),
                cancellationToken);
        }

        ScopeContext appendScope = scopeContextProvider.GetCurrentScope();
        await RunAgentExecutionLlmCostEstimateAppender.AppendAsync(
            response,
            runId,
            appendScope,
            agentExecutionTraceRepository,
            llmCostEstimator,
            cancellationToken);

        if (!ConditionalGetNegotiation.TryFromRowVersion(runHeader.RowVersion, out runEtag))
            runEtag = ConditionalGetNegotiation.FromRowVersionWithFingerprint(null, $"run-detail:{runId}");

        return new RunGraphDetailQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Response = response,
            Etag = runEtag
        };
    }

    public async Task<RunRoiEstimateQueryResult> GetRunRoiEstimateAsync(string runId, CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(runId, out _))
        {
            return new RunRoiEstimateQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        ArchitectureRunDetail? detail =
            await runDetailQueryService.GetRunDetailForOperatorEnrichAsync(runId, cancellationToken);

        if (detail is null)
        {
            return new RunRoiEstimateQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        return new RunRoiEstimateQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Estimate = runRoiEstimator.Estimate(detail)
        };
    }

    public async Task<RunStageTimelineQueryResult> GetRunStageTimelineAsync(string runId, CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(runId, out Guid runGuid))
        {
            return new RunStageTimelineQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Persistence.Models.RunRecord? run = await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null)
        {
            return new RunStageTimelineQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        IReadOnlyList<StageTimelineSummary> timeline =
            await runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken);

        return new RunStageTimelineQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Timeline = timeline
        };
    }

    public async Task<RunInteractiveGraphQueryResult> GetInteractiveGraphSnapshotAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(runId, out Guid runGuid))
        {
            return new RunInteractiveGraphQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);

        if (detail?.GraphSnapshot is null)
        {
            return new RunInteractiveGraphQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Interactive graph snapshot for run '{runGuid:D}' was not found."
            };
        }

        return new RunInteractiveGraphQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Response = GraphSnapshotCytoscapeMapper.ToInteractiveResponse(detail.GraphSnapshot)
        };
    }

    public async Task<RunRoiTelemetryQueryResult> GetRoiTelemetryAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRoiTelemetryAggregate aggregate =
            await RunRoiTelemetryAggregateQuery.ReadAsync(dbConnectionFactory, scope, cancellationToken);

        return new RunRoiTelemetryQueryResult { Aggregate = aggregate };
    }

    public async Task<RunListQueryResult> ListRunsAsync(
        ClaimsPrincipal user,
        string? cursor,
        int? limit,
        int offset,
        int take,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        bool useKeyset = !string.IsNullOrWhiteSpace(cursor);
        int requestedTake = useKeyset ? RunPagination.ClampTake(take) : RunPagination.ClampLimit(limit ?? pageSize);
        int visibleOffset = 0;
        if (!useKeyset)
        {
            visibleOffset = offset > 0
                ? RunPagination.NormalizeOffset(offset)
                : PaginationDefaults.ToSkip(page, requestedTake);
        }
        (DateTime CreatedUtc, Guid RunId)? anchor = RunCursorCodec.TryDecode(cursor);

        async Task<bool> CanReadAsync(Guid runId, CancellationToken ct)
        {
            (bool found, bool allowed) = await architectureShareAccessGate.EvaluateRunReadAsync(user, scope, runId, ct);
            return found && allowed;
        }

        RunListPage visible = await AuthorityRunInventoryQuery.PageVisibleHeadersAsync(
            inventoryQuery.EnumerateVisibleHeadersAsync(
                scope, null, anchor?.CreatedUtc, anchor?.RunId, CanReadAsync, cancellationToken),
            visibleOffset,
            requestedTake,
            cancellationToken);

        string? nextCursor = useKeyset && visible.HasMore
            ? RunCursorCodec.Encode(visible.Items[^1].CreatedUtc, visible.Items[^1].RunId)
            : null;
        IReadOnlyList<RunSummary> summaries = visible.Items.Select(RunSummaryProjection.FromHeader).ToList();
        string fingerprint = useKeyset
            ? $"keyset|cursor={cursor}|take={requestedTake}"
            : $"offset|offset={visibleOffset}|limit={requestedTake}";
        return new RunListQueryResult
        {
            Body = RunListPageMapper.MapPage(summaries, visible.HasMore, nextCursor, requestedTake),
            Etag = RunListPageMapper.BuildEtag(summaries, fingerprint, visible.HasMore, nextCursor),
        };
    }

    private static RunGraphDetailQueryResult NotFoundDetail(string detail) =>
        new() { Outcome = RunGraphQueryOutcome.NotFound, ProblemDetail = detail };
}
