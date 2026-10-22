using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Application.Governance.Posture;

public static class PrimaryPillarKeySelector
{
    public static string? Select(IReadOnlyList<PillarPosture> pillars)
    {
        ArgumentNullException.ThrowIfNull(pillars);

        PillarPosture? selected = pillars
            .OrderByDescending(static pillar => SeverityWeight(pillar.FindingCounts))
            .ThenBy(static pillar => pillar.DisplayOrder)
            .FirstOrDefault(pillar => SeverityWeight(pillar.FindingCounts) > 0);

        return selected?.PillarKey;
    }

    private static int SeverityWeight(PillarFindingAggregate counts) =>
        (counts.CriticalCount * 1_000)
        + (counts.ErrorCount * 100)
        + (counts.WarningCount * 10)
        + counts.InfoCount;
}
