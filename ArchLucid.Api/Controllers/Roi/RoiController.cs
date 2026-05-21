using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Authorization;

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
public sealed class RoiController(IExecutiveRoiSummaryService executiveRoiSummaryService) : ControllerBase
{
    private readonly IExecutiveRoiSummaryService _executiveRoiSummaryService =
        executiveRoiSummaryService ?? throw new ArgumentNullException(nameof(executiveRoiSummaryService));

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
}
