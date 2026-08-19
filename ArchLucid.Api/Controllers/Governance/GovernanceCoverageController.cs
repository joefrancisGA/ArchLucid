using ArchLucid.Api.Attributes;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Read-only coverage disclosure for the active tenant/workspace/project scope.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class GovernanceCoverageController(
    ICoverageQueryService coverageQueryService,
    IPolicyPackRepository policyPackRepository,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    [HttpGet("coverage")]
    [ProducesResponseType(typeof(CoverageSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetScopeCoverage(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        CoverageSummary summary = await coverageQueryService.GetByScopeAsync(scope, cancellationToken);

        Dictionary<Guid, PolicyPack> packById = summary.Assignments.Count == 0
            ? new Dictionary<Guid, PolicyPack>()
            : (await policyPackRepository.GetByIdsAsync(
                summary.Assignments.Select(static row => row.PolicyPackId).Distinct().ToList(),
                cancellationToken)).ToDictionary(static pack => pack.PolicyPackId);

        CoverageSummaryResponse response = CoverageAssignmentMapper.ToSummaryResponse(summary, packById);
        return Ok(response);
    }
}
