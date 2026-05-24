using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Collapses overlapping CI reruns: the same stable <see cref="ArchitectureFinding.FindingId"/> across
///     included runs counts once toward portfolio systemic-issue totals (V1 §2.8).
/// </summary>
public static class ExecutiveRoiFindingDeduplicator
{
    /// <summary>
    ///     Returns findings deduplicated by stable <see cref="ArchitectureFinding.FindingId"/>.
    ///     Findings without a stable id are never deduplicated against each other.
    /// </summary>
    public static IEnumerable<ArchitectureFinding> DeduplicateByStableIdentity(IEnumerable<ArchitectureFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        HashSet<string> seenFindingIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureFinding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
            {
                yield return finding;
                continue;
            }

            if (seenFindingIds.Add(finding.FindingId))
                yield return finding;
        }
    }
}
