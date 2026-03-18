using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Repositories;

public class InMemoryFindingsSnapshotRepository : IFindingsSnapshotRepository
{
    private readonly List<FindingsSnapshot> _store = new();

    public Task SaveAsync(FindingsSnapshot snapshot, CancellationToken ct)
    {
        _store.Add(snapshot);
        return Task.CompletedTask;
    }

    public Task<FindingsSnapshot?> GetByIdAsync(Guid findingsSnapshotId, CancellationToken ct)
    {
        var result = _store.FirstOrDefault(x => x.FindingsSnapshotId == findingsSnapshotId);
        return Task.FromResult(result);
    }
}

