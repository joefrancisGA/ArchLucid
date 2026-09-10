using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>Tenant-scoped insight-density novelty-rate diagnostics (DX-23).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenants/current/insight-density")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InsightDensityNoveltyRatesController(
    IFindingInsightSignalRepository insightSignalRepository,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private const int DefaultLookbackDays = 90;

    private const int MaxLookbackDays = 366;

    private readonly IFindingInsightSignalRepository _insightSignalRepository =
        insightSignalRepository ?? throw new ArgumentNullException(nameof(insightSignalRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Lists per-engine novelty mark rates for Decision-grade findings in the requested window.</summary>
    [HttpGet("novelty-rates")]
    [ProducesResponseType(typeof(EngineInsightNoveltyRatesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetNoveltyRatesAsync(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        DateTime toUtcExclusive = NormalizeUtc(to) ?? TimeProvider.System.UtcNowDateTime();
        DateTime fromUtc = NormalizeUtc(from)
            ?? toUtcExclusive.AddDays(-DefaultLookbackDays);

        if (toUtcExclusive <= fromUtc)
        {
            return this.BadRequestProblem(
                "Query window is invalid — 'to' must be after 'from'.",
                ProblemTypes.ValidationFailed);
        }

        if ((toUtcExclusive - fromUtc).TotalDays > MaxLookbackDays)
        {
            return this.BadRequestProblem(
                $"Query window exceeds the maximum of {MaxLookbackDays} days.",
                ProblemTypes.ValidationFailed);
        }

        IReadOnlyList<EngineInsightNoveltyRateRow> rows = await _insightSignalRepository.ListNoveltyRatesAsync(
            scope,
            fromUtc,
            toUtcExclusive,
            cancellationToken);

        return Ok(new EngineInsightNoveltyRatesResponse
        {
            FromUtc = fromUtc,
            ToUtcExclusive = toUtcExclusive,
            Rows = rows,
        });
    }

    private static DateTime? NormalizeUtc(DateTime? value)
    {
        if (value is null)
        {
            return null;
        }

        return value.Value.Kind switch
        {
            DateTimeKind.Utc => value.Value,
            DateTimeKind.Local => value.Value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc),
        };
    }
}
