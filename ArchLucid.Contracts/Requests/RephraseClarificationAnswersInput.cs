using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Advisory batch input for humanizing document-extracted clarification answers before intake submit.
/// </summary>
public sealed class RephraseClarificationAnswersInput
{
    [Required]
    [MinLength(1)]
    public IReadOnlyList<ClarificationAnswerRephraseItem> Items
    {
        get;
        set;
    } = [];
}
