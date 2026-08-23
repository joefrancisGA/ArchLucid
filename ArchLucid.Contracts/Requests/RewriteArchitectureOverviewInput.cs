using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Advisory input for rewriting an architecture overview from a confirmed structured brief.
///     Does not persist — caller previews and accepts into the draft document.
/// </summary>
public sealed class RewriteArchitectureOverviewInput
{
    [Required]
    [MinLength(20)]
    public string CurrentOverview
    {
        get;
        set;
    } = string.Empty;

    public string? SystemName
    {
        get;
        set;
    }

    public string? BusinessOutcome
    {
        get;
        set;
    }

    public ArchitectureDraftStructuredBrief StructuredBrief
    {
        get;
        set;
    } = new();
}
