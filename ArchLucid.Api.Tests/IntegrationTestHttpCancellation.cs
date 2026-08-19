namespace ArchLucid.Api.Tests;

/// <summary>
///     Bounded cancellation for integration HTTP calls so a stuck host does not consume the full CI blame-hang budget.
/// </summary>
internal static class IntegrationTestHttpCancellation
{
    internal static readonly TimeSpan DefaultRequestTimeout = TimeSpan.FromSeconds(90);

    internal static CancellationTokenSource CreateRequestTimeoutSource(
        TimeSpan? timeout = null,
        CancellationToken cancellationToken = default)
    {
        CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        linked.CancelAfter(timeout ?? DefaultRequestTimeout);

        return linked;
    }
}
