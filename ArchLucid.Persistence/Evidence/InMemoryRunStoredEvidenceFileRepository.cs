using System.Collections.Concurrent;

using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Evidence;

public sealed class InMemoryRunStoredEvidenceFileRepository : IRunStoredEvidenceFileRepository
{
    private readonly ConcurrentDictionary<string, RunStoredEvidenceFileRecord> _records = new();

    public Task InsertAsync(RunStoredEvidenceFileRecord record, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        ArgumentNullException.ThrowIfNull(record);

        if (!_records.TryAdd(record.EvidenceItemId, record))
            throw new InvalidOperationException($"Stored evidence item '{record.EvidenceItemId}' already exists.");

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<RunStoredEvidenceFileRecord>> ListByRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<RunStoredEvidenceFileRecord> rows = _records.Values
            .Where(record =>
                record.TenantId == scope.TenantId
                && record.WorkspaceId == scope.WorkspaceId
                && record.ScopeProjectId == scope.ProjectId
                && record.RunId == runId)
            .OrderBy(record => record.CreatedUtc)
            .ThenBy(record => record.OriginalFileName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<RunStoredEvidenceFileRecord?> TryGetByEvidenceItemIdAsync(
        ScopeContext scope,
        Guid runId,
        string evidenceItemId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(evidenceItemId))
        {
            return Task.FromResult<RunStoredEvidenceFileRecord?>(null);
        }

        if (!_records.TryGetValue(evidenceItemId.Trim(), out RunStoredEvidenceFileRecord? record))
        {
            return Task.FromResult<RunStoredEvidenceFileRecord?>(null);
        }

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId
            || record.RunId != runId)
        {
            return Task.FromResult<RunStoredEvidenceFileRecord?>(null);
        }

        return Task.FromResult<RunStoredEvidenceFileRecord?>(record);
    }
}
