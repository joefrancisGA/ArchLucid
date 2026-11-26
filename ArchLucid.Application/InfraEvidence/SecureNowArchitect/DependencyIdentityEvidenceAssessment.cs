using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record DependencyIdentityEvidenceAssessment(bool BindingEvidenceAvailable,
    IReadOnlyList<DependencyIdentityExposure> Exposures);
