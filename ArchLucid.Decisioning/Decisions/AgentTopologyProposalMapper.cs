using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Decisioning.Decisions;

public static class AgentTopologyProposalMapper
{
    public static ManifestDeltaProposal ToManifestDeltaProposal(AgentTopologyProposal contract)
    {
        ArgumentNullException.ThrowIfNull(contract);

        return RoundTrip<AgentTopologyProposal, ManifestDeltaProposal>(contract);
    }

    public static AgentTopologyProposal ToAgentTopologyProposal(ManifestDeltaProposal domain)
    {
        ArgumentNullException.ThrowIfNull(domain);

        return RoundTrip<ManifestDeltaProposal, AgentTopologyProposal>(domain);
    }

    private static TTarget RoundTrip<TSource, TTarget>(TSource source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        TTarget? target = JsonSerializer.Deserialize<TTarget>(json, ContractJson.Default);

        return target ?? throw new InvalidOperationException(
            $"AgentTopologyProposalMapper round-trip produced null {typeof(TTarget).Name}.");
    }
}
