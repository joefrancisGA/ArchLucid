using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Wave-14 suggestion 132: resolve finding evidence anchors against pinned evidence package ids.
/// </summary>
internal static class FindingPinnedEvidencePackageReferenceResolver
{
    private static readonly Regex EvidencePackageRefPattern = new(
        @"evidencePackage\s*:\s*([0-9a-fA-F-]{32,36})",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static bool ResolvesToPinnedPackageId(Finding finding, IReadOnlySet<Guid> pinnedPackageIds)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(pinnedPackageIds);

        if (pinnedPackageIds.Count == 0)
            return false;

        foreach (Guid packageId in ExtractReferencedPackageIds(finding))
        {
            if (pinnedPackageIds.Contains(packageId))
                return true;
        }

        return false;
    }

    private static IEnumerable<Guid> ExtractReferencedPackageIds(Finding finding)
    {
        foreach (string candidate in CollectCandidateStrings(finding))
        {
            foreach (Guid packageId in TryParsePackageId(candidate))
                yield return packageId;

            foreach (Match match in EvidencePackageRefPattern.Matches(candidate))
            {
                foreach (Guid packageId in TryParsePackageId(match.Groups[1].Value))
                    yield return packageId;
            }
        }
    }

    private static IEnumerable<string> CollectCandidateStrings(Finding finding)
    {
        foreach (string nodeId in finding.RelatedNodeIds)
            yield return nodeId;

        foreach (string citation in finding.Trace.Citations)
            yield return citation;

        foreach (string note in finding.Trace.Notes)
            yield return note;

        foreach (string value in finding.Properties.Values)
            yield return value;

        if (!string.IsNullOrWhiteSpace(finding.Rationale))
            yield return finding.Rationale;

        if (!string.IsNullOrWhiteSpace(finding.RequestInputRef))
            yield return finding.RequestInputRef;
    }

    private static IEnumerable<Guid> TryParsePackageId(string? candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
            yield break;

        string trimmed = candidate.Trim();

        if (Guid.TryParseExact(trimmed, "D", out Guid parsed) || Guid.TryParseExact(trimmed, "N", out parsed))
            yield return parsed;
    }
}
