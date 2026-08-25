using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     One extracted clarification answer to rephrase into operator-facing prose.
/// </summary>
public sealed class ClarificationAnswerRephraseItem
{
    [Required]
    public string QuestionKey
    {
        get;
        set;
    } = string.Empty;

    [Required]
    [MinLength(10)]
    public string QuestionPrompt
    {
        get;
        set;
    } = string.Empty;

    [Required]
    [MinLength(3)]
    public string ExtractedAnswer
    {
        get;
        set;
    } = string.Empty;
}
