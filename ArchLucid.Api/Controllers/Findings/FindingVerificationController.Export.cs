using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Findings;

public sealed partial class FindingVerificationController
{
    /// <summary>Lists append-only verification reports for a sealed run package.</summary>
    [HttpGet("{runId:guid}/finding-verification")]
    [ProducesResponseType(typeof(IReadOnlyList<FindingVerificationReportSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListFindingVerificationReportsAsync(
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<FindingVerificationReportSummaryResponse> reports =
            await _findingVerificationReportQueryService.ListReportsByRunAsync(scope, runId, cancellationToken);

        return Ok(reports);
    }

    /// <summary>Gets one append-only verification report by id.</summary>
    [HttpGet("{runId:guid}/finding-verification/{reportId:guid}")]
    [ProducesResponseType(typeof(FindingVerificationReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingVerificationReportAsync(
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        FindingVerificationReportResponse? report =
            await _findingVerificationReportQueryService.GetReportAsync(scope, runId, reportId, cancellationToken);

        if (report is null)
        {
            return this.NotFoundProblem(
                $"Finding verification report '{reportId:D}' was not found for run '{runId:D}'.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(report);
    }

    /// <summary>Exports a verification report as Markdown.</summary>
    [HttpGet("{runId:guid}/finding-verification/{reportId:guid}/export/markdown")]
    [Produces("text/markdown")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportFindingVerificationMarkdownAsync(
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            byte[] bytes = await _findingVerificationReportExportApplicationService.ExportMarkdownAsync(
                scope,
                runId,
                reportId,
                cancellationToken);

            string fileName = $"finding-verification-{reportId:D}.md";

            return File(bytes, "text/markdown", fileName);
        }
        catch (FindingVerificationReportNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }

    /// <summary>Exports a verification report as DOCX.</summary>
    [HttpGet("{runId:guid}/finding-verification/{reportId:guid}/export/docx")]
    [Produces("application/vnd.openxmlformats-officedocument.wordprocessingml.document")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportFindingVerificationDocxAsync(
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            byte[] bytes = await _findingVerificationReportExportApplicationService.ExportDocxAsync(
                scope,
                runId,
                reportId,
                cancellationToken);

            string fileName = $"finding-verification-{reportId:D}.docx";

            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                fileName);
        }
        catch (FindingVerificationReportNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }
}
