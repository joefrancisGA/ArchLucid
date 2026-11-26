using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeSecurityExecutionResult(bool Published, bool CatalogCurrent, bool Persisted, int Candidates);
