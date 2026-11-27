namespace ArchLucid.Application.CloudExtractor;

/// <summary>Owns the cancellation budget for collection, not for the subsequent ingest.</summary>
internal sealed class HostedCloudCollectionDeadline : IDisposable
{
    private readonly TimeProvider _timeProvider;
    private readonly TimeSpan _budget;
    private readonly long _startedAt;
    private readonly CancellationTokenSource _deadline;
    private readonly CancellationTokenSource _collectionCancellation;

    public HostedCloudCollectionDeadline(TimeProvider timeProvider, TimeSpan budget, CancellationToken callerToken)
    {
        _timeProvider = timeProvider;
        _budget = budget;
        _startedAt = timeProvider.GetTimestamp();
        _deadline = new CancellationTokenSource(budget, timeProvider);
        _collectionCancellation = CancellationTokenSource.CreateLinkedTokenSource(callerToken, _deadline.Token);
    }

    public CancellationToken Token => _collectionCancellation.Token;

    // The timestamp check also covers a collector that returns before the timer callback runs.
    public bool IsExpired => _deadline.IsCancellationRequested || _timeProvider.GetElapsedTime(_startedAt) >= _budget;

    public string FailureDetail(string provider) =>
        $"Hosted {provider} collection exceeded its {_budget.TotalSeconds:0}-second deadline. No package was ingested.";

    public void Dispose()
    {
        _collectionCancellation.Dispose();
        _deadline.Dispose();
    }
}
