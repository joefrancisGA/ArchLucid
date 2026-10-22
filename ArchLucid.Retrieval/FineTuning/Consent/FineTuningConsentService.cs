using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Consent;

/// <summary>Tenant-settings backed manifest fine-tuning consent (default disabled).</summary>
public sealed class FineTuningConsentService(IFineTuningManifestConsentReader consentReader) : IFineTuningConsentService
{
    private readonly IFineTuningManifestConsentReader _consentReader =
        consentReader ?? throw new ArgumentNullException(nameof(consentReader));

    /// <inheritdoc />
    public async Task<FineTuningConsentStatus> GetConsentAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        string? raw = await _consentReader
            .TryGetRawConsentAsync(tenantId, cancellationToken)
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
