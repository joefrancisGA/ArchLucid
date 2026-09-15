namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Documented thresholds for inventory graph → <see cref="Models.DiagramAst" /> compilation (IE-16).</summary>
public static class DiagramAstFromGraphCompilerConstants
{
    /// <summary>Inferred/heuristic edges below this weight are dropped to avoid fully-connected noise.</summary>
    public const double MinimumEdgeWeight = 0.75d;

    /// <summary>Cap on VNet / subscription / RG summary nodes in Executive mode.</summary>
    public const int ExecutiveMaxResourceNodes = 12;

    /// <summary>
    /// Per-tier cap on always-show resources (VMs, databases, storage, data factories) in Executive mode.
    /// Overflow collapses into one <c>+N more …</c> node per tier so a 500-resource tenant still fits one page.
    /// </summary>
    public const int ExecutiveAlwaysShowTierMaxNodes = 16;

    /// <summary>
    /// Upper bound on Executive node count: summary nodes plus every tier at budget plus one rollup node each.
    /// Used by render coercion so a dense-but-valid Executive diagram is not reported as partitioned.
    /// </summary>
    public static int ExecutiveMaxTotalNodes =>
        ExecutiveMaxResourceNodes + (ExecutiveAlwaysShowTiers.All.Count * (ExecutiveAlwaysShowTierMaxNodes + 1));

    public const int DependencyNeighborhoodDefaultDepth = 2;

    /// <summary>Target ~2:1 aspect when wrapping unrelated peers into a grid (<c>sqrt(n × factor)</c>).</summary>
    public const int PeerGridAspectFactor = 2;

    public const int PeerGridMinColumns = 2;

    public const int PeerGridMaxColumns = 6;

    /// <summary>Minimum nodes in a subgraph before intra-subgraph grid links are applied.</summary>
    public const int PeerGridSubgraphMinNodes = 4;

    /// <summary>Title suffix when Full subscription compiles as an RG map (IE-17).</summary>
    public const string ResourceGroupMapTitleSuffix = "resource group map";

    /// <summary>Title suffix when Full subscription keeps VMs, databases, and other backbone types.</summary>
    public const string BackboneKeepTitleSuffix = "backbone resources";
}
