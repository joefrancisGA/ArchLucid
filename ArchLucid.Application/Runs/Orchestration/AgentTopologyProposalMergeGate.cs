using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Validates agent proposals against inventoried graph nodes before commit overlay (TB-2221).
/// </summary>
public static class AgentTopologyProposalMergeGate
{
    public static IReadOnlyList<AgentResult> FilterValidatedProposals(
        GraphSnapshot graph,
        IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(results);

        HashSet<string> inventoriedLabels = ResolveInventoriedLabels(graph);

        if (inventoriedLabels.Count == 0)
            return results;

        List<AgentResult> filtered = [];

        foreach (AgentResult result in results)
        {
            if (!RequiresInventoryOverlayValidation(result.AgentType) || result.ProposedChanges is null)
            {
                filtered.Add(result);
                continue;
            }

            AgentTopologyProposal sanitized = SanitizeProposal(result.ProposedChanges, inventoriedLabels);

            if (ProposalIsEmpty(sanitized))
                continue;

            filtered.Add(CloneWithProposal(result, sanitized));
        }

        return filtered;
    }

    private static bool RequiresInventoryOverlayValidation(AgentType agentType) =>
        agentType is AgentType.Topology or AgentType.Cost or AgentType.Compliance or AgentType.Critic;

    private static HashSet<string> ResolveInventoriedLabels(GraphSnapshot graph) =>
        graph.Nodes
            .Where(static n => string.Equals(n.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
            .Where(static n => !IsAgentProposedNode(n))
            .Select(static n => n.Label)
            .Where(static l => !string.IsNullOrWhiteSpace(l))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

    private static bool IsAgentProposedNode(GraphNode node) =>
        string.Equals(node.SourceType, nameof(AgentType.Topology), StringComparison.OrdinalIgnoreCase)
        && string.Equals(node.SourceId, "ProposedChanges", StringComparison.OrdinalIgnoreCase);

    private static AgentTopologyProposal SanitizeProposal(
        AgentTopologyProposal proposal,
        HashSet<string> inventoriedLabels)
    {
        List<ManifestService> services = proposal.AddedServices?
            .Where(s => !string.IsNullOrWhiteSpace(s.ServiceName))
            .Where(s => inventoriedLabels.Contains(s.ServiceName))
            .ToList() ?? [];

        List<ManifestDatastore> datastores = proposal.AddedDatastores?
            .Where(d => !string.IsNullOrWhiteSpace(d.DatastoreName))
            .Where(d => inventoriedLabels.Contains(d.DatastoreName))
            .ToList() ?? [];

        List<ManifestRelationship> relationships = proposal.AddedRelationships?
            .Where(r => inventoriedLabels.Contains(r.SourceId) || inventoriedLabels.Contains(r.TargetId))
            .ToList() ?? [];

        return new AgentTopologyProposal
        {
            ProposalId = proposal.ProposalId,
            SourceAgent = proposal.SourceAgent,
            AddedServices = services,
            AddedDatastores = datastores,
            AddedRelationships = relationships,
            RequiredControls = proposal.RequiredControls,
            Warnings = proposal.Warnings
        };
    }

    private static bool ProposalIsEmpty(AgentTopologyProposal proposal) =>
        (proposal.AddedServices?.Count ?? 0) == 0
        && (proposal.AddedDatastores?.Count ?? 0) == 0
        && (proposal.AddedRelationships?.Count ?? 0) == 0
        && (proposal.RequiredControls?.Count ?? 0) == 0;

    private static AgentResult CloneWithProposal(AgentResult source, AgentTopologyProposal proposal)
    {
        return new AgentResult
        {
            ResultId = source.ResultId,
            TaskId = source.TaskId,
            RunId = source.RunId,
            AgentType = source.AgentType,
            Claims = source.Claims,
            EvidenceRefs = source.EvidenceRefs,
            Confidence = source.Confidence,
            Findings = source.Findings,
            ProposedChanges = proposal,
            ReasoningTrace = source.ReasoningTrace,
            CreatedUtc = source.CreatedUtc
        };
    }
}
