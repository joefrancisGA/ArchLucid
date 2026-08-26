using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Roi;

public interface IRealizedValueAttestationService
{
    Task<RealizedValueAttestationResponse> GetAttestationAsync(
        Guid tenantId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task SaveAttestationAsync(
        Guid tenantId,
        Guid workspaceId,
        UpsertRealizedValueAttestationRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class RealizedValueAttestationService(ITenantSettingsRepository tenantSettingsRepository)
    : IRealizedValueAttestationService
{
    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public Task<RealizedValueAttestationResponse> GetAttestationAsync(
        Guid tenantId,
        Guid workspaceId,
        CancellationToken cancellationToken = default) =>
        RealizedValueMetricsCalculator.LoadAttestationResponseAsync(
            _tenantSettingsRepository,
            tenantId,
            workspaceId,
            cancellationToken);

    public Task SaveAttestationAsync(
        Guid tenantId,
        Guid workspaceId,
        UpsertRealizedValueAttestationRequest request,
        CancellationToken cancellationToken = default) =>
        RealizedValueMetricsCalculator.SaveAttestationAsync(
            _tenantSettingsRepository,
            tenantId,
            workspaceId,
            request,
            cancellationToken);
}
