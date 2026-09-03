using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Comparison;

public sealed partial class ComparisonService
{
    private static void CompareCost(ManifestDocument baseM, ManifestDocument targetM, ComparisonResult result)
    {
        decimal? b = baseM.Cost.MaxMonthlyCost;
        decimal? t = targetM.Cost.MaxMonthlyCost;

        if (b != t)

            result.CostChanges.Add(new CostDelta { BaseCost = b, TargetCost = t });
    }
}
