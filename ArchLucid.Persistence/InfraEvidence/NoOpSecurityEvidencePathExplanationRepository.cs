using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityEvidencePathExplanationRepository : ISecurityEvidencePathExplanationRepository
{
    public Task InsertAsync(SecurityEvidencePathExplanationRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<IReadOnlyList<SecurityEvidencePathExplanationRecord>> ListByPathIdAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<SecurityEvidencePathExplanationRecord>>([]);
}
