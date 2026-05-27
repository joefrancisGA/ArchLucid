using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Roi;

public interface IRealizedValueAttestationService
{
    Task SaveAttestationAsync(
        Guid tenantId,
        UpsertRealizedValueAttestationRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class RealizedValueAttestationService(ITenantSettingsRepository tenantSettingsRepository)
    : IRealizedValueAttestationService
{
    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public Task SaveAttestationAsync(
        Guid tenantId,
        UpsertRealizedValueAttestationRequest request,
        CancellationToken cancellationToken = default) =>
        RealizedValueMetricsCalculator.SaveAttestationAsync(_tenantSettingsRepository, tenantId, request, cancellationToken);
}
