using ArchLucid.Api.Models.Analytics;
using ArchLucid.Core.Analytics;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Analytics;

/// <summary>Internal cross-tenant product metrics (never tenant-scoped; operator RBAC only).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.RequireOperatorRole)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/internal/analytics")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class InternalCrossTenantAnalyticsController(IInternalCrossTenantAnalyticsService analyticsService)
    : ControllerBase
{
    private readonly IInternalCrossTenantAnalyticsService _analyticsService =
        analyticsService ?? throw new ArgumentNullException(nameof(analyticsService));

    /// <summary>Returns anonymized aggregates (usage volume, completion durations, telemetry-derived hours saved).</summary>
    [HttpGet("cross-tenant")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(InternalCrossTenantAnalyticsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<InternalCrossTenantAnalyticsResponse>> GetCrossTenantAsync(
        CancellationToken cancellationToken = default)
    {
        InternalCrossTenantAnalyticsSummary summary = await _analyticsService.GetSummaryAsync(cancellationToken);

        InternalCrossTenantAnalyticsResponse body = new()
        {
            CatalogsAggregated = summary.CatalogsAggregated,
            TotalRunsNonArchived = summary.TotalRunsNonArchived,
            TotalCompletedRuns = summary.TotalCompletedRuns,
            AverageCompletedRunDurationSeconds = summary.AverageCompletedRunDurationSeconds,
            TotalEstimatedEngineeringHoursSaved = summary.TotalEstimatedEngineeringHoursSaved,
        };

        return Ok(body);
    }
}
