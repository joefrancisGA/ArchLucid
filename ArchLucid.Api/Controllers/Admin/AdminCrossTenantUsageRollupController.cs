using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Fleet-wide usage rollup — platform operator only (TB-282). Tenant admins and tenant operators must not reach
///     cross-tenant aggregates.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformCrossTenantReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/analytics")]
public sealed class AdminCrossTenantUsageRollupController(IAdminDiagnosticsService diagnostics) : ControllerBase
{
    private readonly IAdminDiagnosticsService _diagnostics =
        diagnostics ?? throw new ArgumentNullException(nameof(diagnostics));

    /// <summary>Aggregate-only counters across tenants (internal ops / ROI narratives).</summary>
    [HttpGet("cross-tenant-summary")]
    [ProducesResponseType(typeof(CrossTenantUsageRollup), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCrossTenantUsageSummary(CancellationToken cancellationToken = default)
    {
        CrossTenantUsageRollup rollup =
            await _diagnostics.GetCrossTenantUsageRollupAsync(cancellationToken);

        return Ok(rollup);
    }
}
