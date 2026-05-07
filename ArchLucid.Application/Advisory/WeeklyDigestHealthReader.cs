using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Advisory;

/// <summary>Builds digest health rows from persistence without sending notifications.</summary>
public sealed class WeeklyDigestHealthReader(
    IAdvisoryScanScheduleRepository scheduleRepository,
    IDigestSubscriptionRepository digestSubscriptionRepository,
    IArchitectureDigestRepository architectureDigestRepository,
    ITenantExecDigestPreferencesRepository execDigestPreferencesRepository) : IWeeklyDigestHealthReader
{
    private readonly IAdvisoryScanScheduleRepository _scheduleRepository =
        scheduleRepository ?? throw new ArgumentNullException(nameof(scheduleRepository));

    private readonly IDigestSubscriptionRepository _digestSubscriptionRepository =
        digestSubscriptionRepository ?? throw new ArgumentNullException(nameof(digestSubscriptionRepository));

    private readonly IArchitectureDigestRepository _architectureDigestRepository =
        architectureDigestRepository ?? throw new ArgumentNullException(nameof(architectureDigestRepository));

    private readonly ITenantExecDigestPreferencesRepository _execDigestPreferencesRepository =
        execDigestPreferencesRepository ?? throw new ArgumentNullException(nameof(execDigestPreferencesRepository));

    /// <inheritdoc />
    public async Task<WeeklyDigestHealthSnapshot> GetSnapshotAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<AdvisoryScanSchedule> schedules =
            await _scheduleRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                cancellationToken).ConfigureAwait(false);

        IReadOnlyList<DigestSubscription> subs =
            await _digestSubscriptionRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                cancellationToken).ConfigureAwait(false);

        IReadOnlyList<ArchitectureDigest> latestDigests =
            await _architectureDigestRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, 1,
                cancellationToken).ConfigureAwait(false);

        ExecDigestPreferencesResponse execPrefs =
            await _execDigestPreferencesRepository.GetByTenantAsync(scope.TenantId, cancellationToken)
                .ConfigureAwait(false) ?? ExecDigestPreferencesResponse.Unconfigured(scope.TenantId);

        int enabledSchedules = schedules.Count(static s => s.IsEnabled);
        DateTimeOffset? nextRun = null;

        foreach (AdvisoryScanSchedule schedule in schedules.Where(static s => s.IsEnabled && s.NextRunUtc.HasValue))
        {
            DateTimeOffset candidate =
                new(DateTime.SpecifyKind(schedule.NextRunUtc!.Value, DateTimeKind.Utc), TimeSpan.Zero);

            if (nextRun is null || candidate < nextRun.Value)
                nextRun = candidate;
        }

        int enabledSubs = subs.Count(static s => s.IsEnabled);
        int emailCh = subs.Count(static s =>
            s.IsEnabled &&
            string.Equals(s.ChannelType, DigestDeliveryChannelType.Email, StringComparison.OrdinalIgnoreCase));
        int slackCh = subs.Count(static s =>
            s.IsEnabled &&
            string.Equals(s.ChannelType, DigestDeliveryChannelType.SlackWebhook, StringComparison.OrdinalIgnoreCase));
        int teamsCh = subs.Count(static s =>
            s.IsEnabled &&
            string.Equals(s.ChannelType, DigestDeliveryChannelType.TeamsWebhook, StringComparison.OrdinalIgnoreCase));

        DateTimeOffset? maxDelivered = null;

        foreach (DigestSubscription subscription in subs.Where(static s =>
                     s.IsEnabled && s.LastDeliveredUtc.HasValue))
        {
            DateTimeOffset candidate =
                new(DateTime.SpecifyKind(subscription.LastDeliveredUtc!.Value, DateTimeKind.Utc), TimeSpan.Zero);

            if (maxDelivered is null || candidate > maxDelivered.Value)
                maxDelivered = candidate;
        }

        ArchitectureDigest? latestDigest = latestDigests.Count > 0 ? latestDigests[0] : null;

        List<string> gaps = [];

        if (enabledSchedules == 0)
            gaps.Add("No enabled advisory scan schedule — weekly architecture digests will not be generated on a cadence.");

        if (enabledSubs == 0)
            gaps.Add("No digest subscriptions — generated digests have no outbound recipients in this scope.");

        if (!execPrefs.EmailEnabled || execPrefs.RecipientEmails.Count == 0)
            gaps.Add(
                "Executive email digest is not fully configured — sponsor emails will not receive the separate executive rollup.");

        WeeklyDigestHealthSnapshot snapshot = new()
        {
            EnabledAdvisoryScheduleCount = enabledSchedules,
            EarliestNextAdvisoryRunUtc = nextRun,
            DigestSubscriptionCount = subs.Count,
            EnabledDigestSubscriptionCount = enabledSubs,
            DigestSubscriptionsByEmailChannel = emailCh,
            DigestSubscriptionsBySlackChannel = slackCh,
            DigestSubscriptionsByTeamsChannel = teamsCh,
            LatestDigestSubscriptionDeliveryUtc = maxDelivered,
            LatestArchitectureDigestId = latestDigest?.DigestId,
            LatestArchitectureDigestGeneratedUtc = latestDigest is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(latestDigest.GeneratedUtc, DateTimeKind.Utc),
                    TimeSpan.Zero),
            ExecutiveEmailDigestIsConfigured = execPrefs.IsConfigured,
            ExecutiveEmailDigestEnabled = execPrefs.EmailEnabled && execPrefs.RecipientEmails.Count > 0,
            ExecutiveDigestRecipientCount = execPrefs.RecipientEmails.Count,
            ExecutiveDigestIanaTimeZoneId = execPrefs.IanaTimeZoneId,
            ExecutiveDigestDayOfWeek = execPrefs.DayOfWeek,
            ExecutiveDigestHourOfDay = execPrefs.HourOfDay,
            SetupGaps = gaps,
        };

        return snapshot;
    }
}
