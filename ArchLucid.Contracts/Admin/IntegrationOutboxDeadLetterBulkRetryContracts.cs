namespace ArchLucid.Contracts.Admin;

/// <summary>Request body for bulk integration outbox dead-letter retry.</summary>
public sealed class IntegrationOutboxDeadLetterBulkRetryRequest
{
    public Guid? TenantId
    {
        get;
        init;
    }

    public string? EventType
    {
        get;
        init;
    }

    /// <summary>Maximum rows to re-queue (1–500, default 100).</summary>
    public int MaxRows
    {
        get;
        init;
    } = 100;
}

/// <summary>Response from bulk integration outbox dead-letter retry.</summary>
public sealed class IntegrationOutboxDeadLetterBulkRetryResponse
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
