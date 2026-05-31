using ArchLucid.Api.Attributes;
using ArchLucid.Application.Reports;
using ArchLucid.Core.Authorization;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Reports;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/reports/executive-summary")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ExecutiveSummaryController(IExecutiveReportsSummaryService executiveReportsSummaryService) : ControllerBase
{
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ExecutiveSummaryResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExecutiveSummaryResult>> GetExecutiveSummary(CancellationToken cancellationToken)
    {
        ExecutiveSummaryResult result = await executiveReportsSummaryService.BuildAsync(cancellationToken);

        return Ok(result);
    }
}
