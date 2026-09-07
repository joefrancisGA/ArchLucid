namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>Acquires and releases per-run execute ownership leases (TB-943).</summary>
public interface IRunExecuteOwnershipLeaseService
{
    bool IsEnabled { get; }

    /// <summary>Throws <see cref="ArchLucid.Contracts.Common.ConflictException" /> when another holder owns a live lease.</summary>
    Task AcquireAsync(Guid runId, CancellationToken cancellationToken);

    /// <summary>Extends the lease TTL when this instance already holds it (heartbeat during long execute).</summary>
    Task RenewAsync(Guid runId, CancellationToken cancellationToken);

    /// <summary>Starts periodic lease renewal until disposed (no-op when leasing is disabled).</summary>
    IAsyncDisposable BeginRenewalScope(Guid runId, CancellationToken cancellationToken);

    Task ReleaseAsync(Guid runId, CancellationToken cancellationToken);

    /// <summary>TB-961: release every lease held by this process instance.</summary>
    Task<int> ReleaseAllHeldByThisInstanceAsync(CancellationToken cancellationToken);
}
