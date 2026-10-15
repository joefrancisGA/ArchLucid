using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Advisory batch input for humanizing document-extracted clarification answers before intake submit.
/// </summary>
public sealed class RephraseClarificationAnswersInput
{
    private IReadOnlyList<ClarificationAnswerRephraseItem> items = [];

    [Required]
    [MinLength(1)]
    public IReadOnlyList<ClarificationAnswerRephraseItem> Items
    {
        get => items;
        set => items = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
