using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

/// <inheritdoc cref="IPolicyPackAssignStage" />
public sealed class PolicyPackAssignStage(
    IPolicyPackAssignmentRepository assignmentRepository,
    IPolicyPackResolverCacheInvalidator policyPackResolverCacheInvalidator,
    IPolicyPackChangeLogAppender changeLogAppender) : IPolicyPackAssignStage
{
    private readonly IPolicyPackAssignmentRepository _assignmentRepository =
        assignmentRepository ?? throw new ArgumentNullException(nameof(assignmentRepository));

    private readonly IPolicyPackResolverCacheInvalidator _policyPackResolverCacheInvalidator =
        policyPackResolverCacheInvalidator ?? throw new ArgumentNullException(nameof(policyPackResolverCacheInvalidator));

    private readonly IPolicyPackChangeLogAppender _changeLogAppender =
        changeLogAppender ?? throw new ArgumentNullException(nameof(changeLogAppender));

    public async Task<PolicyPackAssignment> AssignAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        bool isOrganizationRequired = false,
        bool isEnabled = true,
        CancellationToken ct = default)
    {
        string normalized = GovernanceScopeLevel.TryNormalize(scopeLevel) ?? GovernanceScopeLevel.Project;

        Guid ws = workspaceId;
        Guid proj = projectId;

        if (string.Equals(normalized, GovernanceScopeLevel.Tenant, StringComparison.Ordinal))
        {
            ws = Guid.Empty;
            proj = Guid.Empty;
        }
        else if (string.Equals(normalized, GovernanceScopeLevel.Workspace, StringComparison.Ordinal))
            proj = Guid.Empty;

        IReadOnlyList<PolicyPackAssignment> existingAssignments =
            await _assignmentRepository.ListByScopeAsync(tenantId, ws, proj, ct)
            ?? Array.Empty<PolicyPackAssignment>();

        PolicyPackAssignment? matchingAssignment = existingAssignments.FirstOrDefault(assignment =>
            !assignment.ArchivedUtc.HasValue
            && assignment.PolicyPackId == policyPackId
            && string.Equals(assignment.PolicyPackVersion, version, StringComparison.OrdinalIgnoreCase)
            && string.Equals(assignment.ScopeLevel, normalized, StringComparison.Ordinal)
            && assignment.IsPinned == isPinned
            && assignment.IsOrganizationRequired == isOrganizationRequired
            && assignment.IsEnabled == isEnabled);

        if (matchingAssignment is not null)
            return matchingAssignment;

        PolicyPackAssignment assignment = new()
        {
            AssignmentId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = ws,
            ProjectId = proj,
            PolicyPackId = policyPackId,
            PolicyPackVersion = version,
            IsEnabled = isEnabled,
            ScopeLevel = normalized,
            IsPinned = isPinned,
            IsOrganizationRequired = isOrganizationRequired,
            AssignedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await _assignmentRepository.CreateAsync(assignment, ct);

        await _policyPackResolverCacheInvalidator.InvalidateTenantAsync(tenantId, ct);

        string assignJson = JsonSerializer.Serialize(
            new { scopeLevel = normalized, version, isPinned, isOrganizationRequired },
            PolicyPackChangeLogAppender.ChangeLogJsonOptions);

        await _changeLogAppender.AppendAsync(
            policyPackId,
            tenantId,
            ws,
            proj,
            PolicyPackChangeTypes.Assigned,
            "system",
            null,
            assignJson,
            $"Pack '{policyPackId}' assigned at {normalized} scope, version '{version}'.",
            ct);

        return assignment;
    }

    public async Task<bool> TryArchiveAssignmentAsync(Guid tenantId, Guid assignmentId, CancellationToken ct)
    {
        bool ok = await _assignmentRepository.ArchiveAsync(tenantId, assignmentId, ct);

        if (!ok)
        {
            PolicyPackAssignment? existing =
                await _assignmentRepository.GetByTenantAndAssignmentIdAsync(tenantId, assignmentId, ct);

            if (existing is not null && existing.ArchivedUtc.HasValue)
                return true;

            return false;
        }

        PolicyPackAssignment? row =
            await _assignmentRepository.GetByTenantAndAssignmentIdAsync(tenantId, assignmentId, ct);

        if (row is null)
            return true;

        await _policyPackResolverCacheInvalidator.InvalidateTenantAsync(row.TenantId, ct);

        await _changeLogAppender.AppendAsync(
            row.PolicyPackId,
            row.TenantId,
            row.WorkspaceId,
            row.ProjectId,
            PolicyPackChangeTypes.AssignmentArchived,
            "system",
            null,
            null,
            $"Assignment '{assignmentId}' archived.",
            ct);

        return true;
    }
}
