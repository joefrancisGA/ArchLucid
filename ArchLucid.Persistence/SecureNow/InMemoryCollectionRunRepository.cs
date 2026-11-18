using System.Collections.Concurrent;
using System.Data.SqlTypes;

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
        cancellationToken.ThrowIfCancellationRequested();
        CollectionRun snapshot = CopyHash(collectionRun);
        _runs.AddOrUpdate(
            Key(collectionRun.TenantId, collectionRun.WorkspaceId, collectionRun.ProjectId, collectionRun.RunId),
            snapshot,
            (_, current) => snapshot.Status == CollectionRunStatus.Running && current.Status != CollectionRunStatus.Running
                ? current
                : snapshot);
        return Task.CompletedTask;
    }

    public Task<CollectionRun?> GetAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        CollectionRun? result = _runs.TryGetValue(Key(scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId), out CollectionRun? run)
            ? CopyHash(run)
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
        cancellationToken.ThrowIfCancellationRequested();
        int safeOffset = Math.Max(0, offset);
        int safeLimit = Math.Clamp(limit, 1, 100);
        IReadOnlyList<CollectionRun> result = _runs.Values
            .Where(run => IsInScope(run, scope))
            .OrderByDescending(run => run.StartedUtc)
            .ThenByDescending(run => new SqlGuid(run.RunId))
            .Skip(safeOffset)
            .Take(safeLimit)
            .Select(CopyHash)
            .ToArray();
        return Task.FromResult(result);
    }

    public Task<Guid?> FindImportedSnapshotIdByHashAsync(
        ScopeContext scope,
        byte[] zipSha256,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(zipSha256);
        cancellationToken.ThrowIfCancellationRequested();
        Guid? result = _runs.Values
            .Where(run =>
                IsInScope(run, scope) &&
                run.Status == CollectionRunStatus.Imported &&
                run.ImportedSnapshotId.HasValue &&
                run.ZipSha256 is not null &&
                run.ZipSha256.SequenceEqual(zipSha256))
            .OrderByDescending(run => run.StartedUtc)
            .ThenByDescending(run => new SqlGuid(run.RunId))
            .Select(run => run.ImportedSnapshotId)
            .FirstOrDefault();
        return Task.FromResult(result);
    }

    private static CollectionRun CopyHash(CollectionRun run) =>
        run.ZipSha256 is byte[] hash ? run with { ZipSha256 = (byte[])hash.Clone() } : run;

    private static bool IsInScope(CollectionRun run, ScopeContext scope) =>
        run.TenantId == scope.TenantId &&
        run.WorkspaceId == scope.WorkspaceId &&
        run.ProjectId == scope.ProjectId;

    private static string Key(Guid tenantId, Guid workspaceId, Guid projectId, Guid runId) =>
        $"{tenantId:N}:{workspaceId:N}:{projectId:N}:{runId:N}";
}
