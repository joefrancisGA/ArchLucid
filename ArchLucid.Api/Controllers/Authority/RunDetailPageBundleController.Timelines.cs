using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models.Runs;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunDetailPageBundleController
{
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

    private async Task<IReadOnlyList<StageTimelineSummary>> LoadStageTimelineAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunRecord? run =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
        {
            return [];
        }

        return await _runStageOutcomesRepository.ListByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);
    }
}
