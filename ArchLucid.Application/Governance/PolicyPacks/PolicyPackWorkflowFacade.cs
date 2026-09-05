using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>
///     Default <see cref="IPolicyPackWorkflowFacade"/> consolidating policy pack route orchestration previously in
///     <c>PolicyPacksController</c>.
/// </summary>
public sealed partial class PolicyPackWorkflowFacade(
    IScopeContextProvider scopeProvider,
    IPolicyPackRepository packRepository,
    IPolicyPackAssignmentRepository assignmentRepository,
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

    private readonly IPolicyPackAssignmentRepository _assignmentRepository =
        assignmentRepository ?? throw new ArgumentNullException(nameof(assignmentRepository));

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
        bool isOrganizationRequired,
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
            isOrganizationRequired,
            ct);

        if (assignment is null)
            return new PolicyPackAssignWorkflowResult(PolicyPackAssignOutcome.VersionNotFound, null);

        return new PolicyPackAssignWorkflowResult(PolicyPackAssignOutcome.Assigned, assignment);
    }

    /// <inheritdoc />
    public async Task<bool> TryArchiveAssignmentAsync(Guid assignmentId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPackAssignment? assignment =
            await _assignmentRepository.GetByTenantAndAssignmentIdAsync(scope.TenantId, assignmentId, ct);

        if (!PolicyPackAssignmentScope.IsVisibleInScope(assignment, scope))
            return false;

        if (PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment))
            return false;

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
    public async Task<bool> TrySetAssignmentEnabledAsync(Guid assignmentId, bool isEnabled, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        PolicyPackAssignment? existing =
            await _assignmentRepository.GetByTenantAndAssignmentIdAsync(scope.TenantId, assignmentId, ct);

        bool valueUnchanged = existing is not null
            && PolicyPackAssignmentScope.IsVisibleInScope(existing, scope)
            && existing.IsEnabled == isEnabled;

        bool ok = await _workspaceSelectionService.TrySetAssignmentEnabledAsync(
            scope,
            assignmentId,
            isEnabled,
            ct);

        if (!ok)
            return false;

        if (!valueUnchanged)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.PolicyPackAssignmentEnabledChanged,
                    DataJson = JsonSerializer.Serialize(new { assignmentId, isEnabled }),
                },
                ct);
        }

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> TrySetAssignmentOrganizationRequiredAsync(
        Guid assignmentId,
        bool isOrganizationRequired,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        PolicyPackAssignment? existing =
            await _assignmentRepository.GetByTenantAndAssignmentIdAsync(scope.TenantId, assignmentId, ct);

        bool valueUnchanged = existing is not null
            && PolicyPackAssignmentScope.IsVisibleInScope(existing, scope)
            && existing.IsOrganizationRequired == isOrganizationRequired;

        bool ok = await _workspaceSelectionService.TrySetAssignmentOrganizationRequiredAsync(
            scope,
            assignmentId,
            isOrganizationRequired,
            ct);

        if (!ok)
            return false;

        if (!valueUnchanged)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.PolicyPackAssignmentOrganizationRequiredChanged,
                    DataJson = JsonSerializer.Serialize(new { assignmentId, isOrganizationRequired }),
                },
                ct);
        }

        return true;
    }

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
