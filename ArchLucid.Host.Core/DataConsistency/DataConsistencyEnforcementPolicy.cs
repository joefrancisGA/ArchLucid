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

    /// <summary>
    ///     Shared gate for inserting orphan rows into <c>dbo.DataConsistencyQuarantine</c> (golden manifests, findings
    ///     snapshots, etc.). Mirrors host branch logic: only when mode is <see cref="DataConsistencyEnforcementMode.Quarantine"/>
    ///     or <paramref name="autoQuarantine"/> is enabled, and the orphan count is positive.
    /// </summary>
    internal static bool ShouldAttemptOrphanRowQuarantine(
        DataConsistencyEnforcementMode mode,
        bool autoQuarantine,
        long orphanCount)
    {
        if (orphanCount <= 0)
            return false;

        return mode == DataConsistencyEnforcementMode.Quarantine || autoQuarantine;
    }

    internal static bool ShouldAttemptGoldenManifestQuarantine(
        DataConsistencyEnforcementMode mode,
        bool autoQuarantine,
        long goldenOrphanCount) =>
        ShouldAttemptOrphanRowQuarantine(mode, autoQuarantine, goldenOrphanCount);

    internal static bool ShouldAttemptFindingsSnapshotQuarantine(
        DataConsistencyEnforcementMode mode,
        bool autoQuarantine,
        long findingsOrphanCount) =>
        ShouldAttemptOrphanRowQuarantine(mode, autoQuarantine, findingsOrphanCount);

    internal static int NormalizeAlertThreshold(int alertThreshold) => Math.Max(1, alertThreshold);

    internal static bool ShouldEvaluateEnforcement(DataConsistencyEnforcementMode mode) => mode != DataConsistencyEnforcementMode.Off;
}
