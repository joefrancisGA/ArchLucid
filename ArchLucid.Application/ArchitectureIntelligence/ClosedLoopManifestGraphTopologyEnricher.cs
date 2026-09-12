using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Adds closed-loop manifest topology nodes onto the authority graph so capability analyzers can see κ-backed evidence.
/// </summary>
public static class ClosedLoopManifestGraphTopologyEnricher
{
    private const string ClosedLoopSourceType = "ClosedLoopStrengthenedTopology";

    public static int EnrichGraphFromManifestTopology(GraphSnapshot graphSnapshot, ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(manifest);

        HashSet<string> existingLabels = graphSnapshot.Nodes
            .Where(static node =>
                string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
            .Select(static node => node.Label)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int addedNodeCount = 0;

        foreach (ManifestService service in manifest.Topology.Services)
        {
            if (existingLabels.Contains(service.ServiceName))
                continue;

            graphSnapshot.Nodes.Add(new GraphNode
            {
                NodeId = $"cl-topology:{service.ServiceId}",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = service.ServiceName,
                Category = service.ServiceType.ToString(),
                SourceType = ClosedLoopSourceType,
                SourceId = service.ServiceId,
                ReasoningTrace = service.Purpose,
                Properties = BuildCapabilityEvidenceProperties(service.ServiceName, service.Purpose, service.Tags),
            });

            existingLabels.Add(service.ServiceName);
            addedNodeCount++;
        }

        foreach (ManifestDatastore datastore in manifest.Topology.Datastores)
        {
            if (existingLabels.Contains(datastore.DatastoreName))
                continue;

            graphSnapshot.Nodes.Add(new GraphNode
            {
                NodeId = $"cl-topology:{datastore.DatastoreId}",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = datastore.DatastoreName,
                Category = datastore.DatastoreType.ToString(),
                SourceType = ClosedLoopSourceType,
                SourceId = datastore.DatastoreId,
                ReasoningTrace = datastore.Purpose,
                Properties = BuildCapabilityEvidenceProperties(datastore.DatastoreName, datastore.Purpose, []),
            });

            existingLabels.Add(datastore.DatastoreName);
            addedNodeCount++;
        }

        if (addedNodeCount > 0)
        {
            graphSnapshot.Warnings.Add(
                $"Closed-loop strengthening added {addedNodeCount} topology node(s) for capability coverage re-analysis.");
        }

        return addedNodeCount;
    }

    private static Dictionary<string, string> BuildCapabilityEvidenceProperties(
        string name,
        string? purpose,
        IReadOnlyList<string> tags)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["closedLoopStrengthened"] = "true",
            ["capabilityEvidence"] = string.Join(
                ' ',
                new[] { name, purpose }
                    .Concat(tags)
                    .Where(static value => !string.IsNullOrWhiteSpace(value))),
        };

        return properties;
    }
}
