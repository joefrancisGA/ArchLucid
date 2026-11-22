using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityEvidencePathExplanationRepository : ISecurityEvidencePathExplanationRepository
{
    public Task InsertAsync(SecurityEvidencePathExplanationRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<SecurityEvidencePathExplanationRecord>> ListByPathIdAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<SecurityEvidencePathExplanationRecord>>([]);
    }
}
