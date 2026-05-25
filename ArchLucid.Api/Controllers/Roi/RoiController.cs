using System.Diagnostics;
using System.Text;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Auth.Services;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Roi;

/// <summary>Cross-run executive ROI rollups for sponsor dashboards.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/roi")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class RoiController(
    IExecutiveRoiSummaryService executiveRoiSummaryService,
    IExecutiveRoiBoardPackExporter boardPackExporter,
    IAuditService auditService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly IExecutiveRoiSummaryService _executiveRoiSummaryService =
        executiveRoiSummaryService ?? throw new ArgumentNullException(nameof(executiveRoiSummaryService));

    private readonly IExecutiveRoiBoardPackExporter _boardPackExporter =
        boardPackExporter ?? throw new ArgumentNullException(nameof(boardPackExporter));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>
    ///     Aggregates the latest committed run per system, sums estimated USD savings, and returns the top recurring
    ///     finding themes.
    /// </summary>
    [HttpGet("executive-summary")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ExecutiveRoiSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExecutiveRoiSummaryResponse>> GetExecutiveSummaryAsync(CancellationToken cancellationToken)
    {
        ExecutiveRoiSummaryResponse body = await _executiveRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);
        return Ok(body);
    }

    /// <summary>One-page Markdown or PDF board pack derived from the executive ROI summary (no LLM).</summary>
    [HttpGet("executive-summary/board-pack")]
    [Produces("text/markdown", "application/pdf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetExecutiveSummaryBoardPackAsync(
        [FromQuery] string? format,
        CancellationToken cancellationToken)
    {
        if (!TryParseBoardPackFormat(format, out ExecutiveRoiBoardPackFormat parsedFormat))
            return this.BadRequestProblem("format must be md or pdf.", ProblemTypes.ValidationFailed);

        string? traceId = Activity.Current?.TraceId.ToString();

        ExecutiveRoiBoardPackExportResult export = await _boardPackExporter
            .ExportAsync(parsedFormat, traceId, cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        await _auditService.LogAsync(
            scope.CreateAuditEvent(
                AuditEventTypes.ExecutiveRoiBoardPackExported,
                User?.Identity?.Name ?? "operator",
                "roi-board-pack",
                $"format={parsedFormat.ToString().ToLowerInvariant()}"),
            cancellationToken).ConfigureAwait(false);

        if (parsedFormat == ExecutiveRoiBoardPackFormat.Pdf && export.FileBytes is not null)
            return File(export.FileBytes, export.ContentType, export.FileName);

        return Content(export.Markdown ?? string.Empty, export.ContentType, Encoding.UTF8);
    }

    /// <summary>
    ///     Aggregates metrics across all tenants the calling user has access to. Enforces k-anonymity (k >= 5).
    /// </summary>
    [HttpGet("cross-tenant-portfolio")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(CrossTenantPortfolioSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CrossTenantPortfolioSummaryResponse>> GetCrossTenantPortfolioSummaryAsync(CancellationToken cancellationToken)
    {
        string? directoryKey = RoleSyncService.TryDirectoryObjectKey(User);
        if (string.IsNullOrWhiteSpace(directoryKey))
        {
            return Forbid();
        }

        CrossTenantPortfolioSummaryResponse body = await _executiveRoiSummaryService.GetCrossTenantPortfolioSummaryAsync(directoryKey, cancellationToken).ConfigureAwait(false);
        return Ok(body);
    }

    /// <summary>Six-month executive ROI trend (savings and critical findings).</summary>
    [HttpGet("executive-summary/history")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ExecutiveRoiHistoryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExecutiveRoiHistoryResponse>> GetExecutiveSummaryHistoryAsync(CancellationToken cancellationToken)
    {
        ExecutiveRoiHistoryResponse body = await _executiveRoiSummaryService.BuildHistoryAsync(cancellationToken).ConfigureAwait(false);
        return Ok(body);
    }

    /// <summary>Deduplicated finding export rows and environment savings slices.</summary>
    [HttpGet("executive-summary/export")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ExecutiveRoiExportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExecutiveRoiExportResponse>> GetExecutiveSummaryExportAsync(CancellationToken cancellationToken)
    {
        ExecutiveRoiExportResponse body = await _executiveRoiSummaryService.BuildExportAsync(cancellationToken).ConfigureAwait(false);
        return Ok(body);
    }

    private static bool TryParseBoardPackFormat(string? format, out ExecutiveRoiBoardPackFormat parsedFormat)
    {
        parsedFormat = ExecutiveRoiBoardPackFormat.Markdown;

        if (string.IsNullOrWhiteSpace(format))
            return true;

        string normalized = format.Trim().ToLowerInvariant();

        if (normalized is "md" or "markdown")
            return true;

        if (normalized is "pdf")
        {
            parsedFormat = ExecutiveRoiBoardPackFormat.Pdf;

            return true;
        }

        return false;
    }
}
