using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal interface IRuntimeFindingJournal
{
    Task<bool> AppendAsync(RuntimeObservationRequest request, RuntimeCatalogAssessment assessment, CancellationToken ct);
}
