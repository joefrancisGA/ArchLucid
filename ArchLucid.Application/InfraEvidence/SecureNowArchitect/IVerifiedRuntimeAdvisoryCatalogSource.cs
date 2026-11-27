using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal interface IVerifiedRuntimeAdvisoryCatalogSource
{
    Task<VerifiedRuntimeAdvisoryCatalog?> ReadAsync(RuntimeObservationRequest request, CancellationToken ct);
}
