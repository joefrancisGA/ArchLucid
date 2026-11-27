using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record DependencyIdentityExposure(
    RuntimeObservationRequest Scope, string IdentityId, string DependencyEvidenceId,
    string BindingEvidenceId, IReadOnlyList<string> AdvisoryIds, IReadOnlyList<string> GrantedCapabilities);
