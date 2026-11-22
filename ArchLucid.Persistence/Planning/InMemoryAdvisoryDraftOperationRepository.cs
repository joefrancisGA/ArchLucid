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
        return Task.FromResult(row is null ? null : Copy(row));
    }

    /// <inheritdoc />
    public Task<bool> TryInsertPendingAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);
        cancellationToken.ThrowIfCancellationRequested();

        string key = BuildKey(row.TenantId, row.WorkspaceId, row.ProjectId, row.OperationId);
        bool inserted = _rows.TryAdd(key, Copy(row));
        return Task.FromResult(inserted);
    }

    /// <inheritdoc />
    public Task UpdateAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);
        cancellationToken.ThrowIfCancellationRequested();

        string key = BuildKey(row.TenantId, row.WorkspaceId, row.ProjectId, row.OperationId);
        if (_rows.ContainsKey(key))
            _rows[key] = Copy(row);
        return Task.CompletedTask;
    }

    private static AdvisoryDraftOperationRow Copy(AdvisoryDraftOperationRow row) =>
        new()
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            OperationId = row.OperationId,
            State = row.State,
            StepLabel = row.StepLabel,
            CurrentStep = row.CurrentStep,
            CreatedUtc = row.CreatedUtc,
            HeartbeatUtc = row.HeartbeatUtc,
            CompletedUtc = row.CompletedUtc,
            ResultJson = row.ResultJson,
            ErrorMessage = row.ErrorMessage,
        };

    private static string BuildKey(Guid tenantId, Guid workspaceId, Guid projectId, Guid operationId) =>
        $"{tenantId:N}:{workspaceId:N}:{projectId:N}:{operationId:N}";
}
