using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Only independently authenticated, server-owned providers may supply these bindings.
internal interface IVerifiedDependencyIdentityBindingSource
{
    Task<IReadOnlyList<VerifiedDependencyIdentityBinding>?> ReadAsync(RuntimeObservationRequest request,
        CancellationToken ct);
}
