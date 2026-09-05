namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Documented thresholds for inventory graph → <see cref="Models.DiagramAst" /> compilation (IE-16).</summary>
public static class DiagramAstFromGraphCompilerConstants
{
    /// <summary>Inferred/heuristic edges below this weight are dropped to avoid fully-connected noise.</summary>
    public const double MinimumEdgeWeight = 0.75d;

    public const int ExecutiveMaxResourceNodes = 12;

    public const int DependencyNeighborhoodDefaultDepth = 2;
}
