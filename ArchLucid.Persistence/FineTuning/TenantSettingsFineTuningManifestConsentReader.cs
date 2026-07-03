using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.FineTuning;

/// <summary>Tenant-settings backed manifest fine-tuning consent reader (default unset).</summary>
public sealed class TenantSettingsFineTuningManifestConsentReader(
    ITenantSettingsRepository tenantSettingsRepository) : IFineTuningManifestConsentReader
{
    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    /// <inheritdoc />
    public Task<string?> TryGetRawConsentAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _tenantSettingsRepository.TryGetAsync(tenantId, TenantSettingKeys.FineTuningManifestConsent, cancellationToken);
}
