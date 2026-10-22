using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Wave-13 suggestion 125 / wave-14 suggestion 132: block commit when high-severity findings lack resolvable evidence anchors.
/// </summary>
public static class FindingEvidenceReferentialIntegrityValidator
{
    public static IReadOnlyList<string> GetBlockingReasons(
        RunRecord header,
        IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(findings);

        if (string.IsNullOrWhiteSpace(header.PinnedEvidencePackagePinsJson))
            return [];

        if (!RunHeaderPinDeserializer.TryDeserializeEvidenceRows(
                header.PinnedEvidencePackagePinsJson,
                out PinnedEvidencePackageRow[] pinnedRows))
        {
            return ["Evidence package pin JSON is not a valid PinnedEvidencePackageRow array."];
        }

        HashSet<Guid> pinnedPackageIds = pinnedRows
            .Select(static row => row.PackageId)
            .Where(static id => id != Guid.Empty)
            .ToHashSet();

        List<string> reasons = [];

        foreach (Finding finding in findings)
        {
            if (finding.IsMuted)
                continue;

            if (finding.Severity is not (FindingSeverity.Error or FindingSeverity.Critical))
                continue;

            if (FindingPinnedEvidencePackageReferenceResolver.ResolvesToPinnedPackageId(finding, pinnedPackageIds))
                continue;

            if (FindingEvidenceLinkageFindingEngine.HasEvidenceLinkage(finding))
            {
                reasons.Add(
                    $"Finding '{finding.FindingId}' ({finding.Severity}) references evidence anchors that do not resolve to a pinned evidence package id ({pinnedPackageIds.Count} pinned).");
                continue;
            }

            reasons.Add(
                $"Finding '{finding.FindingId}' ({finding.Severity}) lacks resolvable evidence linkage against pinned evidence packages ({pinnedPackageIds.Count} pinned).");
        }

        return reasons;
    }
}
