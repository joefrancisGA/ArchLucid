using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Comparison;

public sealed partial class ComparisonService
{
    private static void CompareDecisions(ManifestDocument baseM, ManifestDocument targetM, ComparisonResult result)
    {
        Dictionary<string, ResolvedArchitectureDecision> baseMap =
            BuildUniqueDecisionMap(baseM.Decisions, result, "Decisions(base)");
        Dictionary<string, ResolvedArchitectureDecision> targetMap =
            BuildUniqueDecisionMap(targetM.Decisions, result, "Decisions(target)");

        foreach (string key in baseMap.Keys.Union(targetMap.Keys))
        {
            baseMap.TryGetValue(key, out ResolvedArchitectureDecision? b);
            targetMap.TryGetValue(key, out ResolvedArchitectureDecision? t);

            if (b is null)

                result.DecisionChanges.Add(new DecisionDelta { DecisionKey = key, TargetValue = t!.SelectedOption, ChangeType = "Added" });

            else if (t is null)

                result.DecisionChanges.Add(new DecisionDelta { DecisionKey = key, BaseValue = b.SelectedOption, ChangeType = "Removed" });

            else if (!string.Equals(b.SelectedOption, t.SelectedOption, StringComparison.Ordinal))

                result.DecisionChanges.Add(new DecisionDelta
                {
                    DecisionKey = key, BaseValue = b.SelectedOption, TargetValue = t.SelectedOption, ChangeType = "Modified"
                });
        }
    }
}
