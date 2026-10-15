using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Decisions;

public sealed class DecisionOptionRecord
{
    public string OptionId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string Description
    {
        get;
        set;
    } = string.Empty;

    public double BaseConfidence
    {
        get;
        set;
    }

    public double SupportScore
    {
        get;
        set;
    }

    public double OppositionScore
    {
        get;
        set;
    }

    public double FinalScore => BaseConfidence + SupportScore - OppositionScore;

    private List<string> evidenceRefs = [];

    public List<string> EvidenceRefs
    {
        get => evidenceRefs;
        set => evidenceRefs = ContractCollectionDefaults.Coalesce(value);
    }
}
