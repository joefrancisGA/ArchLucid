using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>One-click pilot / sponsor value metrics for the authenticated tenant scope.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant")]
[EnableRateLimiting("fixed")]
public sealed class TenantPilotValueReportController(
    IPilotValueReportService pilotValueReportService,
    IPilotValueReportMarkdownFormatter pilotValueReportMarkdownFormatter,
    IScopeContextProvider scopeContextProvider,
    IAuditRepository auditRepository) : ControllerBase
{
    private const int MaxRollingDays = 90;

    private readonly IPilotValueReportService _pilotValueReportService =
        pilotValueReportService ?? throw new ArgumentNullException(nameof(pilotValueReportService));

    private readonly IPilotValueReportMarkdownFormatter _pilotValueReportMarkdownFormatter =
        pilotValueReportMarkdownFormatter ?? throw new ArgumentNullException(nameof(pilotValueReportMarkdownFormatter));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditRepository _auditRepository =
        auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    /// <summary>
    ///     Pilot value report: committed-run aggregates, findings, audit-backed governance/recommendation tallies, and a
    ///     markdown option.
    ///     Query window: <paramref name="fromUtc" /> inclusive; <paramref name="toUtc" /> exclusive (matches audit export
    ///     semantics). When
    ///     <paramref name="fromUtc" /> is omitted, defaults to tenant creation (UTC). When <paramref name="toUtc" /> is
    ///     omitted, defaults to now (UTC).
    /// </summary>
    [HttpGet("pilot-value-report")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(PilotValueReport), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPilotValueReport(
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        CancellationToken cancellationToken)
    {
        if (fromUtc is { Year: < 1970 } || toUtc is { Year: < 1970 })
        {
            return this.BadRequestProblem(
                "fromUtc and toUtc must be on or after 1970-01-01 when specified.",
                ProblemTypes.ValidationFailed);
        }

        PilotValueReport? report = await _pilotValueReportService.BuildAsync(fromUtc, toUtc, cancellationToken);

        if (report is null)
        {
            return this.NotFoundProblem(
                "Tenant was not found for the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        string accept = Request.Headers.Accept.ToString();

        if (accept.Contains("text/markdown", StringComparison.OrdinalIgnoreCase))
            return Content(_pilotValueReportMarkdownFormatter.Format(report), "text/markdown; charset=utf-8");

        return Ok(report);
    }

    /// <summary>
    ///     ROI summary page bundle: pilot-to-date + rolling pilot reports and exact GovernancePreCommitBlocked counts.
    /// </summary>
    [HttpGet("roi-summary-page-bundle")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantRoiSummaryPageBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoiSummaryPageBundle(
        [FromQuery] int rollingDays = 30,
        CancellationToken cancellationToken = default)
    {
        if (rollingDays is < 1 or > MaxRollingDays)
        {
            return this.BadRequestProblem(
                $"rollingDays must be between 1 and {MaxRollingDays}.",
                ProblemTypes.ValidationFailed);
        }

        DateTime rollingToUtc = TimeProvider.System.UtcNowDateTime();
        DateTime rollingFromUtc = rollingToUtc.AddDays(-rollingDays);

        PilotValueReport? pilotToDate =
            await _pilotValueReportService.BuildAsync(null, rollingToUtc, cancellationToken).ConfigureAwait(false);

        if (pilotToDate is null)
        {
            return this.NotFoundProblem(
                "Tenant was not found for the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        Task<PilotValueReport?> rollingReportTask =
            _pilotValueReportService.BuildAsync(rollingFromUtc, rollingToUtc, cancellationToken);

        Task<int> rollingBlocksTask =
            CountPreCommitBlocksAsync(rollingFromUtc, rollingToUtc, cancellationToken);

        Task<int> pilotBlocksTask =
            CountPreCommitBlocksAsync(pilotToDate.FromUtc, pilotToDate.ToUtc, cancellationToken);

        await Task.WhenAll(rollingReportTask, rollingBlocksTask, pilotBlocksTask).ConfigureAwait(false);

        PilotValueReport? rollingReport = await rollingReportTask.ConfigureAwait(false);

        if (rollingReport is null)
        {
            return this.NotFoundProblem(
                "Tenant was not found for the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        TenantRoiSummaryPageBundleResponse body = new()
        {
            PilotToDate = pilotToDate,
            RollingWindow = rollingReport,
            PilotToDatePreCommitBlocks = new AuditEventCountResponse
            {
                Count = await pilotBlocksTask.ConfigureAwait(false),
                Exact = true,
            },
            RollingWindowPreCommitBlocks = new AuditEventCountResponse
            {
                Count = await rollingBlocksTask.ConfigureAwait(false),
                Exact = true,
            },
        };

        return Ok(body);
    }

    private async Task<int> CountPreCommitBlocksAsync(
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        AuditEventFilter filter = new()
        {
            FromUtc = fromUtc,
            ToUtc = toUtc,
            EventType = AuditEventTypes.GovernancePreCommitBlocked,
        };

        return await _auditRepository
            .CountFilteredAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, filter, cancellationToken)
            .ConfigureAwait(false);
    }
}
