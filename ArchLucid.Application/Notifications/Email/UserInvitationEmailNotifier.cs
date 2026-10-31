using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
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
    private const string TemplateId = "user-workspace-invitation";
    private static readonly System.Text.RegularExpressions.Regex PersonalMessageMarkdownLinkRegex =
        new(@"\[(?<label>[^\]]+)\]\((?<url>[^)]+)\)", System.Text.RegularExpressions.RegexOptions.Compiled);

    private static readonly System.Text.RegularExpressions.Regex PersonalMessageEmbeddedHttpUrlRegex =
        new(@"https?://[^\s<>""'\)\]]+", System.Text.RegularExpressions.RegexOptions.Compiled | System.Text.RegularExpressions.RegexOptions.IgnoreCase);

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

        if (!IdentityEmailNormalizer.TryNormalize(displayEmail, out string normalizedMailbox, out string mailboxForDelivery))
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning("Workspace invitation email skipped: invalid recipient mailbox.");
            }

            return false;
        }

        string normalizedAcceptUrl = EmailBrandingUrls.SanitizeOperatorAbsoluteUrl(acceptUrl.Trim());
        string? normalizedPersonalMessage = NormalizePersonalMessage(personalMessage);
        string displayAppRole = EmailHeaderFragmentSanitizer.Sanitize(appRole);

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = EmailProductDisplayNameResolver.Resolve(emailOptions);

        string subject = $"You're invited to {productName}";
        string text = BuildTextBody(productName, normalizedAcceptUrl, displayAppRole, expiryDays, normalizedPersonalMessage);
        string html = BuildHtmlBody(productName, normalizedAcceptUrl, displayAppRole, expiryDays, normalizedPersonalMessage);

        EmailMessage message = new()
        {
            To = mailboxForDelivery,
            Subject = subject,
            HtmlBody = html,
            TextBody = text,
            IdempotencyKey = BuildIdempotencyKey(normalizedMailbox, normalizedAcceptUrl),
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
            body += $"\nMessage from your administrator:\n{FormatPersonalMessageText(personalMessage.Trim())}\n";
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
            html += $"<p><strong>Message from your administrator</strong><br/>{FormatPersonalMessageHtml(personalMessage.Trim())}</p>";
        }

        html += "<p>If you were not expecting this invitation, you can ignore this email.</p>";

        return html;
    }

    private static string FormatPersonalMessageText(string personalMessage)
    {
        string sanitizedMessage = EmailHeaderFragmentSanitizer.Sanitize(personalMessage);

        return PersonalMessageMarkdownLinkRegex.Replace(
            sanitizedMessage,
            static match =>
            {
                string label = match.Groups["label"].Value;
                string url = SanitizePersonalMessageLinkUrl(match.Groups["url"].Value);

                return $"{label} ({url})";
            });
    }

    private static string FormatPersonalMessageHtml(string personalMessage)
    {
        int lastIndex = 0;
        System.Text.StringBuilder builder = new();

        foreach (System.Text.RegularExpressions.Match match in PersonalMessageMarkdownLinkRegex.Matches(personalMessage))
        {
            if (match.Index > lastIndex)
            {
                builder.Append(System.Net.WebUtility.HtmlEncode(personalMessage[lastIndex..match.Index]));
            }

            string rawLabel = match.Groups["label"].Value;
            string rawUrl = match.Groups["url"].Value;

            string label = System.Net.WebUtility.HtmlEncode(rawLabel);

            if (Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out Uri? uri)
                && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp))
            {
                string sanitizedUrl = SanitizePersonalMessageLinkUrl(rawUrl);
                string url = System.Net.WebUtility.HtmlEncode(sanitizedUrl);
                builder.Append($"<a href=\"{url}\" rel=\"noopener noreferrer\">{label}</a>");
            }
            else
            {
                string urlText = System.Net.WebUtility.HtmlEncode(rawUrl);
                builder.Append($"{label} ({urlText})");
            }
            lastIndex = match.Index + match.Length;
        }

        if (lastIndex < personalMessage.Length)
        {
            builder.Append(System.Net.WebUtility.HtmlEncode(personalMessage[lastIndex..]));
        }

        return builder.ToString();
    }

    private static string SanitizePersonalMessageLinkUrl(string rawUrl)
    {
        string trimmed = rawUrl.Trim();

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri)
            || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            return trimmed;
        }

        return EmailBrandingUrls.SanitizeOperatorAbsoluteUrl(trimmed);
    }

    private static string? NormalizePersonalMessage(string? personalMessage)
    {
        if (string.IsNullOrWhiteSpace(personalMessage))
            return null;

        return SanitizeEmbeddedHttpUrls(personalMessage.Trim());
    }

    private static string SanitizeEmbeddedHttpUrls(string message)
    {
        return PersonalMessageEmbeddedHttpUrlRegex.Replace(
            message,
            static match => SanitizePersonalMessageLinkUrl(match.Value));
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
