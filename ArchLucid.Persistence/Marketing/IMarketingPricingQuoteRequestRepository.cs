namespace ArchLucid.Persistence.Marketing;

/// <summary>Append-only persistence for anonymous pricing quote requests.</summary>
public interface IMarketingPricingQuoteRequestRepository
{
    Task AppendAsync(
        string workEmail,
        string companyName,
        string tierInterest,
        string message,
        byte[]? clientIpSha256,
        CancellationToken cancellationToken);
}
