using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Maps deterministic engine <c>Category</c> values to architecture pillar storage keys.
///     Review-integrity categories are intentionally absent so those findings stay unmapped.
/// </summary>
internal static class FindingEngineArchitecturePillarResolver
{
    private static readonly Dictionary<string, ArchitecturePillar> CategoryToPillar =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Security"] = ArchitecturePillar.Security,
            ["Compliance"] = ArchitecturePillar.DataAndCompliance,
            ["Cost"] = ArchitecturePillar.CostEffectiveness,
            ["CostOptimization"] = ArchitecturePillar.CostEffectiveness,
        };

    internal static bool TryResolveStorageKey(string engineCategory, out string storageKey)
    {
        storageKey = string.Empty;

        if (string.IsNullOrWhiteSpace(engineCategory))
        {
            return false;
        }

        if (!CategoryToPillar.TryGetValue(engineCategory.Trim(), out ArchitecturePillar pillar))
        {
            return false;
        }

        storageKey = ArchitecturePillarRollup.ToStorageKey(pillar);
        return true;
    }
}
