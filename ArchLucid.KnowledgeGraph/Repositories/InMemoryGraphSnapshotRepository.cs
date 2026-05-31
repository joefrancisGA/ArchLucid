using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Repositories;

public class InMemoryGraphSnapshotRepository : IGraphSnapshotRepository
{
    private const int MaxEntries = 500;
    private readonly Lock _lock = new();
    private readonly Dictionary<Guid, GraphSnapshot> _store = [];
    private readonly Dictionary<Guid, ScopeContext> _scopeBySnapshotId = [];
    private readonly IScopeContextProvider? _scopeContextProvider;

    public InMemoryGraphSnapshotRepository()
    {
    }

    public InMemoryGraphSnapshotRepository(IScopeContextProvider scopeContextProvider)
    {
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    }

    public Task SaveAsync(
        GraphSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ct.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;
        ScopeContext? savedScope = CaptureScopeAtSave();
        lock (_lock)
        {
            _store[snapshot.GraphSnapshotId] = snapshot;

            if (savedScope is not null)
                _scopeBySnapshotId[snapshot.GraphSnapshotId] = savedScope;
            else
                _scopeBySnapshotId.Remove(snapshot.GraphSnapshotId);

            if (_store.Count <= MaxEntries)
                return Task.CompletedTask;

            Guid oldest = _store.Keys.First();
            _store.Remove(oldest);
            _scopeBySnapshotId.Remove(oldest);
        }

        return Task.CompletedTask;
    }

    public Task<GraphSnapshot?> GetByIdAsync(ScopeContext scope, Guid graphSnapshotId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_lock)
        {
            if (!_store.TryGetValue(graphSnapshotId, out GraphSnapshot? result))
                return Task.FromResult<GraphSnapshot?>(null);

            if (_scopeBySnapshotId.TryGetValue(graphSnapshotId, out ScopeContext? savedScope)
                && !ScopeMatches(savedScope, scope))
            {
                return Task.FromResult<GraphSnapshot?>(null);
            }

            return Task.FromResult<GraphSnapshot?>(result);
        }
    }

    public Task<GraphSnapshot?> GetLatestByContextSnapshotIdAsync(
        ScopeContext scope,
        Guid contextSnapshotId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_lock)
        {
            GraphSnapshot? latest = _store.Values
                .Where(s => s.ContextSnapshotId == contextSnapshotId)
                .Where(s => SnapshotVisibleUnderScope(s.GraphSnapshotId, scope))
                .OrderByDescending(s => s.CreatedUtc)
                .FirstOrDefault();

            return Task.FromResult(latest);
        }
    }

    public Task<IReadOnlyList<GraphSnapshotIndexedEdge>> ListIndexedEdgesAsync(Guid graphSnapshotId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_lock)
        {
            if (!_store.TryGetValue(graphSnapshotId, out GraphSnapshot? snapshot))
                return Task.FromResult<IReadOnlyList<GraphSnapshotIndexedEdge>>([]);

            IReadOnlyList<GraphSnapshotIndexedEdge> edges = snapshot.Edges
                .Select(e => new GraphSnapshotIndexedEdge(e.EdgeId, e.FromNodeId, e.ToNodeId, e.EdgeType, e.Weight))
                .OrderBy(e => e.EdgeId, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return Task.FromResult(edges);
        }
    }

    private bool SnapshotVisibleUnderScope(Guid graphSnapshotId, ScopeContext scope)
    {
        if (!_scopeBySnapshotId.TryGetValue(graphSnapshotId, out ScopeContext? savedScope))
            return true;

        return ScopeMatches(savedScope, scope);
    }

    private ScopeContext? CaptureScopeAtSave()
    {
        if (_scopeContextProvider is null)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        return scope;
    }

    private static bool ScopeMatches(ScopeContext saved, ScopeContext requested)
    {
        if (requested.TenantId == Guid.Empty)
            return true;

        return saved.TenantId == requested.TenantId
               && saved.WorkspaceId == requested.WorkspaceId
               && saved.ProjectId == requested.ProjectId;
    }
}
