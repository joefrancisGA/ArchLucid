using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts;

public sealed class ArchitectureWorkLeaseService(
    IDraftRequestRepository draftRepository,
    IArchitectureWorkLeaseRepository leaseRepository,
    IArchitectureWorkLeaseHolderResolver holderResolver) : IArchitectureWorkLeaseService
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IArchitectureWorkLeaseRepository _leaseRepository =
        leaseRepository ?? throw new ArgumentNullException(nameof(leaseRepository));

    private readonly IArchitectureWorkLeaseHolderResolver _holderResolver =
        holderResolver ?? throw new ArgumentNullException(nameof(holderResolver));

    public async Task<ArchitectureWorkLeaseAcquireResult> AcquireAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        DraftRequestResponse? draft = await _draftRepository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            cancellationToken);

        if (draft is null || draft.ArchitectureId is null || draft.ArchitectureId == Guid.Empty)
        {
            return new ArchitectureWorkLeaseAcquireResult { Status = ArchitectureWorkLeaseAcquireStatus.DraftNotFound };
        }

        Guid? holderUserId = await _holderResolver.TryResolveHolderUserIdAsync(scope, actorId, cancellationToken);

        if (holderUserId is null || holderUserId == Guid.Empty)
        {
            return new ArchitectureWorkLeaseAcquireResult { Status = ArchitectureWorkLeaseAcquireStatus.HolderNotResolved };
        }

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        ArchitectureWorkLeaseRecord? existing =
            await _leaseRepository.TryGetByDraftIdAsync(scope, draftId, cancellationToken);

        if (existing is not null
            && existing.ExpiresUtc > now
            && existing.HolderUserId != holderUserId.Value)
        {
            return new ArchitectureWorkLeaseAcquireResult
            {
                Status = ArchitectureWorkLeaseAcquireStatus.HeldByOther,
                Conflict = ToConflict(existing),
            };
        }

        ArchitectureWorkLeaseRecord record = new()
        {
            DraftId = draftId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ArchitectureId = draft.ArchitectureId.Value,
            HolderUserId = holderUserId.Value,
            AcquiredUtc = existing?.HolderUserId == holderUserId.Value ? existing.AcquiredUtc : now,
            LastHeartbeatUtc = now,
            ExpiresUtc = now.Add(ArchitectureWorkLeaseTiming.LeaseTtl),
        };

        await _leaseRepository.UpsertAsync(scope, record, cancellationToken);

        return new ArchitectureWorkLeaseAcquireResult
        {
            Status = ArchitectureWorkLeaseAcquireStatus.Acquired,
            Response = ToResponse(record, actorId, heldByCaller: true),
        };
    }

    public async Task<ArchitectureWorkLeaseHeartbeatResult> HeartbeatAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        DraftRequestResponse? draft = await _draftRepository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            cancellationToken);

        if (draft is null)
        {
            return new ArchitectureWorkLeaseHeartbeatResult { Status = ArchitectureWorkLeaseHeartbeatStatus.DraftNotFound };
        }

        Guid? holderUserId = await _holderResolver.TryResolveHolderUserIdAsync(scope, actorId, cancellationToken);

        if (holderUserId is null || holderUserId == Guid.Empty)
        {
            return new ArchitectureWorkLeaseHeartbeatResult { Status = ArchitectureWorkLeaseHeartbeatStatus.HolderNotResolved };
        }

        ArchitectureWorkLeaseRecord? existing =
            await _leaseRepository.TryGetByDraftIdAsync(scope, draftId, cancellationToken);

        if (existing is null)
        {
            return new ArchitectureWorkLeaseHeartbeatResult { Status = ArchitectureWorkLeaseHeartbeatStatus.LeaseNotFound };
        }

        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        if (existing.ExpiresUtc <= now)
        {
            return new ArchitectureWorkLeaseHeartbeatResult { Status = ArchitectureWorkLeaseHeartbeatStatus.Expired };
        }

        if (existing.HolderUserId != holderUserId.Value)
        {
            return new ArchitectureWorkLeaseHeartbeatResult { Status = ArchitectureWorkLeaseHeartbeatStatus.NotHolder };
        }

        ArchitectureWorkLeaseRecord extended = new()
        {
            DraftId = existing.DraftId,
            TenantId = existing.TenantId,
            WorkspaceId = existing.WorkspaceId,
            ScopeProjectId = existing.ScopeProjectId,
            ArchitectureId = existing.ArchitectureId,
            HolderUserId = existing.HolderUserId,
            AcquiredUtc = existing.AcquiredUtc,
            LastHeartbeatUtc = now,
            ExpiresUtc = now.Add(ArchitectureWorkLeaseTiming.LeaseTtl),
            RowVersion = existing.RowVersion,
        };

        await _leaseRepository.UpsertAsync(scope, extended, cancellationToken);

        return new ArchitectureWorkLeaseHeartbeatResult
        {
            Status = ArchitectureWorkLeaseHeartbeatStatus.Extended,
            Response = ToResponse(extended, actorId, heldByCaller: true),
        };
    }

    public async Task<ArchitectureWorkLeaseReleaseResult> ReleaseAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        DraftRequestResponse? draft = await _draftRepository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            cancellationToken);

        if (draft is null)
        {
            return new ArchitectureWorkLeaseReleaseResult { Status = ArchitectureWorkLeaseReleaseStatus.DraftNotFound };
        }

        Guid? holderUserId = await _holderResolver.TryResolveHolderUserIdAsync(scope, actorId, cancellationToken);

        if (holderUserId is null || holderUserId == Guid.Empty)
        {
            return new ArchitectureWorkLeaseReleaseResult { Status = ArchitectureWorkLeaseReleaseStatus.HolderNotResolved };
        }

        ArchitectureWorkLeaseRecord? existing =
            await _leaseRepository.TryGetByDraftIdAsync(scope, draftId, cancellationToken);

        if (existing is null)
        {
            return new ArchitectureWorkLeaseReleaseResult { Status = ArchitectureWorkLeaseReleaseStatus.LeaseNotFound };
        }

        if (existing.HolderUserId != holderUserId.Value)
        {
            return new ArchitectureWorkLeaseReleaseResult { Status = ArchitectureWorkLeaseReleaseStatus.NotHolder };
        }

        bool deleted = await _leaseRepository.TryDeleteByDraftIdForHolderAsync(
            scope,
            draftId,
            holderUserId.Value,
            cancellationToken);

        return new ArchitectureWorkLeaseReleaseResult
        {
            Status = deleted
                ? ArchitectureWorkLeaseReleaseStatus.Released
                : ArchitectureWorkLeaseReleaseStatus.LeaseNotFound,
        };
    }

    private static ArchitectureWorkLeaseResponse ToResponse(
        ArchitectureWorkLeaseRecord record,
        string callerActorId,
        bool heldByCaller)
    {
        return new ArchitectureWorkLeaseResponse
        {
            DraftId = record.DraftId,
            ArchitectureId = record.ArchitectureId,
            HolderUserId = record.HolderUserId,
            HolderActorOid = ArchitectureSharePlatformUserActorOid.FromUserId(record.HolderUserId),
            AcquiredUtc = record.AcquiredUtc,
            ExpiresUtc = record.ExpiresUtc,
            HeldByCaller = heldByCaller,
        };
    }

    private static ArchitectureWorkLeaseConflictResponse ToConflict(ArchitectureWorkLeaseRecord record)
    {
        return new ArchitectureWorkLeaseConflictResponse
        {
            DraftId = record.DraftId,
            HolderUserId = record.HolderUserId,
            HolderActorOid = ArchitectureSharePlatformUserActorOid.FromUserId(record.HolderUserId),
            ExpiresUtc = record.ExpiresUtc,
        };
    }
}
