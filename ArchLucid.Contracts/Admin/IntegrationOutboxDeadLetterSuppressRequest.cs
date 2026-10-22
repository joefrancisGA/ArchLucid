namespace ArchLucid.Contracts.Admin;

/// <summary>Optional operator note when suppressing an integration outbox dead-letter row.</summary>
public sealed class IntegrationOutboxDeadLetterSuppressRequest
{
    public string? Comment
    {
        get;
        init;
    }
}
