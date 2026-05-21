using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Services.Governance;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>
///     Versioned policy pack CRUD, publish, assign, and effective-governance reads for the ambient
///     tenant/workspace/project.
/// </summary>
/// <remarks>
///     <para>
///         <strong>Routes:</strong> under <c>v{version}/policy-packs</c>. Mutating actions require
///         <see cref="ArchLucidPolicies.PolicyPackMutationAuthority" />; reads require
///         <see cref="ArchLucidPolicies.ReadAuthority" />. Request bodies are validated with FluentValidation (see
///         validators for <see cref="CreatePolicyPackRequest" />, etc.).
///     </para>
///     <para>
///         <strong>Scope:</strong> All operations use <see cref="IScopeContextProvider.GetCurrentScope" /> for
///         tenant/workspace/project ids (headers or JWT claims).
///     </para>
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/policy-packs")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public sealed class PolicyPacksController(
    IScopeContextProvider scopeProvider,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IPolicyPackCatalogRepository policyPackCatalogRepository,
    IPolicyPackResolver resolver,
    IEffectiveGovernanceLoader governanceLoader,
    IPolicyPacksAppService policyPacksApp,
    IPolicyPackCatalogAdminService policyPackCatalogAdminService,
    IPolicyPackGovernanceDryRunService policyPackGovernanceDryRunService,
    PolicyPackMarkdownExplainService policyPackMarkdownExplainService,
    IPolicyPackRuleTemplatesService policyPackRuleTemplatesService,
    IAuditService auditService)
    : ControllerBase
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IPolicyPackCatalogRepository _policyPackCatalogRepository =
        policyPackCatalogRepository ?? throw new ArgumentNullException(nameof(policyPackCatalogRepository));

    private readonly IPolicyPackCatalogAdminService _policyPackCatalogAdminService =
        policyPackCatalogAdminService ?? throw new ArgumentNullException(nameof(policyPackCatalogAdminService));

    private readonly PolicyPackMarkdownExplainService _policyPackMarkdownExplainService =
        policyPackMarkdownExplainService ?? throw new ArgumentNullException(nameof(policyPackMarkdownExplainService));

    private readonly IPolicyPackGovernanceDryRunService _policyPackGovernanceDryRunService =
        policyPackGovernanceDryRunService ?? throw new ArgumentNullException(nameof(policyPackGovernanceDryRunService));

    private readonly IPolicyPackRuleTemplatesService _policyPackRuleTemplatesService =
        policyPackRuleTemplatesService ?? throw new ArgumentNullException(nameof(policyPackRuleTemplatesService));
    /// <summary>Creates a new pack and an initial unpublished version <c>1.0.0</c>.</summary>
    /// <remarks>Audit: <c>PolicyPackCreated</c> via <see cref="IPolicyPacksAppService" />.</remarks>
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

        ScopeContext scope = scopeProvider.GetCurrentScope();

        PolicyPack pack = await policyPacksApp.CreatePackAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            request.Name,
            request.Description,
            request.PackType,
            request.InitialContentJson,
            ct);

        return Ok(pack);
    }

    /// <summary>Publishes or upserts a version for the pack and marks the pack active.</summary>
    /// <remarks>Audit: <c>PolicyPackVersionPublished</c>.</remarks>
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

        PolicyPackVersion version = await policyPacksApp.PublishVersionAsync(
            policyPackId,
            request.Version.Trim(),
            request.ContentJson,
            ct);

        return Ok(version);
    }

    /// <summary>
    ///     Assigns an existing published version to a governance tier (<see cref="AssignPolicyPackRequest.ScopeLevel" />) for
    ///     the current scope.
    /// </summary>
    /// <returns>404 with <c>policy-pack-version-not-found</c> when the version row does not exist.</returns>
    /// <remarks>Audit: <c>PolicyPackAssignmentCreated</c>. Default scope level is Project when omitted or blank in JSON.</remarks>
    [HttpPost("{policyPackId:guid}/assign")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPackAssignment), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign(
        Guid policyPackId,
        [FromBody] AssignPolicyPackRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string versionKey = request.Version.Trim();
        string scopeLevel = string.IsNullOrWhiteSpace(request.ScopeLevel) ? "Project" : request.ScopeLevel;

        PolicyPackAssignment? assignment = await policyPacksApp.TryAssignAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            policyPackId,
            versionKey,
            scopeLevel,
            request.IsPinned,
            ct);

        if (assignment is null)
            return this.NotFoundProblem(
                $"Policy pack version '{versionKey}' was not found for pack '{policyPackId}'.",
                ProblemTypes.PolicyPackVersionNotFound);

        return Ok(assignment);
    }

    /// <summary>Soft-deletes a policy pack assignment for the current tenant (row retained for audit).</summary>
    /// <returns>404 when no active assignment matched.</returns>
    /// <remarks>Audit: <c>PolicyPackAssignmentArchived</c>.</remarks>
    [HttpPost("assignments/{assignmentId:guid}/archive")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveAssignment(Guid assignmentId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        bool ok = await policyPacksApp.TryArchiveAssignmentAsync(scope.TenantId, assignmentId, ct);

        if (!ok)
            return this.NotFoundProblem(
                $"Assignment '{assignmentId}' was not found or is already archived for this tenant.",
                ProblemTypes.ResourceNotFound);

        return NoContent();
    }

    /// <summary>Soft-deletes a policy pack.</summary>
    /// <returns>404 when the pack does not exist in the current scope.</returns>
    [HttpDelete("{policyPackId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePack(Guid policyPackId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        bool ok = await policyPacksApp.TrySoftDeletePackAsync(scope.TenantId, policyPackId, ct);

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
        ScopeContext scope = scopeProvider.GetCurrentScope();
        PolicyPack? duplicate = await policyPacksApp.TryDuplicatePackAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            policyPackId,
            ct);

        if (duplicate is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found or has no versions to duplicate.",
                ProblemTypes.ResourceNotFound);

        return Ok(duplicate);
    }

    /// <summary>Lists packs whose <em>authoring</em> scope matches the current tenant/workspace/project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPack>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PolicyPack>>> List(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<PolicyPack> packs = await packRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return Ok(packs);
    }

    /// <summary>Lists platform-promoted policy pack snapshots available to clone into the current tenant.</summary>
    [HttpGet("catalog")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackCatalogListItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PolicyPackCatalogListItem>>> ListCatalog(CancellationToken ct = default)
    {
        IReadOnlyList<PolicyPackCatalogListItem> rows = await _policyPackCatalogRepository.ListPromotedAsync(ct);
        return Ok(rows);
    }

    /// <summary>Reads one promoted catalog entry including snapshot JSON for cloning.</summary>
    /// <returns>404 when the entry is missing or not promoted.</returns>
    [HttpGet("catalog/{policyPackCatalogEntryId:guid}")]
    [ProducesResponseType(typeof(PolicyPackCatalogEntryDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCatalogEntry(Guid policyPackCatalogEntryId, CancellationToken ct = default)
    {
        PolicyPackCatalogEntryDetail? row =
            await _policyPackCatalogRepository.GetPromotedDetailByIdAsync(policyPackCatalogEntryId, ct);

        if (row is null)
            return this.NotFoundProblem(
                $"Policy pack catalog entry '{policyPackCatalogEntryId}' was not found or is not promoted.",
                ProblemTypes.ResourceNotFound);

        return Ok(row);
    }

    /// <summary>Snapshots a pack from the caller&apos;s authoring scope into the global catalog and promotes it.</summary>
    [HttpPost("catalog/promote")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [ProducesResponseType(typeof(PolicyPackCatalogEntryDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PromoteCatalogEntry(
        [FromBody] PromotePolicyPackCatalogEntryRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        PolicyPackCatalogEntryDetail? row = await _policyPackCatalogAdminService.TryPromoteFromSourcePackAsync(
            scope,
            request.SourcePolicyPackId,
            request.Version,
            ct);

        if (row is null)
            return this.NotFoundProblem(
                $"Policy pack '{request.SourcePolicyPackId}' was not found in the current scope or has no content for the requested version.",
                ProblemTypes.ResourceNotFound);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackCatalogPromoted,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        policyPackCatalogEntryId = row.PolicyPackCatalogEntryId,
                        sourcePolicyPackId = row.SourcePolicyPackId,
                        snapshotVersion = row.SnapshotVersion
                    }),
            },
            ct);

        return Ok(row);
    }

    /// <summary>Removes a catalog entry from the buyer-visible catalog (row retained).</summary>
    [HttpPost("catalog/demote")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DemoteCatalogEntry(
        [FromBody] DemotePolicyPackCatalogEntryRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        bool ok = await _policyPackCatalogAdminService.TryDemoteAsync(request.PolicyPackCatalogEntryId, ct);

        if (!ok)
            return this.NotFoundProblem(
                $"Policy pack catalog entry '{request.PolicyPackCatalogEntryId}' was not found.",
                ProblemTypes.ResourceNotFound);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackCatalogDemoted,
                DataJson = JsonSerializer.Serialize(new { policyPackCatalogEntryId = request.PolicyPackCatalogEntryId }),
            },
            ct);

        return NoContent();
    }

    /// <summary>Lists all version rows for a pack (newest first by repository ordering).</summary>
    /// <returns>Version list, or 404 when the pack does not exist in the current scope.</returns>
    [HttpGet("{policyPackId:guid}/versions")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackVersion>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListVersions(
        Guid policyPackId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        PolicyPack? pack = await packRepository.GetByIdAsync(policyPackId, ct);

        if (pack is null ||
            pack.TenantId != scope.TenantId ||
            pack.WorkspaceId != scope.WorkspaceId ||
            pack.ProjectId != scope.ProjectId)

            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        IReadOnlyList<PolicyPackVersion> versions = await versionRepository.ListByPackAsync(policyPackId, ct);
        return Ok(versions);
    }

    /// <summary>
    ///     Plain-English Markdown summary of the pack&apos;s current version JSON (LLM-assisted; advisory only).
    /// </summary>
    [HttpGet("{policyPackId:guid}/explain")]
    [EnableRateLimiting("expensive")]
    [Produces("text/markdown")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExplainPack(Guid policyPackId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        PolicyPack? pack = await packRepository.GetByIdAsync(policyPackId, ct);

        if (pack is null ||
            pack.TenantId != scope.TenantId ||
            pack.WorkspaceId != scope.WorkspaceId ||
            pack.ProjectId != scope.ProjectId)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        string versionLabel = pack.CurrentVersion.Trim();
        PolicyPackVersion? versionRow = await versionRepository.GetByPackAndVersionAsync(policyPackId, versionLabel, ct);

        if (versionRow is null || string.IsNullOrWhiteSpace(versionRow.ContentJson))
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' has no content for version '{versionLabel}'.",
                ProblemTypes.PolicyPackVersionNotFound);

        string markdown = await _policyPackMarkdownExplainService
            .SummarizePackJsonAsync(pack.Name, versionRow.ContentJson, ct)
            .ConfigureAwait(false);

        return Content(markdown, "text/markdown; charset=utf-8");
    }

    /// <summary>
    ///     Returns each applicable enabled assignment as a separate <see cref="ResolvedPolicyPack" /> (raw <c>ContentJson</c>
    ///     per pack)—no merge.
    /// </summary>
    /// <remarks>
    ///     For merged effective document and precedence, use <c>GET …/effective-content</c> or
    ///     <c>GET …/governance-resolution</c>.
    /// </remarks>
    [HttpGet("effective")]
    [ProducesResponseType(typeof(EffectivePolicyPackSet), StatusCodes.Status200OK)]
    public async Task<ActionResult<EffectivePolicyPackSet>> GetEffective(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        EffectivePolicyPackSet effective = await resolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return Ok(effective);
    }

    /// <summary>
    ///     Returns the single merged <see cref="PolicyPackContentDocument" /> after hierarchical resolution (project &gt;
    ///     workspace &gt; tenant, pin, recency).
    /// </summary>
    /// <remarks>
    ///     Implemented via <see cref="IEffectiveGovernanceLoader" /> → <see cref="IEffectiveGovernanceResolver" />
    ///     (decisions/conflicts omitted here).
    ///     Used by alert/compliance/advisory code paths indirectly through the same loader in persistence services.
    /// </remarks>
    [HttpGet("effective-content")]
    [ProducesResponseType(typeof(PolicyPackContentDocument), StatusCodes.Status200OK)]
    public async Task<ActionResult<PolicyPackContentDocument>> GetEffectiveContent(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        PolicyPackContentDocument doc = await governanceLoader.LoadEffectiveContentAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return Ok(doc);
    }

    /// <summary>Bundled starter policy pack templates for the visual rule builder (flattened manifest).</summary>
    [HttpGet("rule-templates")]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPackRuleTemplateItem>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<PolicyPackRuleTemplateItem>> GetRuleTemplates()
    {
        IReadOnlyList<PolicyPackRuleTemplateItem> templates = _policyPackRuleTemplatesService.ListTemplates();

        return Ok(templates);
    }

    /// <summary>
    ///     Simulates proposed pack content against a single run's findings (pre-commit gate semantics) without persisting a pack.
    /// </summary>
    /// <remarks>
    ///     Facade over <see cref="GovernanceController.DryRunProposedPolicyPack" /> with a typed
    ///     <see cref="PolicyPackContentDocument" /> body. Persists the same redacted governance dry-run audit row as the governance route.
    /// </remarks>
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

        string policyPackContentJson =
            JsonSerializer.Serialize(request.Content, ContractJson.CamelCaseIgnoreNullCompact);

        PolicyPackGovernanceDryRunResult? result = await _policyPackGovernanceDryRunService.EvaluateAsync(
            policyPackContentJson,
            request.RunId.Trim(),
            targetManifestId: null,
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

    /// <summary>
    ///     Simulates the pack's latest version content against many runs (governance dry-run per run).
    /// </summary>
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

        PolicyPack? pack = await packRepository.GetByIdAsync(policyPackId, cancellationToken);

        if (pack is null || pack.IsDeleted)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found.",
                ProblemTypes.ResourceNotFound);

        PolicyPackVersion? versionRow = await versionRepository.GetByPackAndVersionAsync(
            policyPackId,
            pack.CurrentVersion.Trim(),
            cancellationToken);

        if (versionRow is null)
        {
            IReadOnlyList<PolicyPackVersion> versions = await versionRepository.ListByPackAsync(policyPackId, cancellationToken);
            versionRow = versions.FirstOrDefault();
        }

        if (versionRow is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' has no versions to simulate.",
                ProblemTypes.ResourceNotFound);

        List<PolicyPackSimulateBulkRunResult> runResults = [];
        int wouldBlock = 0;
        int notFound = 0;
        int evaluated = 0;

        foreach (string runIdRaw in request.RunIds.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(runIdRaw))
                continue;

            string runId = runIdRaw.Trim();
            PolicyPackGovernanceDryRunResult? dryRun = await _policyPackGovernanceDryRunService.EvaluateAsync(
                versionRow.ContentJson,
                runId,
                targetManifestId: null,
                request.BlockCommitOnCritical,
                request.BlockCommitMinimumSeverity,
                policyPackId,
                cancellationToken);

            if (dryRun is null)
            {
                notFound++;
                runResults.Add(new PolicyPackSimulateBulkRunResult { RunId = runId, Found = false });

                continue;
            }

            evaluated++;

            bool wouldBlockCommit = dryRun.GateResult.Blocked;

            if (wouldBlockCommit)
                wouldBlock++;

            runResults.Add(
                new PolicyPackSimulateBulkRunResult
                {
                    RunId = runId,
                    Found = true,
                    WouldBlockCommit = wouldBlockCommit,
                    Detail = dryRun,
                });
        }

        PolicyPackSimulateBulkSummaryResponse summary = new()
        {
            PolicyPackId = policyPackId,
            PolicyPackVersion = versionRow.Version,
            RequestedRunCount = request.RunIds.Count,
            EvaluatedRunCount = evaluated,
            NotFoundRunCount = notFound,
            WouldBlockCommitCount = wouldBlock,
            Results = runResults,
        };

        return Ok(summary);
    }

    /// <summary>
    ///     Validates raw policy pack content JSON against structural rules without persisting a pack.
    /// </summary>
    [HttpPost("validate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult Validate([FromBody] JsonElement? body)
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

        PolicyPackContentDocumentValidator validator = new();
        FluentValidation.Results.ValidationResult validationResult = validator.Validate(document);

        if (!validationResult.IsValid)
        {
            string[] errors = validationResult.Errors
                .Select(static error => error.ErrorMessage)
                .ToArray();

            return this.BadRequestProblem(
                string.Join("; ", errors),
                ProblemTypes.ValidationFailed,
                extensions: new Dictionary<string, object?> { ["errors"] = errors });
        }

        return Ok();
    }
}
