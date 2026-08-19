using System.Data;

using ArchLucid.Contracts.Scoping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Scoping;

namespace ArchLucid.ContextIngestion.Repositories;

public class InMemoryContextSnapshotRepository : IContextSnapshotRepository
{
    private const int MaxSnapshots = 500;
    private readonly Lock _lock = new();

    private readonly Dictionary<Guid, ContextSnapshot> _store = [];

    private readonly Dictionary<Guid, ReadScopeTriple> _scopeBySnapshotId = [];

    private readonly IScopeContextProvider? _scopeContextProvider;

    public InMemoryContextSnapshotRepository()
    {
    }

    public InMemoryContextSnapshotRepository(IScopeContextProvider scopeContextProvider)
    {
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    }

    public Task<ContextSnapshot?> GetLatestAsync(string projectId, CancellationToken ct)
    {
        _ = ct;
        lock (_lock)
        {
            ContextSnapshot? result = _store.Values
                .Where(s => string.Equals(s.ProjectId, projectId, StringComparison.Ordinal))
                .OrderByDescending(s => s.CreatedUtc)
                .FirstOrDefault();
            return Task.FromResult(result);
        }
    }

    public Task<ContextSnapshot?> GetByIdAsync(ReadScopeTriple scope, Guid snapshotId, CancellationToken ct)
    {
        _ = ct;
        lock (_lock)
        {
            if (!_store.TryGetValue(snapshotId, out ContextSnapshot? snapshot))
                return Task.FromResult<ContextSnapshot?>(null);

            if (_scopeBySnapshotId.TryGetValue(snapshotId, out ReadScopeTriple savedScope)
                && !ScopeMatches(savedScope, scope))
            {
                return Task.FromResult<ContextSnapshot?>(null);
            }

            return Task.FromResult<ContextSnapshot?>(snapshot);
        }
    }

    public Task SaveAsync(
        ContextSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = ct;
        _ = connection;
        _ = transaction;
        ReadScopeTriple? savedScope = CaptureScopeAtSave();
        lock (_lock)
        {
            _store[snapshot.SnapshotId] = snapshot;

            if (savedScope is ReadScopeTriple scopeTriple)
                _scopeBySnapshotId[snapshot.SnapshotId] = scopeTriple;
            else
                _scopeBySnapshotId.Remove(snapshot.SnapshotId);

            if (_store.Count <= MaxSnapshots)
                return Task.CompletedTask;

            List<Guid> toRemove = _store.Values
                .OrderBy(s => s.CreatedUtc)
                .Take(_store.Count - MaxSnapshots)
                .Select(s => s.SnapshotId)
                .ToList();

            foreach (Guid id in toRemove)
            {
                _store.Remove(id);
                _scopeBySnapshotId.Remove(id);
            }
        }

        return Task.CompletedTask;
    }

    private ReadScopeTriple? CaptureScopeAtSave()
    {
        if (_scopeContextProvider is null)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        return scope.ToReadScope();
    }

    private static bool ScopeMatches(ReadScopeTriple saved, ReadScopeTriple requested)
    {
        if (requested.TenantId == Guid.Empty)
            return true;

        return saved.TenantId == requested.TenantId
               && saved.WorkspaceId == requested.WorkspaceId
               && saved.ProjectId == requested.ProjectId;
    }
}
