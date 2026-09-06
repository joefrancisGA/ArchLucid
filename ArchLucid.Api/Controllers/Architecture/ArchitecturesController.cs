using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Architecture;

/// <summary>Customer-visible architecture identities (ADR 0074).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architectures")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ArchitecturesController(
    IScopeContextProvider scopeProvider,
    IArchitectureIdentityService architectureIdentityService) : ControllerBase
{
    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Lists architecture identities in the current tenant/workspace/project scope.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ArchitectureIdentityListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListArchitectures(
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        PagedResponse<ArchitectureIdentityListItem> response = await _architectureIdentityService.ListIdentitiesAsync(
            scope,
            page,
            pageSize,
            cancellationToken);

        return Ok(response);
    }

    /// <summary>Gets one architecture identity with child draft and review summaries.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}")]
    [ProducesResponseType(typeof(ArchitectureIdentityDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArchitecture(Guid architectureId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ArchitectureIdentityDetail? detail = await _architectureIdentityService.GetIdentityAsync(
            scope,
            architectureId,
            cancellationToken);

        if (detail is null)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(detail);
    }
}
