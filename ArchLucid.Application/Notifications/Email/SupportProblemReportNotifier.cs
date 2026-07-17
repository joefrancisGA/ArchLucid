using System.Net;

using ArchLucid.Application.Support;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Support;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref="ISupportProblemReportNotifier" />
public sealed class SupportProblemReportNotifier(
    IEmailProvider emailProvider,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<SupportProblemReportNotifier> logger) : ISupportProblemReportNotifier
{
    private const string EventType = "support-problem-report";

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));

    private readonly ILogger<SupportProblemReportNotifier> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task NotifySupportInboxAsync(
        SupportProblemReportRecord report,
        string submittedByActorId,
        bool supportBundleAttached,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentException.ThrowIfNullOrWhiteSpace(submittedByActorId);

        EmailNotificationOptions opts = _emailOptionsMonitor.CurrentValue;
        string? inbox = opts.SupportInbox;

        if (string.IsNullOrWhiteSpace(inbox))
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Support problem report notification skipped: {ConfigKey} is empty.",
                    nameof(EmailNotificationOptions.SupportInbox));
            }

            return;
        }

        if (string.Equals(_emailProvider.ProviderName, EmailProviderNames.Noop, StringComparison.OrdinalIgnoreCase))
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Would notify support inbox {Inbox} for report id {ReportId} (Email:Provider is {Provider}).",
                    inbox.Trim(),
                    report.Id,
                    _emailProvider.ProviderName);
            }

            return;
        }

        string referenceId = report.Id.ToString("D");
        string safeActor = WebUtility.HtmlEncode(submittedByActorId);
        string safeCorrelation = WebUtility.HtmlEncode(report.CorrelationId ?? "—");
        string safeClientRequest = WebUtility.HtmlEncode(report.ClientRequestId ?? "—");
        string subject = $"[ArchLucid] Report {referenceId}";
        string html = "<p>A new <strong>Report problem</strong> submission was received from the operator UI.</p>" +
                      $"<p><strong>Report reference:</strong> {referenceId}</p>" +
                      $"<p><strong>Submitted (UTC):</strong> {report.CreatedUtc:O}</p>" +
                      $"<p><strong>Submitter actor id:</strong> {safeActor}</p>" +
                      $"<p><strong>Correlation id:</strong> {safeCorrelation}</p>" +
                      $"<p><strong>Client request id:</strong> {safeClientRequest}</p>" +
                      $"<p><strong>Redacted support bundle attached:</strong> {(supportBundleAttached ? "Yes" : "No")}</p>" +
                      $"<p><strong>SLA:</strong> {WebUtility.HtmlEncode(SupportProblemReportIntakeService.SlaMessage)}</p>";
        string text = "ArchLucid support problem report\n" +
                      $"Report reference: {referenceId}\n" +
                      $"Submitted (UTC): {report.CreatedUtc:O}\n" +
                      $"Submitter actor id: {submittedByActorId}\n" +
                      $"Correlation id: {report.CorrelationId ?? "—"}\n" +
                      $"Client request id: {report.ClientRequestId ?? "—"}\n" +
                      $"Redacted support bundle attached: {(supportBundleAttached ? "Yes" : "No")}\n" +
                      $"SLA: {SupportProblemReportIntakeService.SlaMessage}\n";
        EmailMessage emailMessage = new()
        {
            To = inbox.Trim(),
            Subject = subject,
            HtmlBody = html,
            TextBody = text,
            IdempotencyKey = $"{EventType}:{report.Id:N}",
            Tags = new EmailMessageTags { EventType = EventType }
        };

        try
        {
            await _emailProvider.SendAsync(emailMessage, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(ex, "Support problem report email failed for report id {ReportId}.", report.Id);
            }
        }
    }
}
