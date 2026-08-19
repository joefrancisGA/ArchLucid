using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Consent;

/// <summary>Reads and validates tenant manifest fine-tuning consent.</summary>
public interface IFineTuningConsentService
{
    Task<FineTuningConsentStatus> GetConsentAsync(Guid tenantId, CancellationToken cancellationToken);

    Task RequireExportConsentAsync(Guid tenantId, CancellationToken cancellationToken);
}
