using System.ComponentModel.DataAnnotations;

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
    public string[] CurrentConstraints
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     Assumptions already on the draft (user-entered or previously suggested/confirmed).
    ///     Used to avoid restating or semantically duplicating existing items in new suggestions.
    /// </summary>
    public string[] CurrentAssumptions
    {
        get;
        set;
    } = [];
}
