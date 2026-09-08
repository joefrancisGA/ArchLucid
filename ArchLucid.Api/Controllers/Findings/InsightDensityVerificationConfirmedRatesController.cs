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
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Findings;

/// <summary>Tenant-scoped verification confirmed-rate diagnostics (DX-56).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenants/current/insight-density")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InsightDensityVerificationConfirmedRatesController(
    IAppendOnlyFindingVerificationReportRepository verificationReportRepository,
    IScopeContextProvider scopeProvider,
    IOptionsMonitor<InsightDensityGateOptions> gateOptions) : ControllerBase
{
    private const int DefaultLookbackDays = 90;

    private const int MaxLookbackDays = 366;

    private readonly IAppendOnlyFindingVerificationReportRepository _verificationReportRepository =
        verificationReportRepository ?? throw new ArgumentNullException(nameof(verificationReportRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IOptionsMonitor<InsightDensityGateOptions> _gateOptions =
        gateOptions ?? throw new ArgumentNullException(nameof(gateOptions));

    [HttpGet("verification-confirmed-rates")]
    [ProducesResponseType(typeof(EngineVerificationConfirmedRatesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetVerificationConfirmedRatesAsync(
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

        InsightDensityGateOptions options = _gateOptions.CurrentValue;
        int minSample = options.VerificationPriorMinSample > 0 ? options.VerificationPriorMinSample : 20;

        IReadOnlyList<EngineVerificationConfirmedRateRow> rows =
            await _verificationReportRepository.ListConfirmedRatesByEngineTypeAsync(
                scope,
                fromUtc,
                toUtcExclusive,
                minSample,
                cancellationToken);

        return Ok(new EngineVerificationConfirmedRatesResponse
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
