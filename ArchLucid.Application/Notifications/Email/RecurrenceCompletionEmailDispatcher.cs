using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref="IRecurrenceCompletionEmailDispatcher" />
public sealed class RecurrenceCompletionEmailDispatcher(
    IEmailTemplateRenderer templateRenderer,
    IEmailProvider emailProvider,
    ISentEmailLedger sentEmailLedger,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<RecurrenceCompletionEmailDispatcher> logger) : IRecurrenceCompletionEmailDispatcher
{
    public const string TemplateId = "RecurrenceCompletion";

    private const string DefaultProductName = "ArchLucid";

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));

    private readonly ILogger<RecurrenceCompletionEmailDispatcher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ISentEmailLedger _sentEmailLedger = sentEmailLedger ?? throw new ArgumentNullException(nameof(sentEmailLedger));

    private readonly IEmailTemplateRenderer _templateRenderer =
        templateRenderer ?? throw new ArgumentNullException(nameof(templateRenderer));

    /// <inheritdoc />
    public async Task<bool> TryDispatchAsync(
        Guid tenantId,
        Guid scheduleId,
        Guid triggeredRunId,
        string scheduleName,
        int newFindingCount,
        int resolvedFindingCount,
        Guid sourceRunId,
        IReadOnlyList<string> toMailboxes,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (toMailboxes.Count == 0)
            return false;

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName)
            ? DefaultProductName
            : emailOptions.ProductDisplayName.Trim();

        string? operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl)
            ? null
            : emailOptions.OperatorBaseUrl.TrimEnd('/');

        string runHex = triggeredRunId.ToString("N");
        string runDetailUrl = operatorBase is null ? $"/reviews/{runHex}" : $"{operatorBase}/reviews/{runHex}";
        string compareUrl = RecurrenceCompletionOperatorLinks.BuildCompareUrl(operatorBase, sourceRunId, triggeredRunId);

        RecurrenceCompletionEmailModel model = new()
        {
            ProductName = productName,
            ScheduleName = scheduleName.Trim(),
            NewFindingCount = newFindingCount,
            ResolvedFindingCount = resolvedFindingCount,
            RunDetailUrl = runDetailUrl,
            CompareUrl = compareUrl,
            LogoImageUrl = EmailBrandingUrls.TryBuildLogoImageUrl(operatorBase),
        };

        string idempotencyKey = $"recurrence-completion:{tenantId:N}:{scheduleId:N}:{runHex}";
        SentEmailLedgerEntry ledgerEntry = new(idempotencyKey, tenantId, TemplateId, _emailProvider.ProviderName, null);
        bool reserved = await _sentEmailLedger.TryRecordSentAsync(ledgerEntry, cancellationToken).ConfigureAwait(false);

        if (!reserved)
            return false;

        string html = await _templateRenderer.RenderHtmlAsync(TemplateId, model, cancellationToken).ConfigureAwait(false);
        string text = await _templateRenderer.RenderTextAsync(TemplateId, model, cancellationToken).ConfigureAwait(false);
        string subject =
            $"{productName}: your scheduled architecture review is ready — {newFindingCount} new finding(s)";

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
                IdempotencyKey = $"{idempotencyKey}:{mailbox.Trim()}",
                Tags = new EmailMessageTags
                {
                    TenantId = tenantId,
                    EventType = TemplateId,
                },
            };

            try
            {
                await _emailProvider.SendAsync(message, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                {
                    _logger.LogError(
                        ex,
                        "Recurrence completion email send failed for tenant {TenantId}, schedule {ScheduleId}.",
                        tenantId,
                        scheduleId);
                }

                throw;
            }
        }

        return true;
    }
}
