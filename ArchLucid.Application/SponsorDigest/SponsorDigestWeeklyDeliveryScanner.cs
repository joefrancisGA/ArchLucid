using System.Globalization;

using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.SponsorDigest;

/// <summary>Worker/CLI entry that evaluates per-tenant sponsor digest schedules and sends at most one digest per tenant per ISO week.</summary>
public sealed class SponsorDigestWeeklyDeliveryScanner(
    ITenantSponsorDigestPreferencesRepository digestPreferencesRepository,
    ITenantRepository tenantRepository,
    IExecDigestComposer execDigestComposer,
    IExecDigestEmailDispatcher execDigestEmailDispatcher,
    ITenantTrialEmailContactLookup tenantTrialEmailContactLookup,
    ISponsorDigestUnsubscribeTokenFactory unsubscribeTokenFactory,
    IExecDigestSponsorDeepLinkTokenFactory sponsorDeepLinkTokenFactory,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<SponsorDigestWeeklyDeliveryScanner> logger)
{
    private readonly ITenantSponsorDigestPreferencesRepository _digestPreferencesRepository =
        digestPreferencesRepository ?? throw new ArgumentNullException(nameof(digestPreferencesRepository));

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IExecDigestComposer _execDigestComposer = execDigestComposer ?? throw new ArgumentNullException(nameof(execDigestComposer));

    private readonly IExecDigestEmailDispatcher _execDigestEmailDispatcher =
        execDigestEmailDispatcher ?? throw new ArgumentNullException(nameof(execDigestEmailDispatcher));

    private readonly ILogger<SponsorDigestWeeklyDeliveryScanner> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantTrialEmailContactLookup _tenantTrialEmailContactLookup =
        tenantTrialEmailContactLookup ?? throw new ArgumentNullException(nameof(tenantTrialEmailContactLookup));

    private readonly ISponsorDigestUnsubscribeTokenFactory _unsubscribeTokenFactory =
        unsubscribeTokenFactory ?? throw new ArgumentNullException(nameof(unsubscribeTokenFactory));

    private readonly IExecDigestSponsorDeepLinkTokenFactory _sponsorDeepLinkTokenFactory =
        sponsorDeepLinkTokenFactory ?? throw new ArgumentNullException(nameof(sponsorDeepLinkTokenFactory));

    public async Task PublishDueAsync(DateTimeOffset utcNow, CancellationToken cancellationToken)
    {
        IReadOnlyList<Guid> tenantIds = await _digestPreferencesRepository.ListEmailEnabledTenantIdsAsync(cancellationToken).ConfigureAwait(false);
        foreach (Guid tenantId in tenantIds)
        {
            if (cancellationToken.IsCancellationRequested)
                break;
            try
            {
                await TryPublishForTenantAsync(tenantId, utcNow, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)when (!cancellationToken.IsCancellationRequested)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(ex, "Sponsor digest weekly delivery failed for tenant {TenantId}.", tenantId);
            }
        }
    }

    private async Task TryPublishForTenantAsync(Guid tenantId, DateTimeOffset utcNow, CancellationToken cancellationToken)
    {
        SponsorDigestPreferencesResponse? prefs = await _digestPreferencesRepository.GetByTenantAsync(tenantId, cancellationToken).ConfigureAwait(false);
        if (prefs is null || !prefs.EmailEnabled)
            return;
        TimeZoneInfo tz;
        try
        {
            tz = TimeZoneInfo.FindSystemTimeZoneById(prefs.IanaTimeZoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Sponsor digest: unknown timezone {Tz} for tenant {TenantId}; falling back to UTC.", prefs.IanaTimeZoneId, tenantId);
            tz = TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            tz = TimeZoneInfo.Utc;
        }

        DateTime local = TimeZoneInfo.ConvertTimeFromUtc(utcNow.UtcDateTime, tz);
        if (local.DayOfWeek != (DayOfWeek)prefs.DayOfWeek)
            return;
        if (local.Hour != prefs.HourOfDay)
            return;
        TenantWorkspaceLink? workspace = await _tenantRepository.GetFirstWorkspaceAsync(tenantId, cancellationToken).ConfigureAwait(false);
        if (workspace is null)
            return;
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspace.WorkspaceId, ProjectId = workspace.DefaultProjectId };
        DateTime refDay = DateTime.SpecifyKind(utcNow.UtcDateTime.Date, DateTimeKind.Utc);
        int isoYear = ISOWeek.GetYear(refDay);
        int isoWeek = ISOWeek.GetWeekOfYear(refDay);
        DateTime weekStartUtc = DateTime.SpecifyKind(ISOWeek.ToDateTime(isoYear, isoWeek, DayOfWeek.Monday), DateTimeKind.Utc);
        DateTime weekEndUtc = weekStartUtc.AddDays(7);
        string isoKey = $"{isoYear}-W{isoWeek:00}";
        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl) ? "http://localhost:3000" : emailOptions.OperatorBaseUrl.Trim();
        string apiBase = operatorBase.TrimEnd('/');
        string token = _unsubscribeTokenFactory.CreateToken(tenantId);
        string unsubscribeUrl = $"{apiBase}/v1.0/notifications/sponsor-digest/unsubscribe?token={Uri.EscapeDataString(token)}";
        List<string> recipients = [];
        if (prefs.RecipientEmails is { Count: > 0 } configured)
            recipients.AddRange(configured.Where(static e => !string.IsNullOrWhiteSpace(e)).Select(static e => e.Trim()));
        if (recipients.Count == 0)
        {
            string? fallback = await _tenantTrialEmailContactLookup.TryResolveAdminEmailAsync(tenantId, cancellationToken).ConfigureAwait(false);
            if (!string.IsNullOrWhiteSpace(fallback))
                recipients.Add(fallback.Trim());
        }

        if (recipients.Count == 0)
        {
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Sponsor digest skipped; no recipients for tenant {TenantId}.", tenantId);
            return;
        }

        ExecDigestComposition composition;
        using (AmbientScopeContext.Push(scope))
        {
            composition = await _execDigestComposer.ComposeAsync(tenantId, weekStartUtc, weekEndUtc, scope, operatorBase, cancellationToken)
                .ConfigureAwait(false);
        }

        ExecDigestComposition tokenizedComposition = ApplyTokenizedSponsorDeepLinks(
            composition,
            tenantId,
            isoKey,
            operatorBase);

        await _execDigestEmailDispatcher.TryDispatchAsync(
                tenantId,
                isoKey,
                tokenizedComposition,
                recipients,
                unsubscribeUrl,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private ExecDigestComposition ApplyTokenizedSponsorDeepLinks(
        ExecDigestComposition composition,
        Guid tenantId,
        string isoWeekKey,
        string operatorBase)
    {
        string dashboardToken = _sponsorDeepLinkTokenFactory.CreateDashboardToken(tenantId, isoWeekKey);
        string dashboardUrl = ExecDigestSponsorDeepLinkOperatorLinks.BuildDashboardUrl(operatorBase, dashboardToken);
        string sponsorValueReportUrl;

        if (!string.IsNullOrWhiteSpace(composition.LatestCommittedRunIdHex))
        {
            string runToken = _sponsorDeepLinkTokenFactory.CreateRunCollateralToken(
                tenantId,
                composition.LatestCommittedRunIdHex,
                isoWeekKey);
            sponsorValueReportUrl = ExecDigestSponsorDeepLinkOperatorLinks.BuildRunCollateralUrl(
                operatorBase,
                composition.LatestCommittedRunIdHex,
                runToken);
        }
        else
        {
            sponsorValueReportUrl = dashboardUrl;
        }

        return composition with
        {
            DashboardUrl = dashboardUrl,
            SponsorValueReportUrl = sponsorValueReportUrl,
        };
    }
}
