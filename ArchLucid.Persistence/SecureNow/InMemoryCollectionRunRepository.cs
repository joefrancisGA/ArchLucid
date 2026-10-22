using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

namespace ArchLucid.Persistence.SecureNow;

public sealed class InMemoryCollectionRunRepository : ICollectionRunRepository
{
    private readonly ConcurrentDictionary<string, CollectionRun> _runs = new(StringComparer.Ordinal);

    public Task UpsertAsync(CollectionRun collectionRun, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(collectionRun);
        _runs[Key(collectionRun.TenantId, collectionRun.WorkspaceId, collectionRun.ProjectId, collectionRun.RunId)] = collectionRun;
        return Task.CompletedTask;
    }

    public Task<CollectionRun?> GetAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        CollectionRun? result = _runs.TryGetValue(Key(scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId), out CollectionRun? run)
            ? run
            : null;
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<CollectionRun>> ListAsync(
        ScopeContext scope,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        int safeOffset = Math.Max(0, offset);
        int safeLimit = Math.Clamp(limit, 1, 100);
        IReadOnlyList<CollectionRun> result = _runs.Values
            .Where(run => IsInScope(run, scope))
            .OrderByDescending(run => run.StartedUtc)
            .ThenByDescending(run => run.RunId)
            .Skip(safeOffset)
            .Take(safeLimit)
            .ToArray();
        return Task.FromResult(result);
    }

    public Task<bool> HasImportedHashAsync(
        ScopeContext scope,
        byte[] zipSha256,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(zipSha256);
        bool result = _runs.Values.Any(run =>
            IsInScope(run, scope) &&
            run.Status == CollectionRunStatus.Imported &&
            run.ZipSha256 is not null &&
            run.ZipSha256.SequenceEqual(zipSha256));
        return Task.FromResult(result);
    }

    private static bool IsInScope(CollectionRun run, ScopeContext scope) =>
        run.TenantId == scope.TenantId &&
        run.WorkspaceId == scope.WorkspaceId &&
        run.ProjectId == scope.ProjectId;

    private static string Key(Guid tenantId, Guid workspaceId, Guid projectId, Guid runId) =>
        $"{tenantId:N}:{workspaceId:N}:{projectId:N}:{runId:N}";
}
