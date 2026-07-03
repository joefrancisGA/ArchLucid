using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Consent;

/// <summary>Tenant-settings backed manifest fine-tuning consent (default disabled).</summary>
public sealed class FineTuningConsentService(ITenantSettingsRepository tenantSettingsRepository) : IFineTuningConsentService
{
    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    /// <inheritdoc />
    public async Task<FineTuningConsentStatus> GetConsentAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        string? raw = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.FineTuningManifestConsent, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(raw))
            return FineTuningConsentStatus.Disabled;

        if (Enum.TryParse(raw.Trim(), ignoreCase: true, out FineTuningConsentStatus parsed))
            return parsed;

        return FineTuningConsentStatus.Disabled;
    }

    /// <inheritdoc />
    public async Task RequireExportConsentAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        FineTuningConsentStatus consent = await GetConsentAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (consent != FineTuningConsentStatus.Enabled)
        {
            throw new InvalidOperationException(
                "Manifest fine-tuning export requires tenant consent FineTuning.ManifestConsent=Enabled.");
        }
    }
}
