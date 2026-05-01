using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Authorization;

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
public sealed class TenantPilotValueReportController(IPilotValueReportService pilotValueReportService) : ControllerBase
{
    private readonly IPilotValueReportService _pilotValueReportService =
        pilotValueReportService ?? throw new ArgumentNullException(nameof(pilotValueReportService));

    /// <summary>
    ///     Pilot value report: committed-run aggregates, findings, audit-backed governance/recommendation tallies, and a markdown option.
    ///     Query window: <paramref name="fromUtc" /> inclusive; <paramref name="toUtc" /> exclusive (matches audit export semantics). When
    ///     <paramref name="fromUtc" /> is omitted, defaults to tenant creation (UTC). When <paramref name="toUtc" /> is omitted, defaults to now (UTC).
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
        PilotValueReport? report = await _pilotValueReportService.BuildAsync(fromUtc, toUtc, cancellationToken);

        if (report is null)
        {
            return this.NotFoundProblem(
                "Tenant was not found for the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        string accept = Request.Headers.Accept.ToString();

        if (accept.Contains("text/markdown", StringComparison.OrdinalIgnoreCase))
            return Content(PilotValueReportMarkdown.Format(report), "text/markdown; charset=utf-8");

        return Ok(report);
    }
}
