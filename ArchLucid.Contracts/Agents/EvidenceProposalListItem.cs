namespace ArchLucid.Contracts.Agents;

/// <summary>Operator-review queue row for agent-proposed catalog evidence.</summary>
public sealed class EvidenceProposalListItem
{
    public string ResultId
    {
        get;
        init;
    } = string.Empty;

    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public string AgentType
    {
        get;
        init;
    } = string.Empty;

    public string ProposedEvidenceJson
    {
        get;
        init;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public bool IsPromoted
    {
        get;
        init;
    }
}
