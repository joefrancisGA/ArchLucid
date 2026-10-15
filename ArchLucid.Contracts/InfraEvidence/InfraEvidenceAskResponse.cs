using ArchLucid.Contracts.Serialization;

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

    private List<InfraEvidenceAskCitation> citations = [];

    public List<InfraEvidenceAskCitation> Citations
    {
        get => citations;
        set => citations = ContractCollectionDefaults.Coalesce(value);
    }

    public string? SimulatorLabel
    {
        get;
        set;
    }

    public DiagramViewPlan? ViewPlan
    {
        get;
        set;
    }
}
