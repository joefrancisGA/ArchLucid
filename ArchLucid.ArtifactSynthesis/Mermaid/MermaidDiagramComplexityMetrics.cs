namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramComplexityMetrics
{
    public int NodeCount
    {
        get;
        init;
    }

    public int EdgeCount
    {
        get;
        init;
    }

    public int SubgraphCount
    {
        get;
        init;
    }

    public int MaxDegree
    {
        get;
        init;
    }

    public int CrossSubgraphEdgeCount
    {
        get;
        init;
    }

    public int TextSizeBytes
    {
        get;
        init;
    }

    public int LayoutEstimate
    {
        get;
        init;
    }

    public bool ExceedsReadableThresholds(MermaidDiagramReadabilityThresholds thresholds)
    {
        ArgumentNullException.ThrowIfNull(thresholds);

        if (NodeCount > thresholds.MaxNodes)
        {
            return true;
        }

        if (EdgeCount > thresholds.MaxEdges)
        {
            return true;
        }

        if (SubgraphCount > thresholds.MaxSubgraphs)
        {
            return true;
        }

        if (MaxDegree > thresholds.MaxMaxDegree)
        {
            return true;
        }

        if (CrossSubgraphEdgeCount > thresholds.MaxCrossSubgraphEdges)
        {
            return true;
        }

        if (TextSizeBytes > thresholds.MaxTextSizeBytes)
        {
            return true;
        }

        if (LayoutEstimate > thresholds.MaxLayoutEstimate)
        {
            return true;
        }

        return false;
    }
}
