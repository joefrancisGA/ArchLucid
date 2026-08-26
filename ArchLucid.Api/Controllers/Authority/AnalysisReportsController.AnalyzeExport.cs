using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Jobs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AnalysisReportsController
{
    /// <summary>
    ///     Builds a structured <see cref="ArchLucid.Application.Analysis.ArchitectureAnalysisReport" /> for
    ///     <paramref name="runId" /> using optional section flags in the body.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report")]
    [HttpPost("review/{runId}/analysis-report")]
    [ProducesResponseType(typeof(ArchitectureAnalysisReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnalyzeRun(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        RunDetailLookup runDetail = await LoadRunDetailOrNotFoundAsync(runId, cancellationToken);

        if (runDetail.Error is not null)
            return runDetail.Error;
        request.PreloadedRunDetail = runDetail.Detail;

        try
        {
            ArchitectureAnalysisReport
                report = await architectureAnalysisService.BuildAsync(request, cancellationToken);

            Guid? auditRunId = Guid.TryParse(runId, out Guid parsedRunId) ? parsedRunId : null;

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArchitectureAnalysisReportGenerated,
                    RunId = auditRunId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            runId,
                            manifestVersion = report.Manifest?.Metadata.ManifestVersion,
                            warningCount = report.Warnings.Count,
                            request.IncludeEvidence,
                            request.IncludeExecutionTraces,
                            request.IncludeManifest,
                            request.IncludeDiagram,
                            request.IncludeSummary,
                            request.IncludeDeterminismCheck
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            return Ok(new ArchitectureAnalysisReportResponse { Report = report });
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Analysis failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.BadRequest);
        }
    }

    /// <summary>
    ///     Returns the same analysis content as <c>analysis-report</c> serialized to markdown in JSON (
    ///     <see cref="ArchitectureAnalysisExportResponse" />).
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report/export")]
    [HttpPost("review/{runId}/analysis-report/export")]
    [ProducesResponseType(typeof(ArchitectureAnalysisExportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportAnalysisReport(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        RunDetailLookup runDetail = await LoadRunDetailOrNotFoundAsync(runId, cancellationToken);

        if (runDetail.Error is not null)
            return runDetail.Error;
        request.PreloadedRunDetail = runDetail.Detail;

        try
        {
            ArchitectureAnalysisReport
                report = await architectureAnalysisService.BuildAsync(request, cancellationToken);
            string markdown = architectureAnalysisExportService.GenerateMarkdown(report);
            return Ok(new ArchitectureAnalysisExportResponse
            {
                RunId = runId, Format = "markdown", FileName = $"analysis_{runId}.md", Content = markdown
            });
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Analysis export failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.ExportFailed);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report/export/file")]
    [HttpPost("review/{runId}/analysis-report/export/file")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAnalysisReportExport(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        RunDetailLookup runDetail = await LoadRunDetailOrNotFoundAsync(runId, cancellationToken);

        if (runDetail.Error is not null)
            return runDetail.Error;
        request.PreloadedRunDetail = runDetail.Detail;

        try
        {
            ArchitectureAnalysisReport
                report = await architectureAnalysisService.BuildAsync(request, cancellationToken);
            string markdown = architectureAnalysisExportService.GenerateMarkdown(report);
            return ApiFileResults.RangeText(Request, markdown, "text/markdown", $"analysis-report-{runId}.md");
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Analysis export file failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.ExportFailed);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report/export/docx")]
    [HttpPost("review/{runId}/analysis-report/export/docx")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAnalysisReportDocx(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        RunDetailLookup runDetail = await LoadRunDetailOrNotFoundAsync(runId, cancellationToken);

        if (runDetail.Error is not null)
            return runDetail.Error;
        request.PreloadedRunDetail = runDetail.Detail;

        try
        {
            byte[] bytes = await docxExportService.GenerateDocxAsync(
                await architectureAnalysisService.BuildAsync(request, cancellationToken),
                cancellationToken);
            return ApiFileResults.RangeBytes(
                Request,
                bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"analysis-report-{runId}.docx");
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "DOCX export failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.ExportFailed);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report/export/docx/async")]
    [HttpPost("review/{runId}/analysis-report/export/docx/async")]
    [AsyncRequired]
    [ProducesResponseType(typeof(AsyncJobResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAnalysisReportDocxAsync(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        RunDetailLookup runDetail = await LoadRunDetailOrNotFoundAsync(runId, cancellationToken);

        if (runDetail.Error is not null)
            return runDetail.Error;
        request.PreloadedRunDetail = runDetail.Detail;

        AnalysisReportDocxWorkUnit workUnit = new(
            AnalysisReportDocxJobPayload.FromAnalysisRequest(request),
            $"analysis-report-{runId}.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        string jobId = await jobs.EnqueueAsync(workUnit, cancellationToken: cancellationToken);

        return Accepted(new AsyncJobResponse { JobId = jobId });
    }
}
