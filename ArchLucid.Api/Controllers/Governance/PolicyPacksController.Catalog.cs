using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
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
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(ct).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPacksPageBundleResponse body = await _workflow.GetPageBundleAsync(ct);
        return Ok(body);
    }

    /// <summary>Lists workspace policy packs with assignment ids for tenant opt-in/opt-out.</summary>
    [HttpGet("workspace-selection")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackWorkspaceSelectionItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListWorkspaceSelection(
        CancellationToken ct = default)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(ct).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IReadOnlyList<PolicyPackWorkspaceSelectionItem> rows = await _workflow.ListWorkspaceSelectionAsync(ct);
        return Ok(rows);
    }

    /// <summary>Lists platform-promoted policy pack snapshots available to clone into the current tenant.</summary>
    [HttpGet("catalog")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackCatalogListItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PolicyPackCatalogListItem>>> ListCatalog(CancellationToken ct = default)
    {
        IReadOnlyList<PolicyPackCatalogListItem> rows = await _workflow.ListCatalogAsync(ct);
        return Ok(rows);
    }

    /// <summary>Reads one promoted catalog entry including snapshot JSON for cloning.</summary>
    [HttpGet("catalog/{policyPackCatalogEntryId:guid}")]
    [ProducesResponseType(typeof(PolicyPackCatalogEntryDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCatalogEntry(Guid policyPackCatalogEntryId, CancellationToken ct = default)
    {
        PolicyPackCatalogEntryDetail? row = await _workflow.TryGetCatalogEntryAsync(policyPackCatalogEntryId, ct);

        if (row is null)
            return this.NotFoundProblem(
                $"Policy pack catalog entry '{policyPackCatalogEntryId}' was not found or is not promoted.",
                ProblemTypes.ResourceNotFound);

        return Ok(row);
    }

    /// <summary>Snapshots a pack from the caller's authoring scope into the global catalog and promotes it.</summary>
    [HttpPost("catalog/promote")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [MutatingAuditExcluded("Audit: IPolicyPackWorkflowFacade.TryPromoteCatalogEntryAsync logs PolicyPackCatalogPromoted.")]
    [ProducesResponseType(typeof(PolicyPackCatalogEntryDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PromoteCatalogEntry(
        [FromBody] PromotePolicyPackCatalogEntryRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        PolicyPackCatalogEntryDetail? row;

        try
        {
            row = await _workflow.TryPromoteCatalogEntryAsync(
                request.SourcePolicyPackId,
                request.Version,
                ct);
        }
        catch (PolicyPackCrossTenantDistributionBlockedException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        if (row is null)
            return this.NotFoundProblem(
                $"Policy pack '{request.SourcePolicyPackId}' was not found in the current scope or has no content for the requested version.",
                ProblemTypes.ResourceNotFound);

        return Ok(row);
    }

    /// <summary>Removes a catalog entry from the buyer-visible catalog (row retained).</summary>
    [HttpPost("catalog/demote")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [MutatingAuditExcluded("Audit: IPolicyPackWorkflowFacade.TryDemoteCatalogEntryAsync logs PolicyPackCatalogDemoted.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DemoteCatalogEntry(
        [FromBody] DemotePolicyPackCatalogEntryRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        bool ok = await _workflow.TryDemoteCatalogEntryAsync(request.PolicyPackCatalogEntryId, ct);

        if (!ok)
            return this.NotFoundProblem(
                $"Policy pack catalog entry '{request.PolicyPackCatalogEntryId}' was not found.",
                ProblemTypes.ResourceNotFound);

        return NoContent();
    }

    /// <summary>Lists version metadata for a pack (newest first).</summary>
    [HttpGet("{policyPackId:guid}/versions")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackVersion>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListVersions(Guid policyPackId, CancellationToken ct = default)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(ct).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IReadOnlyList<PolicyPackVersion>? versions = await _workflow.TryListVersionsAsync(policyPackId, ct);

        if (versions is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(versions);
    }

    /// <summary>Reads one version including full <c>ContentJson</c>.</summary>
    [HttpGet("{policyPackId:guid}/versions/{packVersion}")]
    [ProducesResponseType(typeof(PolicyPackVersion), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVersion(
        Guid policyPackId,
        string packVersion,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(packVersion))
            return this.BadRequestProblem("Version is required.", ProblemTypes.ValidationFailed);

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(ct).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPackVersionLookupResult lookup = await _workflow.TryGetVersionAsync(policyPackId, packVersion, ct);

        return lookup.Outcome switch
        {
            PolicyPackVersionLookupOutcome.Found => Ok(lookup.Version!),
            PolicyPackVersionLookupOutcome.PackNotFound => this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound),
            PolicyPackVersionLookupOutcome.VersionNotFound => this.NotFoundProblem(
                $"Policy pack version '{packVersion.Trim()}' was not found for pack '{policyPackId}'.",
                ProblemTypes.PolicyPackVersionNotFound),
            _ => throw new InvalidOperationException($"Unexpected version lookup outcome: {lookup.Outcome}."),
        };
    }

    /// <summary>Plain-English Markdown summary of the pack's current version JSON (LLM-assisted; advisory only).</summary>
    [HttpGet("{policyPackId:guid}/explain")]
    [EnableRateLimiting("expensive")]
    [Produces("text/markdown")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExplainPack(Guid policyPackId, CancellationToken ct = default)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(ct).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string? markdown = await _workflow.TryExplainPackMarkdownAsync(policyPackId, ct);

        if (markdown is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope or has no content.",
                ProblemTypes.ResourceNotFound);

        return Content(markdown, "text/markdown; charset=utf-8");
    }

    /// <summary>Returns each applicable enabled assignment as a separate resolved pack (no merge).</summary>
    [HttpGet("effective")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(EffectivePolicyPackSet), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetEffective(CancellationToken ct = default)
    {
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(ct).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        EffectivePolicyPackSet effective = await _workflow.GetEffectiveAsync(ct);

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
        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(ct).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPackContentDocument doc = await _workflow.GetEffectiveContentAsync(ct);

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
        IReadOnlyList<PolicyPackRuleTemplateItem> templates = _workflow.ListRuleTemplates();
        return Ok(templates);
    }
}
