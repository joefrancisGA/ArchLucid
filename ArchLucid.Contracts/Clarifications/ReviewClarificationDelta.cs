namespace ArchLucid.Contracts.Clarifications;

/// <summary>Question-id delta between a prior review run and the current run.</summary>
public sealed class ReviewClarificationDelta
{
    public string PriorRunId
    {
        get;
        set;
    } = string.Empty;

    public List<string> ResolvedByEvidenceQuestionIds
    {
        get;
        set;
    } = [];

    public List<string> ResolvedByAssertionQuestionIds
    {
        get;
        set;
    } = [];

    public List<string> StillOpenQuestionIds
    {
        get;
        set;
    } = [];
}
