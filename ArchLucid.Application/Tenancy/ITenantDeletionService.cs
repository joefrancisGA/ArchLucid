using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>Orchestrates full tenant offboarding (blobs, SQL hard purge including optional tenant audit rows, platform audit).</summary>
public interface ITenantDeletionService
{
    Task<TenantDeletionResult> DeleteTenantAsync(
        Guid tenantId,
        TenantDeletionInvocation invocation,
        CancellationToken cancellationToken);
}
