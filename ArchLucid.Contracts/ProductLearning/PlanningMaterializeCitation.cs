namespace ArchLucid.Contracts.ProductLearning;

/// <summary>Pilot-feedback evidence linked during planning materialize (RAG-V1.1-003).</summary>
public sealed class PlanningMaterializeCitation
{
    public Guid SignalId
    {
        get;
        init;
    }

    public string Subject
    {
        get;
        init;
    } = string.Empty;

    public string? CommentSnippet
    {
        get;
        init;
    }
}
