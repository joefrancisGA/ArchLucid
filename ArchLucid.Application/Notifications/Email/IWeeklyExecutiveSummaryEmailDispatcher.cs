namespace ArchLucid.Application.Notifications.Email;

/// <summary>
///     Sends the weekly run-summary one-pager using the transactional email stack (<see cref="IEmailTemplateRenderer" />,
///     <see cref="Core.Notifications.Email.IEmailProvider" />, <see cref="Core.Notifications.ISentEmailLedger" />).
/// </summary>
public interface IWeeklyExecutiveSummaryEmailDispatcher
{
    Task<bool> TryDispatchAsync(
        Guid tenantId,
        string isoWeekIdempotencyKey,
        string runIdHex,
        string summaryMarkdown,
        string runDetailUrl,
        string weekLabel,
        IReadOnlyList<string> toMailboxes,
        CancellationToken cancellationToken);
}
