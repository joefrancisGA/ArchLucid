using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Governance;

/// <summary>Natural-language intent for generating a curated policy pack rules document (preview only).</summary>
public sealed class GeneratePolicyPackRequest
{
    [Required]
    [MinLength(20)]
    [MaxLength(8_000)]
    public string Prompt
    {
        get;
        set;
    } = string.Empty;
}
