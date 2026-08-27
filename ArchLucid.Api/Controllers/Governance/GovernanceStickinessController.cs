using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Core.Authorization;
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
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IGovernanceStickinessFacade _facade =
        facade ?? throw new ArgumentNullException(nameof(facade));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private const int RegisterMaxRowsLimit = 500;

    private IActionResult? ValidateRegisterMaxRows(int maxRows)
    {
        if (maxRows <= 0)
            return this.BadRequestProblem("maxRows must be greater than 0.", ProblemTypes.ValidationFailed);

        if (maxRows > RegisterMaxRowsLimit)
            return this.BadRequestProblem("maxRows must be at most 500.", ProblemTypes.ValidationFailed);

        return null;
    }

    private IActionResult? ValidateDecisionRegisterFilters(
        DateTimeOffset? recordedAfterUtc,
        DateTimeOffset? recordedBeforeUtc,
        double? minConfidence,
        double? maxConfidence)
    {
        if (recordedAfterUtc is not null
            && recordedBeforeUtc is not null
            && recordedAfterUtc.Value > recordedBeforeUtc.Value)
        {
            return this.BadRequestProblem(
                "recordedAfterUtc must be on or before recordedBeforeUtc.",
                ProblemTypes.ValidationFailed);
        }

        if (minConfidence is not null
            && maxConfidence is not null
            && minConfidence.Value > maxConfidence.Value)
        {
            return this.BadRequestProblem(
                "minConfidence must be less than or equal to maxConfidence.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private async Task<IActionResult?> RequireTenantOrNotFoundAsync(CancellationToken cancellationToken) =>
        await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeContextProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);
}
