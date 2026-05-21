using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref="IWeeklyExecutiveSummaryEmailDispatcher" />
public sealed class WeeklyExecutiveSummaryEmailDispatcher(
    IEmailTemplateRenderer templateRenderer,
    IEmailProvider emailProvider,
    ISentEmailLedger sentEmailLedger,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<WeeklyExecutiveSummaryEmailDispatcher> logger) : IWeeklyExecutiveSummaryEmailDispatcher
{
    public const string TemplateId = "WeeklyExecutiveSummary";
    private const string DefaultProductName = "ArchLucid";

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));
    private readonly ILogger<WeeklyExecutiveSummaryEmailDispatcher> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

        if (toMailboxes.Count == 0)
            return false;

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName) ? DefaultProductName : emailOptions.ProductDisplayName.Trim();
        string? operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl) ? null : emailOptions.OperatorBaseUrl.TrimEnd('/');

        WeeklyExecutiveSummaryEmailModel model = new()
        {
            ProductName = productName,
            WeekLabel = weekLabel,
            RunIdHex = runIdHex.Trim(),
            RunDetailUrl = runDetailUrl.Trim(),
            SummaryMarkdown = summaryMarkdown,
            LogoImageUrl = EmailBrandingUrls.TryBuildLogoImageUrl(operatorBase)
        };

        string idempotencyKey = $"weekly-executive-summary:{tenantId:N}:{isoWeekIdempotencyKey}";
        SentEmailLedgerEntry ledgerEntry = new(idempotencyKey, tenantId, TemplateId, _emailProvider.ProviderName, null);
        bool reserved = await _sentEmailLedger.TryRecordSentAsync(ledgerEntry, cancellationToken);

        if (!reserved)
            return false;

        string html = await _templateRenderer.RenderHtmlAsync(TemplateId, model, cancellationToken);
        string text = await _templateRenderer.RenderTextAsync(TemplateId, model, cancellationToken);
        string subject = $"{productName} weekly executive summary — {weekLabel}";

        foreach (string mailbox in toMailboxes)
        {
            if (string.IsNullOrWhiteSpace(mailbox))
                continue;

            EmailMessage message = new()
            {
                To = mailbox.Trim(),
                Subject = subject,
                HtmlBody = html,
                TextBody = text,
                IdempotencyKey = idempotencyKey + ":" + mailbox.Trim(),
                Tags = new EmailMessageTags { TenantId = tenantId, EventType = "weekly-executive-summary" }
            };

            try
            {
                await _emailProvider.SendAsync(message, cancellationToken);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(ex, "Weekly executive summary email send failed for tenant {TenantId}.", tenantId);

                throw;
            }
        }

        return true;
    }
}
