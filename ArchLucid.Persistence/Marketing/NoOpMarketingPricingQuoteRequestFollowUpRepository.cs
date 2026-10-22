namespace ArchLucid.Persistence.Marketing;

/// <inheritdoc />
public sealed class NoOpMarketingPricingQuoteRequestFollowUpRepository : IMarketingPricingQuoteRequestFollowUpRepository
{
    /// <inheritdoc />
    public Task<bool> AcknowledgeAsync(Guid requestId, string? assignedOwner, CancellationToken cancellationToken) =>
        Task.FromResult(false);

    /// <inheritdoc />
    public Task<bool> CloseAsync(Guid requestId, CancellationToken cancellationToken) =>
        Task.FromResult(false);
}
