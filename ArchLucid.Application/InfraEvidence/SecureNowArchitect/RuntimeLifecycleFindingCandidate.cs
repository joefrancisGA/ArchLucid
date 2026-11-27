using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeLifecycleFindingCandidate(RuntimeObservationRequest Scope, string InstanceId,
    string ReleaseLine, string LifecycleEvidenceId, string CatalogEvidenceId, string RuntimeEvidenceReference);
