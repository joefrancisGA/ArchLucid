using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using ApiReplayExportRequest = ArchLucid.Api.Models.ReplayExportRequest;
using AppReplayExportRequest = ArchLucid.Application.Analysis.ReplayExportRequest;

namespace ArchLucid.Api.Controllers.Authority;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ExportsController(IRunExportQueryFacade runExportQueryFacade) : ControllerBase
{
    private readonly IRunExportQueryFacade _runExportQueryFacade =
        runExportQueryFacade ?? throw new ArgumentNullException(nameof(runExportQueryFacade));

    [HttpGet("review/{runId}/exports")]
    [ProducesResponseType(typeof(RunExportHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetRunExportHistory([FromRoute] string runId, CancellationToken cancellationToken)
    {
        RunExportHistoryQueryResult result = await _runExportQueryFacade.GetRunExportHistoryAsync(runId, cancellationToken);
        return result.Outcome switch
        {
            ExportRecordLoadOutcome.Success => Ok(new RunExportHistoryResponse { Exports = result.Exports!.ToList() }),
            ExportRecordLoadOutcome.RunNotFound => this.NotFoundProblem($"Run '{result.MissingRunId}' was not found.", ProblemTypes.RunNotFound),
            ExportRecordLoadOutcome.LineageUnverified => this.ConflictProblem(
                $"Run export history for '{result.MissingRunId}' is blocked until export lineage verification succeeds.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected export history outcome: {result.Outcome}."),
        };
    }

    [HttpGet("review/exports/{exportRecordId}")]
    [ProducesResponseType(typeof(RunExportRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetExportRecord([FromRoute] string exportRecordId, CancellationToken cancellationToken)
    {
        ScopedExportRecordLoadResult result = await _runExportQueryFacade.GetExportRecordAsync(exportRecordId, cancellationToken);
        return result.Outcome switch
        {
            ExportRecordLoadOutcome.Success => Ok(new RunExportRecordResponse { Record = result.Record! }),
            ExportRecordLoadOutcome.ExportRecordNotFound => this.NotFoundProblem($"Export record '{result.MissingId}' was not found.", ProblemTypes.ResourceNotFound),
            ExportRecordLoadOutcome.LineageUnverified => this.ConflictProblem(
                $"Export record '{result.MissingId}' is blocked until export lineage and sealed-manifest verification succeeds.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected export record outcome: {result.Outcome}."),
        };
    }

    [HttpGet("review/exports/compare")]
    [ProducesResponseType(typeof(ExportRecordDiffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareExportRecords(
        [FromQuery] string leftExportRecordId,
        [FromQuery] string rightExportRecordId,
        CancellationToken cancellationToken) =>
        MapExportRecordDiffResult(await _runExportQueryFacade.CompareExportRecordsAsync(leftExportRecordId, rightExportRecordId, cancellationToken));

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("review/exports/compare/summary")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: IRunExportQueryFacade.CompareExportRecordsSummaryAsync logs ComparisonSummaryPersisted.")]
    [ProducesResponseType(typeof(ExportRecordDiffSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareExportRecordsSummary(
        [FromQuery] string leftExportRecordId,
        [FromQuery] string rightExportRecordId,
        [FromBody] PersistComparisonRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new PersistComparisonRequest();
        ExportRecordDiffSummaryQueryResult result = await _runExportQueryFacade.CompareExportRecordsSummaryAsync(
            leftExportRecordId, rightExportRecordId, request.Persist, cancellationToken);
        if (result.Outcome is not ExportRecordLoadOutcome.Success)
            return MapExportRecordLoadOutcome(result.Outcome, result.MissingId);
        if (!string.IsNullOrWhiteSpace(result.ComparisonRecordId))
            Response.Headers[ArchLucidHttpHeaders.ComparisonRecordId] = result.ComparisonRecordId;
        return Ok(new ExportRecordDiffSummaryResponse { Format = "markdown", Summary = result.SummaryMarkdown! });
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("review/exports/{exportRecordId}/replay")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReplayExportRecord(
        [FromRoute] string exportRecordId,
        [FromBody] ApiReplayExportRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ApiReplayExportRequest();
        ExportReplayQueryResult result = await _runExportQueryFacade.ReplayExportAsync(
            exportRecordId,
            new AppReplayExportRequest { ExportRecordId = exportRecordId, RecordReplayExport = request.RecordReplayExport },
            cancellationToken);
        if (result.Outcome is ExportRecordLoadOutcome.LineageUnverified)
        {
            return this.ConflictProblem(
                $"Export replay for '{result.MissingId}' is blocked until export lineage and sealed-manifest verification succeeds.",
                ProblemTypes.Conflict);
        }

        if (result.Outcome is not ExportRecordLoadOutcome.Success)
            return this.NotFoundProblem($"Export record '{result.MissingId}' was not found.", ProblemTypes.ResourceNotFound);
        return ReplayArtifactResponseFactory.FromExportReplay(Request, result.Replay!);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("review/exports/{exportRecordId}/replay/metadata")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ReplayExportMetadataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReplayExportRecordMetadata(
        [FromRoute] string exportRecordId,
        [FromBody] ApiReplayExportRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ApiReplayExportRequest();
        ExportReplayQueryResult result = await _runExportQueryFacade.ReplayExportAsync(
            exportRecordId,
            new AppReplayExportRequest { ExportRecordId = exportRecordId, RecordReplayExport = request.RecordReplayExport },
            cancellationToken);
        if (result.Outcome is ExportRecordLoadOutcome.LineageUnverified)
        {
            return this.ConflictProblem(
                $"Export replay for '{result.MissingId}' is blocked until export lineage verification succeeds.",
                ProblemTypes.Conflict);
        }

        if (result.Outcome is not ExportRecordLoadOutcome.Success)
            return this.NotFoundProblem($"Export record '{result.MissingId}' was not found.", ProblemTypes.ResourceNotFound);
        ReplayExportResult replay = result.Replay!;
        return Ok(new ReplayExportMetadataResponse { ExportRecordId = replay.ExportRecordId, Format = replay.Format, FileName = replay.FileName });
    }

    private IActionResult MapExportRecordDiffResult(ExportRecordDiffQueryResult result) =>
        result.Outcome is ExportRecordLoadOutcome.Success
            ? Ok(new ExportRecordDiffResponse { Diff = result.Diff! })
            : MapExportRecordLoadOutcome(result.Outcome, result.MissingId);

    private IActionResult MapExportRecordLoadOutcome(ExportRecordLoadOutcome outcome, string? missingId) => outcome switch
    {
        ExportRecordLoadOutcome.LeftIdRequired => this.BadRequestProblem("leftExportRecordId is required.", ProblemTypes.ValidationFailed),
        ExportRecordLoadOutcome.RightIdRequired => this.BadRequestProblem("rightExportRecordId is required.", ProblemTypes.ValidationFailed),
        ExportRecordLoadOutcome.LeftNotFound or ExportRecordLoadOutcome.ExportRecordNotFound => this.NotFoundProblem($"Export record '{missingId}' was not found.", ProblemTypes.ResourceNotFound),
        ExportRecordLoadOutcome.RightNotFound => this.NotFoundProblem($"Export record '{missingId}' was not found.", ProblemTypes.ResourceNotFound),
        ExportRecordLoadOutcome.LineageUnverified => this.ConflictProblem(
            $"Export record '{missingId}' is blocked until export lineage and sealed-manifest verification succeeds.",
            ProblemTypes.Conflict),
        _ => throw new InvalidOperationException($"Unexpected export record load outcome: {outcome}."),
    };
}
