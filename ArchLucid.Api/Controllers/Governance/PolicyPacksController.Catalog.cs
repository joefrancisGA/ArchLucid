using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
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

    /// <summary>Returns each applicable enabled assignment as a separate resolved pack (no merge).</summary>
    [HttpGet("effective")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(EffectivePolicyPackSet), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetEffective(CancellationToken ct = default)
    {
        PolicyPackHttpResult<EffectivePolicyPackSet> result = await _httpFacade.GetEffectiveAsync(ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        EffectivePolicyPackSet effective = result.Value!;
        ScopeContext scope = HttpContext.RequestServices.GetRequiredService<IScopeContextProvider>().GetCurrentScope();
        string fingerprint =
            $"effective|tenant={scope.TenantId:N}|workspace={scope.WorkspaceId:N}|project={scope.ProjectId:N}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            effective,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(effective, etag);
    }

    /// <summary>Returns the single merged effective policy pack content document.</summary>
    [HttpGet("effective-content")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(PolicyPackContentDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetEffectiveContent(CancellationToken ct = default)
    {
        PolicyPackHttpResult<PolicyPackContentDocument> result = await _httpFacade.GetEffectiveContentAsync(ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        PolicyPackContentDocument doc = result.Value!;
        ScopeContext scope = HttpContext.RequestServices.GetRequiredService<IScopeContextProvider>().GetCurrentScope();
        string fingerprint =
            $"effective-content|tenant={scope.TenantId:N}|workspace={scope.WorkspaceId:N}|project={scope.ProjectId:N}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            doc,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(doc, etag);
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
