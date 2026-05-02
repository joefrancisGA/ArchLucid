using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     Pure predicates for orphan enforcement (Warn / Alert / Quarantine). Keeps branch logic unit-testable without SQL.
///     Quarantine records rows in <c>dbo.DataConsistencyQuarantine</c> — it does <b>not</b> delete foreign data.
/// </summary>
internal static class DataConsistencyEnforcementPolicy
{
    internal static bool UsesAlertCounters(DataConsistencyEnforcementMode mode) =>
        mode is DataConsistencyEnforcementMode.Alert or DataConsistencyEnforcementMode.Quarantine;

    internal static bool IsAlertEligible(long orphanCount, int alertThreshold)
    {
        int threshold = NormalizeAlertThreshold(alertThreshold);

        return orphanCount >= threshold;
    }

    internal static bool ShouldAttemptGoldenManifestQuarantine(
        DataConsistencyEnforcementMode mode,
        bool autoQuarantine,
        long goldenOrphanCount)
    {
        if (goldenOrphanCount <= 0)
            return false;

        return mode == DataConsistencyEnforcementMode.Quarantine || autoQuarantine;
    }

    internal static int NormalizeAlertThreshold(int alertThreshold) => Math.Max(1, alertThreshold);

    internal static bool ShouldEvaluateEnforcement(DataConsistencyEnforcementMode mode) => mode != DataConsistencyEnforcementMode.Off;
}
