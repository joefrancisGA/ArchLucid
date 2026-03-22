namespace ArchiForge.Decisioning.Alerts.Composite;

public interface ICompositeAlertRuleRepository
{
    Task CreateAsync(CompositeAlertRule rule, CancellationToken ct);
    Task UpdateAsync(CompositeAlertRule rule, CancellationToken ct);
    Task<CompositeAlertRule?> GetByIdAsync(Guid compositeRuleId, CancellationToken ct);

    Task<IReadOnlyList<CompositeAlertRule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<IReadOnlyList<CompositeAlertRule>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
