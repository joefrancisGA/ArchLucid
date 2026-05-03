using ArchLucid.Application.ExecutiveSummary;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     HTTP API for retrieving high-level executive summaries of architectural health.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/authority/executive-summary")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ExecutiveSummaryController(IExecutiveSummaryService executiveSummaryService) : ControllerBase
{
    /// <summary>
    ///     Aggregates raw architectural findings into three high-level scores: Security Posture, Tech Debt Risk, and Compliance Alignment.
    /// </summary>
    [HttpGet("{tenantId:guid}")]
    [ProducesResponseType(typeof(ExecutiveSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExecutiveSummary(
        [FromRoute] Guid tenantId,
        CancellationToken cancellationToken)
    {
        ExecutiveSummaryResponse response = await executiveSummaryService.GenerateSummaryAsync(tenantId, cancellationToken);
        return Ok(response);
    }
}
