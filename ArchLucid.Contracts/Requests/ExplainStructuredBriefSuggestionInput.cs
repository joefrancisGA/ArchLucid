using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Requests;

/// <summary>
/// On-demand explain request for one structured-brief suggestion chip during intake.
/// </summary>
public sealed class ExplainStructuredBriefSuggestionInput
{
    /// <summary>Overview and structured-brief context used when the suggestion was generated.</summary>
    [Required]
    [MinLength(20)]
    public string SourceText
    {
        get;
        set;
    } = string.Empty;

    [Required]
    public StructuredBriefSuggestionKind SuggestionKind
    {
        get;
        set;
    }

    /// <summary>The suggested constraint, assumption, or capability text shown on the row.</summary>
    [Required]
    [MinLength(1)]
    public string SuggestionText
    {
        get;
        set;
    } = string.Empty;
}
