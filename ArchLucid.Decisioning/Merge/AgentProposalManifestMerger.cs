using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Merge;

/// <summary>
///     Merges validated <see cref="AgentResult" /> proposals (deltas, findings) into a <see cref="GoldenManifest" />.
/// </summary>
public sealed partial class AgentProposalManifestMerger
{
    public void MergeAgentResultsIntoManifest(
        string runId,
        IReadOnlyCollection<AgentResult> validResults,
        GoldenManifest manifest,
        DecisionMergeResult output)
    {
        ArgumentNullException.ThrowIfNull(validResults);
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(output);

        foreach (AgentResult result in validResults.OrderBy(r => GetMergeOrder(r.AgentType)))
        {
            DecisionMergeTraceRecorder.AddTrace(
                output,
                runId,
                "AgentResultAccepted",
                $"Accepted {result.AgentType} result with confidence {result.Confidence:F2}.",
                new Dictionary<string, string>
                {
                    ["resultId"] = result.ResultId,
                    ["taskId"] = result.TaskId,
                    ["agentType"] = result.AgentType.ToString()
                });

            if (result.ProposedChanges is not null)
            {
                ManifestDeltaProposal proposal =
                    AgentTopologyProposalMapper.ToManifestDeltaProposal(result.ProposedChanges);

                ApplyProposal(manifest, proposal, output, result.AgentType);
            }

            ApplyFindingsToGovernance(manifest, result, output);
        }
    }

    private static int GetMergeOrder(AgentType agentType)
    {
        return agentType switch
        {
            AgentType.Topology => 10,
            AgentType.Cost => 20,
            AgentType.Compliance => 30,
            AgentType.Critic => 40,
            _ => 100
        };
    }

    private static void ApplyProposal(
        GoldenManifest manifest,
        ManifestDeltaProposal proposal,
        DecisionMergeResult output,
        AgentType agentType)
    {
        MergeServices(manifest, proposal.AddedServices, output, agentType);
        MergeDatastores(manifest, proposal.AddedDatastores, output, agentType);
        MergeRelationships(manifest, proposal.AddedRelationships, output, agentType);
        MergeRequiredControls(manifest, proposal.RequiredControls, output, agentType);
        MergeWarnings(output, proposal.Warnings, agentType);
    }
}
