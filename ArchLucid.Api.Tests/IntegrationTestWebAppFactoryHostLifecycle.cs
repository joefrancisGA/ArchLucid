namespace ArchLucid.Api.Tests;

/// <summary>
///     Single-flight host startup and bounded teardown for <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" />
///     integration fixtures. Prevents concurrent <c>EnsureServer</c> access and waits for in-flight startup before dispose
///     so abandoned <see cref="IntegrationTestHostStartup" /> worker threads do not leak hosts (CI #2168, #2195).
/// </summary>
internal sealed class IntegrationTestWebAppFactoryHostLifecycle
{
    /// <summary>
    ///     Allow a wedged startup worker to finish (or fault) before <c>DisposeAsync</c> enters
    ///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> teardown.
    /// </summary>
    internal static readonly TimeSpan StartupSettleBeforeDisposeTimeout = TimeSpan.FromMinutes(2);

    /// <summary>
    ///     Bound host dispose so an <c>IHostedService</c> that ignores its shutdown token cannot wedge CI for 75 minutes.
    /// </summary>
    internal static readonly TimeSpan BoundedDisposeTimeout = TimeSpan.FromMinutes(2);

    private readonly object _hostLifecycleLock = new();

    private Task<IServiceProvider>? _ensureServicesTask;

    internal Task<IServiceProvider> EnsureServicesStartedAsync(
        string logPrefix,
        Func<Task<IServiceProvider>> startCoreAsync)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(logPrefix);
        ArgumentNullException.ThrowIfNull(startCoreAsync);

        lock (_hostLifecycleLock)
        {
            _ensureServicesTask ??= startCoreAsync();

            return _ensureServicesTask;
        }
    }

    internal async ValueTask DisposeHostAsync(string logPrefix, Func<ValueTask> baseDisposeAsync)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(logPrefix);
        ArgumentNullException.ThrowIfNull(baseDisposeAsync);

        Console.Error.WriteLine(
            $"[{logPrefix}] Dispose beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

        await WaitForInFlightStartupSettleAsync(logPrefix).ConfigureAwait(false);

        Task disposeTask = baseDisposeAsync().AsTask();
        Task winner = await Task.WhenAny(disposeTask, Task.Delay(BoundedDisposeTimeout)).ConfigureAwait(false);

        if (winner != disposeTask)
        {
            Console.Error.WriteLine(
                $"[{logPrefix}] Host dispose exceeded {BoundedDisposeTimeout.TotalSeconds:N0}s; "
                + "abandoning wedged dispose to avoid the CI blame-hang ceiling. A hosted service likely ignored its shutdown token.");

            ObserveAbandonedTask(disposeTask);

            return;
        }

        await disposeTask.ConfigureAwait(false);
    }

    private async Task WaitForInFlightStartupSettleAsync(string logPrefix)
    {
        Task<IServiceProvider>? startup = null;

        lock (_hostLifecycleLock)
        {
            startup = _ensureServicesTask;
        }

        if (startup is null)
            return;

        Task winner = await Task.WhenAny(startup, Task.Delay(StartupSettleBeforeDisposeTimeout)).ConfigureAwait(false);

        if (winner != startup)
        {
            Console.Error.WriteLine(
                $"[{logPrefix}] In-flight host startup did not settle within "
                + $"{StartupSettleBeforeDisposeTimeout.TotalSeconds:N0}s before dispose; orphan worker may remain until process exit.");

            ObserveAbandonedTask(startup);

            return;
        }

        try
        {
            await startup.ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(
                $"[{logPrefix}] In-flight host startup faulted before dispose: {ex.Message}");
        }
    }

    /// <summary>
    ///     Swallows faults on abandoned tasks so they cannot surface as <see cref="TaskScheduler.UnobservedTaskException" />.
    /// </summary>
    private static void ObserveAbandonedTask(Task task)
    {
        ArgumentNullException.ThrowIfNull(task);

        _ = task.ContinueWith(
            static completed =>
            {
                if (completed.IsFaulted)
                    _ = completed.Exception;
            },
            CancellationToken.None,
            TaskContinuationOptions.OnlyOnFaulted,
            TaskScheduler.Default);
    }
}
