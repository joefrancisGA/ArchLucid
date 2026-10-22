namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional vision-based diagram ingest (IE-20). Default off so vision cannot be confused with ARM inventory.
/// </summary>
public sealed class DiagramVisionOptions
{
    public const string SectionName = "ArchLucid:DiagramVision";

    /// <summary>Master switch for <c>POST .../diagrams/vision-ingest</c>. Default <c>false</c>.</summary>
    public bool Enabled
    {
        get;
        set;
    }
}
