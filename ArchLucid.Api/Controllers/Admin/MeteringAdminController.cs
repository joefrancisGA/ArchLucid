using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Usage metering read APIs (admin-only).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/metering")]
public sealed class MeteringAdminController(
    IUsageMeteringService metering,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IUsageMeteringService _metering = metering ?? throw new ArgumentNullException(nameof(metering));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <summary>
    ///     Aggregated usage for a tenant between <paramref name="periodStart" /> (inclusive) and
    ///     <paramref name="periodEnd" /> (exclusive).
    /// </summary>
    [HttpGet("tenants/{tenantId:guid}/summary")]
    [ProducesResponseType(typeof(IReadOnlyList<TenantUsageSummary>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTenantSummaryAsync(
        Guid tenantId,
        [FromQuery] DateTimeOffset periodStart,
        [FromQuery] DateTimeOffset periodEnd,
        CancellationToken cancellationToken = default)
    {
        if (periodEnd <= periodStart)
            return this.BadRequestProblem(
                "periodEnd must be greater than periodStart.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<TenantUsageSummary> rows =
            await _metering.GetSummaryAsync(scope.TenantId, periodStart, periodEnd, cancellationToken);

        return Ok(rows);
    }
}
