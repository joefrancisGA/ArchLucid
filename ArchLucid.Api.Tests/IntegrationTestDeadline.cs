namespace ArchLucid.Api.Tests;

/// <summary>
///     Hard per-test deadline for <see cref="AlertLifecycleWebAppFactory" /> integration tests so a stall
///     fails fast with an attributable <see cref="TimeoutException" /> instead of consuming the CI blame-hang budget.
/// </summary>
internal static class IntegrationTestDeadline
{
    /// <summary>
    ///     Host start (180s) + client wrap (30s) + bounded HTTP (90s) + bounded dispose (120s) can stack under slow CI;
    ///     8 minutes keeps headroom above the ~420s worst-case inner stack (AskThread 240s failures used the old 4-minute budget).
    ///     Applies to classes that cold-boot (and dispose) the host inside the test body; shared-fixture classes should pass
    ///     <see cref="SharedHostTestTimeout" /> instead.
    /// </summary>
    internal static readonly TimeSpan DefaultTestTimeout = TimeSpan.FromMinutes(8);

    /// <summary>
    ///     Per-test budget for classes that reuse a warmed host via <c>IClassFixture</c> (e.g. <see cref="PolicyPackRequestValidationTests" />
    ///     on <see cref="ArchLucidApiFactory" />). Prefer <see cref="DefaultTestTimeout" /> for InMemory Ask/Retrieval smoke tests —
    ///     a non-cancellable HTTP stall on a shared host poisons every test in the class (CI #2268).
    /// </summary>
    internal static readonly TimeSpan SharedHostTestTimeout = TimeSpan.FromSeconds(150);

    internal static async Task RunAsync(
        string testName,
        Func<CancellationToken, Task> body,
        TimeSpan? timeout = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(testName);
        ArgumentNullException.ThrowIfNull(body);

        TimeSpan effectiveTimeout = timeout ?? DefaultTestTimeout;

        using CancellationTokenSource deadline = new();
        deadline.CancelAfter(effectiveTimeout);

        Task runTask = body(deadline.Token);

        bool timedOut = StarvationProofTimeout.WaitUntilCompletedOrTimeout(
            runTask,
            effectiveTimeout,
            nameof(IntegrationTestDeadline) + ":" + testName);

        if (timedOut)
        {
            await deadline.CancelAsync().ConfigureAwait(false);

            Console.Error.WriteLine(
                $"[IntegrationTestDeadline] TIMEOUT: test '{testName}' exceeded {effectiveTimeout.TotalSeconds:N0}s at {DateTime.UtcNow:HH:mm:ss.fff}Z");

            ObserveAbandonedRunTask(runTask, testName);

            throw new TimeoutException(
                $"Integration test '{testName}' exceeded {effectiveTimeout.TotalSeconds:N0}s.");
        }

        await runTask.ConfigureAwait(false);
    }

    /// <summary>
    ///     The test body may keep running after the deadline; observe completion so faults are not unobserved and
    ///     late finishes are visible when diagnosing thread-pool starvation on CI shards.
    /// </summary>
    private static void ObserveAbandonedRunTask(Task runTask, string testName)
    {
        ArgumentNullException.ThrowIfNull(runTask);
        ArgumentException.ThrowIfNullOrWhiteSpace(testName);

        _ = runTask.ContinueWith(
            completed =>
            {
                if (completed.IsFaulted)
                {
                    _ = completed.Exception;

                    return;
                }

                if (completed.IsCanceled)
                {
                    Console.Error.WriteLine(
                        "[IntegrationTestDeadline] Abandoned run task was canceled after deadline for '"
                        + testName
                        + "'.");

                    return;
                }

                Console.Error.WriteLine(
                    "[IntegrationTestDeadline] Abandoned run task completed after deadline for '"
                    + testName
                    + "' at "
                    + DateTime.UtcNow.ToString("HH:mm:ss.fff", System.Globalization.CultureInfo.InvariantCulture)
                    + "Z");
            },
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);
    }

    internal static CancellationTokenSource CreateLinkedRequestTimeoutSource(CancellationToken testDeadlineToken)
    {
        return IntegrationTestHttpCancellation.CreateRequestTimeoutSource(cancellationToken: testDeadlineToken);
    }
}
