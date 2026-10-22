using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Paid-tenant usage headroom for Team→Professional expansion nudges (Improvement #5).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant")]
public sealed class TenantUsageStatusController(
    ITenantUsageStatusService tenantUsageStatusService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantUsageStatusService _tenantUsageStatusService =
        tenantUsageStatusService ?? throw new ArgumentNullException(nameof(tenantUsageStatusService));

    /// <summary>Returns seat and workspace usage vs packaging caps for paid tenants.</summary>
    [HttpGet("usage-status")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantUsageStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsageStatusAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantUsageStatusSnapshot? snapshot =
            await _tenantUsageStatusService.BuildAsync(scope.TenantId, cancellationToken);

        if (snapshot is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        return Ok(
            new TenantUsageStatusResponse
            {
                IsTrial = snapshot.IsTrial,
                CommercialTier = snapshot.CommercialTier,
                SeatsUsed = snapshot.SeatsUsed,
                SeatsLimit = snapshot.SeatsLimit,
                WorkspacesUsed = snapshot.WorkspacesUsed,
                WorkspacesLimit = snapshot.WorkspacesLimit
            });
    }
}
