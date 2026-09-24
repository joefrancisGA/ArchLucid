using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramRecoveryServicesVaultFilter
{
    public static List<GraphNode> Exclude(IEnumerable<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        return nodes
            .Where(node => !string.Equals(
                ReadArmType(node),
                "Microsoft.RecoveryServices/vaults",
                StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    private static string ReadArmType(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.type", out string? armType)
            ? armType
            : string.Empty;
    }
}
