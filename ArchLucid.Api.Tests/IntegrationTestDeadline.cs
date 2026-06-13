namespace ArchLucid.Api.Tests;

/// <summary>
///     Hard per-test deadline for <see cref="AlertLifecycleWebAppFactory" /> integration tests so a stall
///     fails fast with an attributable <see cref="TimeoutException" /> instead of consuming the CI blame-hang budget.
/// </summary>
internal static class IntegrationTestDeadline
{
    internal static readonly TimeSpan DefaultTestTimeout = TimeSpan.FromMinutes(4);

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
