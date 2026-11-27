namespace ArchLucid.Core.Http;

/// <summary>Links caller cancellation to a single monotonic deadline across a multi-step outbound operation.</summary>
public sealed class OutboundOperationDeadline : IDisposable
{
    private readonly TimeProvider _timeProvider;
    private readonly TimeSpan _budget;
    private readonly long _startedAt;
    private readonly CancellationTokenSource _deadline;
    private readonly CancellationTokenSource _collectionCancellation;

    public OutboundOperationDeadline(TimeProvider timeProvider, TimeSpan budget, CancellationToken callerToken)
    {
        _timeProvider = timeProvider;
        _budget = budget;
        _startedAt = timeProvider.GetTimestamp();
        _deadline = new CancellationTokenSource(budget, timeProvider);
        _collectionCancellation = CancellationTokenSource.CreateLinkedTokenSource(callerToken, _deadline.Token);
    }

    public CancellationToken Token => _collectionCancellation.Token;

    // The timestamp check also covers a collector that returns before the timer callback runs.
    public bool IsExpired => Remaining == TimeSpan.Zero;

    public TimeSpan Budget => _budget;

    public TimeSpan Remaining
    {
        get
        {
            TimeSpan remaining = _budget - _timeProvider.GetElapsedTime(_startedAt);

            return _deadline.IsCancellationRequested || remaining <= TimeSpan.Zero ? TimeSpan.Zero : remaining;
        }
    }

    public void Dispose()
    {
        _collectionCancellation.Dispose();
        _deadline.Dispose();
    }
}
