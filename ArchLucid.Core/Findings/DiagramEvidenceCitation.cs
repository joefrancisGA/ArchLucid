namespace ArchLucid.Core.Findings;

/// <summary>
///     Parsed <c>diagram:</c> evidence citation (AS-022).
/// </summary>
public sealed class DiagramEvidenceCitation
{
    public required string EvidenceItemId
    {
        get;
        init;
    }

    public required string ShapeOrEdgeId
    {
        get;
        init;
    }
}
