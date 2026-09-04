using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Lists version metadata for a pack (newest first).</summary>
    [HttpGet("{policyPackId:guid}/versions")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackVersion>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListVersions(Guid policyPackId, CancellationToken ct = default)
    {
        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>> result =
            await _httpFacade.ListVersionsAsync(policyPackId, ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack '{policyPackId}' was not found in the current scope.");
        }

        return Ok(result.Value!);
    }

    /// <summary>Reads one version including full <c>ContentJson</c>.</summary>
    [HttpGet("{policyPackId:guid}/versions/{packVersion}")]
    [ProducesResponseType(typeof(PolicyPackVersion), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVersion(
        Guid policyPackId,
        string packVersion,
        CancellationToken ct = default)
    {
        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        IActionResult? versionProblem =
            PolicyPacksHttpMapper.ValidatePackVersion(packVersion).ToBadRequestProblemOrNull(this);

        if (versionProblem is not null)
            return versionProblem;

        PolicyPackVersionHttpResult result = await _httpFacade.GetVersionAsync(policyPackId, packVersion, ct)
            .ConfigureAwait(false);

        return this.MapVersionLookup(result);
    }
}
