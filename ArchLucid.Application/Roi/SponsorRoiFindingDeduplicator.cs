using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Collapses overlapping CI reruns: the same stable <see cref="ArchitectureFinding.FindingId"/> across
///     included runs counts once toward portfolio systemic-issue totals (V1 §2.8).
/// </summary>
public static class SponsorRoiFindingDeduplicator
{
    /// <summary>
    ///     Returns findings deduplicated by stable <see cref="ArchitectureFinding.FindingId"/>.
    ///     When the same id appears more than once, the instance with the highest
    ///     <see cref="ArchitectureFinding.EstimatedUsdSavings"/> is kept.
    ///     Findings without a stable id are never deduplicated against each other.
    /// </summary>
    public static IEnumerable<ArchitectureFinding> DeduplicateByStableIdentity(IEnumerable<ArchitectureFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        Dictionary<string, ArchitectureFinding> bestById = new(StringComparer.OrdinalIgnoreCase);
        List<string> idOrder = [];

        foreach (ArchitectureFinding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
            {
                yield return finding;

                continue;
            }

            string id = finding.FindingId.Trim();

            if (!bestById.TryGetValue(id, out ArchitectureFinding? existing))
            {
                bestById[id] = finding;
                idOrder.Add(id);

                continue;
            }

            if (ResolveEstimatedUsdSavings(finding) > ResolveEstimatedUsdSavings(existing))
                bestById[id] = finding;
        }

        foreach (string id in idOrder)
            yield return bestById[id];
    }

    private static decimal ResolveEstimatedUsdSavings(ArchitectureFinding finding) =>
        finding.EstimatedUsdSavings ?? 0m;
}
