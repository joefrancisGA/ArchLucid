namespace ArchLucid.Core.Configuration;

/// <summary>Optional LLM Sponsor report prefix on ROI board-pack export (TB-241).</summary>
public sealed class RoiBoardPackNarrativeOptions
{
    public const string SectionPath = "Roi";

    /// <summary>When true, board-pack Markdown is prefixed with <c>## Sponsor report</c> from a fast LLM call.</summary>
    public bool GenerateBoardPackNarrative
    {
        get;
        set;
    }
}
