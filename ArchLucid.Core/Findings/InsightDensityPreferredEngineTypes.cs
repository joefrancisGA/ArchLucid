using System.Collections.Frozen;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Path and contradiction engines the insight-density judge and generator should prefer under caps (DX-21).
/// </summary>
public static class InsightDensityPreferredEngineTypes
{
    public static FrozenSet<string> EngineTypeIds { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "open-commitment",
        "declaration-premise-conflict",
        "declaration-inventory-contradiction",
        "identity-blast-radius",
        "segmentation-semantics",
        "secrets-lifecycle",
        "dr-rpo-topology",
    }.ToFrozenSet(StringComparer.OrdinalIgnoreCase);

    public static bool IsPreferred(string? engineType)
    {
        if (string.IsNullOrWhiteSpace(engineType))
        {
            return false;
        }

        return EngineTypeIds.Contains(engineType.Trim());
    }
}
