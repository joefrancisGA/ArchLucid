using ArchLucid.Contracts.Findings;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Counts snapshot findings that still block pre-finalize severity checklist items — aligned with risk-register
///     closed dispositions (<see cref="ArchLucid.Persistence.Governance.ArchitectureRiskRegisterReader" />).
/// </summary>
internal static class PreFinalizeActiveFindingCounter
{
    internal static int Count(
        IReadOnlyList<Finding> findings,
        FindingSeverity severity,
        IReadOnlyDictionary<string, Disposition> latestDispositionsByFindingId)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(latestDispositionsByFindingId);

        return findings.Count(finding => IsActiveForChecklist(finding, severity, latestDispositionsByFindingId));
    }

    internal static bool IsActiveForChecklist(
        Finding finding,
        FindingSeverity severity,
        IReadOnlyDictionary<string, Disposition> latestDispositionsByFindingId)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(latestDispositionsByFindingId);

        if (finding.IsMuted)
            return false;

        if (finding.Severity != severity)
            return false;

        if (finding.EnforcementTier == FindingEnforcementTier.Advisory)
            return false;

        if (string.IsNullOrWhiteSpace(finding.FindingId))
            return true;

        if (!latestDispositionsByFindingId.TryGetValue(finding.FindingId.Trim(), out Disposition disposition))
            return true;

        return !IsClosedForRiskRegister(disposition);
    }

    internal static bool IsClosedForRiskRegister(Disposition disposition) =>
        disposition is Disposition.Remediated or Disposition.RejectedAsNotApplicable;
}
