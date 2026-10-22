using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Projects tenant policy-pack keys into diagram-only human review annotations.</summary>
public static class InventoryDiagramQuestionableAttentionResolver
{
    public const string UhgUnregisteredAvdSessionHostRuleKey = "uhg-avd-vm-not-in-host-pool";

    private const string Reason =
        "This virtual machine is named like a UHG session host and is not registered in any session host collected for this snapshot.";

    private const string RecommendedAction =
        "Confirm whether it should be registered to a host pool, kept as an image or management machine, or retired.";

    public static IReadOnlyDictionary<string, DiagramQuestionableAttention> Resolve(
        GraphSnapshot graph,
        IReadOnlyCollection<string> assignedPolicyPackRuleKeys)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(assignedPolicyPackRuleKeys);

        if (!assignedPolicyPackRuleKeys.Contains(
                UhgUnregisteredAvdSessionHostRuleKey,
                StringComparer.OrdinalIgnoreCase))
        {
            return new Dictionary<string, DiagramQuestionableAttention>(StringComparer.Ordinal);
        }

        List<GraphNode> sessionHosts = graph.Nodes
            .Where(node => ReadArmType(node).Contains(
                "Microsoft.DesktopVirtualization/hostPools/sessionHosts",
                StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (sessionHosts.Count == 0)
        {
            return new Dictionary<string, DiagramQuestionableAttention>(StringComparer.Ordinal);
        }

        HashSet<string> registeredVmIds = sessionHosts
            .SelectMany(ReadSessionHostVirtualMachineIds)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> registeredVmNames = sessionHosts
            .Select(node => ReadLastSegment(ReadArmId(node)))
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!.Split('.', 2)[0])
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        Dictionary<string, DiagramQuestionableAttention> result = new(StringComparer.Ordinal);

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = ReadArmType(node);
            string armId = ReadArmId(node);
            string vmName = ReadLastSegment(armId) ?? string.Empty;

            if (!armType.Equals("Microsoft.Compute/virtualMachines", StringComparison.OrdinalIgnoreCase)
                || !vmName.StartsWith("avd", StringComparison.OrdinalIgnoreCase)
                || registeredVmIds.Contains(armId)
                || registeredVmNames.Contains(vmName))
            {
                continue;
            }

            result[node.NodeId] = new DiagramQuestionableAttention(Reason, RecommendedAction);
        }

        return result;
    }

    private static IEnumerable<string> ReadSessionHostVirtualMachineIds(GraphNode node)
    {
        foreach (string key in new[] { "properties.resourceId", "vmResourceId", "properties.vmResourceId" })
        {
            if (node.Properties.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
            {
                yield return value.Trim();
            }
        }
    }

    private static string ReadArmType(GraphNode node) =>
        node.Properties.TryGetValue("arm.type", out string? value) ? value : string.Empty;

    private static string ReadArmId(GraphNode node) =>
        node.Properties.TryGetValue("arm.id", out string? value) ? value : string.Empty;

    private static string? ReadLastSegment(string armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return null;
        }

        int slash = armId.LastIndexOf('/');
        return (slash < 0 ? armId : armId[(slash + 1)..]).Trim();
    }
}
