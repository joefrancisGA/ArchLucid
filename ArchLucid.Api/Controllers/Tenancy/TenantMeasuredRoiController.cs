using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Measured ROI bundle for the operator <c>/why-archlucid</c> panel (process signals + cost context).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/measured-roi")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantMeasuredRoiController(
    ITenantMeasuredRoiService measuredRoiService,
    IScopeContextProvider scopeProvider,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly ITenantMeasuredRoiService _measuredRoiService =
        measuredRoiService ?? throw new ArgumentNullException(nameof(measuredRoiService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <summary>Returns cumulative process counters and optional monthly cost band for the caller's tenant.</summary>
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantMeasuredRoiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        TenantMeasuredRoiSummary summary =
            await _measuredRoiService.GetAsync(scope.TenantId, cancellationToken);

        return Ok(TenantMeasuredRoiResponse.FromDomain(summary));
    }
}
