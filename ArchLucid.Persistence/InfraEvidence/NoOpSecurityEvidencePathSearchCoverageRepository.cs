using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityEvidencePathSearchCoverageRepository : ISecurityEvidencePathSearchCoverageRepository
{
    public Task ReplaceForEngineAsync(
        ScopeContext scope,
        Guid snapshotId,
        string engineName,
        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> rows,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(rows);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<SecurityEvidencePathSearchCoverageRecord>> ListBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult<IReadOnlyList<SecurityEvidencePathSearchCoverageRecord>>([]);
    }
}
