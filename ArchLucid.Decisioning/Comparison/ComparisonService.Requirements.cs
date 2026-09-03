using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Comparison;

public sealed partial class ComparisonService
{
    private enum RequirementBucket
    {
        Covered,
        Uncovered
    }

    private sealed record RequirementState(RequirementBucket Bucket, string CoverageStatus, bool IsMandatory);

    private static void CompareRequirements(ManifestDocument baseM, ManifestDocument targetM, ComparisonResult result)
    {
        Dictionary<string, RequirementState> baseStates = RequirementStates(baseM.Requirements);
        Dictionary<string, RequirementState> targetStates = RequirementStates(targetM.Requirements);

        foreach (string name in baseStates.Keys.Union(targetStates.Keys, StringComparer.OrdinalIgnoreCase))
        {
            baseStates.TryGetValue(name, out RequirementState? b);
            targetStates.TryGetValue(name, out RequirementState? t);

            if (b is null && t is not null)
            {
                result.RequirementChanges.Add(new RequirementDelta
                {
                    RequirementName = name, ChangeType = t.Bucket == RequirementBucket.Covered ? "Covered" : "Uncovered"
                });
                continue;
            }

            if (b is not null && t is null)
            {
                result.RequirementChanges.Add(new RequirementDelta { RequirementName = name, ChangeType = "Removed" });
                continue;
            }

            if (b is null || t is null)
                continue;

            if (b.Bucket != t.Bucket)
            {
                result.RequirementChanges.Add(new RequirementDelta
                {
                    RequirementName = name, ChangeType = t.Bucket == RequirementBucket.Covered ? "Covered" : "Uncovered"
                });
                continue;
            }

            if (!string.Equals(b.CoverageStatus, t.CoverageStatus, StringComparison.Ordinal) ||
                b.IsMandatory != t.IsMandatory)

                result.RequirementChanges.Add(new RequirementDelta { RequirementName = name, ChangeType = "Changed" });
        }
    }

    private static Dictionary<string, RequirementState> RequirementStates(RequirementsCoverageSection section)
    {
        Dictionary<string, RequirementState> map = new(StringComparer.OrdinalIgnoreCase);

        // First-wins: if a name appears in both lists, the Covered entry takes priority.

        foreach (RequirementCoverageItem x in section.Covered)
            map.TryAdd(x.RequirementName,
                new RequirementState(RequirementBucket.Covered, x.CoverageStatus, x.IsMandatory));

        foreach (RequirementCoverageItem x in section.Uncovered)
            map.TryAdd(x.RequirementName,
                new RequirementState(RequirementBucket.Uncovered, x.CoverageStatus, x.IsMandatory));

        return map;
    }
}
