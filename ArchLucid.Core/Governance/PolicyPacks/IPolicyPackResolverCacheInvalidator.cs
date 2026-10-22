namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Bumps tenant-scoped revision stamps so cached <see cref="IPolicyPackResolver" /> results refresh after
///     assignment or publish mutations.
/// </summary>
public interface IPolicyPackResolverCacheInvalidator
{
    Task InvalidateTenantAsync(Guid tenantId, CancellationToken ct);
}
