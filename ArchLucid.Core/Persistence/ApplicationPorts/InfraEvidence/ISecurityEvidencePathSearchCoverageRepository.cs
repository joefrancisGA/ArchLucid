using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathSearchCoverageRepository
{
    Task ReplaceForEngineAsync(
        ScopeContext scope,
        Guid snapshotId,
        string engineName,
        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> rows,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathSearchCoverageRecord>> ListBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);
}
