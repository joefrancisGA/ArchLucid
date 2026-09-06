namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>Lease service used when leasing is disabled (InMemory tests and explicit opt-out).</summary>
public sealed class DisabledRunExecuteOwnershipLeaseService : IRunExecuteOwnershipLeaseService
{
    /// <inheritdoc />
    public bool IsEnabled => false;

    /// <inheritdoc />
    public Task AcquireAsync(Guid runId, CancellationToken cancellationToken) => Task.CompletedTask;

    /// <inheritdoc />
    public Task RenewAsync(Guid runId, CancellationToken cancellationToken) => Task.CompletedTask;

    /// <inheritdoc />
    public IAsyncDisposable BeginRenewalScope(Guid runId, CancellationToken cancellationToken) =>
        NoOpRunExecuteOwnershipLeaseRenewalScope.Instance;

    /// <inheritdoc />
    public Task ReleaseAsync(Guid runId, CancellationToken cancellationToken) => Task.CompletedTask;

    /// <inheritdoc />
    public Task<int> ReleaseAllHeldByThisInstanceAsync(CancellationToken cancellationToken) => Task.FromResult(0);
}
