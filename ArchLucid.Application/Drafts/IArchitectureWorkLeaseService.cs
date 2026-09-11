using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

public enum ArchitectureWorkLeaseAcquireStatus
{
    Acquired,
    DraftNotFound,
    HolderNotResolved,
    NotAuthorized,
    HeldByOther,
}

public enum ArchitectureWorkLeaseStealStatus
{
    Stolen,
    DraftNotFound,
    HolderNotResolved,
    NotAuthorized,
}

public enum ArchitectureWorkLeaseHeartbeatStatus
{
    Extended,
    DraftNotFound,
    HolderNotResolved,
    LeaseNotFound,
    NotHolder,
    Expired,
}

public enum ArchitectureWorkLeaseReleaseStatus
{
    Released,
    DraftNotFound,
    HolderNotResolved,
    LeaseNotFound,
    NotHolder,
}

public sealed class ArchitectureWorkLeaseAcquireResult
{
    public ArchitectureWorkLeaseAcquireStatus Status
    {
        get;
        init;
    }

    public ArchitectureWorkLeaseResponse? Response
    {
        get;
        init;
    }

    public ArchitectureWorkLeaseConflictResponse? Conflict
    {
        get;
        init;
    }
}

public sealed class ArchitectureWorkLeaseStealResult
{
    public ArchitectureWorkLeaseStealStatus Status
    {
        get;
        init;
    }

    public ArchitectureWorkLeaseResponse? Response
    {
        get;
        init;
    }

    public Guid? PreviousHolderUserId
    {
        get;
        init;
    }
}

public sealed class ArchitectureWorkLeaseHeartbeatResult
{
    public ArchitectureWorkLeaseHeartbeatStatus Status
    {
        get;
        init;
    }

    public ArchitectureWorkLeaseResponse? Response
    {
        get;
        init;
    }
}

public sealed class ArchitectureWorkLeaseReleaseResult
{
    public ArchitectureWorkLeaseReleaseStatus Status
    {
        get;
        init;
    }
}

public interface IArchitectureWorkLeaseService
{
    Task<ArchitectureWorkLeaseSnapshot?> TryGetActiveSnapshotAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureWorkLeaseAcquireResult> AcquireAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        bool hasExecuteAuthority,
        CancellationToken cancellationToken = default);

    Task<ArchitectureWorkLeaseStealResult> StealAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        bool hasExecuteAuthority,
        CancellationToken cancellationToken = default);

    Task<ArchitectureWorkLeaseHeartbeatResult> HeartbeatAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureWorkLeaseReleaseResult> ReleaseAsync(
        ScopeContext scope,
        Guid draftId,
        string actorId,
        CancellationToken cancellationToken = default);
}
