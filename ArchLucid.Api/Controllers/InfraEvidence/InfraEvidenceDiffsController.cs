using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/diffs")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfraEvidenceDiffsController(
    IInfraEvidenceDriftWorkbenchQueryService driftWorkbenchQueryService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet("{diffId:guid}/changes")]
    [ProducesResponseType(typeof(PagedResponse<AzureInventoryChangeRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListChangesForDiff(
        Guid diffId,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        PagedResponse<AzureInventoryChangeRecord>? response = await driftWorkbenchQueryService.ListChangesForDiffAsync(
            scope,
            diffId,
            page,
            pageSize,
            cancellationToken);

        if (response is null)
        {
            return this.NotFoundProblem(
                $"Diff '{diffId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(response);
    }
}
