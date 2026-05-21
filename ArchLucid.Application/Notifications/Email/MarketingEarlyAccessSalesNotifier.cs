using System.Net;

using ArchLucid.Contracts.Marketing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref="IMarketingEarlyAccessSalesNotifier" />
public sealed class MarketingEarlyAccessSalesNotifier(
    IEmailProvider emailProvider,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<MarketingEarlyAccessSalesNotifier> logger) : IMarketingEarlyAccessSalesNotifier
{
    private const string EventType = "marketing-early-access";

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));
    private readonly ILogger<MarketingEarlyAccessSalesNotifier> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task NotifyAsync(
        MarketingEarlyAccessRequestInsertResult insert,
        string email,
        string? companyName,
        string? role,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(email);
        EmailNotificationOptions opts = _emailOptionsMonitor.CurrentValue;
        string? inbox = opts.PricingQuoteSalesInbox;

        if (string.IsNullOrWhiteSpace(inbox))
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Marketing early-access sales notification skipped: {ConfigKey} is empty.",
                    nameof(EmailNotificationOptions.PricingQuoteSalesInbox));
            return;
        }

        if (string.Equals(_emailProvider.ProviderName, EmailProviderNames.Noop, StringComparison.OrdinalIgnoreCase))
        {
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Would notify early-access inbox {Inbox} for request id {RequestId} (Email:Provider is {Provider}).",
                    inbox.Trim(),
                    insert.Id,
                    _emailProvider.ProviderName);
            return;
        }

        string safeEmail = WebUtility.HtmlEncode(email);
        string safeCompany = string.IsNullOrWhiteSpace(companyName) ? "—" : WebUtility.HtmlEncode(companyName);
        string safeRole = string.IsNullOrWhiteSpace(role) ? "—" : WebUtility.HtmlEncode(role);
        const string subject = "ArchLucid: early access / waitlist request";
        string html = "<p>A new <strong>early access</strong> submission was captured from the public <strong>/welcome</strong> hero " +
                      "(not a tenant signup — manual follow-up).</p>" +
                      $"<p><strong>Request id:</strong> {insert.Id:N}</p>" + $"<p><strong>Created (UTC):</strong> {insert.CreatedUtc:O}</p>" +
                      $"<p><strong>Email:</strong> {safeEmail}</p>" + $"<p><strong>Company:</strong> {safeCompany}</p>" +
                      $"<p><strong>Role:</strong> {safeRole}</p>";
        string text = $"ArchLucid early-access request\nRequest id: {insert.Id:N}\nCreated (UTC): {insert.CreatedUtc:O}\n" +
                      $"Email: {email}\nCompany: {companyName ?? "—"}\nRole: {role ?? "—"}\n";
        EmailMessage emailMessage = new()
        {
            To = inbox.Trim(),
            Subject = subject,
            HtmlBody = html,
            TextBody = text,
            IdempotencyKey = $"{EventType}:{insert.Id:N}",
            Tags = new EmailMessageTags { EventType = EventType }
        };

        try
        {
            await _emailProvider.SendAsync(emailMessage, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Marketing early-access sales email failed for request id {RequestId}.", insert.Id);
        }
    }
}
