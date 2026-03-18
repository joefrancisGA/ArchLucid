using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Interfaces;

public interface IFindingsSnapshotRepository
{
    Task SaveAsync(FindingsSnapshot snapshot, CancellationToken ct);
    Task<FindingsSnapshot?> GetByIdAsync(Guid findingsSnapshotId, CancellationToken ct);
}

