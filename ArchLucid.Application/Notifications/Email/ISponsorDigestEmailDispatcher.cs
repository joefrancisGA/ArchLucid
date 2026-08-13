using ArchLucid.Application.SponsorDigest;

namespace ArchLucid.Application.Notifications.Email;

/// <summary>
///     Sends the weekly sponsor digest using the transactional email stack (<see cref="Core.Notifications.Email.IEmailTemplateRenderer" />,
///     <see cref="Core.Notifications.Email.IEmailProvider" />, <see cref="Core.Notifications.ISentEmailLedger" />).
/// </summary>
public interface ISponsorDigestEmailDispatcher
{
    /// <summary>
    ///     When the idempotency ledger rejects the key for this ISO week, returns <see langword="false" /> (duplicate /
    ///     replay).
    /// </summary>
    Task<bool> TryDispatchAsync(
        Guid tenantId,
        string isoWeekIdempotencyKey,
        SponsorDigestComposition composition,
        IReadOnlyList<string> toMailboxes,
        string unsubscribeAbsoluteUrl,
        CancellationToken cancellationToken);
}
