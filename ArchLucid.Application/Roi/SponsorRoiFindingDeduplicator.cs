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
    ///     known <see cref="ArchitectureFinding.EstimatedUsdSavings"/> is kept.
    ///     Findings without a stable id are never deduplicated against each other.
    /// </summary>
    public static IEnumerable<ArchitectureFinding> DeduplicateByStableIdentity(IEnumerable<ArchitectureFinding> findings) =>
        DeduplicateByStableIdentity(findings, onExcluded: null);

    internal static IEnumerable<ArchitectureFinding> DeduplicateByStableIdentity(
        IEnumerable<ArchitectureFinding> findings,
        Action<ArchitectureFinding>? onExcluded)
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

            if (Nullable.Compare(finding.EstimatedUsdSavings, existing.EstimatedUsdSavings) > 0)
            {
                bestById[id] = finding;
                onExcluded?.Invoke(existing);
            }
            else
            {
                onExcluded?.Invoke(finding);
            }
        }

        foreach (string id in idOrder)
            yield return bestById[id];
    }
}
