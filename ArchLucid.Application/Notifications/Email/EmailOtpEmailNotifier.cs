using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Identity;

public interface IEmailOtpEmailNotifier
{
    Task<bool> TrySendSignInCodeAsync(
        string displayEmail,
        string code,
        int lifetimeMinutes,
        CancellationToken cancellationToken);
}

public sealed class EmailOtpEmailNotifier(
    IEmailProvider emailProvider,
    Microsoft.Extensions.Options.IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    Microsoft.Extensions.Logging.ILogger<EmailOtpEmailNotifier> logger) : IEmailOtpEmailNotifier
{
    private const string TemplateId = "email-otp-sign-in";

    private readonly IEmailProvider _emailProvider =
        emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));

    private readonly Microsoft.Extensions.Options.IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly Microsoft.Extensions.Logging.ILogger<EmailOtpEmailNotifier> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<bool> TrySendSignInCodeAsync(
        string displayEmail,
        string code,
        int lifetimeMinutes,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayEmail);
        ArgumentException.ThrowIfNullOrWhiteSpace(code);

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = EmailProductDisplayNameResolver.Resolve(emailOptions);

        string subject = $"{productName} sign-in code";
        string text = BuildTextBody(productName, code, lifetimeMinutes);
        string html = BuildHtmlBody(productName, code, lifetimeMinutes);

        string codeFingerprint = EmailOtpRequestMetadataHasher.HashOptional(code)
            ?? throw new ArgumentException("Code is required.", nameof(code));

        EmailMessage message = new()
        {
            To = displayEmail.Trim(),
            Subject = subject,
            HtmlBody = html,
            TextBody = text,
            IdempotencyKey = $"{TemplateId}:{EmailOtpCorrelationFingerprint.ComputeHexPrefix(displayEmail)}:{codeFingerprint}",
            Tags = new EmailMessageTags { TenantId = Guid.Empty, EventType = TemplateId }
        };

        try
        {
            await _emailProvider.SendAsync(message, cancellationToken).ConfigureAwait(false);

            return true;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            string recipientCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(displayEmail);

            if (_logger.IsEnabled(Microsoft.Extensions.Logging.LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Email OTP sign-in code send failed (recipientCorrelation={RecipientCorrelation}).",
                    recipientCorrelation);
            }

            return false;
        }
    }

    private static string BuildTextBody(string productName, string code, int lifetimeMinutes) =>
        $"{productName} sign-in code: {code}\n\n" +
        $"This code expires in {lifetimeMinutes} minutes.\n" +
        "Do not share this code with anyone.\n\n" +
        "If you did not request this email, you can ignore it.";

    private static string BuildHtmlBody(string productName, string code, int lifetimeMinutes) =>
        $"<p><strong>{System.Net.WebUtility.HtmlEncode(productName)}</strong> sign-in code:</p>" +
        $"<p style=\"font-size:24px;letter-spacing:4px;\"><strong>{System.Net.WebUtility.HtmlEncode(code)}</strong></p>" +
        $"<p>This code expires in {lifetimeMinutes} minutes.</p>" +
        "<p><strong>Do not share this code with anyone.</strong></p>" +
        "<p>If you did not request this email, you can ignore it.</p>";
}
