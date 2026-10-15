using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ProgressiveInterviewState
{
    public string ModelId
    {
        get;
        set;
    } = null!;

    private List<FramingQuestion> framingQuestions = [];

    public List<FramingQuestion> FramingQuestions
    {
        get => framingQuestions;
        set => framingQuestions = ContractCollectionDefaults.Coalesce(value);
    }

    private List<FramingQuestion> evidenceDrivenQuestions = [];

    public List<FramingQuestion> EvidenceDrivenQuestions
    {
        get => evidenceDrivenQuestions;
        set => evidenceDrivenQuestions = ContractCollectionDefaults.Coalesce(value);
    }

    public bool IsFramingComplete
    {
        get;
        set;
    }
}
