namespace ArchLucid.Core.Configuration;

/// <summary>Optional LLM executive summary prefix on ROI board-pack export (TB-241).</summary>
public sealed class RoiBoardPackNarrativeOptions
{
    public const string SectionPath = "Roi";

    /// <summary>When true, board-pack Markdown is prefixed with <c>## Executive summary</c> from a fast LLM call.</summary>
    public bool GenerateBoardPackNarrative
    {
        get;
        set;
    }
}
