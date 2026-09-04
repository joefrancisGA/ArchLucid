using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ExplanationController
{
    /// <summary>Stakeholder explanation for one run's golden manifest, optionally enriched with stored provenance graph JSON.</summary>
    /// <param name="runId">Run to load.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns><see cref="ExplanationResult" /> JSON, or 404 when the run or manifest is missing in scope.</returns>
    [HttpGet("runs/{runId:guid}/explain")]
    [ProducesResponseType(typeof(ExplanationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExplainRun(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await query.GetRunDetailAsync(scope, runId, ct);
        if (detail?.GoldenManifest is null)
            return this.NotFoundProblem(
                $"Run '{runId}' was not found or has no committed manifest in the current scope.",
                ProblemTypes.RunNotFound);

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        DecisionProvenanceGraph? graph = null;
        ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot? snapshot =
            await provenanceRepo.GetByRunIdAsync(scope, runId, ct);

        if (snapshot is not null)

            try
            {
                graph = ProvenanceGraphSerializer.Deserialize(snapshot.GraphJson);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarningWithSanitizedUserArg(
                    ex,
                    "Provenance graph JSON for run {RunId} is corrupt; explanation will proceed without provenance.",
                    runId.ToString("D"));
            }

        ExplanationResult result = await explanation.ExplainRunAsync(detail.GoldenManifest, graph, ct);
        List<FindingTraceConfidenceDto> traceRows = FindingTraceConfidenceMapper.FromSnapshot(detail.FindingsSnapshot);

        if (traceRows.Count > 0)
            result.FindingTraceConfidences = traceRows;

        int findingCountForTelemetry = detail.FindingsSnapshot?.Findings?.Count ?? 0;
        FindingsListAccessTelemetry.LogFindingSnapshotExpose(_logger, scope, runId, nameof(ExplainRun), findingCountForTelemetry);

        return Ok(result);
    }

    /// <summary>Sponsor rollup: themes, risk posture, counts, and the same explanation payload as granular explain.</summary>
    /// <param name="runId">Run to summarize.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns><see cref="RunExplanationSummary" /> JSON, or 404 when the run or manifest is missing in scope.</returns>
    [HttpGet("runs/{runId:guid}/aggregate")]
    [ProducesResponseType(typeof(RunExplanationSummary), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AggregateRunExplanation(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await query.GetRunDetailAsync(scope, runId, ct);

        if (detail?.GoldenManifest is null)
            return this.NotFoundProblem(
                $"Run '{runId}' was not found or has no committed manifest in the current scope.",
                ProblemTypes.RunNotFound);

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        RunExplanationSummary? summary = await runExplanationSummary.GetSummaryAsync(scope, runId, ct);
        if (summary is null)
            return this.NotFoundProblem(
                $"Run '{runId}' was not found or has no committed manifest in the current scope.",
                ProblemTypes.RunNotFound);

        FindingsListAccessTelemetry.LogFindingSnapshotExpose(
            _logger,
            scope,
            runId,
            nameof(AggregateRunExplanation),
            summary.FindingCount);

        return Ok(summary);
    }
}
