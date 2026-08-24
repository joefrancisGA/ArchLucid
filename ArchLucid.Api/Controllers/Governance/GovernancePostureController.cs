using ArchLucid.Api.Attributes;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Contracts.Governance.Posture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Read-only architecture posture summary for the active tenant/workspace/project scope (TB-2377).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class GovernancePostureController(
    IArchitecturePostureService postureService,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    [HttpGet("posture")]
    [ProducesResponseType(typeof(ArchitecturePostureSummary), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPosture(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid resolvedProjectId = projectId ?? scope.ProjectId;

        ArchitecturePostureSummary summary = await postureService.GetSummaryAsync(
            scope.TenantId,
            scope.WorkspaceId,
            resolvedProjectId,
            cancellationToken: cancellationToken);

        return Ok(summary);
    }
}
