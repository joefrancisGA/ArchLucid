namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ProgressiveInterviewState
{
    public string ModelId
    {
        get;
        set;
    } = null!;

    public List<FramingQuestion> FramingQuestions
    {
        get;
        set;
    } = [];

    public List<FramingQuestion> EvidenceDrivenQuestions
    {
        get;
        set;
    } = [];

    public bool IsFramingComplete
    {
        get;
        set;
    }
}
