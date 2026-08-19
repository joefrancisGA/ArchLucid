using System.Globalization;
using System.Net;

using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Governance;

/// <summary>Builds the TB-2193 waiver expiry reminder subject and body. Separated so copy is testable without I/O.</summary>
public static class WaiverExpiryReminderEmailComposer
{
    /// <summary>Operator route that owns waivers and their renew / revoke decisions.</summary>
    public const string DecisionRegisterPath = "/governance/decision-register";

    public static WaiverExpiryReminderEmailContent Compose(
        WaiverExpiryNotification notification,
        EmailNotificationOptions emailOptions)
    {
        ArgumentNullException.ThrowIfNull(notification);
        ArgumentNullException.ThrowIfNull(emailOptions);

        string productName =
            string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName)
                ? "ArchLucid"
                : emailOptions.ProductDisplayName.Trim();

        string? operatorBase =
            string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl)
                ? null
                : emailOptions.OperatorBaseUrl.Trim().TrimEnd('/');

        string registerText =
            operatorBase is null
                ? $"(configure {nameof(EmailNotificationOptions.OperatorBaseUrl)}) {DecisionRegisterPath}"
                : $"{operatorBase}{DecisionRegisterPath}";

        string registerHref = operatorBase is null ? "#" : $"{operatorBase}{DecisionRegisterPath}";

        bool lapsed = notification.DaysRemaining <= 0;

        string subject =
            lapsed
                ? $"{productName}: accepted risk has reached its expiry date"
                : $"{productName}: accepted risk expires in {notification.DaysRemaining} day(s)";

        string expiresAt = notification.Waiver.ExpiresAtUtc.ToString("u", CultureInfo.InvariantCulture);

        string leadSentence =
            lapsed
                ? "This risk acceptance has reached its expiry date and needs a decision: renew it with fresh rationale, or revoke it and reopen the finding."
                : "This risk acceptance is approaching its expiry date. Renew it with fresh rationale, or let it lapse and reopen the finding.";

        string html =
            "<p>"
            + WebUtility.HtmlEncode(leadSentence)
            + "</p><ul>"
            + $"<li><strong>Finding:</strong> {WebUtility.HtmlEncode(notification.Waiver.FindingId)}</li>"
            + $"<li><strong>Owner:</strong> {WebUtility.HtmlEncode(notification.Waiver.OwnerUserId)}</li>"
            + $"<li><strong>Expires (UTC):</strong> {WebUtility.HtmlEncode(expiresAt)}</li>"
            + $"<li><strong>Days remaining:</strong> {WebUtility.HtmlEncode(notification.DaysRemaining.ToString(CultureInfo.InvariantCulture))}</li>"
            + "</ul>"
            + $"<p>Review it in the decision register: <a href=\"{WebUtility.HtmlEncode(registerHref)}\">{WebUtility.HtmlEncode(registerText)}</a>.</p>"
            + "<p>Expiry never renews or revokes a risk acceptance on its own; a person decides.</p>";

        string text =
            leadSentence
            + "\n"
            + $"Finding: {notification.Waiver.FindingId}\n"
            + $"Owner: {notification.Waiver.OwnerUserId}\n"
            + $"Expires (UTC): {expiresAt}\n"
            + $"Days remaining: {notification.DaysRemaining.ToString(CultureInfo.InvariantCulture)}\n"
            + $"Decision register: {registerText}\n";

        return new WaiverExpiryReminderEmailContent
        {
            Subject = subject,
            HtmlBody = html,
            TextBody = text,
        };
    }
}
