namespace ArchLucid.Core.AiUsage;

public interface ITenantAiBudgetPolicyResolver
{
    Task<TenantAiBudgetPolicySnapshot> ResolveAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task<AiUsageWorkspaceKind> ResolveWorkspaceKindAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
