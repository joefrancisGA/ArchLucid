using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

public sealed partial class PolicyPackWorkflowFacade
{
    /// <inheritdoc />
    public async Task<PolicyPacksPageBundleResponse> GetPageBundleAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        Task<IReadOnlyList<PolicyPack>> packsTask = ListVisiblePacksInScopeAsync(scope, ct);

        Task<EffectivePolicyPackSet> effectiveTask = _resolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        Task<PolicyPackContentDocument> contentTask = _governanceLoader.LoadEffectiveContentAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        await Task.WhenAll(packsTask, effectiveTask, contentTask).ConfigureAwait(false);

        return new PolicyPacksPageBundleResponse
        {
            Packs = await packsTask.ConfigureAwait(false),
            Effective = await effectiveTask.ConfigureAwait(false),
            EffectiveContent = await contentTask.ConfigureAwait(false),
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PolicyPackWorkspaceSelectionItem>> ListWorkspaceSelectionAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return await _workspaceSelectionService.ListAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<PolicyPackCatalogListItem>> ListCatalogAsync(CancellationToken ct) =>
        _policyPackCatalogRepository.ListPromotedAsync(ct);

    /// <inheritdoc />
    public Task<PolicyPackCatalogEntryDetail?> TryGetCatalogEntryAsync(
        Guid policyPackCatalogEntryId,
        CancellationToken ct) =>
        _policyPackCatalogRepository.GetPromotedDetailByIdAsync(policyPackCatalogEntryId, ct);

    /// <inheritdoc />
    public async Task<PolicyPackCatalogEntryDetail?> TryPromoteCatalogEntryAsync(
        Guid sourcePolicyPackId,
        string? version,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        PolicyPackCatalogEntryDetail? row = await _policyPackCatalogAdminService.TryPromoteFromSourcePackAsync(
            scope,
            sourcePolicyPackId,
            version,
            ct);

        if (row is null)
            return null;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackCatalogPromoted,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        policyPackCatalogEntryId = row.PolicyPackCatalogEntryId,
                        sourcePolicyPackId = row.SourcePolicyPackId,
                        snapshotVersion = row.SnapshotVersion,
                    }),
            },
            ct);

        return row;
    }

    /// <inheritdoc />
    public async Task<bool> TryDemoteCatalogEntryAsync(Guid policyPackCatalogEntryId, CancellationToken ct)
    {
        PolicyPackCatalogEntryDetail? promoted =
            await _policyPackCatalogRepository.GetPromotedDetailByIdAsync(policyPackCatalogEntryId, ct);

        bool ok = await _policyPackCatalogAdminService.TryDemoteAsync(policyPackCatalogEntryId, ct);

        if (!ok)
            return false;

        if (promoted is null)
            return true;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackCatalogDemoted,
                DataJson = JsonSerializer.Serialize(new { policyPackCatalogEntryId }),
            },
            ct);

        return true;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PolicyPackVersion>?> TryListVersionsAsync(Guid policyPackId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return null;

        return await _versionRepository.ListByPackAsync(policyPackId, ct);
    }

    /// <inheritdoc />
    public async Task<PolicyPackVersionLookupResult> TryGetVersionAsync(
        Guid policyPackId,
        string packVersion,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return new PolicyPackVersionLookupResult(PolicyPackVersionLookupOutcome.PackNotFound, null);

        PolicyPackVersion? row = await _versionRepository.GetByPackAndVersionAsync(policyPackId, packVersion.Trim(), ct);

        if (row is null)
            return new PolicyPackVersionLookupResult(PolicyPackVersionLookupOutcome.VersionNotFound, null);

        return new PolicyPackVersionLookupResult(PolicyPackVersionLookupOutcome.Found, row);
    }

    /// <inheritdoc />
    public async Task<string?> TryExplainPackMarkdownAsync(Guid policyPackId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return null;

        string versionLabel = pack!.CurrentVersion.Trim();
        PolicyPackVersion? versionRow = await _versionRepository.GetByPackAndVersionAsync(policyPackId, versionLabel, ct);

        if (versionRow is null || string.IsNullOrWhiteSpace(versionRow.ContentJson))
            return null;

        return await _policyPackMarkdownExplainService
            .SummarizePackJsonAsync(pack.Name, versionRow.ContentJson, ct)
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<EffectivePolicyPackSet> GetEffectiveAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return await _resolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);
    }

    /// <inheritdoc />
    public async Task<PolicyPackContentDocument> GetEffectiveContentAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return await _governanceLoader.LoadEffectiveContentAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);
    }

    /// <inheritdoc />
    public IReadOnlyList<PolicyPackRuleTemplateItem> ListRuleTemplates() =>
        _policyPackRuleTemplatesService.ListTemplates();
}
