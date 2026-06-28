namespace ArchLucid.Api.Tests;

/// <summary>
///     Forces <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> host
///     startup (first access to <c>Services</c>) under a bounded timeout so a stuck hosted-service
///     <c>StartAsync</c> fails the test quickly instead of consuming the full CI blame-hang budget.
/// </summary>
internal static class IntegrationTestHostStartup
{
    /// <summary>
    ///     InMemory integration hosts should start in seconds; 180s leaves headroom under slow CI without consuming
    ///     the 8-minute whole-test deadline (180s startup + 90s HTTP + 120s dispose &lt; 480s).
    /// </summary>
    internal static readonly TimeSpan DefaultStartupTimeout = TimeSpan.FromSeconds(180);

    /// <summary>
    ///     After <see cref="EnsureStartedAsync" /> completes, <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}.CreateClient" />
    ///     should only wrap the already-built TestServer (seconds). A separate 120s bound stacked on startup
    ///     consumed the entire 4-minute whole-test deadline under CI load (CI #2168 follow-up).
    /// </summary>
    internal static readonly TimeSpan DefaultClientCreationTimeout = TimeSpan.FromSeconds(30);

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
    ///     Runs a synchronous factory operation on a dedicated worker thread under <paramref name="timeout" />.
    ///     CI #2377: poll-based <see cref="StarvationProofTimeout" /> so the bound fires even when the thread pool
    ///     is exhausted (Task.Delay + WhenAny continuations never run).
    /// </summary>
    internal static async Task<T> EnsureCompletedAsync<T>(
        Func<T> operation,
        TimeSpan? timeout = null)
    {
        ArgumentNullException.ThrowIfNull(operation);

        TimeSpan effectiveTimeout = timeout ?? DefaultStartupTimeout;

        Console.Error.WriteLine(
            $"[IntegrationTestHostStartup] Starting bounded operation (limit {effectiveTimeout.TotalSeconds:N0}s) at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        System.Diagnostics.Stopwatch stopwatch = System.Diagnostics.Stopwatch.StartNew();
        TaskCompletionSource<T> completion = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Thread worker = new(_ =>
        {
            try
            {
                T result = operation();
                completion.TrySetResult(result);
            }
            catch (Exception ex)
            {
                completion.TrySetException(ex);
            }
        })
        {
            IsBackground = true,
            Name = nameof(IntegrationTestHostStartup) + "-worker",
        };

        worker.Start();

        bool timedOut = StarvationProofTimeout.WaitUntilCompletedOrTimeout(
            completion.Task,
            effectiveTimeout,
            nameof(IntegrationTestHostStartup));

        if (timedOut)
        {
            Console.Error.WriteLine(
                $"[IntegrationTestHostStartup] TIMEOUT: operation exceeded {effectiveTimeout.TotalSeconds:N0}s at {DateTime.UtcNow:HH:mm:ss.fff}Z");

            ObserveAbandonedOperation(completion.Task);

            throw new TimeoutException(
                $"Integration host operation exceeded {effectiveTimeout.TotalSeconds:N0}s.");
        }

        T resolved = await completion.Task.ConfigureAwait(false);

        Console.Error.WriteLine(
            $"[IntegrationTestHostStartup] Bounded operation completed in {stopwatch.Elapsed.TotalSeconds:N1}s at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        return resolved;
    }

    /// <summary>
    ///     The worker thread may keep running after a timeout; observe completion so faults are not unobserved and
    ///     late finishes are visible in CI stderr when diagnosing host leaks.
    /// </summary>
    private static void ObserveAbandonedOperation(Task operationTask)
    {
        ArgumentNullException.ThrowIfNull(operationTask);

        _ = operationTask.ContinueWith(
            static completed =>
            {
                if (completed.IsFaulted)
                {
                    _ = completed.Exception;

                    return;
                }

                if (completed.IsCanceled)
                {
                    Console.Error.WriteLine(
                        "[IntegrationTestHostStartup] Abandoned bounded operation was canceled after caller timeout.");

                    return;
                }

                Console.Error.WriteLine(
                    "[IntegrationTestHostStartup] Abandoned bounded operation completed after caller timeout at "
                    + DateTime.UtcNow.ToString("HH:mm:ss.fff", System.Globalization.CultureInfo.InvariantCulture)
                    + "Z");
            },
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);
    }
}
