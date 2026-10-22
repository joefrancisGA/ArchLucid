using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Runs.Orchestration;

public sealed record TopologyProposalConsensusMergeResult(
    AgentTopologyProposal MergedProposal,
    int DisagreementCount);
