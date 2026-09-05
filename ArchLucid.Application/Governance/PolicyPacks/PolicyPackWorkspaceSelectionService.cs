using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>Workspace policy pack selection reads and assignment enablement toggles.</summary>
public sealed class PolicyPackWorkspaceSelectionService(
    IPolicyPackRepository packRepository,
    IPolicyPackAssignmentRepository assignmentRepository,
    IPlatformBundledPolicyPackAvailability platformAvailability,
    IPolicyPackResolverCacheInvalidator resolverCacheInvalidator)
{
    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackAssignmentRepository _assignmentRepository =
        assignmentRepository ?? throw new ArgumentNullException(nameof(assignmentRepository));

    private readonly IPlatformBundledPolicyPackAvailability _platformAvailability =
        platformAvailability ?? throw new ArgumentNullException(nameof(platformAvailability));

    private readonly IPolicyPackResolverCacheInvalidator _resolverCacheInvalidator =
        resolverCacheInvalidator ?? throw new ArgumentNullException(nameof(resolverCacheInvalidator));

    public async Task<IReadOnlyList<PolicyPackWorkspaceSelectionItem>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        IReadOnlyList<PolicyPack> packs =
            await _packRepository.ListByScopeAsync(tenantId, workspaceId, projectId, ct);

        IReadOnlyList<PolicyPackAssignment> assignments =
            await _assignmentRepository.ListByScopeAsync(tenantId, workspaceId, projectId, ct);

        Dictionary<Guid, PolicyPackAssignment> assignmentByPackId = assignments
            .GroupBy(static assignment => assignment.PolicyPackId)
            .ToDictionary(static group => group.Key, static group => group.First());

        List<PolicyPackWorkspaceSelectionItem> rows = [];

        foreach (PolicyPack pack in packs.OrderBy(static pack => pack.Name, StringComparer.Ordinal))
        {
            if (pack.IsDeleted)
                continue;

            bool isGloballyActive = await _platformAvailability.IsGloballyActiveAsync(pack, ct);

            if (!isGloballyActive)
                continue;

            if (!assignmentByPackId.TryGetValue(pack.PolicyPackId, out PolicyPackAssignment? assignment))
                continue;

            rows.Add(
                new PolicyPackWorkspaceSelectionItem
                {
                    PolicyPackId = pack.PolicyPackId,
                    AssignmentId = assignment.AssignmentId,
                    Name = pack.Name,
                    Description = pack.Description,
                    PackType = pack.PackType,
                    CurrentVersion = pack.CurrentVersion,
                    IsEnabled = assignment.IsEnabled,
                    IsGloballyActive = true,
                    IsOrganizationRequired = assignment.IsOrganizationRequired,
                });
        }

        return rows;
    }

    public async Task<bool> TrySetAssignmentEnabledAsync(
        ScopeContext scope,
        Guid assignmentId,
        bool isEnabled,
        CancellationToken ct)
    {
        PolicyPackAssignment? assignment =
            await _assignmentRepository.GetByTenantAndAssignmentIdAsync(scope.TenantId, assignmentId, ct);

        if (!PolicyPackAssignmentScope.IsVisibleInScope(assignment, scope))
            return false;

        PolicyPack? pack = await _packRepository.GetByIdAsync(assignment!.PolicyPackId, ct);

        if (pack is null || pack.TenantId != scope.TenantId)
            return false;

        if (isEnabled && !await _platformAvailability.IsGloballyActiveAsync(pack, ct))
            return false;

        if (!isEnabled && PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment))
            return false;

        if (assignment.IsEnabled == isEnabled)
            return true;

        assignment.IsEnabled = isEnabled;
        await _assignmentRepository.UpdateAsync(assignment, ct);
        await _resolverCacheInvalidator.InvalidateTenantAsync(scope.TenantId, ct);

        return true;
    }

    public async Task<bool> TrySetAssignmentOrganizationRequiredAsync(
        ScopeContext scope,
        Guid assignmentId,
        bool isOrganizationRequired,
        CancellationToken ct)
    {
        PolicyPackAssignment? assignment =
            await _assignmentRepository.GetByTenantAndAssignmentIdAsync(scope.TenantId, assignmentId, ct);

        if (!PolicyPackAssignmentScope.IsVisibleInScope(assignment, scope))
            return false;

        PolicyPack? pack = await _packRepository.GetByIdAsync(assignment!.PolicyPackId, ct);

        if (pack is null || pack.TenantId != scope.TenantId)
            return false;

        if (assignment.IsOrganizationRequired == isOrganizationRequired)
            return true;

        assignment.IsOrganizationRequired = isOrganizationRequired;

        if (isOrganizationRequired)
            assignment.IsEnabled = true;

        await _assignmentRepository.UpdateAsync(assignment, ct);
        await _resolverCacheInvalidator.InvalidateTenantAsync(scope.TenantId, ct);

        return true;
    }
}
