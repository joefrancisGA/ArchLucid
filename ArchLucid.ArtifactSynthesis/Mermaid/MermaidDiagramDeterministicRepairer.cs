using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramDeterministicRepairer : IMermaidDiagramDeterministicRepairer
{
    public DiagramAst Repair(DiagramAst ast, out MermaidDiagramCollapseReport collapseReport)
    {
        ArgumentNullException.ThrowIfNull(ast);

        List<MermaidDiagramCollapseEntry> collapseEntries = [];
        Dictionary<string, string> nodeIdMap = new(StringComparer.Ordinal);
        List<DiagramNode> repairedNodes = [];
        HashSet<string> seenNodeIds = new(StringComparer.Ordinal);

        foreach (DiagramNode node in ast.Nodes.OrderBy(node => node.OrderKey).ThenBy(node => node.NodeId, StringComparer.Ordinal))
        {
            string sanitizedId = MermaidIdSanitizer.Sanitize(node.NodeId);

            if (!seenNodeIds.Add(sanitizedId))
            {
                collapseEntries.Add(new MermaidDiagramCollapseEntry
                {
                    Kind = "DuplicateNodeId",
                    NodeId = node.NodeId,
                    CloudResourceId = node.CloudResourceId,
                    Reason = "Duplicate node id collapsed during deterministic repair.",
                });

                continue;
            }

            nodeIdMap[node.NodeId] = sanitizedId;
            repairedNodes.Add(new DiagramNode
            {
                NodeId = sanitizedId,
                Label = TruncateLabel(MermaidDiagramRenderer.EscapeLabel(node.Label)),
                NodeType = node.NodeType,
                SubgraphId = string.IsNullOrWhiteSpace(node.SubgraphId)
                    ? null
                    : MermaidIdSanitizer.Sanitize(node.SubgraphId),
                OrderKey = node.OrderKey,
                CloudResourceId = node.CloudResourceId,
                ArmResourceId = node.ArmResourceId,
                SeedNodeId = node.SeedNodeId,
                ArmResourceType = node.ArmResourceType,
                ArmResourceKind = node.ArmResourceKind,
                ExternalLinkedServiceType = node.ExternalLinkedServiceType,
                ExternalFactoryName = node.ExternalFactoryName,
                ExternalFactoryNames = node.ExternalFactoryNames.ToList(),
                ExternalTargetHost = node.ExternalTargetHost,
                ExternalIntegrationRuntime = node.ExternalIntegrationRuntime,
                ExternalHostInKeyVault = node.ExternalHostInKeyVault,
                ArmResourceGroup = node.ArmResourceGroup,
                IncludeResourceGroupInCaption = node.IncludeResourceGroupInCaption,
                HasPrivateEndpointAccess = node.HasPrivateEndpointAccess,
                IsExecutiveOverflow = node.IsExecutiveOverflow,
                IsUnresolvedPolicyOutlineOnly = node.IsUnresolvedPolicyOutlineOnly,
                ParentAttachmentDetails = node.ParentAttachmentDetails.ToList(),
                ConnectionState = node.ConnectionState,
                ConnectionStateMessage = node.ConnectionStateMessage,
                UnresolvedRelationshipDetails = node.UnresolvedRelationshipDetails.ToList(),
                IsAvdCollapsedBoundary = node.IsAvdCollapsedBoundary,
                DataFlowTraversalHopEvidenceDetails = node.DataFlowTraversalHopEvidenceDetails.ToList(),
            });
        }

        HashSet<string> seenEdges = new(StringComparer.Ordinal);
        List<DiagramEdge> repairedEdges = [];

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (!nodeIdMap.TryGetValue(edge.FromNodeId, out string? fromId)
                || !nodeIdMap.TryGetValue(edge.ToNodeId, out string? toId))
            {
                continue;
            }

            string label = TruncateLabel(MermaidDiagramRenderer.EscapeLabel(edge.Label ?? string.Empty));
            string edgeKey = $"{fromId}|{toId}|{label}";

            if (!seenEdges.Add(edgeKey))
            {
                collapseEntries.Add(new MermaidDiagramCollapseEntry
                {
                    Kind = "DuplicateEdge",
                    Reason = $"Duplicate edge collapsed: {fromId} -> {toId}",
                });

                continue;
            }

            repairedEdges.Add(new DiagramEdge
            {
                FromNodeId = fromId,
                ToNodeId = toId,
                Label = label,
                // Layout-only ~~~ links must stay invisible after repair; dropping this
                // flag turns packing edges into unlabeled visible arrows.
                IsLayoutOnly = edge.IsLayoutOnly,
                // Forest membership cites the inference source. A repaired label of "in"
                // with a null source is not a VNet placement.
                InferenceSource = edge.InferenceSource,
                ProvenanceKind = edge.ProvenanceKind,
                DeclaredConnectionId = edge.DeclaredConnectionId,
                IsDataFlowNsgBlocked = edge.IsDataFlowNsgBlocked,
                DataFlowNsgAnnotationLabels = edge.DataFlowNsgAnnotationLabels.ToList(),
                DataFlowNsgSupportingRuleDetails = edge.DataFlowNsgSupportingRuleDetails.ToList(),
            });
        }

        List<DiagramSubgraph> repairedSubgraphs = ast.Subgraphs
            .Select(subgraph => new DiagramSubgraph
            {
                SubgraphId = MermaidIdSanitizer.Sanitize(subgraph.SubgraphId),
                Label = TruncateLabel(MermaidDiagramRenderer.EscapeLabel(subgraph.Label)),
                ParentSubgraphId = string.IsNullOrWhiteSpace(subgraph.ParentSubgraphId)
                    ? null
                    : MermaidIdSanitizer.Sanitize(subgraph.ParentSubgraphId),
                OrderKey = subgraph.OrderKey,
            })
            .ToList();

        collapseReport = new MermaidDiagramCollapseReport { Entries = collapseEntries };

        return new DiagramAst
        {
            Title = ast.Title,
            Nodes = repairedNodes,
            Edges = repairedEdges,
            Subgraphs = repairedSubgraphs,
            FlowchartDirection = ast.FlowchartDirection,
            CaptionLines = ast.CaptionLines.ToList(),
        };
    }

    private static string TruncateLabel(string label)
    {
        const int maxLength = 120;

        if (label.Length <= maxLength)
        {
            return label;
        }

        return label[..maxLength];
    }
}
