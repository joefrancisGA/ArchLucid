using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref="IWeeklySponsorSummaryEmailDispatcher" />
public sealed class WeeklySponsorSummaryEmailDispatcher(
    IEmailTemplateRenderer templateRenderer,
    IEmailProvider emailProvider,
    ISentEmailLedger sentEmailLedger,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<WeeklySponsorSummaryEmailDispatcher> logger) : IWeeklySponsorSummaryEmailDispatcher
{
    public const string TemplateId = "WeeklySponsorSummary";

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));
    private readonly ILogger<WeeklySponsorSummaryEmailDispatcher> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly ISentEmailLedger _sentEmailLedger = sentEmailLedger ?? throw new ArgumentNullException(nameof(sentEmailLedger));
    private readonly IEmailTemplateRenderer _templateRenderer = templateRenderer ?? throw new ArgumentNullException(nameof(templateRenderer));

    /// <inheritdoc />
    public async Task<bool> TryDispatchAsync(
        Guid tenantId,
        string isoWeekIdempotencyKey,
        string runIdHex,
        string summaryMarkdown,
        string runDetailUrl,
        string weekLabel,
        IReadOnlyList<string> toMailboxes,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(isoWeekIdempotencyKey);
        ArgumentNullException.ThrowIfNull(runIdHex);
        ArgumentNullException.ThrowIfNull(summaryMarkdown);
        ArgumentNullException.ThrowIfNull(runDetailUrl);
        ArgumentNullException.ThrowIfNull(weekLabel);
        ArgumentNullException.ThrowIfNull(toMailboxes);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        List<string> normalizedMailboxes = [];

        foreach (string mailbox in toMailboxes)
        {
            if (string.IsNullOrWhiteSpace(mailbox))
                continue;

            normalizedMailboxes.Add(mailbox.Trim());
        }

        if (normalizedMailboxes.Count == 0)
            return false;

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = EmailProductDisplayNameResolver.Resolve(emailOptions);
        string? operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl) ? null : emailOptions.OperatorBaseUrl.TrimEnd('/');

        WeeklySponsorSummaryEmailModel model = new()
        {
            ProductName = productName,
            WeekLabel = weekLabel,
            RunIdHex = runIdHex.Trim(),
            RunDetailUrl = runDetailUrl.Trim(),
            SummaryMarkdown = summaryMarkdown,
            LogoImageUrl = EmailBrandingUrls.TryBuildLogoImageUrl(operatorBase)
        };

        string idempotencyKey = $"weekly-sponsor-summary:{tenantId:N}:{isoWeekIdempotencyKey}";
        string html = await _templateRenderer.RenderHtmlAsync(TemplateId, model, cancellationToken);
        string text = await _templateRenderer.RenderTextAsync(TemplateId, model, cancellationToken);
        string subject = $"{productName} weekly sponsor summary — {weekLabel}";

        return await MultiRecipientEmailDispatch.TrySendToMailboxesAsync(
            tenantId,
            idempotencyKey,
            TemplateId,
            normalizedMailboxes,
            _sentEmailLedger,
            _emailProvider,
            mailbox => new EmailMessage
            {
                To = mailbox,
                Subject = subject,
                HtmlBody = html,
                TextBody = text,
                IdempotencyKey = MultiRecipientEmailDispatch.BuildMailboxIdempotencyKey(idempotencyKey, mailbox),
                Tags = new EmailMessageTags { TenantId = tenantId, EventType = "weekly-sponsor-summary" }
            },
            (ex, mailbox) =>
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(ex, "Weekly sponsor summary email send failed for tenant {TenantId}, mailbox {Mailbox}.", tenantId, mailbox);
            },
            cancellationToken);
    }
}
