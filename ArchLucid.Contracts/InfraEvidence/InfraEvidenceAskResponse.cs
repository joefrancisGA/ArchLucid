namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceAskResponse
{
    public string TopicKind
    {
        get;
        set;
    } = string.Empty;

    public string Answer
    {
        get;
        set;
    } = string.Empty;

    public bool InsufficientEvidence
    {
        get;
        set;
    }

    public List<InfraEvidenceAskCitation> Citations
    {
        get;
        set;
    } = [];

    public string? SimulatorLabel
    {
        get;
        set;
    }
}
