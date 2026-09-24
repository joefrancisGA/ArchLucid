namespace ArchLucid.ArtifactSynthesis.Models;

public sealed class DiagramAstCompileOptions
{
    public string? ResourceGroupName
    {
        get;
        init;
    }

    public IReadOnlyList<string>? SelectedNodeIds
    {
        get;
        init;
    }

    public string? NeighborhoodSeedNodeId
    {
        get;
        init;
    }

    public int NeighborhoodDepth
    {
        get;
        init;
    } = 2;

    /// <summary>
    /// When true, Full subscription compiles as one node per resource group (IE-17 readability collapse).
    /// </summary>
    public bool CollapseToResourceGroupMap
    {
        get;
        init;
    }

    /// <summary>
    /// When true, Full subscription compiles the backbone-only graph (VMs, databases, networks).
    /// </summary>
    public bool CollapseToBackboneKeep
    {
        get;
        init;
    }

    /// <summary>
    /// Executive always-show tier keys (<see cref="Compilers.ExecutiveAlwaysShowTiers" />) the viewer unchecked
    /// for this render. Null or empty shows every tier.
    /// </summary>
    public IReadOnlyList<string>? HiddenExecutiveTierKeys
    {
        get;
        init;
    }

    /// <summary>
    ///     When true, private-endpoint cards stay on the canvas. Default hides them and still uses
    ///     their hops to place remaining resources.
    /// </summary>
    public bool IncludePrivateEndpointNodes
    {
        get;
        init;
    }

    /// <summary>When true, cited Recovery Services vaults and <c>PROTECTS</c> edges join non-BC modes (RSV-04).</summary>
    public bool IncludeRecoveryServices
    {
        get;
        init;
    }

    /// <summary>When true, at least one vault protected-item list failed during collection (RSV-03).</summary>
    public bool RecoveryServicesCollectionIncomplete
    {
        get;
        init;
    }
}
