namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Documented thresholds for inventory graph → <see cref="Models.DiagramAst" /> compilation (IE-16).</summary>
public static class DiagramAstFromGraphCompilerConstants
{
    /// <summary>Inferred/heuristic edges below this weight are dropped to avoid fully-connected noise.</summary>
    public const double MinimumEdgeWeight = 0.75d;

    public const int ExecutiveMaxResourceNodes = 12;

    public const int DependencyNeighborhoodDefaultDepth = 2;

    /// <summary>Target ~2:1 aspect when wrapping unrelated peers into a grid (<c>sqrt(n × factor)</c>).</summary>
    public const int PeerGridAspectFactor = 2;

    public const int PeerGridMinColumns = 2;

    public const int PeerGridMaxColumns = 6;

    /// <summary>Minimum nodes in a subgraph before intra-subgraph grid links are applied.</summary>
    public const int PeerGridSubgraphMinNodes = 4;

    /// <summary>Title suffix when Full subscription compiles as an RG map (IE-17).</summary>
    public const string ResourceGroupMapTitleSuffix = "resource group map";
}
