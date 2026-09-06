using ArchLucid.Api.Http;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using System.Text.Json;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunComparisonController
{
    [HttpGet("review/compare/end-to-end")]
    [ProducesResponseType(typeof(EndToEndReplayComparisonResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareRunsEndToEnd(
        [FromQuery] RunPairQuery query,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, EndToEndReplayComparisonReport? report) =
            await BuildEndToEndReportAsync(query, cancellationToken);
        return error ?? Ok(ComparisonResponseMapper.ToEndToEndResponse(report!));
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("review/compare/end-to-end/summary")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(EndToEndReplayComparisonSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareRunsEndToEndSummary(
        [FromQuery] RunPairQuery query,
        [FromBody] PersistComparisonRequest? request,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, EndToEndReplayComparisonReport? report) =
            await BuildEndToEndReportAsync(query, cancellationToken);
        if (error is not null)
            return error;

        request ??= new PersistComparisonRequest();
        string summary = _endToEndReplayComparisonSummaryFormatter.FormatMarkdown(report!);

        if (!request.Persist)
            return Ok(ComparisonResponseMapper.ToEndToEndSummaryResponse(summary));

        string comparisonRecordId =
            await _comparisonAuditService.RecordEndToEndAsync(report!, summary, cancellationToken);
        Response.Headers[ArchLucidHttpHeaders.ComparisonRecordId] = comparisonRecordId;

        return Ok(ComparisonResponseMapper.ToEndToEndSummaryResponse(summary));
    }

    [HttpGet("review/compare/end-to-end/export")]
    [ProducesResponseType(typeof(EndToEndReplayComparisonExportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExportRunsEndToEndComparisonMarkdown(
        [FromQuery] RunPairQuery query,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, EndToEndReplayComparisonReport? report) =
            await BuildEndToEndReportAsync(query, cancellationToken);
        if (error is not null)
            return error;
        string markdown = _endToEndReplayComparisonExportService.GenerateMarkdown(report!);
        string fileName = $"end_to_end_compare_{query.LeftRunId}_to_{query.RightRunId}.md";
        return Ok(ComparisonResponseMapper.ToEndToEndExportResponse(fileName, markdown));
    }

    [HttpGet("review/compare/end-to-end/export/file")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DownloadRunsEndToEndComparisonMarkdown(
        [FromQuery] RunPairQuery query,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, EndToEndReplayComparisonReport? report) =
            await BuildEndToEndReportAsync(query, cancellationToken);
        if (error is not null)
            return error;
        string markdown = _endToEndReplayComparisonExportService.GenerateMarkdown(report!);
        string fileName = $"end_to_end_compare_{query.LeftRunId}_to_{query.RightRunId}.md";
        await LogComparisonExportDownloadAsync(query, "comparison-markdown", fileName, cancellationToken);
        return ApiFileResults.RangeText(Request, markdown, "text/markdown", fileName);
    }

    [HttpGet("review/compare/end-to-end/export/docx")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExportRunsEndToEndComparisonDocx(
        [FromQuery] RunPairQuery query,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, EndToEndReplayComparisonReport? report) =
            await BuildEndToEndReportAsync(query, cancellationToken);
        if (error is not null)
            return error;
        byte[] bytes = await _endToEndReplayComparisonExportService.GenerateDocxAsync(report!, cancellationToken);
        string fileName = $"end_to_end_compare_{query.LeftRunId}_to_{query.RightRunId}.docx";
        await LogComparisonExportDownloadAsync(query, "comparison-docx", fileName, cancellationToken);
        return ApiFileResults.RangeBytes(
            Request,
            bytes,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileName);
    }

    /// <summary>
    ///     Validates the query and builds the end-to-end comparison report.
    ///     Returns a non-null error result when validation fails.
    /// </summary>
    private async Task<(IActionResult? Error, EndToEndReplayComparisonReport? Report)> BuildEndToEndReportAsync(
        RunPairQuery query,
        CancellationToken cancellationToken)
    {
        IActionResult? error = await ValidateRunPairQueryAsync(query, cancellationToken);

        if (error is not null)
            return (error, null);

        try
        {
            EndToEndReplayComparisonReport report =
                await _endToEndReplayComparisonService.BuildAsync(query.LeftRunId, query.RightRunId, cancellationToken);

            return (null, report);
        }
        catch (ConflictException ex)
        {
            return (this.ConflictProblem(ex.Message, ProblemTypes.Conflict), null);
        }
    }

    private async Task LogComparisonExportDownloadAsync(
        RunPairQuery query,
        string exportType,
        string fileName,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParseExact(query.LeftRunId, "N", out Guid runGuidN)
            ? runGuidN
            : Guid.TryParse(query.LeftRunId, out Guid runGuid) ? runGuid : null;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ExportDownloadSucceeded,
                RunId = auditRunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        exportType,
                        fileName,
                        leftRunId = query.LeftRunId,
                        rightRunId = query.RightRunId
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);
    }
}
