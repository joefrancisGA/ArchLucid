using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Dual-model topology proposal consensus (Prompt 24). Default off — doubles topology inference when enabled.
/// </summary>
public sealed class TopologyProposalConsensusOptions
{
    public const string SectionPath = "ArchLucid:AgentOutput:TopologyProposalConsensus";

    public bool Enabled { get; set; } = false;

    public LlmModelTier SecondaryModelTier { get; set; } = LlmModelTier.Economy;

    public double DisagreementConfidenceMultiplier { get; set; } = 0.65;
}
