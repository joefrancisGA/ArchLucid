using System.Diagnostics;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Http;
using ArchLucid.Application;
using ArchLucid.Application.Http;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
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

/// <summary>Cross-run sponsor ROI rollups for sponsor dashboards.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/roi")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class RoiController(
    ISponsorRoiSummaryService sponsorRoiSummaryService,
    ISponsorRoiBoardPackExporter boardPackExporter,
    IAuditService auditService,
    IScopeContextProvider scopeProvider,
    IComplianceDriftTrendService complianceDriftTrendService) : ControllerBase
{
    private readonly ISponsorRoiSummaryService _sponsorRoiSummaryService =
        sponsorRoiSummaryService ?? throw new ArgumentNullException(nameof(sponsorRoiSummaryService));

    private readonly ISponsorRoiBoardPackExporter _boardPackExporter =
        boardPackExporter ?? throw new ArgumentNullException(nameof(boardPackExporter));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IComplianceDriftTrendService _complianceDriftTrendService =
        complianceDriftTrendService ?? throw new ArgumentNullException(nameof(complianceDriftTrendService));

    /// <summary>Sponsor dashboard bundle: ROI summary and 30-day compliance drift trend (daily buckets).</summary>
    [HttpGet("sponsor-dashboard-bundle")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(SponsorDashboardBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSponsorDashboardBundleAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        DateTime toUtc = TimeProvider.System.UtcNowDateTime();
        DateTime fromUtc = toUtc.AddDays(-30);
        TimeSpan bucketSize = TimeSpan.FromMinutes(1440);

        Task<SponsorRoiSummaryResponse> sponsorTask =
            _sponsorRoiSummaryService.BuildAsync(cancellationToken);

        Task<IReadOnlyList<ComplianceDriftTrendPoint>> driftTask =
            _complianceDriftTrendService.GetTrendAsync(
                scope.TenantId,
                fromUtc,
                toUtc,
                bucketSize,
                cancellationToken);

        await Task.WhenAll(sponsorTask, driftTask).ConfigureAwait(false);

        SponsorDashboardBundleResponse body = new()
        {
            SponsorReport = await sponsorTask.ConfigureAwait(false),
            ComplianceDriftTrend = await driftTask.ConfigureAwait(false)
        };

        return Ok(body);
    }

    /// <summary>
    ///     Aggregates the latest committed run per system, sums estimated USD savings, and returns the top recurring
    ///     finding themes.
    /// </summary>
    [HttpGet("sponsor-report")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(SponsorRoiSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetSponsorReportAsync(CancellationToken cancellationToken)
    {
        SponsorRoiSummaryResponse body = await _sponsorRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            body,
            ContractJson.CamelCaseIgnoreNullCompact,
            "roi:sponsor-report");

        return this.OkWithConditionalEtag(body, etag);
    }

    /// <summary>One-page Markdown or PDF board pack derived from the sponsor ROI summary (no LLM).</summary>
    [HttpGet("sponsor-report/board-pack")]
    [Produces("text/markdown", "application/pdf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSponsorReportBoardPackAsync(
        [FromQuery] string? format,
        [FromQuery] bool generateNarrative = false,
        CancellationToken cancellationToken = default)
    {
        if (!TryParseBoardPackFormat(format, out SponsorRoiBoardPackFormat parsedFormat))
            return this.BadRequestProblem("format must be md or pdf.", ProblemTypes.ValidationFailed);

        string? traceId = Activity.Current?.TraceId.ToString();

        SponsorRoiBoardPackExportResult export;

        try
        {
            export = await _boardPackExporter
                .ExportAsync(parsedFormat, traceId, generateNarrative, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        await _auditService.LogAsync(
            scope.CreateAuditEvent(
                AuditEventTypes.SponsorRoiBoardPackExported,
                User?.Identity?.Name ?? "operator",
                "roi-board-pack",
                JsonSerializer.Serialize(new { format = parsedFormat.ToString().ToLowerInvariant() })),
            cancellationToken).ConfigureAwait(false);

        if (parsedFormat == SponsorRoiBoardPackFormat.Pdf && export.FileBytes is not null)
            return File(export.FileBytes, export.ContentType, export.FileName);

        return Content(export.Markdown ?? string.Empty, export.ContentType, Encoding.UTF8);
    }

    /// <summary>
    ///     Aggregates metrics across all tenants the calling user has access to. Enforces k-anonymity (k >= 5).
    /// </summary>
    [HttpGet("cross-tenant-portfolio")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(CrossTenantPortfolioSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CrossTenantPortfolioSummaryResponse>> GetCrossTenantPortfolioSummaryAsync(CancellationToken cancellationToken)
    {
        string? directoryKey = RoleSyncService.TryDirectoryObjectKey(User);
        if (string.IsNullOrWhiteSpace(directoryKey))
        {
            return Problem(
                title: "Portfolio directory key not configured",
                detail: "This tenant does not have a portfolio directory object key configured. Contact your ArchLucid administrator to enable cross-tenant portfolio access.",
                statusCode: StatusCodes.Status403Forbidden,
                type: "https://archlucid.net/errors/portfolio-key-not-configured");
        }

        CrossTenantPortfolioSummaryResponse body = await _sponsorRoiSummaryService.GetCrossTenantPortfolioSummaryAsync(directoryKey, cancellationToken).ConfigureAwait(false);
        return Ok(body);
    }

    /// <summary>Six-month sponsor ROI trend (savings and critical findings).</summary>
    [HttpGet("sponsor-report/history")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(SponsorRoiHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetSponsorReportHistoryAsync(CancellationToken cancellationToken)
    {
        SponsorRoiHistoryResponse body = await _sponsorRoiSummaryService.BuildHistoryAsync(cancellationToken).ConfigureAwait(false);
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            body,
            ContractJson.CamelCaseIgnoreNullCompact,
            "roi:sponsor-report:history");

        return this.OkWithConditionalEtag(body, etag);
    }

    /// <summary>Deduplicated finding export rows and environment savings slices.</summary>
    [HttpGet("sponsor-report/export")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(SponsorRoiExportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetSponsorReportExportAsync(CancellationToken cancellationToken)
    {
        SponsorRoiExportResponse body = await _sponsorRoiSummaryService.BuildExportAsync(cancellationToken).ConfigureAwait(false);
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            body,
            ContractJson.CamelCaseIgnoreNullCompact,
            "roi:sponsor-report:export");

        return this.OkWithConditionalEtag(body, etag);
    }

    private static bool TryParseBoardPackFormat(string? format, out SponsorRoiBoardPackFormat parsedFormat)
    {
        parsedFormat = SponsorRoiBoardPackFormat.Markdown;

        if (string.IsNullOrWhiteSpace(format))
            return true;

        string normalized = format.Trim().ToLowerInvariant();

        if (normalized is "md" or "markdown")
            return true;

        if (normalized is "pdf")
        {
            parsedFormat = SponsorRoiBoardPackFormat.Pdf;

            return true;
        }

        return false;
    }
}
