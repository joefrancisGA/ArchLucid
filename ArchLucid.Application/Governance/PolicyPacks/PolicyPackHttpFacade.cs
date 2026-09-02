using System.Text.Json;

using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <inheritdoc cref="IPolicyPackHttpFacade" />
public sealed class PolicyPackHttpFacade(
    IPolicyPackWorkflowFacade workflow,
    IScopeContextProvider scopeProvider,
    ITenantRepository tenantRepository) : IPolicyPackHttpFacade
{
    private readonly IPolicyPackWorkflowFacade _workflow =
        workflow ?? throw new ArgumentNullException(nameof(workflow));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPack>> CreatePackAsync(
        PolicyPackCreateBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPack>.ScopeNotFound();

        PolicyPack pack = await _workflow.CreatePackAsync(
            request.Name,
            request.Description,
            request.PackType,
            request.InitialContentJson,
            ct).ConfigureAwait(false);

        return PolicyPackHttpResult<PolicyPack>.Success(pack);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackVersion>> PublishVersionAsync(
        Guid policyPackId,
        PolicyPackPublishBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackVersion>.ScopeNotFound();

        PolicyPackVersion? version = await _workflow.TryPublishVersionAsync(
            policyPackId,
            request.Version.Trim(),
            request.ContentJson,
            ct).ConfigureAwait(false);

        if (version is null)
        {
            return new PolicyPackHttpResult<PolicyPackVersion>
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
                Message = $"Policy pack '{policyPackId}' was not found in the current scope.",
            };
        }

        return PolicyPackHttpResult<PolicyPackVersion>.Success(version);
    }

    /// <inheritdoc />
    public async Task<PolicyPackAssignHttpResult> AssignAsync(
        Guid policyPackId,
        PolicyPackAssignBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return new PolicyPackAssignHttpResult { Outcome = PolicyPackHttpOutcome.ScopeNotFound };

        string versionKey = request.Version.Trim();
        string scopeLevel = string.IsNullOrWhiteSpace(request.ScopeLevel) ? "Project" : request.ScopeLevel;

        PolicyPackAssignWorkflowResult assignResult = await _workflow.TryAssignAsync(
            policyPackId,
            versionKey,
            scopeLevel,
            request.IsPinned,
            ct).ConfigureAwait(false);

        return assignResult.Outcome switch
        {
            PolicyPackAssignOutcome.Assigned => new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.Success,
                Assignment = assignResult.Assignment,
            },
            PolicyPackAssignOutcome.PackNotFound => new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
                PolicyPackId = policyPackId,
            },
            PolicyPackAssignOutcome.VersionNotFound => new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.VersionNotFound,
                PolicyPackId = policyPackId,
                VersionKey = versionKey,
            },
            _ => throw new InvalidOperationException($"Unexpected assign outcome: {assignResult.Outcome}."),
        };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> ArchiveAssignmentAsync(Guid assignmentId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TryArchiveAssignmentAsync(assignmentId, ct).ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> SoftDeletePackAsync(Guid policyPackId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TrySoftDeletePackAsync(policyPackId, ct).ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPack>> DuplicatePackAsync(Guid policyPackId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPack>.ScopeNotFound();

        PolicyPack? duplicate = await _workflow.TryDuplicatePackAsync(policyPackId, ct).ConfigureAwait(false);

        return duplicate is null
            ? new PolicyPackHttpResult<PolicyPack> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPack>.Success(duplicate);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPack>>> ListVisiblePacksAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPack>>.ScopeNotFound();

        IReadOnlyList<PolicyPack> packs = await _workflow.ListVisiblePacksAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<IReadOnlyList<PolicyPack>>.Success(packs);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> SetAssignmentEnabledAsync(
        Guid assignmentId,
        bool isEnabled,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TrySetAssignmentEnabledAsync(assignmentId, isEnabled, ct).ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPacksPageBundleResponse>> GetPageBundleAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPacksPageBundleResponse>.ScopeNotFound();

        PolicyPacksPageBundleResponse body = await _workflow.GetPageBundleAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<PolicyPacksPageBundleResponse>.Success(body);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>> ListWorkspaceSelectionAsync(
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>.ScopeNotFound();

        IReadOnlyList<PolicyPackWorkspaceSelectionItem> rows =
            await _workflow.ListWorkspaceSelectionAsync(ct).ConfigureAwait(false);

        return PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>.Success(rows);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>> ListCatalogAsync(
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>.ScopeNotFound();

        IReadOnlyList<PolicyPackCatalogListItem> rows = await _workflow.ListCatalogAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>.Success(rows);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackCatalogEntryDetail>> GetCatalogEntryAsync(
        Guid policyPackCatalogEntryId,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.ScopeNotFound();

        PolicyPackCatalogEntryDetail? row =
            await _workflow.TryGetCatalogEntryAsync(policyPackCatalogEntryId, ct).ConfigureAwait(false);

        return row is null
            ? new PolicyPackHttpResult<PolicyPackCatalogEntryDetail> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.Success(row);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackCatalogEntryDetail>> PromoteCatalogEntryAsync(
        PolicyPackPromoteCatalogBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.ScopeNotFound();

        try
        {
            PolicyPackCatalogEntryDetail? row = await _workflow.TryPromoteCatalogEntryAsync(
                request.SourcePolicyPackId,
                request.Version,
                ct).ConfigureAwait(false);

            return row is null
                ? new PolicyPackHttpResult<PolicyPackCatalogEntryDetail> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
                : PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.Success(row);
        }
        catch (PolicyPackCrossTenantDistributionBlockedException ex)
        {
            return new PolicyPackHttpResult<PolicyPackCatalogEntryDetail>
            {
                Outcome = PolicyPackHttpOutcome.CrossTenantDistributionBlocked,
                Message = ex.Message,
            };
        }
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> DemoteCatalogEntryAsync(
        PolicyPackDemoteCatalogBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TryDemoteCatalogEntryAsync(request.PolicyPackCatalogEntryId, ct).ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>> ListVersionsAsync(
        Guid policyPackId,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>.ScopeNotFound();

        IReadOnlyList<PolicyPackVersion>? versions =
            await _workflow.TryListVersionsAsync(policyPackId, ct).ConfigureAwait(false);

        return versions is null
            ? new PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>.Success(versions);
    }

    /// <inheritdoc />
    public async Task<PolicyPackVersionHttpResult> GetVersionAsync(
        Guid policyPackId,
        string packVersion,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
        {
            return new PolicyPackVersionHttpResult
            {
                Outcome = PolicyPackVersionLookupOutcome.PackNotFound,
                PolicyPackId = policyPackId,
            };
        }

        PolicyPackVersionLookupResult lookup =
            await _workflow.TryGetVersionAsync(policyPackId, packVersion, ct).ConfigureAwait(false);

        return new PolicyPackVersionHttpResult
        {
            Outcome = lookup.Outcome,
            Version = lookup.Version,
            PolicyPackId = policyPackId,
            PackVersion = packVersion.Trim(),
        };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<string>> ExplainPackMarkdownAsync(Guid policyPackId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<string>.ScopeNotFound();

        string? markdown = await _workflow.TryExplainPackMarkdownAsync(policyPackId, ct).ConfigureAwait(false);

        return markdown is null
            ? new PolicyPackHttpResult<string> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<string>.Success(markdown);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<EffectivePolicyPackSet>> GetEffectiveAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<EffectivePolicyPackSet>.ScopeNotFound();

        EffectivePolicyPackSet effective = await _workflow.GetEffectiveAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<EffectivePolicyPackSet>.Success(effective);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackContentDocument>> GetEffectiveContentAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackContentDocument>.ScopeNotFound();

        PolicyPackContentDocument doc = await _workflow.GetEffectiveContentAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<PolicyPackContentDocument>.Success(doc);
    }

    /// <inheritdoc />
    public PolicyPackHttpResult<IReadOnlyList<PolicyPackRuleTemplateItem>> ListRuleTemplates()
    {
        IReadOnlyList<PolicyPackRuleTemplateItem> templates = _workflow.ListRuleTemplates();
        return PolicyPackHttpResult<IReadOnlyList<PolicyPackRuleTemplateItem>>.Success(templates);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>> SimulateAsync(
        PolicyPackContentDocument content,
        string runId,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        Guid? proposedPolicyPackId,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>.ScopeNotFound();

        PolicyPackGovernanceDryRunResult? result = await _workflow.SimulateAsync(
            content,
            runId,
            blockCommitOnCritical,
            blockCommitMinimumSeverity,
            proposedPolicyPackId,
            ct).ConfigureAwait(false);

        return result is null
            ? new PolicyPackHttpResult<PolicyPackGovernanceDryRunResult> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>.Success(result);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackSimulateBulkSummary>> SimulateBulkAsync(
        Guid policyPackId,
        IReadOnlyList<string> runIds,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackSimulateBulkSummary>.ScopeNotFound();

        PolicyPackSimulateBulkSummary? summary = await _workflow.TrySimulateBulkAsync(
            policyPackId,
            runIds,
            blockCommitOnCritical,
            blockCommitMinimumSeverity,
            ct).ConfigureAwait(false);

        return summary is null
            ? new PolicyPackHttpResult<PolicyPackSimulateBulkSummary> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPackSimulateBulkSummary>.Success(summary);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackContentValidationResponse>> ValidateContentAsync(
        JsonElement body,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackContentValidationResponse>.ScopeNotFound();

        if (body.ValueKind is not JsonValueKind.Object)
        {
            return new PolicyPackHttpResult<PolicyPackContentValidationResponse>
            {
                Outcome = PolicyPackHttpOutcome.ValidationFailed,
                Message = "Expected a JSON object.",
            };
        }

        PolicyPackContentDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                body.GetRawText(),
                ContractJson.CamelCaseIgnoreNullCompact);
        }
        catch (JsonException jsonException)
        {
            return new PolicyPackHttpResult<PolicyPackContentValidationResponse>
            {
                Outcome = PolicyPackHttpOutcome.ValidationFailed,
                Message = $"Invalid JSON: {jsonException.Message}",
            };
        }

        if (document is null)
        {
            return new PolicyPackHttpResult<PolicyPackContentValidationResponse>
            {
                Outcome = PolicyPackHttpOutcome.ValidationFailed,
                Message = "Deserialized document is null.",
            };
        }

        PolicyPackContentValidationResponse response =
            await _workflow.ValidateContentAsync(document, ct).ConfigureAwait(false);

        return PolicyPackHttpResult<PolicyPackContentValidationResponse>.Success(response);
    }

    private async Task<bool> EnsureScopeAsync(CancellationToken cancellationToken)
    {
        TenantWorkspaceScopeResult scopeResult = await TenantWorkspaceScopeGuard.RequireTenantAndWorkspaceAsync(
            _scopeProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        return scopeResult.Outcome == TenantWorkspaceScopeOutcome.Success;
    }
}
