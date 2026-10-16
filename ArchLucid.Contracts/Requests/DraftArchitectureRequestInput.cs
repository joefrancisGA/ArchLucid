using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Requests;

public sealed class DraftArchitectureRequestInput
{
    [Required]
    [MinLength(20)]
    public string FreeTextDescription
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Constraints already on the draft (user-entered or previously suggested/confirmed).
    ///     Used to avoid restating or semantically duplicating existing items in new suggestions.
    /// </summary>
    private string[] currentConstraints = [];

    public string[] CurrentConstraints
    {
        get => currentConstraints;
        set => currentConstraints = ContractCollectionDefaults.CoalesceArray(value);
    }

    /// <summary>
    ///     Assumptions already on the draft (user-entered or previously suggested/confirmed).
    ///     Used to avoid restating or semantically duplicating existing items in new suggestions.
    /// </summary>
    private string[] currentAssumptions = [];

    public string[] CurrentAssumptions
    {
        get => currentAssumptions;
        set => currentAssumptions = ContractCollectionDefaults.CoalesceArray(value);
    }

    /// <summary>
    ///     Assumptions the operator confirmed on the draft. Checked against overview evidence for contradictions.
    /// </summary>
    private string[] confirmedAssumptions = [];

    public string[] ConfirmedAssumptions
    {
        get => confirmedAssumptions;
        set => confirmedAssumptions = ContractCollectionDefaults.CoalesceArray(value);
    }
}
