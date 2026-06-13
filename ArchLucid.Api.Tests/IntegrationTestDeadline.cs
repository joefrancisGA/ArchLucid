namespace ArchLucid.Api.Tests;

/// <summary>
///     Hard per-test deadline for <see cref="AlertLifecycleWebAppFactory" /> integration tests so a stall
///     fails fast with an attributable <see cref="TimeoutException" /> instead of consuming the CI blame-hang budget.
/// </summary>
internal static class IntegrationTestDeadline
{
    /// <summary>
    ///     Host start (120s) + client wrap (30s) + two bounded HTTP calls (90s each) need headroom under slow CI;
    ///     4 minutes stacked with duplicate 120s factory bounds and failed at exactly 240s.
    /// </summary>
    internal static readonly TimeSpan DefaultTestTimeout = TimeSpan.FromMinutes(6);

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
        Task delayTask = Task.Delay(effectiveTimeout);

        Task completed = await Task.WhenAny(runTask, delayTask).ConfigureAwait(false);

        if (completed != runTask)
        {
            await deadline.CancelAsync().ConfigureAwait(false);

            throw new TimeoutException(
                $"Integration test '{testName}' exceeded {effectiveTimeout.TotalSeconds:N0}s.");
        }

        await runTask.ConfigureAwait(false);
    }

    internal static CancellationTokenSource CreateLinkedRequestTimeoutSource(CancellationToken testDeadlineToken)
    {
        return IntegrationTestHttpCancellation.CreateRequestTimeoutSource(cancellationToken: testDeadlineToken);
    }
}
