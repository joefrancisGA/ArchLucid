using System.Text.Json;

using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunQueryController
{
    /// <summary>Keyset list of relational finding metadata for <paramref name="runId" />.</summary>
    [HttpGet("review/{runId}/findings")]
    [HttpGet("/v{version:apiVersion}/runs/{runId}/findings")]
    [ProducesResponseType(typeof(RunFindingsListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListRunFindings(
        [FromRoute] string runId,
        [FromQuery] string? orderBy,
        [FromQuery] int? take,
        [FromQuery] int? cursorSortOrder,
        [FromQuery] int? cursorPriorityRank,
        [FromQuery] Guid? cursorFindingRecordId,
        CancellationToken cancellationToken)
    {
        RunFindingsListQueryResult result = await runFindingsQueryService.ListRunFindingsAsync(
            runId,
            orderBy,
            take,
            cursorSortOrder,
            cursorPriorityRank,
            cursorFindingRecordId,
            cancellationToken);

        if (result.Outcome == RunFindingsQueryOutcome.BadRequest)
            return this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed);

        if (result.Outcome != RunFindingsQueryOutcome.Success)
            return this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);

        IActionResult? findingsNotModified = this.TryConditionalNotModified(result.Etag!);

        return findingsNotModified ?? this.OkWithConditionalEtag(result.Response!, result.Etag!);
    }

    /// <summary>
    ///     Bulk export of flattened architecture findings for <paramref name="runId" /> as <c>text/csv</c> (one row per
    ///     finding across agent results).
    /// </summary>
    [HttpGet("review/{runId}/findings/export/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExportRunFindingsCsv(
        [FromRoute] string runId,
        [FromServices] IAuditService auditService,
        CancellationToken cancellationToken)
    {
        RunFindingsCsvExportQueryResult result =
            await runFindingsQueryService.ExportRunFindingsCsvAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunFindingsQueryOutcome.ManifestNotFound => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound),
            RunFindingsQueryOutcome.NotFound => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound),
            RunFindingsQueryOutcome.Conflict => this.ConflictProblem(result.ProblemDetail!, ProblemTypes.Conflict),
            _ => await ExportFindingsCsvSuccessAsync(result, auditService, cancellationToken)
        };
    }

    /// <summary>
    ///     Returns persisted artifact pointers for one finding (manifest snapshot ids, graph nodes, agent trace ids).
    /// </summary>
    [HttpGet("review/{runId}/findings/{findingId}/evidence-chain")]
    [ProducesResponseType(typeof(FindingEvidenceChainResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingEvidenceChain(
        [FromRoute] string runId,
        [FromRoute] string findingId,
        CancellationToken cancellationToken)
    {
        FindingEvidenceChainQueryResult result =
            await runFindingsQueryService.GetFindingEvidenceChainAsync(runId, findingId, cancellationToken);

        return result.Outcome == RunFindingsQueryOutcome.Success
            ? Ok(result.Chain)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);
    }

    /// <summary>
    ///     Same payload as <c>GET /v1/findings/{findingId}/inspect</c>; returns <c>404</c> when the finding&apos;s persisted
    ///     run identifier does not match <paramref name="runId" /> (prevents cross-run ambiguity in deep links).
    /// </summary>
    [HttpGet("review/{runId}/findings/{findingId}/inspect")]
    [ProducesResponseType(typeof(FindingInspectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingInspectForRun(
        [FromRoute] string runId,
        [FromRoute] string findingId,
        [FromQuery] bool includeTypedPayload = true,
        CancellationToken cancellationToken = default)
    {
        FindingInspectQueryResult result = await runFindingsQueryService.GetFindingInspectForRunAsync(
            runId,
            findingId,
            includeTypedPayload,
            cancellationToken);

        return result.Outcome switch
        {
            RunFindingsQueryOutcome.Success => Ok(result.Response),
            RunFindingsQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound)
        };
    }

    /// <summary>ZIP bundle: run summary, audit slice for the run, and decision traces (size-capped).</summary>
    [HttpGet("review/{runId}/review-trail/export")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<IActionResult> GetTraceabilityBundleZip(
        [FromRoute] string runId,
        CancellationToken cancellationToken) =>
        GetTraceabilityBundleZipCore(runId, cancellationToken);

    /// <summary>Legacy alias; prefer <c>GET /v1/runs/{runId}/review-trail/export</c>.</summary>
    [Obsolete("Prefer GET /v1/runs/{runId}/review-trail/export. Retained for backward compatibility.")]
    [HttpGet("review/{runId}/traceability-bundle.zip")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> GetTraceabilityBundleZipLegacyAlias(
        [FromRoute] string runId,
        CancellationToken cancellationToken) =>
        GetTraceabilityBundleZipCore(runId, cancellationToken);

    private async Task<IActionResult> GetTraceabilityBundleZipCore(
        string runId,
        CancellationToken cancellationToken)
    {
        try
        {
            TraceabilityBundleExportResult result = await traceabilityBundleExport.TryBuildZipAsync(
                runId,
                HttpContext.TraceIdentifier,
                cancellationToken);

            return result.Outcome switch
            {
                TraceabilityBundleExportOutcome.RunNotFound => this.NotFoundProblem(
                    $"Run '{runId}' was not found.",
                    ProblemTypes.RunNotFound),
                TraceabilityBundleExportOutcome.TooLarge => this.PayloadTooLargeProblem(
                    result.ErrorMessage!,
                    ProblemTypes.ExportFailed,
                    extensions: new Dictionary<string, object?>
                    {
                        ["attemptedBytes"] = result.AttemptedBytes,
                        ["maxBytes"] = result.MaxBytes,
                    }),
                TraceabilityBundleExportOutcome.Success => File(
                    result.ZipBytes!,
                    "application/zip",
                    $"traceability-{runId}.zip"),
                _ => throw new InvalidOperationException($"Unexpected outcome {result.Outcome}."),
            };
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    private async Task<IActionResult> ExportFindingsCsvSuccessAsync(
        RunFindingsCsvExportQueryResult result,
        IAuditService auditService,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingsListAccessed,
                RunId = result.AuditRunId,
                DataJson = JsonSerializer.Serialize(
                    new { format = "csv", findingCount = result.FindingCount },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return File(
            result.CsvBytes!,
            "text/csv; charset=utf-8",
            result.DownloadName!);
    }
}
