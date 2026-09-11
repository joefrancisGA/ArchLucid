using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts;

public sealed class ArchitectureWorkLeaseService(
    IDraftRequestRepository draftRepository,
    IArchitectureWorkLeaseRepository leaseRepository,
    IArchitectureWorkLeaseHolderResolver holderResolver,
    IArchitectureShareAccessService shareAccessService) : IArchitectureWorkLeaseService
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IArchitectureWorkLeaseRepository _leaseRepository =
        leaseRepository ?? throw new ArgumentNullException(nameof(leaseRepository));

    private readonly IArchitectureWorkLeaseHolderResolver _holderResolver =
        holderResolver ?? throw new ArgumentNullException(nameof(holderResolver));

    private readonly IArchitectureShareAccessService _shareAccessService =
        shareAccessService ?? throw new ArgumentNullException(nameof(shareAccessService));

    public async Task<ArchitectureWorkLeaseSnapshot?> TryGetActiveSnapshotAsync(
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

        if (!ArchitectureWorkLeaseDraftAccess.IsMutableDraft(draft))
        {
            return null;
        }

        Guid? callerUserId = await _holderResolver.TryResolveHolderUserIdAsync(scope, actorId, cancellationToken);

        ArchitectureWorkLeaseRecord? existing =
            await _leaseRepository.TryGetByDraftIdAsync(scope, draftId, cancellationToken);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        if (existing is null || existing.ExpiresUtc <= now)
        {
            return null;
        }

        bool heldByCaller = callerUserId is not null && existing.HolderUserId == callerUserId.Value;

        return new ArchitectureWorkLeaseSnapshot
        {
            HolderUserId = existing.HolderUserId,
            HolderActorOid = ArchitectureSharePlatformUserActorOid.FromUserId(existing.HolderUserId),
            ExpiresUtc = existing.ExpiresUtc,
            HeldByCaller = heldByCaller,
        };
    }

    public async Task<ArchitectureWorkLeaseAcquireResult> AcquireAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        bool hasExecuteAuthority,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        DraftRequestResponse? draft = await LoadMutableDraftAsync(scope, draftId, cancellationToken);

        if (draft is null)
        {
            return new ArchitectureWorkLeaseAcquireResult { Status = ArchitectureWorkLeaseAcquireStatus.DraftNotFound };
        }

        if (!await CanMutateLeaseAsync(scope, draft, actorId, hasExecuteAuthority, cancellationToken))
        {
            return new ArchitectureWorkLeaseAcquireResult { Status = ArchitectureWorkLeaseAcquireStatus.NotAuthorized };
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

        ArchitectureWorkLeaseRecord record = BuildLeaseRecord(
            scope,
            draft,
            draftId,
            holderUserId.Value,
            existing,
            now);

        await _leaseRepository.UpsertAsync(scope, record, cancellationToken);

        return new ArchitectureWorkLeaseAcquireResult
        {
            Status = ArchitectureWorkLeaseAcquireStatus.Acquired,
            Response = ToResponse(record, heldByCaller: true),
        };
    }

    public async Task<ArchitectureWorkLeaseStealResult> StealAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        bool hasExecuteAuthority,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        DraftRequestResponse? draft = await LoadMutableDraftAsync(scope, draftId, cancellationToken);

        if (draft is null)
        {
            return new ArchitectureWorkLeaseStealResult { Status = ArchitectureWorkLeaseStealStatus.DraftNotFound };
        }

        if (!await CanMutateLeaseAsync(scope, draft, actorId, hasExecuteAuthority, cancellationToken))
        {
            return new ArchitectureWorkLeaseStealResult { Status = ArchitectureWorkLeaseStealStatus.NotAuthorized };
        }

        Guid? holderUserId = await _holderResolver.TryResolveHolderUserIdAsync(scope, actorId, cancellationToken);

        if (holderUserId is null || holderUserId == Guid.Empty)
        {
            return new ArchitectureWorkLeaseStealResult { Status = ArchitectureWorkLeaseStealStatus.HolderNotResolved };
        }

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        ArchitectureWorkLeaseRecord? existing =
            await _leaseRepository.TryGetByDraftIdAsync(scope, draftId, cancellationToken);

        Guid? previousHolderUserId = existing is not null && existing.ExpiresUtc > now
            ? existing.HolderUserId
            : null;

        ArchitectureWorkLeaseRecord record = BuildLeaseRecord(
            scope,
            draft,
            draftId,
            holderUserId.Value,
            existing?.HolderUserId == holderUserId.Value ? existing : null,
            now);

        await _leaseRepository.UpsertAsync(scope, record, cancellationToken);

        return new ArchitectureWorkLeaseStealResult
        {
            Status = ArchitectureWorkLeaseStealStatus.Stolen,
            Response = ToResponse(record, heldByCaller: true),
            PreviousHolderUserId = previousHolderUserId,
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
            Response = ToResponse(extended, heldByCaller: true),
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

    private async Task<DraftRequestResponse?> LoadMutableDraftAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        DraftRequestResponse? draft = await _draftRepository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            cancellationToken);

        return ArchitectureWorkLeaseDraftAccess.IsMutableDraft(draft) ? draft : null;
    }

    private async Task<bool> CanMutateLeaseAsync(
        ScopeContext scope,
        DraftRequestResponse draft,
        string actorId,
        bool hasExecuteAuthority,
        CancellationToken cancellationToken)
    {
        ArchitectureShareAccessEvaluation access = await _shareAccessService.EvaluateAsync(
            scope,
            draft.ArchitectureId!.Value,
            actorId,
            hasReadAuthority: true,
            hasExecuteAuthority,
            hasWorkspaceAdminAuthority: false,
            cancellationToken);

        return ArchitectureWorkLeaseDraftAccess.CanMutateLease(access, hasExecuteAuthority);
    }

    private static ArchitectureWorkLeaseRecord BuildLeaseRecord(
        ScopeContext scope,
        DraftRequestResponse draft,
        Guid draftId,
        Guid holderUserId,
        ArchitectureWorkLeaseRecord? existingForSameHolder,
        DateTimeOffset now) =>
        new()
        {
            DraftId = draftId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ArchitectureId = draft.ArchitectureId!.Value,
            HolderUserId = holderUserId,
            AcquiredUtc = existingForSameHolder?.HolderUserId == holderUserId ? existingForSameHolder.AcquiredUtc : now,
            LastHeartbeatUtc = now,
            ExpiresUtc = now.Add(ArchitectureWorkLeaseTiming.LeaseTtl),
            RowVersion = existingForSameHolder?.RowVersion,
        };

    private static ArchitectureWorkLeaseResponse ToResponse(
        ArchitectureWorkLeaseRecord record,
        bool heldByCaller) =>
        new()
        {
            DraftId = record.DraftId,
            ArchitectureId = record.ArchitectureId,
            HolderUserId = record.HolderUserId,
            HolderActorOid = ArchitectureSharePlatformUserActorOid.FromUserId(record.HolderUserId),
            AcquiredUtc = record.AcquiredUtc,
            ExpiresUtc = record.ExpiresUtc,
            HeldByCaller = heldByCaller,
        };

    private static ArchitectureWorkLeaseConflictResponse ToConflict(ArchitectureWorkLeaseRecord record) =>
        new()
        {
            DraftId = record.DraftId,
            HolderUserId = record.HolderUserId,
            HolderActorOid = ArchitectureSharePlatformUserActorOid.FromUserId(record.HolderUserId),
            ExpiresUtc = record.ExpiresUtc,
        };
}
