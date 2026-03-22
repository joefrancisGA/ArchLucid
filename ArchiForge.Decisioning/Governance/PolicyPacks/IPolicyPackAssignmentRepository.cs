namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public interface IPolicyPackAssignmentRepository
{
    Task CreateAsync(PolicyPackAssignment assignment, CancellationToken ct);
    Task UpdateAsync(PolicyPackAssignment assignment, CancellationToken ct);

    Task<IReadOnlyList<PolicyPackAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
