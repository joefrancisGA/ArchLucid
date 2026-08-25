using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Asp.Versioning;

using FluentValidation;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;

using System.Text.Json;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>
///     Versioned policy pack CRUD, publish, assign, and effective-governance reads for the ambient
///     tenant/workspace/project.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/policy-packs")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public sealed class PolicyPacksController(
    IPolicyPackWorkflowFacade workflow,
    IValidator<CreatePolicyPackRequest> createPolicyPackRequestValidator,
    IValidator<PublishPolicyPackVersionRequest> publishPolicyPackVersionRequestValidator,
    IValidator<AssignPolicyPackRequest> assignPolicyPackRequestValidator)
    : ControllerBase
{
    private readonly IPolicyPackWorkflowFacade _workflow =
        workflow ?? throw new ArgumentNullException(nameof(workflow));

    private readonly IValidator<CreatePolicyPackRequest> _createPolicyPackRequestValidator =
        createPolicyPackRequestValidator ?? throw new ArgumentNullException(nameof(createPolicyPackRequestValidator));

    private readonly IValidator<PublishPolicyPackVersionRequest> _publishPolicyPackVersionRequestValidator =
        publishPolicyPackVersionRequestValidator
        ?? throw new ArgumentNullException(nameof(publishPolicyPackVersionRequestValidator));

    private readonly IValidator<AssignPolicyPackRequest> _assignPolicyPackRequestValidator =
        assignPolicyPackRequestValidator ?? throw new ArgumentNullException(nameof(assignPolicyPackRequestValidator));

    /// <summary>Creates a new pack and an initial unpublished version <c>1.0.0</c>.</summary>
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPack), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePolicyPackRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            await this.ValidateRequestAsync(_createPolicyPackRequestValidator, request, ct);

        if (validationProblem is not null)
            return validationProblem;

        PolicyPack pack = await _workflow.CreatePackAsync(
            request.Name,
            request.Description,
            request.PackType,
            request.InitialContentJson,
            ct);

        return Ok(pack);
    }

    /// <summary>Publishes or upserts a version for the pack and marks the pack active.</summary>
    [HttpPost("{policyPackId:guid}/publish")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPackVersion), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Publish(
        Guid policyPackId,
        [FromBody] PublishPolicyPackVersionRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            await this.ValidateRequestAsync(_publishPolicyPackVersionRequestValidator, request, ct);

        if (validationProblem is not null)
            return validationProblem;

        PolicyPackVersion? version = await _workflow.TryPublishVersionAsync(
            policyPackId,
            request.Version.Trim(),
            request.ContentJson,
            ct);

        if (version is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(version);
    }

    /// <summary>Assigns an existing published version to a governance tier for the current scope.</summary>
    [HttpPost("{policyPackId:guid}/assign")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPackAssignment), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign(
        Guid policyPackId,
        [FromBody] AssignPolicyPackRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            await this.ValidateRequestAsync(_assignPolicyPackRequestValidator, request, ct);

        if (validationProblem is not null)
            return validationProblem;

        string versionKey = request.Version.Trim();
        string scopeLevel = string.IsNullOrWhiteSpace(request.ScopeLevel) ? "Project" : request.ScopeLevel;

        PolicyPackAssignWorkflowResult assignResult = await _workflow.TryAssignAsync(
            policyPackId,
            versionKey,
            scopeLevel,
            request.IsPinned,
            ct);

        return assignResult.Outcome switch
        {
            PolicyPackAssignOutcome.Assigned => Ok(assignResult.Assignment!),
            PolicyPackAssignOutcome.PackNotFound => this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound),
            PolicyPackAssignOutcome.VersionNotFound => this.NotFoundProblem(
                $"Policy pack version '{versionKey}' was not found for pack '{policyPackId}'.",
                ProblemTypes.PolicyPackVersionNotFound),
            _ => throw new InvalidOperationException($"Unexpected assign outcome: {assignResult.Outcome}."),
        };
    }

    /// <summary>Soft-deletes a policy pack assignment for the current tenant (row retained for audit).</summary>
    [HttpPost("assignments/{assignmentId:guid}/archive")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveAssignment(Guid assignmentId, CancellationToken ct = default)
    {
        bool ok = await _workflow.TryArchiveAssignmentAsync(assignmentId, ct);

        if (!ok)
            return this.NotFoundProblem(
                $"Assignment '{assignmentId}' was not found or is already archived for this tenant.",
                ProblemTypes.ResourceNotFound);

        return NoContent();
    }

    /// <summary>Soft-deletes a policy pack.</summary>
    [HttpDelete("{policyPackId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePack(Guid policyPackId, CancellationToken ct = default)
    {
        bool ok = await _workflow.TrySoftDeletePackAsync(policyPackId, ct);

        if (!ok)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        return NoContent();
    }

    /// <summary>Duplicates a policy pack and its latest version content.</summary>
    [HttpPost("{policyPackId:guid}/duplicate")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPack), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DuplicatePack(Guid policyPackId, CancellationToken ct = default)
    {
        PolicyPack? duplicate = await _workflow.TryDuplicatePackAsync(policyPackId, ct);

        if (duplicate is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found or has no versions to duplicate.",
                ProblemTypes.ResourceNotFound);

        return Ok(duplicate);
    }

    /// <summary>Lists packs whose authoring scope matches the current tenant/workspace/project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPack>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PolicyPack>>> List(CancellationToken ct = default)
    {
        IReadOnlyList<PolicyPack> visiblePacks = await _workflow.ListVisiblePacksAsync(ct);
        return Ok(visiblePacks);
    }

    /// <summary>Policy packs hub bundle: list, effective assignments, and merged content.</summary>
    [HttpGet("page-bundle")]
    [ProducesResponseType(typeof(PolicyPacksPageBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPageBundle(CancellationToken ct = default)
    {
        PolicyPacksPageBundleResponse body = await _workflow.GetPageBundleAsync(ct);
        return Ok(body);
    }

    /// <summary>Lists workspace policy packs with assignment ids for tenant opt-in/opt-out.</summary>
    [HttpGet("workspace-selection")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackWorkspaceSelectionItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>> ListWorkspaceSelection(
        CancellationToken ct = default)
    {
        IReadOnlyList<PolicyPackWorkspaceSelectionItem> rows = await _workflow.ListWorkspaceSelectionAsync(ct);
        return Ok(rows);
    }

    /// <summary>Enables or disables one policy pack assignment for the current workspace scope.</summary>
    [HttpPut("assignments/{assignmentId:guid}/enabled")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [MutatingAuditExcluded("Audit: IPolicyPackWorkflowFacade.TrySetAssignmentEnabledAsync logs PolicyPackAssignmentEnabledChanged.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetAssignmentEnabled(
        Guid assignmentId,
        [FromBody] SetPolicyPackAssignmentEnabledRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        bool ok = await _workflow.TrySetAssignmentEnabledAsync(assignmentId, request.IsEnabled, ct);

        if (!ok)
        {
            return this.NotFoundProblem(
                $"Assignment '{assignmentId}' was not found or cannot be enabled in the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        return NoContent();
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

    /// <summary>Simulates proposed pack content against a single run's findings without persisting a pack.</summary>
    [HttpPost("simulate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackGovernanceDryRunResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Simulate(
        [FromBody] PolicyPackSimulateRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        PolicyPackGovernanceDryRunResult? result = await _workflow.SimulateAsync(
            request.Content,
            request.RunId,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            request.ProposedPolicyPackId,
            cancellationToken);

        if (result is null)
            return this.NotFoundProblem(
                "The target run was not found in the current tenant/workspace/project scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(result);
    }

    /// <summary>Simulates the pack's latest version content against many runs.</summary>
    [HttpPost("{policyPackId:guid}/simulate-bulk")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [ProducesResponseType(typeof(PolicyPackSimulateBulkSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SimulateBulk(
        Guid policyPackId,
        [FromBody] PolicyPackSimulateBulkRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.RunIds.Count == 0)
            return this.BadRequestProblem("RunIds must contain at least one id.", ProblemTypes.ValidationFailed);

        if (request.RunIds.Count > 50)
            return this.BadRequestProblem("At most 50 run ids are allowed per request.", ProblemTypes.ValidationFailed);

        PolicyPackSimulateBulkSummary? summary = await _workflow.TrySimulateBulkAsync(
            policyPackId,
            request.RunIds,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            cancellationToken);

        if (summary is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(MapBulkSummary(summary));
    }

    /// <summary>Validates raw policy pack content JSON against structural rules without persisting a pack.</summary>
    [HttpPost("validate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackContentValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Validate([FromBody] JsonElement? body, CancellationToken cancellationToken)
    {
        if (body is null || body.Value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.Value.ValueKind is not JsonValueKind.Object)
            return this.BadRequestProblem("Expected a JSON object.", ProblemTypes.ValidationFailed);

        PolicyPackContentDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                body.Value.GetRawText(),
                ContractJson.CamelCaseIgnoreNullCompact);
        }
        catch (JsonException jsonException)
        {
            return this.BadRequestProblem(
                $"Invalid JSON: {jsonException.Message}",
                ProblemTypes.ValidationFailed);
        }

        if (document is null)
            return this.BadRequestProblem("Deserialized document is null.", ProblemTypes.ValidationFailed);

        PolicyPackContentValidationResponse response =
            await _workflow.ValidateContentAsync(document, cancellationToken);

        return Ok(response);
    }

    private static PolicyPackSimulateBulkSummaryResponse MapBulkSummary(PolicyPackSimulateBulkSummary summary) =>
        new()
        {
            PolicyPackId = summary.PolicyPackId,
            PolicyPackVersion = summary.PolicyPackVersion,
            RequestedRunCount = summary.RequestedRunCount,
            EvaluatedRunCount = summary.EvaluatedRunCount,
            NotFoundRunCount = summary.NotFoundRunCount,
            WouldBlockCommitCount = summary.WouldBlockCommitCount,
            Results = summary.Results
                .Select(static result => new PolicyPackSimulateBulkRunResult
                {
                    RunId = result.RunId,
                    Found = result.Found,
                    WouldBlockCommit = result.WouldBlockCommit,
                    Detail = result.Detail,
                })
                .ToList(),
        };
}
