using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
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
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    [HttpGet("posture")]
    [ProducesResponseType(typeof(ArchitecturePostureSummary), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPosture(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken)
    {
        if (GovernanceQueryProjectScope.IsInvalidEmptyProjectQueryId(projectId))
            return this.BadRequestProblem("projectId must not be empty.", ProblemTypes.ValidationFailed);

        (IActionResult? scopeProblem, ScopeContext scope) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeContextProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        if (!GovernanceQueryProjectScope.TryResolve(projectId, scope, out Guid resolvedProjectId))
            return Ok(new ArchitecturePostureSummary());

        ArchitecturePostureSummary summary = await postureService.GetSummaryAsync(
            scope.TenantId,
            scope.WorkspaceId,
            resolvedProjectId,
            cancellationToken: cancellationToken);

        return Ok(summary);
    }
}
