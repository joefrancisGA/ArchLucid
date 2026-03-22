using ArchiForge.Decisioning.Governance.PolicyPacks;
using ArchiForge.Decisioning.Governance.Resolution;

namespace ArchiForge.Persistence.Governance;

public sealed class InMemoryPolicyPackAssignmentRepository : IPolicyPackAssignmentRepository
{
    private readonly List<PolicyPackAssignment> _items = [];
    private readonly object _gate = new();

    public Task CreateAsync(PolicyPackAssignment assignment, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
            _items.Add(assignment);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(PolicyPackAssignment assignment, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            var i = _items.FindIndex(x => x.AssignmentId == assignment.AssignmentId);
            if (i >= 0)
                _items[i] = assignment;
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<PolicyPackAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            var result = _items
                .Where(x => x.TenantId == tenantId)
                .Where(x =>
                    string.Equals(x.ScopeLevel, GovernanceScopeLevel.Tenant, StringComparison.Ordinal) ||
                    (string.Equals(x.ScopeLevel, GovernanceScopeLevel.Workspace, StringComparison.Ordinal) &&
                     x.WorkspaceId == workspaceId) ||
                    (string.Equals(x.ScopeLevel, GovernanceScopeLevel.Project, StringComparison.Ordinal) &&
                     x.WorkspaceId == workspaceId && x.ProjectId == projectId))
                .OrderByDescending(x => x.AssignedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<PolicyPackAssignment>>(result);
        }
    }
}
