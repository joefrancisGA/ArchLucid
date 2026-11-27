using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Only a server-selected, independently verified catalog provider may implement this contract.
internal sealed record VerifiedRuntimeAdvisoryCatalog(string EvidenceId, DateTimeOffset VerifiedAt,
    DateTimeOffset ValidUntil, IReadOnlyList<VerifiedRuntimeAdvisory> Entries)
{
    public IReadOnlyList<VerifiedRuntimeLifecycle> Lifecycles { get; init; } = [];
}
