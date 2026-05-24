namespace ArchLucid.Contracts.Admin;

/// <summary>cURL replay command for a dead-lettered integration outbox row.</summary>
public sealed class IntegrationEventDeadLetterCurlResponse
{
    public Guid OutboxId
    {
        get;
        init;
    }

    public required string CurlCommand
    {
        get;
        init;
    }
}
