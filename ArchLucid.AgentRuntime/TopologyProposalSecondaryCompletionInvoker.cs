using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

public sealed class TopologyProposalSecondaryCompletionInvoker(
    IEnumerable<IAgentHandler> handlers,
    IOptions<TopologyProposalConsensusOptions> options) : ITopologyProposalSecondaryCompletionInvoker
{
    private readonly IEnumerable<IAgentHandler> _handlers =
        handlers ?? throw new ArgumentNullException(nameof(handlers));

    private readonly TopologyProposalConsensusOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public async Task<AgentTopologyProposal?> InvokeSecondaryAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask topologyTask,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(topologyTask);

        if (!_options.Enabled)
            return null;

        IAgentHandler? topologyHandler = _handlers.FirstOrDefault(static handler => handler.AgentType is AgentType.Topology);

        if (topologyHandler is null)
            return null;

        AgentTask secondaryTask = new()
        {
            TaskId = topologyTask.TaskId,
            RunId = topologyTask.RunId,
            AgentType = AgentType.Topology,
            AgentTypeKey = topologyTask.AgentTypeKey,
            Objective = topologyTask.Objective,
            AllowedTools = topologyTask.AllowedTools.ToList(),
            AllowedSources = topologyTask.AllowedSources.ToList(),
            ModelTierOverride = _options.SecondaryModelTier,
        };

        AgentResult secondaryResult = await topologyHandler.ExecuteAsync(
            runId,
            request,
            evidence,
            secondaryTask,
            cancellationToken);

        return secondaryResult.ProposedChanges;
    }
}
