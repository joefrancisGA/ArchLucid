using ArchLucid.Contracts.Marketing;

namespace ArchLucid.Application.Notifications.Email;

/// <summary>Notifies the sales inbox after an anonymous early-access row is stored.</summary>
public interface IMarketingEarlyAccessSalesNotifier
{
    Task NotifyAsync(
        MarketingEarlyAccessRequestInsertResult insert,
        string email,
        string? companyName,
        string? role,
        CancellationToken cancellationToken);
}
