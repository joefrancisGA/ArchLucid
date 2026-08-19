namespace ArchLucid.AgentRuntime;

/// <summary>
///     Optional per-phase bulkhead cap so staged overlap can reserve handler capacity for the Critic LLM call.
/// </summary>
internal sealed class StagedCriticPhaseAdmissionLimiter : IDisposable
{
    private readonly SemaphoreSlim? _semaphore;

    private StagedCriticPhaseAdmissionLimiter(SemaphoreSlim? semaphore)
    {
        _semaphore = semaphore;
    }

    internal static StagedCriticPhaseAdmissionLimiter? TryCreate(int maxConcurrentHandlers)
    {
        if (maxConcurrentHandlers <= 0)
            return null;

        return new StagedCriticPhaseAdmissionLimiter(new SemaphoreSlim(maxConcurrentHandlers, maxConcurrentHandlers));
    }

    internal async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(action);

        if (_semaphore is null)
            return await action(cancellationToken).ConfigureAwait(false);

        await _semaphore.WaitAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            return await action(cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public void Dispose()
    {
        _semaphore?.Dispose();
    }
}
