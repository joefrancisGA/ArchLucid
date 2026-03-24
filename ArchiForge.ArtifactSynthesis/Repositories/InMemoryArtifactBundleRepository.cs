using System.Data;

using ArchiForge.ArtifactSynthesis.Interfaces;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.Core.Scoping;

namespace ArchiForge.ArtifactSynthesis.Repositories;

public class InMemoryArtifactBundleRepository : IArtifactBundleRepository
{
    private readonly List<ArtifactBundle> _store = [];
    private readonly Lock _lock = new();

    public Task SaveAsync(
        ArtifactBundle bundle,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = ct;
        _ = connection;
        _ = transaction;
        lock (_lock)
        {
            _store.Add(bundle);
        }
        return Task.CompletedTask;
    }

    public Task<ArtifactBundle?> GetByManifestIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        lock (_lock)
        {
            var result = _store.LastOrDefault(x =>
                x.ManifestId == manifestId &&
                x.TenantId == scope.TenantId &&
                x.WorkspaceId == scope.WorkspaceId &&
                x.ProjectId == scope.ProjectId);
            return Task.FromResult(result);
        }
    }
}
