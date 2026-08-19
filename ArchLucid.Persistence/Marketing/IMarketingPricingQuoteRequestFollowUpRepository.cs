namespace ArchLucid.Persistence.Marketing;

/// <summary>Operator mutations for marketing pricing quote sales follow-up.</summary>
public interface IMarketingPricingQuoteRequestFollowUpRepository
{
    /// <summary>Records first human acknowledgement; idempotent when already set.</summary>
    Task<bool> AcknowledgeAsync(Guid requestId, string? assignedOwner, CancellationToken cancellationToken);

    /// <summary>Closes the request so it drops out of SLA aging.</summary>
    Task<bool> CloseAsync(Guid requestId, CancellationToken cancellationToken);
}
