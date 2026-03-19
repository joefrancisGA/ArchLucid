using System.Collections.Concurrent;
using ArchiForge.Persistence.Interfaces;
using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Repositories;

public sealed class InMemoryRunRepository : IRunRepository
{
    private readonly ConcurrentDictionary<Guid, RunRecord> _store = new();

    public Task SaveAsync(RunRecord run, CancellationToken ct)
    {
        _ = ct;
        _store[run.RunId] = run;
        return Task.CompletedTask;
    }

    public Task<RunRecord?> GetByIdAsync(Guid runId, CancellationToken ct)
    {
        _ = ct;
        return Task.FromResult(_store.TryGetValue(runId, out var r) ? r : null);
    }

    public Task UpdateAsync(RunRecord run, CancellationToken ct)
    {
        _ = ct;
        _store[run.RunId] = run;
        return Task.CompletedTask;
    }
}
