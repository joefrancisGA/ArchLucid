using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Clarifications;

/// <summary>Operator-facing clarification question derived from an assessment finding gap.</summary>
public sealed class ReviewClarificationQuestion
{
    public string QuestionId
    {
        get;
        set;
    } = string.Empty;

    public string Prompt
    {
        get;
        set;
    } = string.Empty;

    public string SourceFindingId
    {
        get;
        set;
    } = string.Empty;

    public string SourceFindingType
    {
        get;
        set;
    } = string.Empty;

    public FindingSeverity Severity
    {
        get;
        set;
    }

    public string MissingItem
    {
        get;
        set;
    } = string.Empty;
}
