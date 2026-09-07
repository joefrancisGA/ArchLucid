using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Evidence;

public interface IRunStoredEvidenceFileRepository
{
    Task InsertAsync(RunStoredEvidenceFileRecord record, CancellationToken cancellationToken);

    Task<IReadOnlyList<RunStoredEvidenceFileRecord>> ListByRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken);

    Task<RunStoredEvidenceFileRecord?> TryGetByEvidenceItemIdAsync(
        ScopeContext scope,
        Guid runId,
        string evidenceItemId,
        CancellationToken cancellationToken);
}
