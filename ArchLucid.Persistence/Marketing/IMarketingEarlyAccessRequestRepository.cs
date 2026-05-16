using ArchLucid.Contracts.Marketing;

namespace ArchLucid.Persistence.Marketing;

/// <summary>Append-only persistence for anonymous hero early-access submissions.</summary>
public interface IMarketingEarlyAccessRequestRepository
{
    /// <summary>Returns <see langword="null" /> when storage is NoOp (in-memory host).</summary>
    Task<MarketingEarlyAccessRequestInsertResult?> AppendAsync(
        string email,
        string? companyName,
        string? role,
        string? utmSource,
        string? utmMedium,
        string? utmCampaign,
        byte[]? clientIpSha256,
        CancellationToken cancellationToken);
}
