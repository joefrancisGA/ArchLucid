using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IWaiverExpiryNotificationService" />
public sealed class WaiverExpiryNotificationService(
    IRiskExceptionService riskExceptionService,
    ITenantNotificationChannelPreferencesRepository channelPreferencesRepository,
    ITenantTrialEmailContactLookup tenantAdminContactLookup,
    ISentEmailLedger sentEmailLedger,
    IEmailProvider emailProvider,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    IOptionsMonitor<WaiverExpiryNotificationOptions> optionsMonitor,
    IAuditService auditService,
    TimeProvider timeProvider,
    ILogger<WaiverExpiryNotificationService> logger) : IWaiverExpiryNotificationService
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantNotificationChannelPreferencesRepository _channelPreferencesRepository =
        channelPreferencesRepository ?? throw new ArgumentNullException(nameof(channelPreferencesRepository));

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));

    private readonly ILogger<WaiverExpiryNotificationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<WaiverExpiryNotificationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly ISentEmailLedger _sentEmailLedger =
        sentEmailLedger ?? throw new ArgumentNullException(nameof(sentEmailLedger));

    private readonly ITenantTrialEmailContactLookup _tenantAdminContactLookup =
        tenantAdminContactLookup ?? throw new ArgumentNullException(nameof(tenantAdminContactLookup));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task<int> RunTenantPassAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (!_optionsMonitor.CurrentValue.Enabled)
            return 0;

        // ListActiveAsync is the same call the read path uses: it marks past-due waivers expired and audits them, so
        // the scanner makes expiry authoritative without duplicating that transition anywhere.
        IReadOnlyList<RiskExceptionRecord> activeWaivers = await _riskExceptionService
            .ListActiveAsync(tenantId, null, cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();

        IReadOnlyList<WaiverExpiryNotification> planned =
            WaiverExpiryNotificationPlanner.Plan(activeWaivers, utcNow);

        if (planned.Count == 0)
            return 0;

        if (!await IsEmailChannelEnabledAsync(tenantId, cancellationToken).ConfigureAwait(false))
            return 0;

        string? adminFallback = await _tenantAdminContactLookup
            .TryResolveAdminEmailAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        int sentCount = 0;

        foreach (WaiverExpiryNotification notification in planned)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            if (await TrySendReminderAsync(notification, adminFallback, emailOptions, cancellationToken)
                    .ConfigureAwait(false))
                sentCount++;
        }

        return sentCount;
    }

    /// <summary>
    ///     An explicit customer opt-out wins. A tenant with no preference row keeps reminders on: a waiver lapsing
    ///     unnoticed is a governance-correctness failure, not just unwanted mail.
    /// </summary>
    private async Task<bool> IsEmailChannelEnabledAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantNotificationChannelPreferencesResponse? preferences = await _channelPreferencesRepository
            .GetByTenantAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        if (preferences is null || !preferences.IsConfigured)
            return true;

        return preferences.EmailCustomerNotificationsEnabled;
    }

    private async Task<bool> TrySendReminderAsync(
        WaiverExpiryNotification notification,
        string? adminFallback,
        EmailNotificationOptions emailOptions,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<string> recipients =
            WaiverExpiryReminderRecipients.Resolve(notification.Waiver, adminFallback);

        if (recipients.Count == 0)
            return false;

        string idempotencyKey = WaiverExpiryReminderIdempotency.BuildKey(
            notification.Waiver.RiskExceptionId,
            notification.Waiver.ExpiresAtUtc,
            notification.BoundaryDays);

        SentEmailLedgerEntry ledgerEntry = new(
            idempotencyKey,
            notification.Waiver.TenantId,
            WaiverExpiryReminderIdempotency.EmailTemplateId,
            _emailProvider.ProviderName,
            null);

        // Reserve before sending: the ledger is the only thing standing between a restart and a duplicate reminder.
        bool reserved = await _sentEmailLedger
            .TryRecordSentAsync(ledgerEntry, cancellationToken)
            .ConfigureAwait(false);

        if (!reserved)
            return false;

        WaiverExpiryReminderEmailContent content =
            WaiverExpiryReminderEmailComposer.Compose(notification, emailOptions);

        foreach (string recipient in recipients)
        {
            EmailMessage message = new()
            {
                To = recipient,
                Subject = content.Subject,
                HtmlBody = content.HtmlBody,
                TextBody = content.TextBody,
                IdempotencyKey = $"{idempotencyKey}:{recipient}",
                Tags = new EmailMessageTags
                {
                    TenantId = notification.Waiver.TenantId,
                    EventType = WaiverExpiryReminderIdempotency.EmailTemplateId,
                },
            };

            try
            {
                await _emailProvider.SendAsync(message, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(
                        ex,
                        "Waiver expiry reminder send failed for risk exception {RiskExceptionId}.",
                        notification.Waiver.RiskExceptionId);
            }
        }

        await AuditReminderAsync(notification, recipients.Count, cancellationToken).ConfigureAwait(false);

        return true;
    }

    private Task AuditReminderAsync(
        WaiverExpiryNotification notification,
        int recipientCount,
        CancellationToken cancellationToken)
    {
        AuditEvent auditEvent = new()
        {
            EventType = AuditEventTypes.RiskExceptionExpiryReminderSent,
            ActorUserId = "system",
            ActorUserName = "system",
            TenantId = notification.Waiver.TenantId,
            WorkspaceId = notification.Waiver.WorkspaceId,
            ProjectId = notification.Waiver.ProjectId,
            RunId = notification.Waiver.RunId,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    notification.Waiver.RiskExceptionId,
                    notification.Waiver.FindingId,
                    notification.Waiver.ExpiresAtUtc,
                    notification.BoundaryDays,
                    notification.DaysRemaining,
                    recipientCount,
                },
                AuditJsonSerializationOptions.Instance),
        };

        return DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"{AuditEventTypes.RiskExceptionExpiryReminderSent}:{notification.Waiver.RiskExceptionId:N}:{notification.BoundaryDays}",
            cancellationToken);
    }
}
