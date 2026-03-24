using ArchiForge.Contracts.Governance.Preview;
using ArchiForge.Contracts.Manifest;

namespace ArchiForge.Application.Governance.Preview;

/// <summary>
/// Compares governance-relevant fields from <see cref="ManifestGovernance"/> (or objects that expose it).
/// Unchanged keys are omitted from the result for a compact preview.
/// </summary>
public static class GovernanceManifestComparer
{
    /// <summary>
    /// Compares governance snapshots. Accepts <see cref="ManifestGovernance"/>, <see cref="GoldenManifest"/> (uses <c>.Governance</c>), or null.
    /// </summary>
    public static List<GovernanceDiffItem> Compare(object? currentGovernance, object? previewGovernance)
    {
        var current = ExtractGovernanceFields(ToManifestGovernance(currentGovernance));
        var preview = ExtractGovernanceFields(ToManifestGovernance(previewGovernance));
        return CompareDictionaries(current, preview);
    }

    private static ManifestGovernance? ToManifestGovernance(object? o) => o switch
    {
        null => null,
        ManifestGovernance mg => mg,
        GoldenManifest gm => gm.Governance,
        _ => null
    };

    /// <summary>
    /// Maps <see cref="ManifestGovernance"/> properties to stable string keys for diffing.
    /// </summary>
    private static Dictionary<string, string?> ExtractGovernanceFields(ManifestGovernance? g)
    {
        if (g is null)
            return [];

        return new Dictionary<string, string?>(StringComparer.Ordinal)
        {
            ["ComplianceTags"] = NormalizeList(g.ComplianceTags),
            ["PolicyConstraints"] = NormalizeList(g.PolicyConstraints),
            ["RequiredControls"] = NormalizeList(g.RequiredControls),
            ["RiskClassification"] = NullIfWhiteSpace(g.RiskClassification),
            ["CostClassification"] = NullIfWhiteSpace(g.CostClassification),
        };
    }

    private static string? NullIfWhiteSpace(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static string? NormalizeList(IReadOnlyList<string>? list)
    {
        if (list is null || list.Count == 0)
            return null;
        var ordered = list
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .OrderBy(s => s, StringComparer.OrdinalIgnoreCase)
            .ToList();
        return ordered.Count == 0 ? null : string.Join(", ", ordered);
    }

    private static List<GovernanceDiffItem> CompareDictionaries(
        IReadOnlyDictionary<string, string?> current,
        IReadOnlyDictionary<string, string?> preview)
    {
        var keys = current.Keys.Union(preview.Keys, StringComparer.Ordinal).ToList();
        keys.Sort(StringComparer.Ordinal);
        var items = new List<GovernanceDiffItem>();

        foreach (var key in keys)
        {
            current.TryGetValue(key, out var cur);
            preview.TryGetValue(key, out var prev);
            var curN = cur ?? string.Empty;
            var prevN = prev ?? string.Empty;

            if (curN == prevN)
                continue;

            string changeType;
            if (string.IsNullOrEmpty(curN) && !string.IsNullOrEmpty(prevN))
                changeType = GovernanceDiffChangeType.Added;
            else if (!string.IsNullOrEmpty(curN) && string.IsNullOrEmpty(prevN))
                changeType = GovernanceDiffChangeType.Removed;
            else
                changeType = GovernanceDiffChangeType.Changed;

            items.Add(new GovernanceDiffItem
            {
                Key = key,
                ChangeType = changeType,
                CurrentValue = string.IsNullOrEmpty(curN) ? null : cur,
                PreviewValue = string.IsNullOrEmpty(prevN) ? null : prev
            });
        }

        return items;
    }
}
