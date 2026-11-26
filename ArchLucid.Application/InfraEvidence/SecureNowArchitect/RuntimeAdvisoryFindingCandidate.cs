using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeAdvisoryFindingCandidate(RuntimeObservationRequest Scope,
    string AdvisoryId, string AdvisoryEvidenceId, string CatalogEvidenceId,
    string RuntimeEvidenceReference, int ObservedInstances, bool CoverageComplete);
