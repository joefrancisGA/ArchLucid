using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Policy packs hub bundle: list, effective assignments, and merged content.</summary>
    [HttpGet("page-bundle")]
    [ProducesResponseType(typeof(PolicyPacksPageBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPageBundle(CancellationToken ct = default)
    {
        PolicyPackHttpResult<PolicyPacksPageBundleResponse> result = await _httpFacade.GetPageBundleAsync(ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        return Ok(result.Value!);
    }

    /// <summary>Lists workspace policy packs with assignment ids for tenant opt-in/opt-out.</summary>
    [HttpGet("workspace-selection")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackWorkspaceSelectionItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListWorkspaceSelection(CancellationToken ct = default)
    {
        PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>> result =
            await _httpFacade.ListWorkspaceSelectionAsync(ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        return Ok(result.Value!);
    }

    /// <summary>Lists platform-promoted policy pack snapshots available to clone into the current tenant.</summary>
    [HttpGet("catalog")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackCatalogListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListCatalog(CancellationToken ct = default)
    {
        PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>> result =
            await _httpFacade.ListCatalogAsync(ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        return Ok(result.Value!);
    }

    /// <summary>Reads one promoted catalog entry including snapshot JSON for cloning.</summary>
    [HttpGet("catalog/{policyPackCatalogEntryId:guid}")]
    [ProducesResponseType(typeof(PolicyPackCatalogEntryDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCatalogEntry(Guid policyPackCatalogEntryId, CancellationToken ct = default)
    {
        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackCatalogEntryId, "policyPackCatalogEntryId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<PolicyPackCatalogEntryDetail> result =
            await _httpFacade.GetCatalogEntryAsync(policyPackCatalogEntryId, ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack catalog entry '{policyPackCatalogEntryId}' was not found or is not promoted.");
        }

        return Ok(result.Value!);
    }

    /// <summary>Plain-English Markdown summary of the pack's current version JSON (LLM-assisted; advisory only).</summary>
    [HttpGet("{policyPackId:guid}/explain")]
    [EnableRateLimiting("expensive")]
    [Produces("text/markdown")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExplainPack(Guid policyPackId, CancellationToken ct = default)
    {
        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<string> result = await _httpFacade.ExplainPackMarkdownAsync(policyPackId, ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack '{policyPackId}' was not found in the current scope or has no content.");
        }

        return Content(result.Value!, "text/markdown; charset=utf-8");
    }

    /// <summary>Bundled starter policy pack templates for the visual rule builder.</summary>
    [HttpGet("rule-templates")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackRuleTemplateItem>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<PolicyPackRuleTemplateItem>> GetRuleTemplates()
    {
        PolicyPackHttpResult<IReadOnlyList<PolicyPackRuleTemplateItem>> result = _httpFacade.ListRuleTemplates();
        return Ok(result.Value!);
    }
}
