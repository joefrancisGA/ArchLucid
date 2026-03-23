using System.Data;

using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Repositories;

public class InMemoryGoldenManifestRepository : IGoldenManifestRepository
{
    private readonly List<GoldenManifest> _store = [];
    private readonly Lock _lock = new();

    public Task SaveAsync(
        GoldenManifest manifest,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = ct;
        _ = connection;
        _ = transaction;
        lock (_lock)
        {
            _store.Add(manifest);
        }
        return Task.CompletedTask;
    }

    public Task<GoldenManifest?> GetByIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        lock (_lock)
        {
            var result = _store.FirstOrDefault(x =>
                x.ManifestId == manifestId &&
                x.TenantId == scope.TenantId &&
                x.WorkspaceId == scope.WorkspaceId &&
                x.ProjectId == scope.ProjectId);
            return Task.FromResult(result);
        }
    }
}

