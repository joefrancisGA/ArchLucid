using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Governance;

/// <summary>Plain-English intent for AI-assisted curated rule drafting (not persisted).</summary>
public sealed class DraftPolicyPackInput
{
    [Required]
    [MinLength(20)]
    public string FreeTextIntent
    {
        get;
        set;
    } = "";
}
