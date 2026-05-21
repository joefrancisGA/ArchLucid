namespace ArchLucid.Core.Configuration;

/// <summary>Second-pass LLM call that proposes missing catalog evidence after agent execution.</summary>
public sealed class AgentCuratedEvidenceProposalOptions
{
    public const string SectionPath = "ArchLucid:AgentOutput:CuratedEvidenceProposals";

    public bool Enabled
    {
        get;
        set;
    } = true;
}
