using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// The upstream verifier must establish artifact execution, deployment and identity links
// from authoritative sources. A dependency match alone does not establish identity exposure.
internal sealed record VerifiedDependencyIdentityBinding(
    RuntimeObservationRequest Scope, string ArtifactEvidenceId, string IdentityId,
    bool ArtifactExecuting, IReadOnlyList<string> GrantedCapabilities,
    string BindingEvidenceId, DateTimeOffset ObservedAt, DateTimeOffset ValidUntil);
