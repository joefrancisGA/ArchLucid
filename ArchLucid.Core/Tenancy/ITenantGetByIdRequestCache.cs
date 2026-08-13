namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Per-HTTP-request deduplication for <see cref="ITenantDirectoryReader.GetByIdAsync" /> (TB-2058).
/// </summary>
public interface ITenantGetByIdRequestCache
{
    Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct);
}
