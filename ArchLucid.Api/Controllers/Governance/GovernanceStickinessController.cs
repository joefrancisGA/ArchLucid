using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>TB-057–061 stickiness workflow APIs: risk register, dispositions, waivers, decision register.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class GovernanceStickinessController(
    IGovernanceStickinessFacade facade,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    IArchitectureReviewRecurrenceNextRunCalculator recurrenceNextRunCalculator) : ControllerBase
{
    private readonly IGovernanceStickinessFacade _facade =
        facade ?? throw new ArgumentNullException(nameof(facade));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IArchitectureReviewRecurrenceNextRunCalculator _recurrenceNextRunCalculator =
        recurrenceNextRunCalculator ?? throw new ArgumentNullException(nameof(recurrenceNextRunCalculator));

    private async Task<IActionResult?> RequireTenantAndWorkspaceOrNotFoundAsync(CancellationToken cancellationToken)
    {
        (IActionResult? problem, _) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeContextProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        return problem;
    }
}
