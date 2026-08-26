using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref="IFindingRemediationAssignmentEmailDispatcher" />
public sealed class FindingRemediationAssignmentEmailDispatcher(
    IEmailTemplateRenderer templateRenderer,
    IEmailProvider emailProvider,
    ISentEmailLedger sentEmailLedger,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<FindingRemediationAssignmentEmailDispatcher> logger) : IFindingRemediationAssignmentEmailDispatcher
{
    public const string TemplateId = "FindingRemediationAssignment";

    private const string DefaultProductName = "ArchLucid";

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IEmailProvider _emailProvider = emailProvider ?? throw new ArgumentNullException(nameof(emailProvider));

    private readonly ILogger<FindingRemediationAssignmentEmailDispatcher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ISentEmailLedger _sentEmailLedger = sentEmailLedger ?? throw new ArgumentNullException(nameof(sentEmailLedger));

    private readonly IEmailTemplateRenderer _templateRenderer =
        templateRenderer ?? throw new ArgumentNullException(nameof(templateRenderer));

    /// <inheritdoc />
    public async Task<bool> TryDispatchAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        string findingTitle,
        string assigneeMailbox,
        DateTimeOffset? remediationDueUtc,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        string mailbox = assigneeMailbox.Trim();

        if (!IsMailboxAddress(mailbox))
            return false;

        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string productName = string.IsNullOrWhiteSpace(emailOptions.ProductDisplayName)
            ? DefaultProductName
            : emailOptions.ProductDisplayName.Trim();

        string? operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl)
            ? null
            : emailOptions.OperatorBaseUrl.TrimEnd('/');

        string trimmedFindingId = findingId.Trim();
        string trimmedTitle = string.IsNullOrWhiteSpace(findingTitle) ? trimmedFindingId : findingTitle.Trim();
        string runHex = runId.ToString("N");
        string idempotencyKey =
            $"finding-remediation-assignment:{tenantId:N}:{runHex}:{trimmedFindingId}:{mailbox.ToLowerInvariant()}";

        if (await _sentEmailLedger.IsRecordedAsync(tenantId, idempotencyKey, cancellationToken).ConfigureAwait(false))
            return true;

        FindingRemediationAssignmentEmailModel model = new()
        {
            ProductName = productName,
            FindingTitle = trimmedTitle,
            FindingInspectUrl = FindingRemediationAssignmentOperatorLinks.BuildFindingInspectUrl(
                operatorBase,
                runId,
                trimmedFindingId),
            AssignedToQueueUrl = FindingRemediationAssignmentOperatorLinks.BuildAssignedToMeQueueUrl(operatorBase),
            RemediationDueLabel = remediationDueUtc?.ToString("u"),
            LogoImageUrl = EmailBrandingUrls.TryBuildLogoImageUrl(operatorBase),
        };

        string html = await _templateRenderer.RenderHtmlAsync(TemplateId, model, cancellationToken).ConfigureAwait(false);
        string text = await _templateRenderer.RenderTextAsync(TemplateId, model, cancellationToken).ConfigureAwait(false);
        string subject = $"{productName}: you were assigned an architecture finding";

        EmailMessage message = new()
        {
            To = mailbox,
            Subject = subject,
            HtmlBody = html,
            TextBody = text,
            IdempotencyKey = idempotencyKey,
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
                    "Finding remediation assignment email send failed for tenant {TenantId}, finding {FindingId}.",
                    tenantId,
                    LogSanitizer.Sanitize(trimmedFindingId)); // codeql[cs/log-forging]: FindingId operational id; TenantId is Guid.
            }

            throw;
        }

        SentEmailLedgerEntry ledgerEntry = new(idempotencyKey, tenantId, TemplateId, _emailProvider.ProviderName, null);
        bool reserved = await _sentEmailLedger.TryRecordSentAsync(ledgerEntry, cancellationToken).ConfigureAwait(false);

        return reserved;
    }

    private static bool IsMailboxAddress(string value) =>
        value.Contains('@', StringComparison.Ordinal) && value.IndexOf('@', StringComparison.Ordinal) > 0;
}
