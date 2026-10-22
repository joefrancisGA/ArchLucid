namespace ArchLucid.Core.OperationalErrors;

/// <summary>Bounded in-memory queue for operational error persistence.</summary>
public interface IOperationalErrorCaptureQueue
{
    bool TryEnqueue(OperationalErrorRecord record);

    ValueTask<OperationalErrorRecord> DequeueAsync(CancellationToken cancellationToken);

    void NotifyPersistedSuccess();

    bool TryReturnToQueueAfterFailedDrain(OperationalErrorRecord record);

    long ApproximatePendingCount
    {
        get;
    }
}
