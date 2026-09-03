using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Snapshots a pack from the caller's authoring scope into the global catalog and promotes it.</summary>
    [HttpPost("catalog/promote")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [MutatingAuditExcluded("Audit: IPolicyPackHttpFacade.PromoteCatalogEntryAsync logs PolicyPackCatalogPromoted.")]
    [ProducesResponseType(typeof(PolicyPackCatalogEntryDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PromoteCatalogEntry(
        [FromBody] PromotePolicyPackCatalogEntryRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? promoteValidation =
            PolicyPacksHttpMapper.ValidatePromoteCatalogEntry(request).ToBadRequestProblemOrNull(this);

        if (promoteValidation is not null)
            return promoteValidation;

        PolicyPackHttpResult<PolicyPackCatalogEntryDetail> result = await _httpFacade.PromoteCatalogEntryAsync(
            new PolicyPackPromoteCatalogBody
            {
                SourcePolicyPackId = request.SourcePolicyPackId,
                Version = request.Version,
            },
            ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.CrossTenantDistributionBlocked)
            return this.BadRequestProblem(result.Message ?? "Cross-tenant distribution blocked.", ProblemTypes.ValidationFailed);

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack '{request.SourcePolicyPackId}' was not found in the current scope or has no content for the requested version.");
        }

        return Ok(result.Value!);
    }

    /// <summary>Removes a catalog entry from the buyer-visible catalog (row retained).</summary>
    [HttpPost("catalog/demote")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [MutatingAuditExcluded("Audit: IPolicyPackHttpFacade.DemoteCatalogEntryAsync logs PolicyPackCatalogDemoted.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DemoteCatalogEntry(
        [FromBody] DemotePolicyPackCatalogEntryRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? demoteValidation =
            PolicyPacksHttpMapper.ValidateDemoteCatalogEntry(request).ToBadRequestProblemOrNull(this);

        if (demoteValidation is not null)
            return demoteValidation;

        PolicyPackHttpResult<bool> result = await _httpFacade.DemoteCatalogEntryAsync(
            new PolicyPackDemoteCatalogBody { PolicyPackCatalogEntryId = request.PolicyPackCatalogEntryId },
            ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack catalog entry '{request.PolicyPackCatalogEntryId}' was not found.");
        }

        return NoContent();
    }
}
