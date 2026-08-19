using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>Builds paid-tenant usage headroom for expansion nudges (Improvement #5).</summary>
public interface ITenantUsageStatusService
{
    Task<TenantUsageStatusSnapshot?> BuildAsync(Guid tenantId, CancellationToken cancellationToken);
}
