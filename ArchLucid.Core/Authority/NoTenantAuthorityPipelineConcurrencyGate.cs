namespace ArchLucid.Core.Authority;

/// <summary>
///     No-op gate when concurrency limits are disabled (max ≤ 0).
/// </summary>
public sealed class NoTenantAuthorityPipelineConcurrencyGate : ITenantAuthorityPipelineConcurrencyGate
{
    /// <summary>Returned when concurrency limits evaluate to unlimited at acquire time.</summary>
    public static IAsyncDisposable DisabledLease => EmptyAsyncDisposable.Instance;

    /// <inheritdoc />
    public Task<IAsyncDisposable> AcquireExecutionSlotAsync(
        Guid tenantId,
        Guid runId,
        bool failFastWhenUnavailable,
        CancellationToken cancellationToken = default)
    {
        _ = tenantId;
        _ = runId;
        _ = failFastWhenUnavailable;

        return Task.FromResult<IAsyncDisposable>(EmptyAsyncDisposable.Instance);
    }

    private sealed class EmptyAsyncDisposable : IAsyncDisposable
    {
        internal static readonly EmptyAsyncDisposable Instance = new();

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
