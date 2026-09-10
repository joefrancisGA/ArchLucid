using System.Collections.Concurrent;

using ArchLucid.Contracts.Operations;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Planning;

/// <summary>
///     Thread-safe in-memory <see cref="IAdvisoryDraftOperationRepository" /> for unit tests and
///     <see cref="SqlAdvisoryDraftOperationStore" /> persistence tests without SQL.
/// </summary>
public sealed class InMemoryAdvisoryDraftOperationRepository : IAdvisoryDraftOperationRepository
{
    private readonly ConcurrentDictionary<string, AdvisoryDraftOperationRow> _rows = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<AdvisoryDraftOperationRow?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid operationId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _rows.TryGetValue(BuildKey(tenantId, workspaceId, projectId, operationId), out AdvisoryDraftOperationRow? row);
        return Task.FromResult(row);
    }

    /// <inheritdoc />
    public Task<bool> TryInsertPendingAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);
        cancellationToken.ThrowIfCancellationRequested();

        string key = BuildKey(row.TenantId, row.WorkspaceId, row.ProjectId, row.OperationId);
        bool inserted = _rows.TryAdd(key, row);
        return Task.FromResult(inserted);
    }

    /// <inheritdoc />
    public Task<AdvisoryDraftOperationRow?> GetByOperationIdAsync(
        Guid operationId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        AdvisoryDraftOperationRow? match = _rows.Values.FirstOrDefault(row => row.OperationId == operationId);
        return Task.FromResult(match);
    }

    /// <inheritdoc />
    public Task UpdateAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);
        cancellationToken.ThrowIfCancellationRequested();

        string key = BuildKey(row.TenantId, row.WorkspaceId, row.ProjectId, row.OperationId);
        _rows[key] = row;
        return Task.CompletedTask;
    }

    private static string BuildKey(Guid tenantId, Guid workspaceId, Guid projectId, Guid operationId) =>
        $"{tenantId:N}:{workspaceId:N}:{projectId:N}:{operationId:N}";
}
