namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class FramingQuestion
{
    public string QuestionId
    {
        get;
        set;
    } = null!;

    public string Prompt
    {
        get;
        set;
    } = null!;

    public bool IsAnswered
    {
        get;
        set;
    }

    public string? InferredAnswer
    {
        get;
        set;
    }

    public string? ConfirmedAnswer
    {
        get;
        set;
    }

    public FramingQuestionSource Source
    {
        get;
        set;
    }
}
