namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidComplexityMetrics
{
    public int NodeCount
    {
        get;
        set;
    }

    public int EdgeCount
    {
        get;
        set;
    }

    public int SubgraphCount
    {
        get;
        set;
    }

    public int MaxDegree
    {
        get;
        set;
    }

    public int CrossSubgraphEdgeCount
    {
        get;
        set;
    }

    public int TextSizeBytes
    {
        get;
        set;
    }

    public int LayoutEstimate
    {
        get;
        set;
    }
}
