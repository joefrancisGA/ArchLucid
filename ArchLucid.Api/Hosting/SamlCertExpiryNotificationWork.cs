using System.Globalization;
using System.Net;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Hosting;

/// <summary>
///     Daily SAML SP signing certificate posture scan shared by <see cref="SamlCertExpiryNotificationHostedService"/>.
/// </summary>
internal static class SamlCertExpiryNotificationWork
{
    internal static readonly TimeSpan DailyInterval = TimeSpan.FromHours(24);

    internal const int WarningDaysBeforeExpiry = 30;
    internal const string EmailLedgerTemplateId = "saml-sp-signing-cert-expiry-warning";

    internal static async Task RunDailyPassAsync(
        ISamlOperationalDiagnosticsService samlDiagnostics,
        ITenantRepository tenantRepository,
        ITenantTrialEmailContactLookup contactLookup,
        ISentEmailLedger sentEmailLedger,
        IEmailProvider emailProvider,
        IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(samlDiagnostics);
        ArgumentNullException.ThrowIfNull(tenantRepository);
        ArgumentNullException.ThrowIfNull(contactLookup);
        ArgumentNullException.ThrowIfNull(sentEmailLedger);
        ArgumentNullException.ThrowIfNull(emailProvider);
        ArgumentNullException.ThrowIfNull(emailOptionsMonitor);
        ArgumentNullException.ThrowIfNull(timeProvider);
        ArgumentNullException.ThrowIfNull(logger);

        AdminSamlOperationalHealthResponse health =
            await samlDiagnostics.BuildAsync(cancellationToken).ConfigureAwait(false);

        if (!health.Saml2Enabled)
            return;

        DateTimeOffset utcNow = timeProvider.GetUtcNow();

        if (health.SpSigningCertificateNotAfterUtc is null)
            return;

        double daysRemaining = (health.SpSigningCertificateNotAfterUtc.Value - utcNow).TotalDays;

        if (daysRemaining > WarningDaysBeforeExpiry)
            return;

        EmailNotificationOptions emailOptions = emailOptionsMonitor.CurrentValue;
        string productName =
            string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName)
                ? "ArchLucid"
                : emailOptions.ProductDisplayName.Trim();
        string? operatorBase =
            string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl)
                ? null
                : emailOptions.OperatorBaseUrl.Trim().TrimEnd('/');

        IReadOnlyList<TenantRecord> tenants =
            await tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);

        DateTimeOffset notAfter = health.SpSigningCertificateNotAfterUtc.Value;
        string certDay =
            DateOnly.FromDateTime(notAfter.UtcDateTime).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        string runDay =
            DateOnly.FromDateTime(utcNow.UtcDateTime).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        foreach (TenantRecord tenant in tenants)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            if (tenant.SuspendedUtc is not null)
                continue;

            string? to =
                await contactLookup.TryResolveAdminEmailAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

            if (string.IsNullOrWhiteSpace(to))
                continue;

            string idempotencyKey =
                $"saml-sp-signing-cert-expiry-warning:{tenant.Id:N}:{certDay}:{runDay}";

            SentEmailLedgerEntry ledgerEntry =
                new(idempotencyKey, tenant.Id, EmailLedgerTemplateId, emailProvider.ProviderName, null);

            bool reserved =
                await sentEmailLedger.TryRecordSentAsync(ledgerEntry, cancellationToken).ConfigureAwait(false);

            if (!reserved)
                continue;

            string settingsHref =
                operatorBase is null ? "#" : $"{operatorBase}/settings/identity-providers";

            string settingsText =
                operatorBase is null
                    ? $"(configure {nameof(EmailNotificationOptions.OperatorBaseUrl)}) /settings/identity-providers"
                    : $"{operatorBase}/settings/identity-providers";

            string safeProduct = WebUtility.HtmlEncode(productName);
            string safeNotAfter = WebUtility.HtmlEncode(notAfter.ToString("O", CultureInfo.InvariantCulture));
            string safeDays = WebUtility.HtmlEncode($"{daysRemaining:F1}");
            string safeSettingsText = WebUtility.HtmlEncode(settingsText);

            string subject =
                daysRemaining <= 0
                    ? $"{productName}: SAML signing certificate has expired — SSO risk"
                    : $"{productName}: SAML signing certificate expiring within {WarningDaysBeforeExpiry} days";

            string html =
                "<p>"
                + $"{safeProduct}: SAML service-provider signing certificate is nearing expiry or has expired.</p>"
                + "<ul>"
                + $"<li><strong>Certificate expires (UTC):</strong> {safeNotAfter}</li>"
                + $"<li><strong>Approx. days remaining:</strong> {safeDays}</li>"
                + "</ul>"
                + "<p>Rotate the SP signing certificate and update your IdP trust configuration before SSO breaks.</p>"
                + $"<p>Review SAML posture in the operator console: <a href=\"{WebUtility.HtmlEncode(settingsHref)}\">{safeSettingsText}</a>.</p>"
                + "<p>This message was sent once per day while the certificate is within the warning window.</p>";

            string text =
                $"{productName} SAML SP signing certificate warning.\n"
                + $"Expires (UTC): {notAfter:O}\n"
                + $"Approx. days remaining: {daysRemaining:F1}\n"
                + $"Settings: {settingsText}\n";

            EmailMessage message = new()
            {
                To = to.Trim(),
                Subject = subject,
                HtmlBody = html,
                TextBody = text,
                IdempotencyKey = idempotencyKey,
                Tags = new EmailMessageTags { TenantId = tenant.Id, EventType = EmailLedgerTemplateId }
            };

            try
            {
                await emailProvider.SendAsync(message, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)when (!cancellationToken.IsCancellationRequested)
            {
                if (logger.IsEnabled(LogLevel.Error))
                    logger.LogError(ex, "SAML signing certificate expiry notification send failed for tenant {TenantId}.",
                        tenant.Id);
            }
        }
    }
}
