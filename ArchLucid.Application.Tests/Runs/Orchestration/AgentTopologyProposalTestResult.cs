using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
///     Agent-result fixtures for the agent-topology proposal tests, paired with
///     <see cref="AgentTopologyProposalTestGraph" />.
///     Most cases feed the merge a single topology result proposing one relationship between the two inventoried nodes,
///     so the factories default to that and let each test state only what it is asserting on.
///     <see cref="AgentResult.CreatedUtc" /> is left at its type default (also "now") rather than being stamped here;
///     no case in either suite asserts on it.
/// </summary>
internal static class AgentTopologyProposalTestResult
{
    /// <summary>Label of the inventoried compute node, the usual relationship source in proposals.</summary>
    internal const string SourceLabel = "api";

    /// <summary>Label of the inventoried data node, the usual relationship target in proposals.</summary>
    internal const string TargetLabel = "sql";

    /// <summary>Proposed relationship between two endpoints, named the way an agent would name them.</summary>
    internal static ManifestRelationship Relationship(
        string sourceId = SourceLabel,
        string targetId = TargetLabel,
        RelationshipType relationshipType = RelationshipType.ReadsFrom) =>
        new()
        {
            SourceId = sourceId,
            TargetId = targetId,
            RelationshipType = relationshipType
        };

    /// <summary>Topology proposal adding <paramref name="relationships" /> and nothing else.</summary>
    internal static AgentTopologyProposal RelationshipProposal(params ManifestRelationship[] relationships) =>
        ProposalFor(AgentType.Topology, relationships);

    /// <summary>Relationship proposal attributed to a non-topology agent (cost and compliance cases).</summary>
    internal static AgentTopologyProposal ProposalFor(AgentType sourceAgent, params ManifestRelationship[] relationships)
    {
        ArgumentNullException.ThrowIfNull(relationships);

        return new AgentTopologyProposal
        {
            SourceAgent = sourceAgent,
            AddedRelationships = [.. relationships]
        };
    }

    /// <summary>Topology-agent result carrying <paramref name="proposal" />.</summary>
    internal static AgentResult TopologyResult(
        AgentTopologyProposal proposal,
        string? resultId = null,
        string? taskId = null,
        string? runId = null,
        string? reasoningTrace = null) =>
        ResultFor(AgentType.Topology, proposal, resultId, taskId, runId, reasoningTrace);

    /// <summary>
    ///     Result for an arbitrary <paramref name="agentType" />. Identity fields are only assigned when supplied:
    ///     <see cref="AgentTopologyProposalMergeGate" /> keys sanitized results by <see cref="AgentResult.ResultId" />,
    ///     so cases that pass several results and never set an id must keep the type's unique default.
    /// </summary>
    internal static AgentResult ResultFor(
        AgentType agentType,
        AgentTopologyProposal proposal,
        string? resultId = null,
        string? taskId = null,
        string? runId = null,
        string? reasoningTrace = null)
    {
        ArgumentNullException.ThrowIfNull(proposal);

        AgentResult result = new()
        {
            AgentType = agentType,
            ProposedChanges = proposal
        };

        if (resultId is not null)
        {
            result.ResultId = resultId;
        }

        if (taskId is not null)
        {
            result.TaskId = taskId;
        }

        if (runId is not null)
        {
            result.RunId = runId;
        }

        if (reasoningTrace is not null)
        {
            result.ReasoningTrace = reasoningTrace;
        }

        return result;
    }
}
