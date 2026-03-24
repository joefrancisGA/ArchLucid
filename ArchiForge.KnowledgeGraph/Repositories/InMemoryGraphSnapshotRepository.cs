using System.Data;

using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.KnowledgeGraph.Repositories;

public class InMemoryGraphSnapshotRepository : IGraphSnapshotRepository
{
    private readonly Dictionary<Guid, GraphSnapshot> _store = [];
    private readonly Lock _lock = new();

    public Task SaveAsync(
        GraphSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = ct;
        _ = connection;
        _ = transaction;
        lock (_lock)
        {
            _store[snapshot.GraphSnapshotId] = snapshot;
        }

        return Task.CompletedTask;
    }

    public Task<GraphSnapshot?> GetByIdAsync(Guid graphSnapshotId, CancellationToken ct)
    {
        _ = ct;
        lock (_lock)
        {
            _store.TryGetValue(graphSnapshotId, out var result);
            return Task.FromResult(result);
        }
    }
}
