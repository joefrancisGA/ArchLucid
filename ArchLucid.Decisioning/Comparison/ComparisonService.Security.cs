using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Comparison;

public sealed partial class ComparisonService
{
    private static void CompareSecurity(ManifestDocument baseM, ManifestDocument targetM, ComparisonResult result)
    {
        Dictionary<string, SecurityPostureItem> baseMap =
            BuildUniqueSecurityMap(baseM.Security.Controls, result, "Security(base)");
        Dictionary<string, SecurityPostureItem> targetMap =
            BuildUniqueSecurityMap(targetM.Security.Controls, result, "Security(target)");

        foreach (string key in baseMap.Keys.Union(targetMap.Keys))
        {
            baseMap.TryGetValue(key, out SecurityPostureItem? b);
            targetMap.TryGetValue(key, out SecurityPostureItem? t);

            if (b is null && t is not null)
            {
                result.SecurityChanges.Add(new SecurityDelta { ControlName = t.ControlName, BaseStatus = null, TargetStatus = t.Status });
                continue;
            }

            if (b is not null && t is null)
            {
                result.SecurityChanges.Add(new SecurityDelta { ControlName = b.ControlName, BaseStatus = b.Status, TargetStatus = null });
                continue;
            }

            if (b is null || t is null)
                continue;

            if (!string.Equals(b.Status, t.Status, StringComparison.Ordinal))

                result.SecurityChanges.Add(new SecurityDelta { ControlName = b.ControlName, BaseStatus = b.Status, TargetStatus = t.Status });
        }
    }
}
