namespace ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;

/// <summary>Reads raw manifest fine-tuning consent from durable tenant settings without pulling Retrieval into Persistence.</summary>
public interface IFineTuningManifestConsentReader
{
    Task<string?> TryGetRawConsentAsync(Guid tenantId, CancellationToken cancellationToken);
}
