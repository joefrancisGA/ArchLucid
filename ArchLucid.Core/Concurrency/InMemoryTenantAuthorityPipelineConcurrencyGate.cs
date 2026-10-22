using System.Collections.Concurrent;

using ArchLucid.Core.Authority;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Concurrency;

/// <summary>
///     In-memory per-tenant semaphores for authority pipeline concurrency (single-process simulator / tests).
/// </summary>
public sealed class InMemoryTenantAuthorityPipelineConcurrencyGate(IOptionsMonitor<AuthorityPipelineOptions> optionsMonitor)
    : ITenantAuthorityPipelineConcurrencyGate
{
    private readonly IOptionsMonitor<AuthorityPipelineOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _tenantSemaphores = new();

    /// <inheritdoc />
    public async Task<IAsyncDisposable> AcquireExecutionSlotAsync(
        Guid tenantId,
        Guid runId,
        bool failFastWhenUnavailable,
        CancellationToken cancellationToken = default)
    {
        _ = runId;

        int maxConcurrent = _optionsMonitor.CurrentValue.Concurrency.MaxConcurrentExecutionsPerTenant;

        if (maxConcurrent <= 0)

            return EmptyLease.Instance;


        SemaphoreSlim semaphore =
            _tenantSemaphores.GetOrAdd(tenantId, _ => new SemaphoreSlim(maxConcurrent, maxConcurrent));

        if (failFastWhenUnavailable)

        {

            bool enteredNow = await semaphore.WaitAsync(0, cancellationToken);

            if (!enteredNow)

                throw new AuthorityTenantConcurrencyLimitExceededException(
                    "The tenant reached the configured maximum concurrent architecture authority executions; retry later.");

            return new ReleaseSemaphoreDisposable(semaphore);
        }

        await semaphore.WaitAsync(cancellationToken);

        return new ReleaseSemaphoreDisposable(semaphore);
    }

    private sealed class EmptyLease : IAsyncDisposable
    {
        internal static readonly EmptyLease Instance = new();

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    private sealed class ReleaseSemaphoreDisposable(SemaphoreSlim semaphore) : IAsyncDisposable
    {
        private readonly SemaphoreSlim _semaphore =
            semaphore ?? throw new ArgumentNullException(nameof(semaphore));

        public ValueTask DisposeAsync()
        {
            _semaphore.Release();

            return ValueTask.CompletedTask;
        }
    }
}
