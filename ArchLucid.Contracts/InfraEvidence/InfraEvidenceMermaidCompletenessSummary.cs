using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidCompletenessSummary
{
    public string Mode { get; set; } = string.Empty;
    public int VisibleNodeCount { get; set; }
    public int VisibleEdgeCount { get; set; }
    public int ConnectedComponentCount { get; set; }
    public int HiddenHopsUsedCount { get; set; }
    public int LikelyInCollocationEdgeCount { get; set; }

    private List<string> missingClasses = [];

    public List<string> MissingClasses
    {
        get => missingClasses;
        set => missingClasses = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> collectedClasses = [];

    public List<string> CollectedClasses
    {
        get => collectedClasses;
        set => collectedClasses = ContractCollectionDefaults.Coalesce(value);
    }
}
