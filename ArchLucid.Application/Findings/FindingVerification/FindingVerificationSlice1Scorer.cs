using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings.FindingVerification;

/// <summary>Slice-1 deterministic scorer stub until TB-2034 adds alignment rules.</summary>
internal static class FindingVerificationSlice1Scorer
{
    public static (FindingVerificationStatus Status, string TraceText) Score(
        Finding finding,
        Guid? verificationFindingsSnapshotId,
        FindingsSnapshot? verificationSnapshot)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!verificationFindingsSnapshotId.HasValue)
        {
            return (
                FindingVerificationStatus.NotVerifiable,
                "slice-1: no verification findings snapshot supplied");
        }

        if (verificationSnapshot is null)
        {
            return (
                FindingVerificationStatus.NotVerifiable,
                $"slice-1: verification findings snapshot '{verificationFindingsSnapshotId.Value:D}' was not resolved");
        }

        return (
            FindingVerificationStatus.NotVerifiable,
            $"slice-1: verification snapshot lacks evidence scope for finding '{finding.FindingId}'");
    }
}
