using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>
///     TB-2208 — Links security baselines without explicit protected ids to topology nodes sharing the same sensitivity.
/// </summary>
public static class SecurityBaselineSensitivityScopeExpander
{
    public static IReadOnlyList<CanonicalObject> Expand(IReadOnlyList<CanonicalObject> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        Dictionary<string, string> sensitivityByNodeId = items
            .Where(static o => string.Equals(o.ObjectType, "TopologyResource", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(
                static o => $"obj-{o.ObjectId}",
                static o => o.Properties.TryGetValue(CanonicalGraphPropertyKeys.TopologySensitivity, out string? sensitivity)
                            && !string.IsNullOrWhiteSpace(sensitivity)
                    ? sensitivity
                    : TopologySensitivityClassifier.Classify(o.Name, o.Properties),
                StringComparer.OrdinalIgnoreCase);

        if (sensitivityByNodeId.Count == 0)
            return items;

        List<CanonicalObject> expanded = [];

        foreach (CanonicalObject item in items)
        {
            if (!string.Equals(item.ObjectType, "SecurityBaseline", StringComparison.OrdinalIgnoreCase)
                || HasProtectedTopologyNodeIds(item))
            {
                expanded.Add(item);

                continue;
            }

            string baselineScope = item.Properties.TryGetValue(CanonicalGraphPropertyKeys.BaselineScope, out string? scope)
                                   && !string.IsNullOrWhiteSpace(scope)
                ? scope
                : TopologySensitivityClassifier.ClassifyBaselineScope(
                    item.Properties.TryGetValue("controlId", out string? controlId) ? controlId : null,
                    item.Name);

            List<string> matchingNodeIds = sensitivityByNodeId
                .Where(pair => string.Equals(pair.Value, baselineScope, StringComparison.OrdinalIgnoreCase))
                .Select(static pair => pair.Key)
                .ToList();

            if (matchingNodeIds.Count == 0)
            {
                expanded.Add(item);

                continue;
            }

            item.Properties[CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds] =
                string.Join(',', matchingNodeIds);

            expanded.Add(item);
        }

        return expanded;
    }

    private static bool HasProtectedTopologyNodeIds(CanonicalObject item) =>
        item.Properties.TryGetValue(CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds, out string? raw)
        && !string.IsNullOrWhiteSpace(raw);
}
