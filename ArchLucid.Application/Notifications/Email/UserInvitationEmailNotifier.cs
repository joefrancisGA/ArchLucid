using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

public interface IUserInvitationEmailNotifier
{
    Task<bool> TrySendInvitationAsync(
        string displayEmail,
        string acceptUrl,
        string appRole,
        int expiryDays,
        string? personalMessage,
        CancellationToken cancellationToken);
}

public sealed class UserInvitationEmailNotifier(
    IEmailProvider emailProvider,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<UserInvitationEmailNotifier> logger) : IUserInvitationEmailNotifier
{
    private const string DefaultProductName = "ArchLucid";
    private const string TemplateId = "user-workspace-invitation";

    private readonly IEmailProvider _emailProvider =
        emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly ILogger<UserInvitationEmailNotifier> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<bool> TrySendInvitationAsync(
        string displayEmail,
        string acceptUrl,
        string appRole,
        int expiryDays,
        string? personalMessage,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayEmail);
        ArgumentException.ThrowIfNullOrWhiteSpace(acceptUrl);

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName)
            ? DefaultProductName
            : emailOptions.ProductDisplayName.Trim();

        string subject = $"You're invited to {productName}";
        string text = BuildTextBody(productName, acceptUrl, appRole, expiryDays, personalMessage);
        string html = BuildHtmlBody(productName, acceptUrl, appRole, expiryDays, personalMessage);

        EmailMessage message = new()
        {
            To = displayEmail.Trim(),
            Subject = subject,
            HtmlBody = html,
            TextBody = text,
            IdempotencyKey = BuildIdempotencyKey(displayEmail, acceptUrl),
            Tags = new EmailMessageTags { TenantId = Guid.Empty, EventType = TemplateId }
        };

        try
        {
            await _emailProvider.SendAsync(message, cancellationToken).ConfigureAwait(false);

            return true;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(ex, "Workspace invitation email send failed.");
            }

            return false;
        }
    }

    private static string BuildTextBody(
        string productName,
        string acceptUrl,
        string appRole,
        int expiryDays,
        string? personalMessage)
    {
        string body =
            $"You have been invited to join a workspace in {productName} as {appRole}.\n\n" +
            $"Accept your invitation:\n{acceptUrl}\n\n" +
            $"This link expires in {expiryDays} days.\n";

        if (!string.IsNullOrWhiteSpace(personalMessage))
        {
            body += $"\nMessage from your administrator:\n{personalMessage.Trim()}\n";
        }

        body += "\nIf you were not expecting this invitation, you can ignore this email.";

        return body;
    }

    private static string BuildHtmlBody(
        string productName,
        string acceptUrl,
        string appRole,
        int expiryDays,
        string? personalMessage)
    {
        string encodedUrl = System.Net.WebUtility.HtmlEncode(acceptUrl);
        string html =
            $"<p>You have been invited to join a workspace in <strong>{System.Net.WebUtility.HtmlEncode(productName)}</strong> as <strong>{System.Net.WebUtility.HtmlEncode(appRole)}</strong>.</p>" +
            $"<p><a href=\"{encodedUrl}\">Accept your invitation</a></p>" +
            $"<p>This link expires in {expiryDays} days.</p>";

        if (!string.IsNullOrWhiteSpace(personalMessage))
        {
            html += $"<p><strong>Message from your administrator</strong><br/>{System.Net.WebUtility.HtmlEncode(personalMessage.Trim())}</p>";
        }

        html += "<p>If you were not expecting this invitation, you can ignore this email.</p>";

        return html;
    }

    private static string BuildIdempotencyKey(string displayEmail, string acceptUrl)
    {
        string normalizedEmail = displayEmail.Trim().ToLowerInvariant();
        string? invitationToken = TryExtractInvitationToken(acceptUrl);

        if (!string.IsNullOrWhiteSpace(invitationToken))
        {
            return $"{TemplateId}:{normalizedEmail}:{invitationToken}";
        }

        return $"{TemplateId}:{normalizedEmail}:{acceptUrl.Trim()}";
    }

    private static string? TryExtractInvitationToken(string acceptUrl)
    {
        string trimmedUrl = acceptUrl.Trim();
        const string tokenPrefix = "token=";
        int tokenIndex = trimmedUrl.IndexOf(tokenPrefix, StringComparison.OrdinalIgnoreCase);

        if (tokenIndex < 0)
        {
            return null;
        }

        string tokenPart = trimmedUrl[(tokenIndex + tokenPrefix.Length)..];
        int ampersandIndex = tokenPart.IndexOf('&');

        string token = ampersandIndex >= 0 ? tokenPart[..ampersandIndex] : tokenPart;

        return string.IsNullOrWhiteSpace(token) ? null : token;
    }
}
