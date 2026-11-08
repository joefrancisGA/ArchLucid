namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes compare quality delta counts on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class CompareQualityDeltaCountsNormalizer
{
    internal static void NormalizeInPlace(CompareQualityDeltaCounts? delta)
    {
        if (delta is null)
            return;

        delta.UnsupportedAssumptionsBefore = ClampCount(delta.UnsupportedAssumptionsBefore);
        delta.UnsupportedAssumptionsAfter = ClampCount(delta.UnsupportedAssumptionsAfter);
        delta.HighSeverityBefore = ClampCount(delta.HighSeverityBefore);
        delta.HighSeverityAfter = ClampCount(delta.HighSeverityAfter);
        delta.UncoveredMandatoryBefore = ClampCount(delta.UncoveredMandatoryBefore);
        delta.UncoveredMandatoryAfter = ClampCount(delta.UncoveredMandatoryAfter);
        delta.EvidenceBackedDecisionsBefore = ClampCount(delta.EvidenceBackedDecisionsBefore);
        delta.EvidenceBackedDecisionsAfter = ClampCount(delta.EvidenceBackedDecisionsAfter);
    }

    private static int ClampCount(int value) => value < 0 ? 0 : value;
}
