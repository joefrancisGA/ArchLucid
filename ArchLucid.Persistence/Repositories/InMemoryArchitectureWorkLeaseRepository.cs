using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

public sealed class InMemoryArchitectureWorkLeaseRepository : IArchitectureWorkLeaseRepository
{
    private readonly Dictionary<Guid, ArchitectureWorkLeaseRecord> _byDraftId = new();

    public Task<ArchitectureWorkLeaseRecord?> TryGetByDraftIdAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        if (!_byDraftId.TryGetValue(draftId, out ArchitectureWorkLeaseRecord? record))
        {
            return Task.FromResult<ArchitectureWorkLeaseRecord?>(null);
        }

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.FromResult<ArchitectureWorkLeaseRecord?>(null);
        }

        return Task.FromResult<ArchitectureWorkLeaseRecord?>(Clone(record));
    }

    public Task UpsertAsync(
        ScopeContext scope,
        ArchitectureWorkLeaseRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);
        _ = cancellationToken;

        _byDraftId[record.DraftId] = Clone(record);

        return Task.CompletedTask;
    }

    public Task<bool> TryDeleteByDraftIdForHolderAsync(
        ScopeContext scope,
        Guid draftId,
        Guid holderUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        if (!_byDraftId.TryGetValue(draftId, out ArchitectureWorkLeaseRecord? record))
        {
            return Task.FromResult(false);
        }

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId
            || record.HolderUserId != holderUserId)
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(_byDraftId.Remove(draftId));
    }

    private static ArchitectureWorkLeaseRecord Clone(ArchitectureWorkLeaseRecord record) =>
        new()
        {
            DraftId = record.DraftId,
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ScopeProjectId = record.ScopeProjectId,
            ArchitectureId = record.ArchitectureId,
            HolderUserId = record.HolderUserId,
            AcquiredUtc = record.AcquiredUtc,
            LastHeartbeatUtc = record.LastHeartbeatUtc,
            ExpiresUtc = record.ExpiresUtc,
            RowVersion = record.RowVersion,
        };
}
