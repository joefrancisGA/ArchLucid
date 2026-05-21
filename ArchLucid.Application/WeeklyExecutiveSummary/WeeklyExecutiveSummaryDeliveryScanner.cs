using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.WeeklyExecutiveSummary;

/// <summary>
///     Worker entry that sends at most one run-summary one-pager email per commercial tenant per ISO week to Admin and
///     Sponsor mailboxes.
/// </summary>
public sealed class WeeklyExecutiveSummaryDeliveryScanner(
    ITenantRepository tenantRepository,
    IAuthorityQueryService authorityQueryService,
    IRunDetailQueryService runDetailQueryService,
    IRunSummaryOnePagerExportService runSummaryOnePagerExportService,
    IExecutiveSummaryRecipientLookup recipientLookup,
    IWeeklyExecutiveSummaryEmailDispatcher emailDispatcher,
    IOptionsMonitor<WeeklyExecutiveSummaryOptions> optionsMonitor,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor,
    ILogger<WeeklyExecutiveSummaryDeliveryScanner> logger)
{
    private const int MaxListRuns = 200;
    private const int MaxRunDetailLookups = 40;

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IWeeklyExecutiveSummaryEmailDispatcher _emailDispatcher =
        emailDispatcher ?? throw new ArgumentNullException(nameof(emailDispatcher));

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly ILogger<WeeklyExecutiveSummaryDeliveryScanner> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<WeeklyExecutiveSummaryOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IExecutiveSummaryRecipientLookup _recipientLookup =
        recipientLookup ?? throw new ArgumentNullException(nameof(recipientLookup));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IRunSummaryOnePagerExportService _runSummaryOnePagerExportService =
        runSummaryOnePagerExportService ?? throw new ArgumentNullException(nameof(runSummaryOnePagerExportService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task PublishDueAsync(DateTimeOffset utcNow, CancellationToken cancellationToken)
    {
        WeeklyExecutiveSummaryOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled)
            return;

        if (!IsScheduledLocalHour(utcNow, options))
            return;

        IReadOnlyList<TenantRecord> tenants = await _tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);

        foreach (TenantRecord tenant in tenants)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            if (!CommercialTenantEligibility.IsEligibleForWeeklyExecutiveSummary(tenant))
                continue;

            try
            {
                await TryPublishForTenantAsync(tenant, utcNow, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(ex, "Weekly executive summary delivery failed for tenant {TenantId}.", tenant.Id);
            }
        }
    }

    private async Task TryPublishForTenantAsync(TenantRecord tenant, DateTimeOffset utcNow, CancellationToken cancellationToken)
    {
        TenantWorkspaceLink? workspace = await _tenantRepository.GetFirstWorkspaceAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

        if (workspace is null)
            return;

        ScopeContext scope = new()
        {
            TenantId = tenant.Id,
            WorkspaceId = workspace.WorkspaceId,
            ProjectId = workspace.DefaultProjectId
        };

        string? latestRunHex;
        using (AmbientScopeContext.Push(scope))
        {
            latestRunHex = await TryResolveLatestCommittedRunHexAsync(scope, cancellationToken).ConfigureAwait(false);
        }

        if (string.IsNullOrWhiteSpace(latestRunHex))
        {
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Weekly executive summary skipped; no committed run for tenant {TenantId}.", tenant.Id);

            return;
        }

        IReadOnlyList<string> recipients =
            await _recipientLookup.ListRecipientMailboxesAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

        if (recipients.Count == 0)
        {
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Weekly executive summary skipped; no Admin/Sponsor mailboxes for tenant {TenantId}.", tenant.Id);

            return;
        }

        RunSummaryOnePagerExportResult export;
        using (AmbientScopeContext.Push(scope))
        {
            export = await _runSummaryOnePagerExportService.GenerateMarkdownAsync(latestRunHex, cancellationToken)
                .ConfigureAwait(false);
        }

        string summaryMarkdown = Encoding.UTF8.GetString(export.Content);
        DateTime refDay = DateTime.SpecifyKind(utcNow.UtcDateTime.Date, DateTimeKind.Utc);
        int isoYear = ISOWeek.GetYear(refDay);
        int isoWeek = ISOWeek.GetWeekOfYear(refDay);
        DateTime weekStartUtc = DateTime.SpecifyKind(ISOWeek.ToDateTime(isoYear, isoWeek, DayOfWeek.Monday), DateTimeKind.Utc);
        DateTime weekEndUtc = weekStartUtc.AddDays(7);
        string isoKey = $"{isoYear}-W{isoWeek:00}";
        string weekLabel = FormatWeekLabel(weekStartUtc, weekEndUtc);
        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl) ? "http://localhost:3000" : emailOptions.OperatorBaseUrl.Trim();
        string runDetailUrl = $"{operatorBase.TrimEnd('/')}/reviews/{latestRunHex}";

        await _emailDispatcher.TryDispatchAsync(
            tenant.Id,
            isoKey,
            latestRunHex,
            summaryMarkdown,
            runDetailUrl,
            weekLabel,
            recipients,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<string?> TryResolveLatestCommittedRunHexAsync(ScopeContext authorityScope, CancellationToken cancellationToken)
    {
        IReadOnlyList<RunSummaryDto> summaries =
            await _authorityQueryService.ListRunsByProjectAsync(authorityScope, "default", MaxListRuns, cancellationToken)
                .ConfigureAwait(false);

        List<Guid> candidateRunIds = summaries
            .Where(static s => s.HasGoldenManifest)
            .Select(static s => s.RunId)
            .Distinct()
            .Take(MaxRunDetailLookups)
            .ToList();

        DateTime? latestCommittedUtc = null;
        string? latestHex = null;

        foreach (Guid runId in candidateRunIds)
        {
            string runHex = runId.ToString("N");
            ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runHex, cancellationToken).ConfigureAwait(false);

            if (detail is null)
                continue;

            if (detail.Run.Status is not ArchitectureRunStatus.Committed)
                continue;

            DateTime? committedUtc = detail.Manifest?.Metadata.CreatedUtc;

            if (committedUtc is null)
                continue;

            if (latestCommittedUtc is not null && committedUtc <= latestCommittedUtc)
                continue;

            latestCommittedUtc = committedUtc;
            latestHex = runHex;
        }

        return latestHex;
    }

    private static bool IsScheduledLocalHour(DateTimeOffset utcNow, WeeklyExecutiveSummaryOptions options)
    {
        TimeZoneInfo tz;

        try
        {
            tz = TimeZoneInfo.FindSystemTimeZoneById(options.IanaTimeZoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            tz = TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            tz = TimeZoneInfo.Utc;
        }

        DateTime local = TimeZoneInfo.ConvertTimeFromUtc(utcNow.UtcDateTime, tz);

        if (local.DayOfWeek != (DayOfWeek)options.DayOfWeek)
            return false;

        if (local.Hour != options.HourOfDay)
            return false;

        return true;
    }

    private static string FormatWeekLabel(DateTime startUtc, DateTime endUtc)
    {
        int isoYear = ISOWeek.GetYear(startUtc.Date);
        int isoWeek = ISOWeek.GetWeekOfYear(startUtc.Date);
        return $"{startUtc:yyyy-MM-dd}–{endUtc.AddTicks(-1):yyyy-MM-dd} UTC (ISO week {isoYear}-W{isoWeek:00})";
    }
}
