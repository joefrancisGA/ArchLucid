using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Builds a visible VNet node for a peering remote that is not in the captured snapshot
///     (typically another subscription).
/// </summary>
internal static class ExecutiveVnetPeeringStubNodeFactory
{
    public const string VirtualNetworkArmType = "Microsoft.Network/virtualNetworks";

    public const string StubPropertyKey = "arm.stub";

    public const string RemoteVnetStubValue = "remote-vnet";

    public static GraphNode Create(string azureResourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(azureResourceId);

        string normalized = ArmResourceIdNormalizer.Normalize(azureResourceId);

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ArgumentException("A peering stub requires a normalized ARM id.", nameof(azureResourceId));
        }

        string label = ReadLabel(normalized);

        return new GraphNode
        {
            NodeId = Renderers.MermaidIdSanitizer.Sanitize(normalized),
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = GraphTopologyCategories.Network,
            SourceType = "azure-inventory-snapshot",
            SourceId = normalized,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = normalized,
                ["arm.type"] = VirtualNetworkArmType,
                [StubPropertyKey] = RemoteVnetStubValue,
            },
        };
    }

    private static string ReadLabel(string azureResourceId)
    {
        int lastSlash = azureResourceId.LastIndexOf('/');

        if (lastSlash >= 0 && lastSlash < azureResourceId.Length - 1)
        {
            return azureResourceId[(lastSlash + 1)..];
        }

        return azureResourceId;
    }
}
