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
}
