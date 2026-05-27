using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Tenancy.Diagnostics;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Founder-facing trial funnel + estimated COGS summary (Batch B item 20).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/operational")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminTrialFunnelOperationalController(ITrialFunnelOperationalMetricsReader metricsReader) : ControllerBase
{
    private readonly ITrialFunnelOperationalMetricsReader _metricsReader =
        metricsReader ?? throw new ArgumentNullException(nameof(metricsReader));

    [HttpGet("trial-funnel-summary")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(TrialFunnelOperationalSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TrialFunnelOperationalSummaryResponse>> GetTrialFunnelSummary(
        CancellationToken cancellationToken)
    {
        TrialFunnelOperationalSummaryResponse summary =
            await _metricsReader.GetOperationalSummaryAsync(cancellationToken);

        return Ok(summary);
    }
}
