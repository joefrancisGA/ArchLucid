namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>Lease service used when leasing is disabled (InMemory tests and explicit opt-out).</summary>
public sealed class DisabledRunExecuteOwnershipLeaseService : IRunExecuteOwnershipLeaseService
{
    /// <summary>Shared singleton for manual orchestrator construction in unit tests.</summary>
    public static DisabledRunExecuteOwnershipLeaseService Instance { get; } = new();

    private DisabledRunExecuteOwnershipLeaseService()
    {
    }

    /// <inheritdoc />
    public bool IsEnabled => false;

    /// <inheritdoc />
    public Task AcquireAsync(Guid runId, CancellationToken cancellationToken) => Task.CompletedTask;

    /// <inheritdoc />
    public Task ReleaseAsync(Guid runId, CancellationToken cancellationToken) => Task.CompletedTask;

    /// <inheritdoc />
    public Task<int> ReleaseAllHeldByThisInstanceAsync(CancellationToken cancellationToken) => Task.FromResult(0);
}
