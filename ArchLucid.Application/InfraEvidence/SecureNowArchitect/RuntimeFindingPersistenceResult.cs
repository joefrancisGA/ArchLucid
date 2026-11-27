using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeFindingPersistenceResult(bool CatalogCurrent, bool Persisted, int Candidates);
