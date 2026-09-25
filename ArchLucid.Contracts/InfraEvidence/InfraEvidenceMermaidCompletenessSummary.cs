namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidCompletenessSummary
{
    public string Mode { get; set; } = string.Empty;
    public int VisibleNodeCount { get; set; }
    public int VisibleEdgeCount { get; set; }
    public int ConnectedComponentCount { get; set; }
    public int HiddenHopsUsedCount { get; set; }
    public int LikelyInCollocationEdgeCount { get; set; }
    public List<string> MissingClasses { get; set; } = [];
    public List<string> CollectedClasses { get; set; } = [];
}
