namespace ArchLucid.Api.Tests;

/// <summary>
///     Forces <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> host
///     startup (first access to <c>Services</c>) under a bounded timeout so a stuck hosted-service
///     <c>StartAsync</c> fails the test quickly instead of consuming the full CI blame-hang budget.
/// </summary>
internal static class IntegrationTestHostStartup
{
    internal static readonly TimeSpan DefaultStartupTimeout = TimeSpan.FromSeconds(120);

    /// <summary>
    ///     Returns the started host's <see cref="IServiceProvider" />, or throws
    ///     <see cref="TimeoutException" /> if startup does not complete within <paramref name="timeout" />.
    /// </summary>
    internal static Task<IServiceProvider> EnsureStartedAsync(
        Func<IServiceProvider> accessServices,
        TimeSpan? timeout = null)
    {
        return EnsureCompletedAsync(accessServices, timeout);
    }

    /// <summary>
    ///     Runs a synchronous factory operation on a worker thread under <paramref name="timeout" />.
    ///     Uses <see cref="Task.WhenAny" /> so callers return promptly on timeout even when the worker
    ///     thread remains blocked (WaitAsync alone would leave xUnit waiting on the orphaned task).
    /// </summary>
    internal static async Task<T> EnsureCompletedAsync<T>(
        Func<T> operation,
        TimeSpan? timeout = null)
    {
        ArgumentNullException.ThrowIfNull(operation);

        TimeSpan effectiveTimeout = timeout ?? DefaultStartupTimeout;

        // Host start and EnsureServer have no native CancellationToken seam; run off the test thread so we can bound it.
        Task<T> operationTask = Task.Run(operation);
        Task delayTask = Task.Delay(effectiveTimeout);

        Task completed = await Task.WhenAny(operationTask, delayTask).ConfigureAwait(false);

        if (completed != operationTask)
        {
            throw new TimeoutException(
                $"Integration host operation exceeded {effectiveTimeout.TotalSeconds:N0}s.");
        }

        return await operationTask.ConfigureAwait(false);
    }
}
