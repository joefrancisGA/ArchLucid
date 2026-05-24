namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>Outcome of re-queuing one or more integration outbox dead-letter rows.</summary>
public sealed class IntegrationOutboxDeadLetterBulkRetryResult
{
    public int RetriedCount
    {
        get;
        init;
    }

    public IReadOnlyList<Guid> RetriedOutboxIds
    {
        get;
        init;
    } = [];
}
