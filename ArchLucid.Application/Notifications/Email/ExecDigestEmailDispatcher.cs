using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref = "IExecDigestEmailDispatcher"/>
public sealed class ExecDigestEmailDispatcher(
    IEmailTemplateRenderer templateRenderer,
    IEmailProvider emailProvider,
    ISentEmailLedger sentEmailLedger,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<ExecDigestEmailDispatcher> logger) : IExecDigestEmailDispatcher
{
    public const string TemplateId = "ExecDigest";
    private const string DefaultProductName = "ArchLucid";

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));
    private readonly ILogger<ExecDigestEmailDispatcher> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly ISentEmailLedger _sentEmailLedger = sentEmailLedger ?? throw new ArgumentNullException(nameof(sentEmailLedger));
    private readonly IEmailTemplateRenderer _templateRenderer = templateRenderer ?? throw new ArgumentNullException(nameof(templateRenderer));

    /// <inheritdoc/>
    public async Task<bool> TryDispatchAsync(Guid tenantId, string isoWeekIdempotencyKey, ExecDigestComposition composition, IReadOnlyList<string> toMailboxes,
        string unsubscribeAbsoluteUrl, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(isoWeekIdempotencyKey);
        ArgumentNullException.ThrowIfNull(toMailboxes);
        ArgumentNullException.ThrowIfNull(unsubscribeAbsoluteUrl);
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(isoWeekIdempotencyKey))
            throw new ArgumentException("Idempotency key is required.", nameof(isoWeekIdempotencyKey));
        ArgumentNullException.ThrowIfNull(composition);

        List<string> normalizedMailboxes = [];

        foreach (string mailbox in toMailboxes)
        {
            if (string.IsNullOrWhiteSpace(mailbox))
                continue;

            normalizedMailboxes.Add(mailbox.Trim());
        }

        if (normalizedMailboxes.Count == 0)
            return false;

        if (string.IsNullOrWhiteSpace(unsubscribeAbsoluteUrl))
            throw new ArgumentException("Unsubscribe URL is required.", nameof(unsubscribeAbsoluteUrl));
        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName) ? DefaultProductName : emailOptions.ProductDisplayName.Trim();
        string? operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl) ? null : emailOptions.OperatorBaseUrl.TrimEnd('/');
        ExecDigestEmailModel model = new()
        {
            ProductName = productName,
            WeekLabel = composition.WeekLabel,
            ComplianceDriftMarkdown = composition.ComplianceDriftMarkdown,
            CommittedManifestsInWeek = composition.CommittedManifestsInWeek,
            TopRuns = composition.TopManifestRuns,
            FindingsDeltaSummary = composition.FindingsDeltaSummary,
            DashboardUrl = composition.DashboardUrl,
            SponsorValueReportUrl = composition.SponsorValueReportUrl,
            UnsubscribeUrl = unsubscribeAbsoluteUrl.Trim(),
            LogoImageUrl = EmailBrandingUrls.TryBuildLogoImageUrl(operatorBase)
        };
        string idempotencyKey = $"exec-digest:{tenantId:N}:{isoWeekIdempotencyKey}";
        string html = await _templateRenderer.RenderHtmlAsync(TemplateId, model, cancellationToken);
        string text = await _templateRenderer.RenderTextAsync(TemplateId, model, cancellationToken);
        string subject = $"{productName} weekly digest — {composition.WeekLabel}";

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
                IdempotencyKey = idempotencyKey + ":" + mailbox,
                Tags = new EmailMessageTags { TenantId = tenantId, EventType = "exec-digest-weekly" }
            },
            (ex, mailbox) =>
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(ex, "Exec digest email send failed for tenant {TenantId}, mailbox {Mailbox}.", tenantId, mailbox);
            },
            cancellationToken);
    }
}
