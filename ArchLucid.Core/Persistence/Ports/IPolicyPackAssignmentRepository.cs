using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence port for <see cref="PolicyPackAssignment" /> rows.</summary>
public interface IPolicyPackAssignmentRepository
{
    Task CreateAsync(PolicyPackAssignment assignment, CancellationToken ct);

    Task UpdateAsync(PolicyPackAssignment assignment, CancellationToken ct);

    Task<IReadOnlyList<PolicyPackAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<PolicyPackAssignment?> GetByTenantAndAssignmentIdAsync(Guid tenantId, Guid assignmentId, CancellationToken ct);

    Task<bool> ArchiveAsync(Guid tenantId, Guid assignmentId, CancellationToken ct);
}
