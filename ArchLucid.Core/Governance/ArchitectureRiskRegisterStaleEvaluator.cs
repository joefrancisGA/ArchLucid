using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Governance;

/// <summary>
///     Staleness rules for architecture risk register rows (TB-057, TB-154).
///     Active non-expired waivers suppress deferred-revisit stale signals.
/// </summary>
public static class ArchitectureRiskRegisterStaleEvaluator
{
    public static bool IsStale(
        FindingDisposition? disposition,
        DateTimeOffset? revisitDueUtc,
        DateTimeOffset? waiverExpiresAtUtc,
        DateTimeOffset nowUtc)
    {
        bool hasActiveWaiver = waiverExpiresAtUtc.HasValue && waiverExpiresAtUtc.Value > nowUtc;

        if (hasActiveWaiver)
            return false;

        if (disposition == FindingDisposition.Deferred
            && revisitDueUtc.HasValue
            && revisitDueUtc.Value <= nowUtc)
            return true;

        if (waiverExpiresAtUtc.HasValue && waiverExpiresAtUtc.Value <= nowUtc)
            return true;

        return false;
    }
}
