using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>UTC trial lifecycle transitions (see <c>docs/go-to-market/TRIAL_AND_SIGNUP.md</c> §3).</summary>
public static class TrialLifecyclePolicy
{
    public static TrialLifecycleAdvancement? TryGetNextAdvancement(TenantRecord tenant, DateTimeOffset utcNow, TrialLifecycleSchedulerOptions options)
    {
        ArgumentNullException.ThrowIfNull(tenant);
        ArgumentNullException.ThrowIfNull(options);
        if (tenant.TrialExpiresUtc is null || string.IsNullOrWhiteSpace(tenant.TrialStatus))
            return null;
        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Converted))
            return null;
        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Deleted))
            return null;
        DateTimeOffset anchor = tenant.TrialExpiresUtc.Value;
        DateTimeOffset readOnlyNotBefore = anchor.AddDays(options.ReadOnlyAfterExpireDays);
        DateTimeOffset exportOnlyNotBefore = readOnlyNotBefore.AddDays(options.ExportOnlyAfterReadOnlyDays);
        DateTimeOffset purgeNotBefore = exportOnlyNotBefore.AddDays(options.PurgeAfterExportOnlyDays);

        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Active))
            return utcNow < anchor ? null : new TrialLifecycleAdvancement(TrialLifecycleStatus.Active, TrialLifecycleStatus.Expired, "trial_active_window_ended");

        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Expired))
            return utcNow < readOnlyNotBefore ? null : new TrialLifecycleAdvancement(TrialLifecycleStatus.Expired, TrialLifecycleStatus.ReadOnly, "trial_read_only_phase");

        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.ReadOnly))
            return utcNow < exportOnlyNotBefore ? null : new TrialLifecycleAdvancement(TrialLifecycleStatus.ReadOnly, TrialLifecycleStatus.ExportOnly, "trial_export_only_phase");

        if (!TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.ExportOnly))
            return null;

        return utcNow < purgeNotBefore ? null : new TrialLifecycleAdvancement(TrialLifecycleStatus.ExportOnly, TrialLifecycleStatus.Deleted, "trial_dpa_hard_purge");
    }

    /// <summary>Whole days until the next lifecycle boundary for <c>GET /v1/tenant/trial-status</c>.</summary>
    public static int? ComputeDaysRemainingForStatusDisplay(TenantRecord tenant, DateTimeOffset utcNow, TrialLifecycleSchedulerOptions options)
    {
        ArgumentNullException.ThrowIfNull(tenant);
        ArgumentNullException.ThrowIfNull(options);
        if (tenant.TrialExpiresUtc is null || string.IsNullOrWhiteSpace(tenant.TrialStatus))
            return null;
        if (TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Converted) ||
            TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Deleted))
            return null;
        DateTimeOffset T = tenant.TrialExpiresUtc.Value;
        DateTimeOffset readOnlyNotBefore = T.AddDays(options.ReadOnlyAfterExpireDays);
        DateTimeOffset exportOnlyNotBefore = readOnlyNotBefore.AddDays(options.ExportOnlyAfterReadOnlyDays);
        DateTimeOffset purgeNotBefore = exportOnlyNotBefore.AddDays(options.PurgeAfterExportOnlyDays);
        DateTimeOffset deadline = ResolveStatusDeadline(tenant.TrialStatus, T, readOnlyNotBefore, exportOnlyNotBefore, purgeNotBefore);
        double totalDays = (deadline - utcNow).TotalDays;
        int days = (int)Math.Floor(totalDays);
        return days < 0 ? 0 : days;
    }

    private static DateTimeOffset ResolveStatusDeadline(
        string trialStatus,
        DateTimeOffset trialExpiresUtc,
        DateTimeOffset readOnlyNotBefore,
        DateTimeOffset exportOnlyNotBefore,
        DateTimeOffset purgeNotBefore)
    {
        if (TrialLifecycleStatus.EqualsStatus(trialStatus, TrialLifecycleStatus.Active))
            return trialExpiresUtc;

        if (TrialLifecycleStatus.EqualsStatus(trialStatus, TrialLifecycleStatus.Expired))
            return readOnlyNotBefore;

        if (TrialLifecycleStatus.EqualsStatus(trialStatus, TrialLifecycleStatus.ReadOnly))
            return exportOnlyNotBefore;

        if (TrialLifecycleStatus.EqualsStatus(trialStatus, TrialLifecycleStatus.ExportOnly))
            return purgeNotBefore;

        return trialExpiresUtc;
    }
}
