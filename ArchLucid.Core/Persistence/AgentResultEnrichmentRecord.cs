namespace ArchLucid.Core.Persistence;

/// <summary>Post-commit overlay for <see cref="ArchLucid.Contracts.Agents.AgentResult" /> enrichments (TB-303).</summary>
public sealed class AgentResultEnrichmentRecord
{
    public string ResultId
    {
        get;
        init;
    } = "";

    public double? CalibratedConfidence
    {
        get;
        init;
    }

    public string? EnrichedResultJson
    {
        get;
        init;
    }

    public DateTime? EvidenceProposalPromotedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
