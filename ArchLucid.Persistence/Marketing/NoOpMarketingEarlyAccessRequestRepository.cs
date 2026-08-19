using ArchLucid.Contracts.Marketing;

namespace ArchLucid.Persistence.Marketing;

/// <inheritdoc />
public sealed class NoOpMarketingEarlyAccessRequestRepository : IMarketingEarlyAccessRequestRepository
{
    /// <inheritdoc />
    public Task<MarketingEarlyAccessRequestInsertResult?> AppendAsync(
        string email,
        string? companyName,
        string? role,
        string? utmSource,
        string? utmMedium,
        string? utmCampaign,
        byte[]? clientIpSha256,
        CancellationToken cancellationToken) =>
        Task.FromResult<MarketingEarlyAccessRequestInsertResult?>(null);
}
