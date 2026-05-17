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

    /// <summary>Returns stored daily rollups keyed by <c>AnalyticsTenantKey</c> only.</summary>
    [HttpGet("cross-tenant/daily")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(InternalCrossTenantRollupDailyListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<InternalCrossTenantRollupDailyListResponse>> GetDailyRollupsAsync(
        [FromQuery] DateOnly? rollupDate = null,
        CancellationToken cancellationToken = default)
    {
        DateOnly date = rollupDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        IReadOnlyList<InternalCrossTenantRollupDailyRow> rows =
            await _analyticsService.GetDailyRollupsAsync(date, cancellationToken);

        InternalCrossTenantRollupDailyListResponse body = new()
        {
            RollupDate = date,
            Rows = rows.Select(MapDailyRow).ToList(),
        };

        return Ok(body);
    }

    /// <summary>On-demand rollup refresh for the given UTC calendar day (operator only).</summary>
    [HttpPost("cross-tenant/daily/refresh")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RefreshDailyRollupsAsync(
        [FromQuery] DateOnly? rollupDate = null,
        CancellationToken cancellationToken = default)
    {
        DateOnly date = rollupDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        await _analyticsService.RefreshDailyRollupsAsync(date, cancellationToken);

        return NoContent();
    }

    /// <summary>Exports daily rollups as CSV or JSON (surrogate keys only).</summary>
    [HttpGet("cross-tenant/daily/export")]
    [Produces("text/csv", "application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExportDailyRollupsAsync(
        [FromQuery] DateOnly? rollupDate = null,
        [FromQuery] string format = "csv",
        CancellationToken cancellationToken = default)
    {
        DateOnly date = rollupDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        IReadOnlyList<InternalCrossTenantRollupDailyRow> rows =
            await _analyticsService.GetDailyRollupsAsync(date, cancellationToken);

        if (string.Equals(format, "json", StringComparison.OrdinalIgnoreCase))
        {
            string json = _analyticsService.ExportDailyRollupsJson(rows);

            return Content(json, "application/json");
        }

        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            string csv = _analyticsService.ExportDailyRollupsCsv(rows);

            return Content(csv, "text/csv");
        }

        return BadRequest("format must be csv or json.");
    }

    private static InternalCrossTenantRollupDailyItemResponse MapDailyRow(InternalCrossTenantRollupDailyRow row) =>
        new()
        {
            RollupDate = row.RollupDate,
            AnalyticsTenantKey = row.AnalyticsTenantKey,
            TotalRunsNonArchived = row.TotalRunsNonArchived,
            TotalCompletedRuns = row.TotalCompletedRuns,
            AverageCompletedRunDurationSeconds = row.AverageCompletedRunDurationSeconds,
            EstimatedEngineeringHoursSaved = row.EstimatedEngineeringHoursSaved,
            LlmTokensUsed = row.LlmTokensUsed,
            ComputedUtc = row.ComputedUtc,
        };
}
