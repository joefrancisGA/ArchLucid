using System.Data;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Scoping;

namespace ArchLucid.ArtifactSynthesis.Repositories;

public class InMemoryArtifactBundleRepository : IArtifactBundleRepository
{
    private const int MaxEntries = 500;
    private readonly Lock _lock = new();
    private readonly List<ArtifactBundle> _store = [];

    public Task SaveAsync(
        ArtifactBundle bundle,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ct.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;
        lock (_lock)
        {
            _store.Add(bundle);
            if (_store.Count > MaxEntries)
                _store.RemoveRange(0, _store.Count - MaxEntries);
        }

        return Task.CompletedTask;
    }

    public Task<ArtifactBundle?> GetByManifestIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        lock (_lock)
        {
            ArtifactBundle? result = _store.LastOrDefault(x =>
                x.ManifestId == manifestId &&
                x.TenantId == scope.TenantId &&
                x.WorkspaceId == scope.WorkspaceId &&
                x.ProjectId == scope.ProjectId);
            return Task.FromResult(result);
        }
    }
}
