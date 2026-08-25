using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>
///     Default <see cref="IPolicyPackWorkflowFacade"/> consolidating policy pack route orchestration previously in
///     <c>PolicyPacksController</c>.
/// </summary>
public sealed class PolicyPackWorkflowFacade(
    IScopeContextProvider scopeProvider,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IPolicyPackCatalogRepository policyPackCatalogRepository,
    ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver resolver,
    ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader governanceLoader,
    IPolicyPacksAppService policyPacksApp,
    IPolicyPackCatalogAdminService policyPackCatalogAdminService,
    IPolicyPackGovernanceDryRunService policyPackGovernanceDryRunService,
    IPolicyPackMarkdownExplainService policyPackMarkdownExplainService,
    IPolicyPackRuleTemplatesService policyPackRuleTemplatesService,
    IPolicyPackContentAuthoringValidationService policyPackContentAuthoringValidationService,
    PolicyPackWorkspaceSelectionService workspaceSelectionService,
    IPlatformBundledPolicyPackAvailability platformAvailability,
    IAuditService auditService) : IPolicyPackWorkflowFacade
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackVersionRepository _versionRepository =
        versionRepository ?? throw new ArgumentNullException(nameof(versionRepository));

    private readonly IPolicyPackCatalogRepository _policyPackCatalogRepository =
        policyPackCatalogRepository ?? throw new ArgumentNullException(nameof(policyPackCatalogRepository));

    private readonly ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver _resolver =
        resolver ?? throw new ArgumentNullException(nameof(resolver));

    private readonly ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader _governanceLoader =
        governanceLoader ?? throw new ArgumentNullException(nameof(governanceLoader));

    private readonly IPolicyPacksAppService _policyPacksApp =
        policyPacksApp ?? throw new ArgumentNullException(nameof(policyPacksApp));

    private readonly IPolicyPackCatalogAdminService _policyPackCatalogAdminService =
        policyPackCatalogAdminService ?? throw new ArgumentNullException(nameof(policyPackCatalogAdminService));

    private readonly IPolicyPackGovernanceDryRunService _policyPackGovernanceDryRunService =
        policyPackGovernanceDryRunService ?? throw new ArgumentNullException(nameof(policyPackGovernanceDryRunService));

    private readonly IPolicyPackMarkdownExplainService _policyPackMarkdownExplainService =
        policyPackMarkdownExplainService ?? throw new ArgumentNullException(nameof(policyPackMarkdownExplainService));

    private readonly IPolicyPackRuleTemplatesService _policyPackRuleTemplatesService =
        policyPackRuleTemplatesService ?? throw new ArgumentNullException(nameof(policyPackRuleTemplatesService));

    private readonly IPolicyPackContentAuthoringValidationService _policyPackContentAuthoringValidationService =
        policyPackContentAuthoringValidationService
        ?? throw new ArgumentNullException(nameof(policyPackContentAuthoringValidationService));

    private readonly PolicyPackWorkspaceSelectionService _workspaceSelectionService =
        workspaceSelectionService ?? throw new ArgumentNullException(nameof(workspaceSelectionService));

    private readonly IPlatformBundledPolicyPackAvailability _platformAvailability =
        platformAvailability ?? throw new ArgumentNullException(nameof(platformAvailability));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<PolicyPack> CreatePackAsync(
        string name,
        string description,
        string packType,
        string initialContentJson,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return await _policyPacksApp.CreatePackAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            name,
            description,
            packType,
            initialContentJson,
            ct);
    }

    /// <inheritdoc />
    public async Task<PolicyPackVersion?> TryPublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return null;

        return await _policyPacksApp.PublishVersionAsync(policyPackId, version, contentJson, ct);
    }

    /// <inheritdoc />
    public async Task<PolicyPackAssignWorkflowResult> TryAssignAsync(
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return new PolicyPackAssignWorkflowResult(PolicyPackAssignOutcome.PackNotFound, null);

        PolicyPackAssignment? assignment = await _policyPacksApp.TryAssignAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            policyPackId,
            version,
            scopeLevel,
            isPinned,
            ct);

        if (assignment is null)
            return new PolicyPackAssignWorkflowResult(PolicyPackAssignOutcome.VersionNotFound, null);

        return new PolicyPackAssignWorkflowResult(PolicyPackAssignOutcome.Assigned, assignment);
    }

    /// <inheritdoc />
    public async Task<bool> TryArchiveAssignmentAsync(Guid assignmentId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        return await _policyPacksApp.TryArchiveAssignmentAsync(scope.TenantId, assignmentId, ct);
    }

    /// <inheritdoc />
    public async Task<bool> TrySoftDeletePackAsync(Guid policyPackId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return false;

        return await _policyPacksApp.TrySoftDeletePackAsync(scope.TenantId, policyPackId, ct);
    }

    /// <inheritdoc />
    public async Task<PolicyPack?> TryDuplicatePackAsync(Guid policyPackId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return null;

        return await _policyPacksApp.TryDuplicatePackAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            policyPackId,
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PolicyPack>> ListVisiblePacksAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        return await ListVisiblePacksInScopeAsync(scope, ct);
    }

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
    public async Task<bool> TrySetAssignmentEnabledAsync(Guid assignmentId, bool isEnabled, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        bool ok = await _workspaceSelectionService.TrySetAssignmentEnabledAsync(
            scope.TenantId,
            assignmentId,
            isEnabled,
            ct);

        if (!ok)
            return false;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PolicyPackAssignmentEnabledChanged,
                DataJson = JsonSerializer.Serialize(new { assignmentId, isEnabled }),
            },
            ct);

        return true;
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
        bool ok = await _policyPackCatalogAdminService.TryDemoteAsync(policyPackCatalogEntryId, ct);

        if (!ok)
            return false;

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

    /// <inheritdoc />
    public Task<PolicyPackGovernanceDryRunResult?> SimulateAsync(
        PolicyPackContentDocument content,
        string runId,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        Guid? proposedPolicyPackId,
        CancellationToken ct)
    {
        string policyPackContentJson = JsonSerializer.Serialize(content, ContractJson.CamelCaseIgnoreNullCompact);

        return _policyPackGovernanceDryRunService.EvaluateAsync(
            policyPackContentJson,
            runId.Trim(),
            targetManifestId: null,
            blockCommitOnCritical,
            blockCommitMinimumSeverity,
            proposedPolicyPackId,
            ct);
    }

    /// <inheritdoc />
    public async Task<PolicyPackSimulateBulkSummary?> TrySimulateBulkAsync(
        Guid policyPackId,
        IReadOnlyList<string> runIds,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return null;

        PolicyPackVersion? versionRow = await _versionRepository.GetByPackAndVersionAsync(
            policyPackId,
            pack!.CurrentVersion.Trim(),
            ct);

        if (versionRow is null)
        {
            IReadOnlyList<PolicyPackVersion> versions = await _versionRepository.ListByPackAsync(policyPackId, ct);
            PolicyPackVersion? latestMeta = versions.FirstOrDefault();

            if (latestMeta is not null)
            {
                versionRow = await _versionRepository.GetByPackAndVersionAsync(
                    policyPackId,
                    latestMeta.Version,
                    ct);
            }
        }

        if (versionRow is null || string.IsNullOrWhiteSpace(versionRow.ContentJson))
            return null;

        List<PolicyPackSimulateBulkRunOutcome> runResults = [];
        int wouldBlock = 0;
        int notFound = 0;
        int evaluated = 0;

        foreach (string runIdRaw in runIds.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(runIdRaw))
                continue;

            string runId = runIdRaw.Trim();
            PolicyPackGovernanceDryRunResult? dryRun = await _policyPackGovernanceDryRunService.EvaluateAsync(
                versionRow.ContentJson,
                runId,
                targetManifestId: null,
                blockCommitOnCritical,
                blockCommitMinimumSeverity,
                policyPackId,
                ct);

            if (dryRun is null)
            {
                notFound++;
                runResults.Add(new PolicyPackSimulateBulkRunOutcome { RunId = runId, Found = false });

                continue;
            }

            evaluated++;
            bool wouldBlockCommit = dryRun.GateResult.Blocked;

            if (wouldBlockCommit)
                wouldBlock++;

            runResults.Add(
                new PolicyPackSimulateBulkRunOutcome
                {
                    RunId = runId,
                    Found = true,
                    WouldBlockCommit = wouldBlockCommit,
                    Detail = dryRun,
                });
        }

        return new PolicyPackSimulateBulkSummary
        {
            PolicyPackId = policyPackId,
            PolicyPackVersion = versionRow.Version,
            RequestedRunCount = runIds.Count,
            EvaluatedRunCount = evaluated,
            NotFoundRunCount = notFound,
            WouldBlockCommitCount = wouldBlock,
            Results = runResults,
        };
    }

    /// <inheritdoc />
    public Task<PolicyPackContentValidationResponse> ValidateContentAsync(
        PolicyPackContentDocument document,
        CancellationToken ct) =>
        _policyPackContentAuthoringValidationService.ValidateAsync(document, ct);

    private async Task<IReadOnlyList<PolicyPack>> ListVisiblePacksInScopeAsync(ScopeContext scope, CancellationToken ct)
    {
        IReadOnlyList<PolicyPack> packs = await _packRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        List<PolicyPack> visiblePacks = [];

        foreach (PolicyPack pack in packs)
        {
            if (pack.IsDeleted)
                continue;

            if (!await _platformAvailability.IsGloballyActiveAsync(pack, ct))
                continue;

            visiblePacks.Add(pack);
        }

        return visiblePacks;
    }

    private static bool IsPackVisibleInScope(PolicyPack? pack, ScopeContext scope)
    {
        if (pack is null || pack.IsDeleted)
            return false;

        return pack.TenantId == scope.TenantId
            && pack.WorkspaceId == scope.WorkspaceId
            && pack.ProjectId == scope.ProjectId;
    }
}
