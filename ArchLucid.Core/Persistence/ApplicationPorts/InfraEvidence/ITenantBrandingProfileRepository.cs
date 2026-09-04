using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ITenantBrandingProfileRepository
{
    Task InsertAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default);

    Task<TenantBrandingProfileRecord?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task<TenantBrandingProfileRecord?> TryGetDefaultAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task<int> CountActiveProfilesAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
