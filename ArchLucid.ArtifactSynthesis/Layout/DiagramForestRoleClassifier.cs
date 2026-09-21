using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Stable visual roles used to arrange resources inside inventory containers.</summary>
public static class DiagramForestRoleClassifier
{
    public static int ResolveOrder(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string type = node.ArmResourceType ?? string.Empty;

        if (type.Contains("Network", StringComparison.OrdinalIgnoreCase))
        {
            return 0;
        }

        if (type.Contains("Compute", StringComparison.OrdinalIgnoreCase)
            || type.Contains("Web/sites", StringComparison.OrdinalIgnoreCase)
            || type.Contains("App/container", StringComparison.OrdinalIgnoreCase))
        {
            return 1;
        }

        if (type.Contains("Identity", StringComparison.OrdinalIgnoreCase)
            || type.Contains("KeyVault", StringComparison.OrdinalIgnoreCase))
        {
            return 2;
        }

        if (type.Contains("Storage", StringComparison.OrdinalIgnoreCase)
            || type.Contains("Sql", StringComparison.OrdinalIgnoreCase)
            || type.Contains("DocumentDB", StringComparison.OrdinalIgnoreCase)
            || type.Contains("Cache", StringComparison.OrdinalIgnoreCase))
        {
            return 3;
        }

        if (type.Contains("DataFactory", StringComparison.OrdinalIgnoreCase)
            || type.Contains("Logic", StringComparison.OrdinalIgnoreCase)
            || type.Contains("connections", StringComparison.OrdinalIgnoreCase))
        {
            return 4;
        }

        return 5;
    }

    public static IReadOnlyList<DiagramNode> Order(IReadOnlyList<DiagramNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        return nodes
            .OrderBy(ResolveOrder)
            .ThenBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();
    }
}
