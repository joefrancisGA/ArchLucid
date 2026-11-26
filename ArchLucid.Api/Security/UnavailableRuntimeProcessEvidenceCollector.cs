using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Api.Security;

/// <summary>Default denies collection until a trusted workload collector is registered.</summary>
internal sealed class UnavailableRuntimeProcessEvidenceCollector : IRuntimeProcessEvidenceCollector
{
    public Task<RuntimeObservationBatch?> CollectExecutingAsync(RuntimeObservationRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult<RuntimeObservationBatch?>(null);
    }
}
